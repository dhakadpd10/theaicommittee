// After a reel goes out on Instagram, the same video goes to the Facebook Page (Reels) and YouTube (Shorts).
// Each platform switches on by itself once its secrets exist, and is skipped quietly until then:
//   Facebook: FB_PAGE_ID + FB_PAGE_TOKEN (a Page access token with pages_manage_posts, pages_read_engagement, pages_show_list)
//   YouTube:  YT_CLIENT_ID + YT_CLIENT_SECRET + YT_REFRESH_TOKEN (OAuth for the channel, scope youtube.upload)
// The agent loop calls run() every minute. A slot remembers each platform's result (slot.fb / slot.yt), so nothing
// is posted twice; 3 failed tries on a platform = give up on that reel there (Instagram is never affected).
const fs = require('fs');
const path = require('path');
const { P, readJSON, writeJSON, readText, config, log, publicUrl } = require('./util');

const WINDOW_H = 36;    // only reels that went out on Instagram in the last 36 hours
const RETRY_MIN = 10;
const MAX_TRIES = 3;
const FB = 'https://graph.facebook.com/v25.0';

const hasFB = () => !!(process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN);
const hasYT = () => !!(process.env.YT_CLIENT_ID && process.env.YT_CLIENT_SECRET && process.env.YT_REFRESH_TOKEN);

// Comments there don't trigger our DMs, so the keyword line becomes a direct link to the free pack
function captionFor(caption) {
  const site = config().site_url.replace(/\/$/, '');
  return caption.replace(/^Comment ([A-Z]{3,12}) and I'll DM you ([^\n]*)$/m, (_, kw, what) => `Free: ${what.replace(/\.$/, '')} 👉 ${site}/free/#${kw.toLowerCase()}`);
}

async function json(res, what) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`${what}: ${data.error?.message || data.error_description || res.status}`);
  return data;
}

async function facebook({ videoUrl, caption }) {
  const page = process.env.FB_PAGE_ID, token = process.env.FB_PAGE_TOKEN;
  const form = (o) => new URLSearchParams({ ...o, access_token: token });
  const start = await json(await fetch(`${FB}/${page}/video_reels`, { method: 'POST', body: form({ upload_phase: 'start' }) }), 'Facebook start');
  await json(await fetch(`https://rupload.facebook.com/video-upload/v25.0/${start.video_id}`, { method: 'POST', headers: { Authorization: `OAuth ${token}`, file_url: videoUrl } }), 'Facebook upload');
  await json(await fetch(`${FB}/${page}/video_reels`, { method: 'POST', body: form({ upload_phase: 'finish', video_id: start.video_id, video_state: 'PUBLISHED', description: caption }) }), 'Facebook publish');
  return start.video_id;
}

async function youtube({ videoUrl, title, caption }) {
  const tok = await json(await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({
    grant_type: 'refresh_token', refresh_token: process.env.YT_REFRESH_TOKEN, client_id: process.env.YT_CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET }) }), 'YouTube sign-in');
  const video = Buffer.from(await (await fetch(videoUrl)).arrayBuffer());
  const meta = { snippet: { title, description: caption, categoryId: '23' }, status: { privacyStatus: 'public', selfDeclaredMadeForKids: false } };
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST', body: JSON.stringify(meta),
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(video.length) },
  });
  if (!init.ok) await json(init, 'YouTube start');
  const up = await json(await fetch(init.headers.get('location'), { method: 'PUT', body: video, headers: { 'Content-Type': 'video/mp4' } }), 'YouTube upload');
  return up.id;
}

async function run() {
  const targets = [['fb', hasFB(), facebook], ['yt', hasYT(), youtube]].filter((t) => t[1]);
  if (!targets.length) return { changed: false };
  const qroot = P('content/queue'); let anyChange = false;
  for (const w of fs.existsSync(qroot) ? fs.readdirSync(qroot).sort() : []) {
    const f = path.join(qroot, w, 'plan.json'); const plan = readJSON(f, null); if (!plan) continue;
    let changed = false;
    for (const s of plan.slots) {
      if (s.status !== 'published' || s.format !== 'reel' || !s.published_at || Date.now() - new Date(s.published_at) > WINDOW_H * 3600000) continue;
      const dir = `content/posts/${s.post}`; const ep = readJSON(P(dir, 'episode.json'), {});
      const caption = captionFor(readText(P(dir, 'caption.txt')).trim());
      const title = `${(ep.hook || s.title || 'The AI Committee').slice(0, 85)} #shorts`;
      for (const [key, , send] of targets) {
        const r = s[key] || {};
        if (r.status === 'posted' || r.status === 'failed' || (r.last_try && Date.now() - new Date(r.last_try) < RETRY_MIN * 60000)) continue;
        try {
          const id = await send({ videoUrl: publicUrl(`${dir}/reel.mp4`), title, caption });
          s[key] = { status: 'posted', id, at: new Date().toISOString() }; log(`cross-posted ${s.post} to ${key}`, id);
        } catch (e) {
          const tries = (r.tries || 0) + 1;
          s[key] = { status: tries >= MAX_TRIES ? 'failed' : 'retry', tries, error: e.message.slice(0, 300), last_try: new Date().toISOString() };
          log(`cross-post to ${key} failed for ${s.post} (try ${tries})`, e.message);
        }
        changed = true;
      }
    }
    if (changed) { writeJSON(f, plan); anyChange = true; }
  }
  return { changed: anyChange };
}

module.exports = { run, captionFor, hasFB, hasYT };
