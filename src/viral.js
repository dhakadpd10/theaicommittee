// Every morning, before the day's reel is written: find short videos that are going viral RIGHT NOW in our space,
// rank them by how far each one beat its own channel (the ig-viral "outlier multiple"), and hand the best ones
// to the writers' room as remake cards. We remake the SHAPE of the idea with our own cast and words, never the footage,
// script, jokes or characters.
//
// Two sources:
//  1. YouTube Data API (official; needs the YOUTUBE_API_KEY secret, free). Real view counts for Shorts posted in
//     the last few days, the channel's own median, and the top comments (they say why people loved it).
//     Most big Reels are cross-posted to Shorts, so this is the best measured signal we can get legally.
//  2. Claude web search (always on): Reels/TikTok/Shorts that articles, Reddit and meme pages say are blowing up this week.
// No scraping of Instagram or TikTok, no downloading anyone's video.
const fs = require('fs');
const { P, readJSON, writeJSON, log, localDay, addDays } = require('./util');
const { ask } = require('./claude');

// what our viewers watch: AI being AI, plus the relatable worlds the committee fits into (office, desi family, phones, money)
const QUERIES = [
  'chatgpt funny', 'ai funny shorts', 'claude ai funny', 'gemini ai funny', 'ai assistant comedy skit',
  'ai meme', 'chatgpt vs gemini', 'corporate comedy shorts', 'office comedy relatable', 'desi mom technology funny',
  'indian parents phone funny', 'coding meme shorts', 'animated comedy shorts ai',
];
const USED = () => P('content/research/used.json');

const yt = async (path, params) => {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY })) u.searchParams.set(k, v);
  const r = await fetch(u); const j = await r.json();
  if (!r.ok) throw new Error(`YouTube ${path}: ${j.error?.message || r.status}`);
  return j;
};
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const chunks = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

/** Shorts from the last `days` days, with views, views per hour, the channel's median and the outlier multiple. */
async function fromYouTube({ days = 4, perQuery = 12, queries = 6 } = {}) {
  if (!process.env.YOUTUBE_API_KEY) { log('viral: no YOUTUBE_API_KEY, using web search only'); return []; }
  // rotate through the queries day by day so the week covers all of them (each search costs 100 of 10,000 daily units)
  const start = Math.floor(Date.parse(localDay()) / 86400000) % QUERIES.length;
  const qs = Array.from({ length: Math.min(queries, QUERIES.length) }, (_, i) => QUERIES[(start + i) % QUERIES.length]);
  const after = new Date(Date.now() - days * 86400000).toISOString();
  const ids = new Set();
  for (const q of qs) {
    try {
      const s = await yt('search', { part: 'snippet', type: 'video', videoDuration: 'short', order: 'viewCount', publishedAfter: after, q, maxResults: perQuery, safeSearch: 'strict' });
      for (const it of s.items || []) ids.add(it.id.videoId);
    } catch (e) { log('viral: search failed for', q, e.message); }
  }
  const vids = [];
  for (const c of chunks([...ids], 50)) vids.push(...((await yt('videos', { part: 'snippet,statistics,contentDetails', id: c.join(',') })).items || []));
  // the channel's normal day: median views of its last 15 uploads
  const chans = {};
  for (const c of chunks([...new Set(vids.map((v) => v.snippet.channelId))], 50)) {
    for (const ch of (await yt('channels', { part: 'statistics,contentDetails', id: c.join(',') })).items || []) chans[ch.id] = { subs: Number(ch.statistics.subscriberCount) || 0, uploads: ch.contentDetails.relatedPlaylists.uploads };
  }
  for (const [id, ch] of Object.entries(chans)) {
    try {
      const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: ch.uploads, maxResults: 15 });
      const recent = (await yt('videos', { part: 'statistics', id: (pl.items || []).map((x) => x.contentDetails.videoId).join(',') })).items || [];
      ch.median = median(recent.map((v) => Number(v.statistics.viewCount) || 0));
    } catch { ch.median = 0; }
    void id;
  }
  const now = Date.now();
  const rows = vids.map((v) => {
    const views = Number(v.statistics.viewCount) || 0, ch = chans[v.snippet.channelId] || {};
    const hours = Math.max(1, (now - Date.parse(v.snippet.publishedAt)) / 3600000);
    return {
      source: 'youtube', url: `https://www.youtube.com/shorts/${v.id}`, id: v.id, creator: v.snippet.channelTitle, title: v.snippet.title,
      description: (v.snippet.description || '').slice(0, 400), published: v.snippet.publishedAt.slice(0, 10), views,
      likes: Number(v.statistics.likeCount) || 0, comments: Number(v.statistics.commentCount) || 0, subs: ch.subs || 0,
      views_per_hour: Math.round(views / hours), outlier: ch.median ? +(views / ch.median).toFixed(1) : null,
    };
  }).filter((r) => r.views >= 20000).sort((a, b) => (b.outlier || 0) - (a.outlier || 0) || b.views_per_hour - a.views_per_hour).slice(0, 15);
  // why people loved it: the top comments of the best few (1 unit each)
  for (const r of rows.slice(0, 8)) {
    try { r.top_comments = ((await yt('commentThreads', { part: 'snippet', videoId: r.id, order: 'relevance', maxResults: 8, textFormat: 'plainText' })).items || []).map((c) => c.snippet.topLevelComment.snippet.textDisplay.slice(0, 160)); } catch { r.top_comments = []; }
  }
  log(`viral: ${rows.length} YouTube Shorts ranked from ${ids.size} found`);
  return rows;
}

/** What articles, Reddit and meme pages say is blowing up this week (Reels, TikTok, Shorts). */
const fromWeb = (system) => ask({
  system, effort: 'medium', web: true,
  prompt: `Search the web for short videos (Instagram Reels, TikTok, YouTube Shorts) that went viral in the LAST 7 DAYS (today is ${localDay()}) and that our show could remake: AI assistants being funny (ChatGPT, Claude, Gemini, Copilot, AI agents), AI memes and trends, relatable office life, desi family and parents with phones or AI, students and exams, online shopping, scams people laugh about.
Look at news about viral reels, Reddit threads, meme roundups, "trending audio/format of the week" posts, and creator pages. For each video give: the link (or the creator's page if no direct link), the creator, the platform, the numbers you saw (views, likes, comments) and where you saw them, what happens in it (premise, the escalation, the punchline), and why people shared it. Only things you actually found in a source, never invented. Skip anything political, tragic, sexual, about a real private person, or mocking a group.
Return 6 to 10 short bullet entries.`,
});

/** The day's research: ranked YouTube outliers + web finds, minus anything we already remade. */
async function find(system) {
  const used = readJSON(USED(), []);
  const seen = new Set(used.map((u) => u.url));
  const recentCreators = new Set(used.filter((u) => u.day >= addDays(localDay(), -7)).map((u) => u.creator));
  const tube = (await fromYouTube().catch((e) => { log('viral: YouTube skipped:', e.message); return []; }))
    .filter((r) => !seen.has(r.url) && !recentCreators.has(r.creator));
  const web = await fromWeb(system).catch((e) => { log('viral: web search skipped:', e.message); return ''; });
  return { tube, web, used: used.slice(-30) };
}

/** Remember what we remade, so the same video (or the same creator within a week) is never used again. */
function markUsed(entries) {
  const used = readJSON(USED(), []);
  for (const e of entries) if (e?.url) used.push({ day: localDay(), url: e.url, creator: e.creator || '', post: e.post || '' });
  fs.mkdirSync(P('content/research'), { recursive: true });
  writeJSON(USED(), used.slice(-400));
}

/** Words in a row shared with the source (title, description, comments): the remake must not reuse its wording. */
function copiedPhrase(text, source, n = 6) {
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const src = norm([source.title, source.description, ...(source.top_comments || []), source.what_happens].join(' '));
  const grams = new Set(); for (let i = 0; i + n <= src.length; i++) grams.add(src.slice(i, i + n).join(' '));
  const t = norm(text); for (let i = 0; i + n <= t.length; i++) { const g = t.slice(i, i + n).join(' '); if (grams.has(g)) return g; }
  return null;
}

module.exports = { find, markUsed, copiedPhrase, fromYouTube, QUERIES };
