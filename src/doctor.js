// The agent's self-repair. Called by the loop after every publish round and whenever a step throws.
//  - Instagram refuses a post (blocked account, missing permission)  -> a "post by hand" issue with the video link and caption,
//                                                                       so Prashant gets a phone notification and the day still goes out
//  - the Instagram token is invalid or expired                       -> refresh it and save the new one as the secret
//  - the video is not on the website yet                             -> redeploy the site and try again
//  - anything else that keeps failing                                -> start the Doctor workflow (Claude reads the error and fixes the code)
// Network blips and Instagram hiccups are just retried. Nothing here ever posts twice or deletes anything.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { P, readJSON, writeJSON, readText, config, log, publicUrl } = require('./util');

const STATE = P('content/state/doctor.json');
const state = () => readJSON(STATE, { dispatched: {}, issues: {} });
const save = (s) => writeJSON(STATE, s);
const repo = () => process.env.GITHUB_REPOSITORY;

function gh(args, input) {
  if (!repo() || !process.env.GH_TOKEN) { log('(no GitHub access here)', 'gh', args.join(' ')); return ''; }
  const r = spawnSync('gh', args, { encoding: 'utf8', input, env: process.env });
  if (r.status) log('gh failed:', args.slice(0, 3).join(' '), (r.stderr || '').trim().slice(0, 300));
  return (r.stdout || '').trim();
}
// the @mention makes GitHub push the issue to Prashant's phone and email
const issue = (title, body, label) => gh(['issue', 'create', '--repo', repo(), '--title', title, '--label', label, '--body-file', '-'], `@${process.env.GITHUB_REPOSITORY_OWNER || 'dhakadpd10'} this needs you.\n\n${body}`);
// at most once per `minutes` for the same key, so a stuck problem doesn't spam
function once(key, minutes, fn) {
  const st = state(); const last = st.dispatched[key];
  if (last && Date.now() - new Date(last) < minutes * 60000) return false;
  st.dispatched[key] = new Date().toISOString(); save(st); fn(); return true;
}
const dispatch = (workflow, fields = {}) => gh(['workflow', 'run', workflow, '--repo', repo(), ...Object.entries(fields).flatMap(([k, v]) => ['-f', `${k}=${v}`])]);

const BLOCKED = /API access blocked|not authorized|permission|\(#10\)|\(#200\)|restricted|action is blocked|temporarily blocked|unsupported post request/i;
const TOKEN = /validating access token|session has expired|access token|OAuthException|code 190/i;
const NO_MEDIA = /not on the site yet/i;
const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|\b50[0234]\b|temporar|try again|please retry|rate limit|too many calls/i;

async function refreshToken() {
  if (!process.env.GH_PAT) { log('token looks expired but GH_PAT is missing: cannot refresh'); return false; }
  try {
    const t = (await require('./ig').refreshToken()).access_token;
    if (!/^[A-Za-z0-9_-]{60,}$/.test(t || '')) throw new Error('Instagram returned something that is not a token');
    const r = spawnSync('gh', ['secret', 'set', 'IG_ACCESS_TOKEN', '--repo', repo(), '--body', t], { encoding: 'utf8', env: { ...process.env, GH_TOKEN: process.env.GH_PAT } });
    if (r.status) throw new Error((r.stderr || '').slice(0, 200));
    process.env.IG_ACCESS_TOKEN = t; log('Instagram token refreshed and saved');
    return true;
  } catch (e) { log('token refresh failed:', e.message); return false; }
}

/** Give one post to Prashant as a "Post by hand" issue (once per post) and stop the agent retrying it. */
function handOff(s) {
  const dir = `content/posts/${s.post}`; const caption = readText(P(dir, 'caption.txt')).trim();
  const st = state();
  if (!st.issues[s.post]) {
    issue(`Post by hand: ${s.title} (${s.day} ${s.time} IST)`,
      `Instagram refused the agent's post (\`${s.error.slice(0, 160)}\`), so this one needs you. It takes a minute:\n\n1. Download the video: ${publicUrl(`${dir}/reel.mp4`)}\n2. Instagram → **+ → Reel** → pick it → turn on **Also share to feed**.\n3. Paste this caption:\n\n\`\`\`\n${caption}\n\`\`\`\n4. Share, then close this issue.\n\nThe agent keeps trying the automatic route for the next posts.`, 'post-by-hand');
    st.issues[s.post] = new Date().toISOString(); save(st);
  }
  s.status = 'manual-needed'; log('handed to Prashant:', s.post);
}

/** After a publish round: deal with every slot that has an error. Returns true if a plan file changed. */
async function reviewSlots() {
  const qroot = P('content/queue'); if (!fs.existsSync(qroot)) return false;
  let changedAny = false;
  for (const w of fs.readdirSync(qroot)) {
    const f = path.join(qroot, w, 'plan.json'); const plan = readJSON(f, null); if (!plan) continue;
    let changed = false;
    for (const s of plan.slots) {
      if (!s.error || !['made', 'failed'].includes(s.status)) continue;
      if (BLOCKED.test(s.error) && !TOKEN.test(s.error)) {
        handOff(s); changed = true; // Instagram won't take it from the agent: hand it to Prashant now, while it's still on time
      } else if (TOKEN.test(s.error)) {
        // try to renew (at most hourly); if that can't fix it, the token is broken: ask for a new one and hand the post over
        let fixed = false;
        if (once('token-refresh', 60, () => {})) fixed = await refreshToken();
        if (fixed) { s.status = 'made'; s.attempts = 0; delete s.last_try; changed = true; }
        else if ((s.attempts || 0) >= 2) {
          once('token-notice', 720, () => issue('Instagram token needs renewing (@theaicommittee)',
            `Instagram says: "${s.error.slice(0, 200)}"\n\nThe agent could not renew it by itself, so it needs a fresh one (2 minutes):\n1. developers.facebook.com → your app → Instagram → API setup → section 2 → **Generate token** next to @theaicommittee.\n2. github.com/${repo()}/settings/secrets/actions → **IG_ACCESS_TOKEN** → Update → paste it.\n\nUntil then, every post arrives on time as a **Post by hand** issue. Close this once the token is updated.`, 'inbox'));
          handOff(s); changed = true;
        }
      } else if (NO_MEDIA.test(s.error)) {
        once('site', 15, () => { dispatch('site.yml'); log('video missing on the site: redeploying'); });
        if (s.status === 'failed' && s.attempts < 12) { s.status = 'made'; changed = true; } // keep trying while the site rebuilds
      } else if (s.status === 'failed') {
        once(`doctor:${s.post}`, 120, () => dispatch('doctor.yml', { reason: `publish of ${s.post} failed ${s.attempts} times: ${s.error.slice(0, 300)}` }));
      }
    }
    if (changed) { writeJSON(f, plan); changedAny = true; }
  }
  return changedAny;
}

/** A step threw. Retry quietly when it's a blip; otherwise refresh the token or call the doctor. */
async function handle(step, err) {
  const msg = String(err && err.message || err);
  log(`${step} error:`, msg.slice(0, 300));
  if (TRANSIENT.test(msg)) return;
  if (TOKEN.test(msg)) { await refreshToken(); return; }
  if (BLOCKED.test(msg)) {
    once('blocked-notice', 720, () => issue('Instagram is blocking the agent on @theaicommittee', `Instagram answers the agent with: "${msg.slice(0, 200)}"

This is a block on Meta's side, so no code change can lift it. Until it lifts, every post arrives as a **Post by hand** issue on time.

What usually lifts it:
1. Instagram app (@theaicommittee): clear any security check or warning, confirm the email and phone number, turn on two-factor login.
2. developers.facebook.com → your app → Instagram → API setup → section 2: remove @theaicommittee, **Add account** again, **Generate token**, and save it as the IG_ACCESS_TOKEN secret.
3. Use the account normally for a day or two (post, like, reply by hand). New accounts are often limited at first.

Close this issue once the agent posts again.`, 'inbox'));
    return;
  }
  if (/hit your .*limit|usage limit|session limit/i.test(msg)) { log('Claude usage limit: replies wait until it resets'); return; }
  once(`doctor:${step}`, 180, () => dispatch('doctor.yml', { reason: `${step} failed: ${msg.slice(0, 400)}` }));
}

module.exports = { reviewSlots, handle, refreshToken };
