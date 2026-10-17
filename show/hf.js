// The motion layer: turns one episode into a HyperFrames project and renders the reel with it.
// Bottom layer: our 3D scene (show/scene.js), drawn at the exact time HyperFrames asks for (hf-seek).
// Top layer: GSAP motion in HTML: snappy punch-in on every cut, a whip between committee members,
// a slow push on the punchline, a shake on shock, name tags that bounce in, subtitles that pop in word by word,
// animated time cards, and the fade in and out. Sound is the episode's own mix (audio.wav).
//   node show/hf.js content/posts/<id>            builds <id>/hf/ (open it with `npx hyperframes preview`)
//   node show/hf.js content/posts/<id> --render   also renders <id>/reel.mp4
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const timeline = require('./timeline');

const ROOT = path.join(__dirname, '..'), MODS = path.join(ROOT, 'node_modules');
const W = 1080, H = 1920;
const TAGS = { codex: ['CODEX', '#6F84FF'], claude: ['CLAUDE', '#E0805F'], gemini: ['GEMINI', '#A77BF3'], twin: ['GEMINI (THE TWIN)', '#E06A9A'] };
const MEMBERS = ['codex', 'claude', 'gemini'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r3 = (x) => +x.toFixed(3);

function copy(from, to) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); }

function build(epDir) {
  const EP = path.resolve(epDir), TL = timeline(EP), out = path.join(EP, 'hf');
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  // everything the page needs lives inside the project, so HyperFrames can serve it
  for (const f of ['scene.js', 'committee.js']) copy(path.join(__dirname, f), path.join(out, 'show', f));
  copy(path.join(MODS, 'three/build/three.module.js'), path.join(out, 'vendor/three/build/three.module.js'));
  for (const d of ['postprocessing', 'shaders', 'geometries']) for (const f of fs.readdirSync(path.join(MODS, 'three/examples/jsm', d))) copy(path.join(MODS, 'three/examples/jsm', d, f), path.join(out, 'vendor/three/examples/jsm', d, f));
  copy(path.join(MODS, 'gsap/dist/gsap.min.js'), path.join(out, 'vendor/gsap.min.js'));
  const fonts = [['InterSB', 'inter/files/inter-latin-600-normal.woff2', 600], ['InterB', 'inter/files/inter-latin-700-normal.woff2', 700], ['InterXB', 'inter/files/inter-latin-800-normal.woff2', 800], ['Bree Serif', 'bree-serif/files/bree-serif-latin-400-normal.woff2', 400]];
  for (const [, f] of fonts) copy(path.join(MODS, '@fontsource', f), path.join(out, 'fonts', path.basename(f)));
  copy(path.join(EP, 'audio.wav'), path.join(out, 'audio.wav'));
  fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(TL));

  // ---------- the HTML layers ----------
  const B = TL.beats, layers = [];
  B.forEach((b, i) => {
    if (b.card) layers.push(`<div id="card-${i}" class="clip card" data-start="${r3(b.start)}" data-duration="${r3(b.end - b.start)}" data-track-index="3"><div class="card-text">${[...b.card].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</div></div>`);
    else if (b.text && b.vo !== null) {
      const t0 = Math.max(b.start, b.vo - 0.12), next = B[i + 1], t1 = next ? next.start : TL.DUR;
      const tag = TAGS[b.who] ? `<div class="tag" style="--c:${TAGS[b.who][1]}">${TAGS[b.who][0]}</div>` : '';
      const words = b.text.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
      layers.push(`<div id="sub-${i}" class="clip sub" data-start="${r3(t0)}" data-duration="${r3(t1 - t0)}" data-track-index="2">${tag}<div class="box"><div class="line">${words}</div></div></div>`);
    }
  });

  // ---------- the motion (a pure function of the beats) ----------
  const isMember = (s) => MEMBERS.includes(String(s || '').replace(/-push$/, ''));
  const punch = TL.musicStop !== undefined ? TL.musicStop : (TL.cover ?? -1);
  const motion = [];
  B.forEach((b, i) => {
    const prev = B[i - 1];
    if (i > 0 && !b.card && !prev?.card) {
      if (isMember(b.shot) && isMember(prev.shot) && b.shot !== prev.shot) { // whip between members
        const dir = MEMBERS.indexOf(b.shot.replace(/-push$/, '')) > MEMBERS.indexOf(prev.shot.replace(/-push$/, '')) ? 1 : -1;
        motion.push(`tl.fromTo('#cam', { x: ${dir * 90}, filter: 'blur(14px)' }, { x: 0, filter: 'blur(0px)', duration: 0.26, ease: 'power3.out', immediateRender: false }, ${r3(b.start)});`);
      }
      motion.push(`tl.fromTo('#cam', { scale: 1.055 }, { scale: 1, duration: 0.42, ease: 'power2.out', immediateRender: false }, ${r3(b.start)});`); // snap in on every cut
    }
    if ((i === punch || i === B.length - 2) && b.vo !== null) motion.push(`tl.to('#cam', { scale: 1.075, duration: ${r3(b.len + 0.6)}, ease: 'sine.inOut' }, ${r3(b.vo - 0.1)});`); // slow push on the punchline
    if (b.mood === 'shock' && b.vo !== null) motion.push(`tl.fromTo('#cam', { x: -9 }, { x: 9, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', immediateRender: false }, ${r3(b.vo)}); tl.set('#cam', { x: 0 }, ${r3(b.vo + 0.31)});`);
    if (b.card) {
      motion.push(`tl.fromTo('#card-${i} .ch', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.025, ease: 'back.out(2)', immediateRender: false }, ${r3(b.start + 0.2)});`);
      motion.push(`tl.to('#card-${i} .card-text', { opacity: 0, duration: 0.3 }, ${r3(b.end - 0.4)});`);
    }
    if (b.text && b.vo !== null && !b.card) {
      const t0 = Math.max(b.start, b.vo - 0.12), n = b.text.split(' ').length, stag = Math.min(0.07, (b.len * 0.55) / Math.max(1, n));
      motion.push(`tl.fromTo('#sub-${i} .box', { opacity: 0, y: -14, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out', immediateRender: false }, ${r3(t0)});`);
      if (TAGS[b.who]) motion.push(`tl.fromTo('#sub-${i} .tag', { opacity: 0, y: -28, scale: 0.5 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(2.6)', immediateRender: false }, ${r3(t0)});`);
      motion.push(`tl.fromTo('#sub-${i} .w', { opacity: 0, y: 18, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, stagger: ${r3(stag)}, ease: 'back.out(2.2)', immediateRender: false }, ${r3(t0 + 0.04)});`);
    }
  });
  motion.push(`tl.fromTo('#fade', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'none', immediateRender: false }, 0);`);
  motion.push(`tl.to('#fade', { opacity: 1, duration: 0.5, ease: 'none' }, ${r3(TL.DUR - 0.5)});`);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(TL.title || TL.id)} · The AI Committee</title>
<script src="vendor/gsap.min.js"></script>
<script type="importmap">{ "imports": { "three": "./vendor/three/build/three.module.js", "three/addons/": "./vendor/three/examples/jsm/" } }</script>
<style>
${fonts.map(([n, f, wgt]) => `@font-face { font-family: "${n}"; src: url("fonts/${path.basename(f)}") format("woff2"); font-weight: ${wgt}; }`).join('\n')}
body { margin: 0; background: #000; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }
#cam { position: absolute; inset: 0; transform-origin: 50% 46%; }
#gl, #hud { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
#gl canvas { display: block; }
#hud { display: none; }
.sub { position: absolute; left: 0; right: 0; top: 0; height: 640px; }
.tag { position: absolute; top: 222px; left: 50%; margin-left: -260px; width: 520px; display: flex; justify-content: center; }
.tag { font: 800 30px "InterXB"; color: #fff; letter-spacing: 0.04em; }
.tag::before { content: ""; }
.tag { background: none; }
.tag { padding: 0; }
.sub .tag { position: absolute; }
.tag { text-align: center; }
.tag { height: 48px; line-height: 48px; }
.tag { --pad: 20px; }
.tag { background: transparent; }
.tag span { }
.tag { }
.tag { }
.tag { }
.tag { }
.tag { }
.box { position: absolute; top: 283px; left: 90px; right: 90px; display: flex; justify-content: center; }
.line { background: rgba(16, 14, 18, 0.58); border-radius: 22px; padding: 14px 32px 18px; color: #fff; font: 600 50px/64px "InterSB"; text-align: center; max-width: 820px; }
.w { display: inline-block; }
.card { position: absolute; inset: 0; background: #000; display: flex; align-items: center; justify-content: center; }
.card-text { color: #F1E4CF; font: 600 54px "InterSB"; }
.ch { display: inline-block; }
#fade { position: absolute; inset: 0; background: #000; pointer-events: none; }
</style>
</head>
<body>
<div id="root" data-composition-id="episode" data-start="0" data-width="${W}" data-height="${H}" data-duration="${TL.DUR}" data-fps="30">
  <div id="cam"><div id="gl"></div><canvas id="hud" width="${W}" height="${H}"></canvas></div>
  ${layers.join('\n  ')}
  <div id="fade"></div>
  <audio id="mix" src="audio.wav" data-start="0" data-duration="${TL.DUR}" data-track-index="9"></audio>
</div>
<script type="module">
  window.HF_MODE = true;
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['committee-scene'] = (async () => {
    const faces = ${JSON.stringify(fonts.map(([n, f, wgt]) => [n, 'fonts/' + path.basename(f), wgt]))};
    for (const [name, url, weight] of faces) { const f = new FontFace(name, 'url(' + url + ')', { weight: String(weight) }); await f.load(); document.fonts.add(f); }
    window.TL = await (await fetch('timeline.json')).json();
    await import('./show/scene.js');
  })();
</script>
<script>
  const tl = gsap.timeline({ paused: true });
  ${motion.join('\n  ')}
  window.__timelines['episode'] = tl;
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(out, 'index.html'), html);
  return { out, TL };
}

function render(epDir) {
  const { out } = build(epDir);
  const bin = path.join(MODS, '.bin', process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
  const args = ['render', out, '-o', path.join(path.resolve(epDir), 'reel.mp4'), '--fps', '30', '--crf', '20', '--quiet'];
  const r = spawnSync(bin, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, HYPERFRAMES_TELEMETRY: '0' } });
  if (r.status) throw new Error('hyperframes render failed');
}

module.exports = { build, render };

if (require.main === module) {
  const ep = process.argv[2];
  if (process.argv.includes('--render')) render(ep); else console.log('built', build(ep).out);
}
