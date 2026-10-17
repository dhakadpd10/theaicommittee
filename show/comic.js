// The episode as a comic-strip carousel (1080 x 1350 JPEGs, at most 10):
//   slide 1: the cover frame with the episode title, slides 2..: one frame per spoken line (subtitles burned in),
//   last slide: the follow card.
const fs = require('fs'), path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

const FONTS = path.dirname(path.dirname(require.resolve('@fontsource/inter/package.json')));
for (const [f, n] of [['inter/files/inter-latin-800-normal.woff', 'InterXB'], ['inter/files/inter-latin-600-normal.woff', 'InterSB'], ['bree-serif/files/bree-serif-latin-400-normal.woff', 'Bree']]) {
  const p = path.join(FONTS, f); if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, n);
}
const W = 1080, H = 1350, TOP = 185; // crop from the 1080 x 1920 frame, keeping the subtitle and the faces

/** The moments to freeze: up to 8 spoken lines (the first 2 and the last 4 always, the punchline lives there), each caught mid-sentence. */
function moments(TL, max = 8) {
  const spoken = TL.beats.filter((b) => b.vo !== null);
  let pick = spoken;
  if (spoken.length > max) {
    const head = spoken.slice(0, 2), tail = spoken.slice(-4), mid = spoken.slice(2, -4), k = max - 6;
    pick = [...head, ...Array.from({ length: k }, (_, i) => mid[Math.floor(((i + 0.5) * mid.length) / k)]), ...tail];
  }
  return pick.map((b) => +(b.vo + Math.min(b.len * 0.6, b.len - 0.15)).toFixed(2));
}

function wrap(x, text, maxW) {
  const out = []; let cur = '';
  for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}

async function build(epDir, TL, stillFiles, handle) {
  const ep = JSON.parse(fs.readFileSync(path.join(epDir, 'episode.json'), 'utf8'));
  for (const f of fs.readdirSync(epDir)) if (/^slide-\d+\.jpg$/.test(f)) fs.unlinkSync(path.join(epDir, f));
  const slides = [];
  const crop = async (file) => { const img = await loadImage(fs.readFileSync(file)); const c = createCanvas(W, H), x = c.getContext('2d'); x.drawImage(img, 0, TOP, W, H, 0, 0, W, H); return { c, x }; };

  // 1. cover
  { const { c, x } = await crop(path.join(epDir, 'cover.jpg'));
    const g = x.createLinearGradient(0, H - 420, 0, H); g.addColorStop(0, 'rgba(10,12,20,0)'); g.addColorStop(1, 'rgba(10,12,20,0.92)'); x.fillStyle = g; x.fillRect(0, H - 420, W, 420);
    x.fillStyle = '#E9C978'; x.font = '800 34px InterXB'; x.fillText('THE AI COMMITTEE', 70, H - 210);
    x.fillStyle = '#FFFFFF'; x.font = '800 78px InterXB'; wrap(x, ep.title, W - 140).slice(0, 2).forEach((l, i) => x.fillText(l, 70, H - 120 + i * 84 - (wrap(x, ep.title, W - 140).length > 1 ? 84 : 0)));
    x.fillStyle = 'rgba(255,255,255,0.8)'; x.font = '600 30px InterSB'; x.fillText('swipe for the hearing  >>', 70, H - 50);
    slides.push(c); }
  // 2. one frame per line
  for (const f of stillFiles) slides.push((await crop(f)).c);
  // 3. follow card on a darkened cover
  { const { c, x } = await crop(path.join(epDir, 'cover.jpg'));
    x.fillStyle = 'rgba(10,12,20,0.82)'; x.fillRect(0, 0, W, H);
    x.textAlign = 'center'; x.fillStyle = '#E9C978'; x.font = '800 40px InterXB'; x.fillText('THE AI COMMITTEE', W / 2, 470);
    x.fillStyle = '#FFFFFF'; x.font = '800 70px InterXB'; ['One question.', 'Three AIs.', 'Zero help.'].forEach((l, i) => x.fillText(l, W / 2, 600 + i * 90));
    x.font = '600 36px InterSB'; x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillText(`New hearing every day · ${handle}`, W / 2, 960);
    x.fillText('Which one is your AI? Tell us below.', W / 2, 1020);
    slides.push(c); }
  const out = slides.slice(0, 10);
  out.forEach((c, i) => fs.writeFileSync(path.join(epDir, `slide-${String(i + 1).padStart(2, '0')}.jpg`), c.toBuffer('image/jpeg', 90)));
  return out.length;
}

module.exports = { moments, build };
