// One command for one episode: voices (checked by ear) -> sound mix -> cover, reel and comic-strip slides.
//   node show/make.js content/posts/<id>              everything
//   node show/make.js content/posts/<id> --no-reel    voices, sound, cover and slides only (quick check)
// Prints "CHECK THESE WORDS: ..." when the speech check could not hear a line right (the planner rewrites those lines).
const fs = require('fs'), path = require('path');
const { spawnSync } = require('child_process');
const render = require('./render');
const comic = require('./comic');

(async () => {
  const dir = path.resolve(process.argv[2]); const noReel = process.argv.includes('--no-reel');
  const node = (args) => { const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1 << 26 }); process.stdout.write(r.stdout || ''); if (r.status) throw new Error(`${args[0]} failed:\n${(r.stderr || '').slice(-1500)}`); return r.stdout || ''; };
  const t0 = Date.now();
  const v = node([path.join(__dirname, 'voices.mjs'), dir, '--check']);
  node([path.join(__dirname, 'audio.js'), dir]);
  const r = await render.open(dir);
  await r.cover(path.join(dir, 'cover.jpg'));
  const times = comic.moments(r.TL), stills = [];
  for (const t of times) { const f = path.join(dir, 'stills', `c${t.toFixed(2)}.jpg`); await r.still(t, f); stills.push(f); }
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'agent.json'), 'utf8'));
  const n = await comic.build(dir, r.TL, stills, cfg.handle);
  console.log(`cover + ${n} slides`);
  if (!noReel) { await r.reel(path.join(dir, 'reel.mp4'), path.join(dir, 'audio.wav')); console.log('reel done'); }
  await r.close();
  console.log(`made ${path.basename(dir)} in ${((Date.now() - t0) / 60000).toFixed(1)} min${/CHECK THESE WORDS/.test(v) ? ' (with words to check)' : ''}`);
})().catch((e) => { console.error(e); process.exit(1); });
