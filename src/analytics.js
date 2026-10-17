// Daily: pull each published post's numbers and keep one row per post per day in content/analytics/log.csv.
// The planner reads this to learn which episodes, endings and committee members work.
const fs = require('fs');
const path = require('path');
const { P, readJSON, log, localDay } = require('./util');
const ig = require('./ig');

const COLS = ['date', 'post', 'format', 'title', 'turn_by', 'published_at', 'views', 'reach', 'likes', 'comments', 'saved', 'shares', 'total_interactions', 'avg_watch_ms', 'follows'];
const csv = (v) => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));

async function run() {
  const file = P('content/analytics/log.csv'); const today = localDay();
  const rows = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').slice(1).filter((r) => !r.startsWith(today + ',')) : [];
  let n = 0;
  for (const w of fs.existsSync(P('content/queue')) ? fs.readdirSync(P('content/queue')) : []) {
    for (const s of readJSON(path.join(P('content/queue'), w, 'plan.json'), { slots: [] }).slots) {
      if (!s.media_id || Date.now() - new Date(s.published_at) > 30 * 86400000) continue;
      try {
        const m = await ig.mediaInsights(s.media_id, s.format);
        rows.push([today, s.post, s.format, s.title || '', s.turn_by || '', s.published_at, m.views, m.reach, m.likes, m.comments, m.saved, m.shares, m.total_interactions, m.ig_reels_avg_watch_time, m.follows].map(csv).join(','));
        n++;
      } catch (e) { log('insights failed', s.post, e.message); }
    }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, [COLS.join(','), ...rows].join('\n') + '\n');
  log(`analytics: ${n} posts logged`);
}

module.exports = { run };
