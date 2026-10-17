// Draws an episode: a tiny local server serves the 3D page, a headless browser draws each frame, ffmpeg encodes.
// Works on Windows (Edge or Chrome with the GPU) and on Linux / GitHub Actions (Chrome with SwiftShader, no GPU).
//   node show/render.js episodes/<id>                -> reel.mp4 (needs audio.wav from show/audio.js)
//   node show/render.js episodes/<id> --stills 1,5,9 -> stills/tN.jpg
//   node show/render.js episodes/<id> --cover        -> cover.jpg
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const timeline = require('./timeline');

const SHOW = __dirname, MODS = path.join(__dirname, '..', 'node_modules');
const FPS = 30, W = 1080, H = 1920;
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };

function findBrowser() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const f = c.find((p) => fs.existsSync(p)); if (!f) throw new Error('no Chrome or Edge found: set CHROME_PATH'); return f;
}
// a GPU when there is one (Windows), software WebGL (SwiftShader) on servers
const browserArgs = () => (!process.env.RENDER_SOFTWARE && (process.platform === 'win32' || process.env.RENDER_GPU)
  ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage']);

/** Open an episode in a headless browser. Returns helpers that draw stills, the cover and the whole reel. */
async function open(epDir) {
  const EP = path.resolve(epDir), TL = timeline(EP);
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    if (u === '/timeline.json') { r.writeHead(200, { 'Content-Type': 'application/json' }); return r.end(JSON.stringify(TL)); }
    let f = null;
    if (u === '/page.html') f = path.join(SHOW, 'page.html');
    else if (u.startsWith('/show/')) f = path.join(SHOW, u.slice(6));
    else if (u.startsWith('/node_modules/')) f = path.join(MODS, u.slice(14));
    if (!f || !f.startsWith(path.dirname(SHOW)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const browser = await puppeteer.launch({
    executablePath: findBrowser(), headless: true, protocolTimeout: 600000,
    userDataDir: path.join(os.tmpdir(), 'committee-' + process.pid + '-' + Date.now()),
    args: [...browserArgs(), '--no-first-run', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && (process.env.DEBUG_PAGE || !/404/.test(m.text()))) console.log('page:', m.text()); });
  if (process.env.DEBUG_PAGE) page.on('response', (q) => { if (q.status() >= 400) console.log('HTTP', q.status(), q.url()); });
  await page.goto(`http://127.0.0.1:${srv.address().port}/page.html`);
  await page.waitForFunction('window.ready === true', { timeout: 180000 });
  const shot = (o = {}) => page.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: W, height: H }, ...o });

  return {
    TL,
    async still(t, file) { await page.evaluate((x) => renderAt(x), t); fs.mkdirSync(path.dirname(file), { recursive: true }); await shot({ path: file }); },
    async cover(file) { await page.evaluate(() => renderCover()); await shot({ path: file }); },
    async reel(out, audio) {
      const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
        '-i', audio, '-map', '0:v', '-map', '1:a',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(TL.DUR), '-movflags', '+faststart', out],
        { stdio: ['pipe', 'ignore', 'pipe'] });
      let err = ''; ff.stderr.on('data', (d) => (err += d));
      const total = Math.round(TL.DUR * FPS), t0 = Date.now();
      for (let i = 0; i < total; i++) {
        await page.evaluate((t) => renderAt(t), i / FPS);
        const buf = await shot();
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % 150 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end();
      await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg failed: ' + err.slice(-800))) : r())));
    },
    async close() { await browser.close(); srv.close(); },
  };
}

module.exports = { open };

if (require.main === module) {
  (async () => {
    const ep = path.resolve(process.argv[2]); const r = await open(ep);
    const si = process.argv.indexOf('--stills');
    if (process.argv.includes('--cover')) { await r.cover(path.join(ep, 'cover.jpg')); console.log('wrote cover.jpg'); }
    else if (si > -1) { for (const s of process.argv[si + 1].split(',').map(Number)) await r.still(s, path.join(ep, `stills/t${s.toFixed(2)}.jpg`)); console.log('stills done'); }
    else { await r.reel(path.join(ep, 'reel.mp4'), path.join(ep, 'audio.wav')); console.log('wrote', path.join(ep, 'reel.mp4')); }
    await r.close();
  })().catch((e) => { console.error(e); process.exit(1); });
}
