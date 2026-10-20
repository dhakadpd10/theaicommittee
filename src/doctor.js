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
  if (!repo() || !process.env.GH_TOKEN) { log('(no GitHub access here)', 'gh', args.join(' ')); return null; }
  const r = spawnSync('gh', args, { encoding: 'utf8', input, env: process.env });
  if (r.status) { log('gh failed:', args.slice(0, 3).join(' '), (r.stderr || '').trim().slice(0, 300)); return null; }
  return (r.stdout || '').trim();
}
// the @mention makes GitHub push the issue to Prashant's phone and email
const issue = (title, body, label) => gh(['issue', 'create', '--repo', repo(), '--title', title, '--label', label, '--body-file', '-'], `@${process.env.GITHUB_REPOSITORY_OWNER || 'dhakadpd10'} this needs you.\n\n${body}`);
// at most once per `minutes` for the same key, so a stuck problem doesn't spam.
// If fn returns null (a GitHub call failed) nothing is recorded, so it is tried again next minute.
function once(key, minutes, fn) {
  const st = state(); const last = st.dispatched[key];
  if (last && Date.now() - new Date(last) < minutes * 60000) return false;
  if (fn() === null) return false;
  const now = state(); now.dispatched[key] = new Date().toISOString(); save(now); return true;
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

/** Give one post to Prashant as a "Post by hand" issue (once per post) and stop the agent retrying it.
 *  The post is only marked as handed over once the issue really exists, so a GitHub hiccup can't swallow it. */
function handOff(s, why) {
  const dir = `content/posts/${s.post}`; const caption = readText(P(dir, 'caption.txt')).trim();
  const st = state();
  if (!st.issues[s.post]) {
    const url = issue(`Post by hand: ${s.title} (${s.day} ${s.time} IST)`,
      `${why || `Instagram refused the agent's post (\`${String(s.error || '').slice(0, 160)}\`)`}, so this one needs you. It takes a minute:\n\n1. Download the video: ${publicUrl(`${dir}/reel.mp4`)}\n2. Instagram → **+ → Reel** → pick it → turn on **Also share to feed**.\n3. Paste this caption:\n\n\`\`\`\n${caption}\n\`\`\`\n4. Share, then close this issue.\n\nThe agent keeps trying the automatic route for the next posts.`, 'post-by-hand');
    if (!/github\.com\/.+\/issues\/\d+/.test(url)) { log('could not open the post-by-hand issue yet, will retry:', s.post); return false; }
    st.issues[s.post] = new Date().toISOString(); save(st);
  }
  s.status = 'manual-needed'; log('handed to Prashant:', s.post);
  return true;
}

// set when the Instagram token is broken and could not be renewed: the loop then hands over to a fresh run,
// which reads the secrets again, so a token Prashant pastes in is picked up within the hour
let tokenBroken = false;

/** After a publish round: deal with every slot that has an error. Returns true if a plan file changed. */
async function reviewSlots() {
  const qroot = P('content/queue'); if (!fs.existsSync(qroot)) return false;
  let changedAny = false;
  for (const w of fs.readdirSync(qroot)) {
    const f = path.join(qroot, w, 'plan.json'); const plan = readJSON(f, null); if (!plan) continue;
    let changed = false;
    for (const s of plan.slots) {
      // a post the agent could not get out within 6 hours: still give it to Prashant rather than lose it
      if (s.status === 'missed' && !state().issues[s.post]) { if (handOff(s, `The agent couldn't post this one on time${s.error ? ` (last error: \`${s.error.slice(0, 120)}\`)` : ''}`)) changed = true; continue; }
      if (!s.error || !['made', 'failed'].includes(s.status)) continue;
      if (BLOCKED.test(s.error) && !TOKEN.test(s.error)) {
        if (handOff(s)) changed = true; // Instagram won't take it from the agent: hand it to Prashant now, while it's still on time
      } else if (TOKEN.test(s.error)) {
        // try to renew (at most hourly); if that can't fix it, the token is broken: ask for a new one and hand the post over
        let fixed = false;
        if (once('token-refresh', 60, () => {})) fixed = await refreshToken();
        if (fixed) { s.status = 'made'; s.attempts = 0; delete s.last_try; changed = true; tokenBroken = false; }
        else if ((s.attempts || 0) >= 2) {
          once('token-notice', 720, () => issue('Instagram token needs renewing (@theaicommittee)',
            `Instagram says: "${s.error.slice(0, 200)}"\n\nThe agent could not renew it by itself, so it needs a fresh one (2 minutes):\n1. developers.facebook.com → your app → Instagram → API setup → section 2 → **Generate token** next to @theaicommittee.\n2. github.com/${repo()}/settings/secrets/actions → **IG_ACCESS_TOKEN** → Update → paste it.\n\nThe agent picks up the new token within the hour by itself (or open Actions → **Agent** → Run workflow to start it now). Until then, every post arrives on time as a **Post by hand** issue. Close this once the token is updated.`, 'inbox'));
          if (handOff(s)) changed = true;
          tokenBroken = true;
        }
      } else if (NO_MEDIA.test(s.error)) {
        once('site', 15, () => { log('video missing on the site: redeploying'); return dispatch('site.yml'); });
        if (s.status === 'failed' && s.attempts < 12) { s.status = 'made'; changed = true; } // keep trying while the site rebuilds
        else if (s.status === 'failed' && handOff(s, 'The video never appeared on the website, so Instagram could not fetch it')) changed = true;
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
  if (TOKEN.test(msg)) { if (once('token-refresh', 60, () => {}) && !(await refreshToken())) tokenBroken = true; return; }
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

/** Twice a day: make sure posts won't run out. If the queue ends tomorrow or sooner, remind Prashant to approve the
 *  waiting batch, or start the Plan job when there is no batch at all (for example after a failed Saturday). */
function checkQueue() {
  const { lastQueuedDay } = require('./plan'); const { localDay, addDays } = require('./util');
  const last = lastQueuedDay(), tomorrow = addDays(localDay(), 1);
  if (last && last > tomorrow) return;
  once('queue-check', 720, () => {
    const open = gh(['pr', 'list', '--repo', repo(), '--state', 'open', '--json', 'number,headRefName,url', '-q', '.[] | select(.headRefName | startswith("episodes/")) | .url']);
    if (open === null) return null; // couldn't ask GitHub: try again next minute
    if (open) return issue(`Posts run out ${last ? `after ${last}` : 'now'}: please approve the waiting episodes`, `The queue ends ${last || 'today'}. The next episodes are ready and waiting for your OK:\n\n${open}\n\nOpen it, watch the videos and press **Merge**.`, 'inbox');
    log('queue runs out and no batch is waiting: starting the Plan job'); return dispatch('plan.yml');
  });
}

module.exports = { reviewSlots, handle, refreshToken, checkQueue, isTokenBroken: () => tokenBroken };
