// Publishes approved reels whose time has come (the agent loop calls this every minute).
// A week's plan.json on the main branch = approved (it got there by merging the weekly pull request).
// Set a slot's "status" to "skip" in plan.json to hold it back.
// Safe to call often: a failed try waits RETRY_MIN before the next one, and before posting it checks
// Instagram for a post with the same caption, so an episode can never go out twice.
const fs = require('fs');
const path = require('path');
const { P, readJSON, writeJSON, readText, config, log, slotDate, publicUrl } = require('./util');
const ig = require('./ig');

const LATE_LIMIT_H = 6;   // more than 6 hours late = "missed", never posted at a strange hour
const RETRY_MIN = 8;      // minutes between tries of the same post
const MAX_TRIES = 6;      // then "failed", and the doctor takes over

async function reachable(url) { try { const r = await fetch(url, { method: 'HEAD' }); return r.ok; } catch { return false; } }
const head = (caption) => caption.split('\n')[0].trim().slice(0, 80);

async function run({ dryRun = false } = {}) {
  const cfg = config(); const now = new Date(); const qroot = P('content/queue');
  if (!fs.existsSync(qroot)) { log('no queue'); return { changed: false }; }
  let postedToday = 0, recent = null;
  const weeks = fs.readdirSync(qroot).sort().map((w) => ({ f: path.join(qroot, w, 'plan.json') })).map((x) => ({ ...x, plan: readJSON(x.f, null) })).filter((x) => x.plan);
  for (const { plan } of weeks) for (const s of plan.slots) if (s.status === 'published' && s.published_at && now - new Date(s.published_at) < 86400000) postedToday++;
  let anyChange = false;
  for (const { f, plan } of weeks) {
    let changed = false;
    for (const s of plan.slots) {
      if (s.status !== 'made' || !/^\d{4}-\d{2}-\d{2}$/.test(s.day)) continue;
      const due = slotDate(s.day, s.time);
      if (due > now) continue;
      if (now - due > LATE_LIMIT_H * 3600000) { s.status = 'missed'; changed = true; log('missed', s.post); continue; }
      if (s.last_try && now - new Date(s.last_try) < RETRY_MIN * 60000) continue;
      if (postedToday >= cfg.limits.max_posts_per_day) { log('daily post limit reached'); continue; }
      const dir = `content/posts/${s.post}`; const caption = readText(P(dir, 'caption.txt')).trim();
      try {
        // already on Instagram? (a crash after posting, or posted by hand)
        recent ||= await ig.recentMedia(15);
        const dup = recent.find((m) => m.caption && head(m.caption) === head(caption) && Date.now() - new Date(m.timestamp) < 3 * 86400000);
        if (dup) { Object.assign(s, { status: 'published', media_id: dup.id, published_at: dup.timestamp, note: 'found already on Instagram' }); delete s.error; changed = true; log('already on Instagram', s.post); continue; }
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
        Object.assign(s, { status: 'published', media_id: id, published_at: new Date().toISOString() }); delete s.error; delete s.last_try;
        postedToday++; changed = true; log('published', s.post, id);
      } catch (e) {
        Object.assign(s, { attempts: (s.attempts || 0) + 1, error: e.message, last_try: new Date().toISOString() }); changed = true;
        log('publish failed', s.post, `(try ${s.attempts})`, e.message);
        if (s.attempts >= MAX_TRIES) s.status = 'failed';
      }
    }
    if (changed && !dryRun) { writeJSON(f, plan); anyChange = true; }
  }
  return { changed: anyChange };
}

module.exports = { run };
