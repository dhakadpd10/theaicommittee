// Builds the public GitHub Pages site into _site/:
//   /media/posts/... reels, covers and carousel slides, at public URLs Instagram's API can fetch
//   /privacy/ /data-deletion/ /terms/   the pages Meta asks apps to have
//   /                a small home page
const fs = require('fs');
const path = require('path');
const { P, config } = require('./util');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CSS = `
:root { --bg:#14161F; --surface:#1C2030; --ink:#F2EEE6; --muted:#A9A3B5; --gold:#E9C978; --codex:#6F84FF; --claude:#E0805F; --gemini:#A77BF3; color-scheme: dark }
@media (prefers-color-scheme: light) { :root { --bg:#F5F0E8; --surface:#FFFFFF; --ink:#1A1822; --muted:#625C6B; --gold:#9A7414; color-scheme: light } }
* { box-sizing:border-box } body { margin:0; background:var(--bg); color:var(--ink); font:400 16px/1.6 "Inter",system-ui,sans-serif; padding:40px 16px 64px }
.wrap { max-width:720px; margin:0 auto; display:grid; gap:24px } header { display:grid; gap:12px }
.sticker { justify-self:start; color:var(--gold); font:800 13px/1 "Inter",sans-serif; letter-spacing:.14em }
h1 { font:800 clamp(34px,7vw,54px)/1.05 "Inter",sans-serif; margin:0 } .lede { margin:0; color:var(--muted); font-size:18px; max-width:60ch }
.cast { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px }
.cast div { background:var(--surface); border-radius:14px; padding:16px; border-top:4px solid var(--c) } .cast b { display:block; font-size:18px } .cast span { color:var(--muted); font-size:14px }
h2 { font:800 22px/1.2 "Inter",sans-serif; margin:24px 0 8px } .legal { max-width:68ch } .legal li { margin:6px 0 } a { color:inherit }
footer { color:var(--muted); font-size:13px }
.free { background:var(--surface); border-radius:14px; padding:18px; display:grid; gap:8px } .free h2 { margin:0 } .free h3 { margin:8px 0 0; font-size:16px }
pre { white-space:pre-wrap; word-break:break-word; background:var(--bg); border-radius:10px; padding:14px; margin:0; font:500 14px/1.55 ui-monospace,Consolas,monospace } .tip { color:var(--muted); font-size:14px; margin:0 }`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"><style>${CSS}</style></head><body>${body}</body></html>\n`;

function build(outDir = P('_site')) {
  const cfg = config();
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), page(cfg.name, `<div class="wrap"><header><span class="sticker">AN ANIMATED SERIES ON INSTAGRAM</span><h1>${esc(cfg.name)}</h1>
<p class="lede">One question. Three AIs. Zero help. Meera brings one everyday problem to her desk-sized committee, and they make it worse. New episode every day on <a href="https://www.instagram.com/${esc(cfg.handle.replace('@', ''))}/">${esc(cfg.handle)}</a>.</p></header>
<div class="cast"><div style="--c:var(--codex)"><b>Codex</b><span>does it, asks nothing</span></div><div style="--c:var(--claude)"><b>Claude</b><span>asks how you feel first</span></div><div style="--c:var(--gemini)"><b>Gemini</b><span>already shared it with your mum</span></div></div>
<footer>Fan-made parody, not affiliated with OpenAI, Anthropic or Google. Made by an open-source agent. <a href="privacy/">Privacy</a> · <a href="data-deletion/">Data deletion</a> · <a href="terms/">Terms</a></footer></div>`));
  const legal = require('./legal');
  for (const [dir, title, html] of [['privacy', 'Privacy Policy', legal.privacy(cfg.handle)], ['data-deletion', 'Data Deletion', legal.deletion(cfg.handle)], ['terms', 'Terms of Use', legal.terms(cfg.handle)]]) {
    fs.mkdirSync(path.join(outDir, dir), { recursive: true });
    fs.writeFileSync(path.join(outDir, dir, 'index.html'), page(`${title} · ${cfg.name}`, html));
  }
  // /free/: the prompt packs people get by commenting a post's keyword (brand/free.json)
  const free = JSON.parse(fs.readFileSync(P('brand/free.json'), 'utf8'));
  const ig = `https://www.instagram.com/${esc(cfg.handle.replace('@', ''))}/`;
  const sections = Object.entries(free).map(([k, t]) => `<section class="free" id="${k.toLowerCase()}"><span class="sticker">${esc(k)}</span><h2>${esc(t.title)}</h2><p>${esc(t.intro)}</p>
${t.prompts.map((p) => `<h3>${esc(p.name)}</h3><pre>${esc(p.text)}</pre>`).join('')}<p class="tip">${esc(t.tip)}</p></section>`).join('\n');
  fs.mkdirSync(path.join(outDir, 'free'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'free', 'index.html'), page(`Free prompts · ${cfg.name}`, `<div class="wrap"><header><span class="sticker">FREE FROM THE COMMITTEE</span><h1>Free prompts</h1>
<p class="lede">The prompts from our episodes on <a href="${ig}">${esc(cfg.handle)}</a>. Copy one, paste it into any AI assistant and fill in the brackets.</p></header>
${sections}
<footer>Fan-made parody, not affiliated with OpenAI, Anthropic or Google. <a href="../">Home</a> · <a href="../privacy/">Privacy</a></footer></div>`));
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  // only media Instagram still has to fetch (waiting posts, or posted in the last 3 days): keeps the site small
  const needed = new Set(); const q = P('content/queue');
  for (const w of fs.existsSync(q) ? fs.readdirSync(q) : []) {
    let plan; try { plan = JSON.parse(fs.readFileSync(path.join(q, w, 'plan.json'), 'utf8')); } catch { continue; }
    for (const s of plan.slots || []) if (s.status === 'made' || (s.published_at && Date.now() - new Date(s.published_at) < 3 * 86400000)) needed.add(s.post);
  }
  let n = 0; const posts = P('content/posts');
  for (const id of (fs.existsSync(posts) ? fs.readdirSync(posts) : []).filter((x) => needed.has(x))) {
    for (const f of fs.readdirSync(path.join(posts, id))) {
      if (!/^(reel\.mp4|cover\.jpg|slide-\d+\.jpg)$/.test(f)) continue;
      const dest = path.join(outDir, 'media', 'posts', id); fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(path.join(posts, id, f), path.join(dest, f)); n++;
    }
  }
  console.log(`site built: home, legal pages and ${n} media files in ${outDir}`);
}

module.exports = { build };
