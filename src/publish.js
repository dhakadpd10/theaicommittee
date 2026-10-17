// Every 15 minutes: publish approved posts whose time has come.
// A week's plan.json on the main branch = approved (it got there by merging the weekly pull request).
// Set a slot's "status" to "skip" in plan.json to hold it back.
const fs = require('fs');
const path = require('path');
const { P, readJSON, writeJSON, readText, config, log, slotDate, publicUrl } = require('./util');
const ig = require('./ig');

const LATE_LIMIT_H = 6; // a post more than 6 hours late is marked "missed", not posted at a strange hour

async function reachable(url) { try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch { return false; } }

async function run({ dryRun = false } = {}) {
  const cfg = config(); const now = new Date(); const qroot = P('content/queue');
  if (!fs.existsSync(qroot)) return log('no queue');
  let postedToday = 0, changed = false;
  for (const week of fs.readdirSync(qroot).sort()) {
    const f = path.join(qroot, week, 'plan.json'); const plan = readJSON(f, null); if (!plan) continue;
    for (const s of plan.slots) {
      if (s.status === 'published' && s.published_at && now - new Date(s.published_at) < 86400000) postedToday++;
      if (s.status !== 'made' || !/^\d{4}-\d{2}-\d{2}$/.test(s.day)) continue;
      const due = slotDate(s.day, s.time);
      if (due > now) continue;
      if (now - due > LATE_LIMIT_H * 3600000) { s.status = 'missed'; changed = true; log('missed', s.post); continue; }
      if (postedToday >= cfg.limits.max_posts_per_day) { log('daily post limit reached'); continue; }
      const dir = `content/posts/${s.post}`; const caption = readText(P(dir, 'caption.txt')).trim();
      try {
        let id;
        if (s.format === 'reel') {
          const videoUrl = publicUrl(`${dir}/reel.mp4`), coverUrl = publicUrl(`${dir}/cover.jpg`);
          if (!(await reachable(videoUrl))) throw new Error(`video not on the site yet: ${videoUrl}`);
          if (dryRun) { log('would publish reel', s.post); continue; }
          id = await ig.publishReel({ videoUrl, coverUrl: fs.existsSync(P(dir, 'cover.jpg')) ? coverUrl : undefined, caption });
        } else {
          const slides = fs.readdirSync(P(dir)).filter((x) => /^slide-\d+\.jpg$/.test(x)).sort().slice(0, 10);
          const imageUrls = slides.map((x) => publicUrl(`${dir}/${x}`));
          if (!(await reachable(imageUrls[0]))) throw new Error(`slides not on the site yet: ${imageUrls[0]}`);
          if (dryRun) { log('would publish carousel', s.post, slides.length, 'slides'); continue; }
          id = await ig.publishCarousel({ imageUrls, caption });
        }
        Object.assign(s, { status: 'published', media_id: id, published_at: new Date().toISOString() });
        postedToday++; changed = true; log('published', s.post, id);
      } catch (e) {
        s.attempts = (s.attempts || 0) + 1; s.error = e.message; changed = true; log('publish failed', s.post, e.message);
        if (s.attempts >= 3) s.status = 'failed';
      }
    }
    if (changed && !dryRun) writeJSON(f, plan);
  }
  return { changed };
}

module.exports = { run };
