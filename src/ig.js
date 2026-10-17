// Instagram API with Instagram Login (official). Needs a Business/Creator account and an Instagram User
// access token with: instagram_business_basic, instagram_business_content_publish,
// instagram_business_manage_comments, instagram_business_manage_messages, instagram_business_manage_insights.
const BASE = 'https://graph.instagram.com/v25.0';
const token = () => { const t = process.env.IG_ACCESS_TOKEN; if (!t) throw new Error('IG_ACCESS_TOKEN is not set'); return t; };
const userId = () => { const u = process.env.IG_USER_ID; if (!u) throw new Error('IG_USER_ID is not set'); return u; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, pathname, params = {}, body) {
  const url = new URL(BASE + pathname);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Instagram ${method} ${pathname}: ${data.error?.message || res.status}`);
  return data;
}
const get = (p, q) => call('GET', p, q);
const post = (p, body) => call('POST', p, {}, body);

// ---------- account ----------
const me = () => get('/me', { fields: 'user_id,username,account_type,followers_count,media_count' });
const recentMedia = (limit = 25) => get(`/${userId()}/media`, { fields: 'id,caption,media_type,media_product_type,timestamp,permalink,comments_count,like_count', limit }).then((r) => r.data || []);
const publishingLimit = () => get(`/${userId()}/content_publishing_limit`, { fields: 'quota_usage,config' });

// ---------- publishing ----------
async function waitForContainer(id, { tries = 30, every = 20000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const s = await get(`/${id}`, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`container ${id}: ${s.status_code} ${s.status || ''}`);
    await sleep(every);
  }
  throw new Error(`container ${id} still processing after ${(tries * every) / 60000} min`);
}
async function publishReel({ videoUrl, coverUrl, caption }) {
  let c;
  try { c = await post(`/${userId()}/media`, { media_type: 'REELS', video_url: videoUrl, cover_url: coverUrl, caption, share_to_feed: true }); }
  catch (e) { if (!coverUrl) throw e; c = await post(`/${userId()}/media`, { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: true }); }
  await waitForContainer(c.id);
  return (await post(`/${userId()}/media_publish`, { creation_id: c.id })).id;
}
async function publishCarousel({ imageUrls, caption }) {
  if (imageUrls.length < 2 || imageUrls.length > 10) throw new Error('a carousel needs 2 to 10 images');
  const children = [];
  for (const image_url of imageUrls) children.push((await post(`/${userId()}/media`, { image_url, is_carousel_item: true })).id);
  for (const id of children) await waitForContainer(id, { tries: 15, every: 4000 });
  const c = await post(`/${userId()}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption });
  await waitForContainer(c.id, { tries: 15, every: 4000 });
  return (await post(`/${userId()}/media_publish`, { creation_id: c.id })).id;
}

// ---------- comments + DMs ----------
const comments = (mediaId) => get(`/${mediaId}/comments`, { fields: 'id,text,username,timestamp,from{id,username},replies{id,username,text,from{id,username}}', limit: 50 }).then((r) => r.data || []);
const replyToComment = (commentId, message) => post(`/${commentId}/replies`, { message });
// one private DM per comment, within 7 days of the comment
const privateReply = (commentId, text) => post(`/${userId()}/messages`, { recipient: { comment_id: commentId }, message: { text } });
const conversations = () => get(`/${userId()}/conversations`, { platform: 'instagram', fields: 'id,updated_time,messages.limit(5){id,from,message,created_time}' }).then((r) => r.data || []);
// normal DM reply (only inside the 24-hour window after their last message)
const sendMessage = (recipientId, text) => post(`/${userId()}/messages`, { recipient: { id: recipientId }, message: { text } });

// ---------- insights ----------
async function mediaInsights(mediaId, kind) {
  const metrics = kind === 'reel' ? 'views,reach,likes,comments,saved,shares,total_interactions' : 'views,reach,likes,comments,saved,shares,total_interactions';
  const r = await get(`/${mediaId}/insights`, { metric: metrics });
  return Object.fromEntries((r.data || []).map((m) => [m.name, m.values?.[0]?.value ?? m.total_value?.value ?? null]));
}

// ---------- token ----------
// long-lived tokens last 60 days; refresh any time after they are 24 hours old
async function refreshToken() {
  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.searchParams.set('grant_type', 'ig_refresh_token'); url.searchParams.set('access_token', token());
  const res = await fetch(url); const data = await res.json();
  if (!res.ok || data.error) throw new Error(`token refresh failed: ${data.error?.message || res.status}`);
  return data; // { access_token, token_type, expires_in }
}

module.exports = { me, recentMedia, publishingLimit, publishReel, publishCarousel, comments, replyToComment, privateReply, conversations, sendMessage, mediaInsights, refreshToken };
