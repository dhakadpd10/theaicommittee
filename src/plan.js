// Every Saturday: plans the coming week (from the day after the last queued episode up to the next Saturday),
// one reel a day: learn from the numbers -> research what's current -> pick the episodes -> write them -> check every line by ear.
// Rendering happens next, in parallel cloud jobs (show/make.js), then the week goes to Prashant as a pull request (his Saturday OK).
// node src/cli.js plan [--start YYYY-MM-DD] [--days N] [--force]
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { P, readJSON, writeJSON, readText, config, log, localDay, addDays } = require('./util');
const { ask, askJSON } = require('./claude');
const { validateEpisode } = require('./validate');

const SYSTEM = () => `You are the writers' room for "The AI Committee", an animated Instagram comedy series. You write short, warm, very relatable episodes in a fixed format and you never break the show's rules.

${readText(P('brand/show.md'))}

# This week's strategy (from the Saturday audit)
${readText(P('brand/strategy.md'), 'No strategy yet: the first audit runs after the first week of posts.')}

# What the numbers said (newest first)
${readText(P('brand/learnings.md'))}`;

const POSTS = () => P('content/posts');
const allPlans = () => { const q = P('content/queue'); return fs.existsSync(q) ? fs.readdirSync(q).map((w) => ({ w, plan: readJSON(path.join(q, w, 'plan.json'), null) })).filter((x) => x.plan) : []; };
function lastQueuedDay() {
  let last = null;
  for (const { plan } of allPlans()) for (const s of plan.slots) if (/^\d{4}-\d{2}-\d{2}$/.test(s.day) && !['skip', 'missed', 'failed'].includes(s.status) && (!last || s.day > last)) last = s.day;
  return last;
}
function recentTitles(n = 28) {
  const posts = fs.existsSync(POSTS()) ? fs.readdirSync(POSTS()).sort().slice(-n) : [];
  return posts.map((id) => { const e = readJSON(path.join(POSTS(), id, 'episode.json'), null); return e ? `${e.title}: ${e.beats[0]?.say || ''}` : id; });
}
const nextNumber = () => (fs.existsSync(POSTS()) ? fs.readdirSync(POSTS()) : []).reduce((m, id) => Math.max(m, Number(id.slice(0, 3)) || 0), 0) + 1;
const examples = () => ['058-voice-clone', '059-take-my-job'].map((id) => readText(path.join(POSTS(), id, 'episode.json'))).join('\n\n') + '\n\n(059 is tagged with the retired "same prompt" series and has a quiz hook: copy its rhythm, not its tag or hook.)';

// ---------- 1. learn: the /ig-audit method on our own numbers, then /ig-plan for next week ----------
const skill = (name) => readText(P('skills', name, 'SKILL.md')).replace(/^---[\s\S]*?---\n/, '');
function followersByDay() { // content/analytics/followers.csv: one account total per day (Instagram has no per-reel follows)
  const rows = readText(P('content/analytics/followers.csv')).trim().split('\n').slice(1).map((l) => l.split(','));
  return Object.fromEntries(rows.filter((r) => r[1]).map((r) => [r[0], Number(r[1])]));
}
function scoreboard() { // latest numbers per post, with the measures ig-audit ranks by
  const lines = readText(P('content/analytics/log.csv')).trim().split('\n'); if (lines.length < 2) return null;
  const cols = lines[0].split(','); const latest = {};
  for (const l of lines.slice(1)) { const v = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')); const r = Object.fromEntries(cols.map((c, i) => [c, v[i]])); latest[r.post + ':' + r.format] = r; }
  const rows = Object.values(latest); if (!rows.length) return null;
  const fol = followersByDay(); const gained = (iso) => { const d = localDay(new Date(iso)); const a = fol[d], b = fol[addDays(d, 1)]; return a !== undefined && b !== undefined ? b - a : null; };
  const num = (x) => Number(x) || 0; const views = rows.map((r) => num(r.views)).sort((x, y) => x - y); const median = views[Math.floor(views.length / 2)] || 1;
  return { median, rows: rows.map((r) => ({ post: r.post, title: r.title, series: r.series || 'old "Hey committee" format', turn_by: r.turn_by, published_at: r.published_at, views: num(r.views), reach: num(r.reach),
    outlier: +(num(r.views) / median).toFixed(2), shares_per_1k_reach: +(1000 * num(r.shares) / Math.max(1, num(r.reach))).toFixed(1), saves_per_1k_reach: +(1000 * num(r.saved) / Math.max(1, num(r.reach))).toFixed(1),
    comments: num(r.comments), likes: num(r.likes), avg_watch_s: r.avg_watch_ms ? +(num(r.avg_watch_ms) / 1000).toFixed(1) : null, follows: r.follows ? num(r.follows) : null, followers_gained_next_day: gained(r.published_at) })).sort((x, y) => y.outlier - x.outlier) };
}
async function learn() {
  const board = scoreboard();
  if (!board || board.rows.length < 3) { log('fewer than 3 posts with numbers yet, skipping the audit'); return; }
  const audit = await ask({
    system: SYSTEM(), effort: 'high',
    prompt: `Run this audit method on our own numbers. Method (follow it, adapted to an animated comedy series: the "hook" is the on-screen hook text plus the first line; there is no product to sell. Compare the series with each other, and the new series format against the old "Hey committee" format):\n\n${skill('ig-audit')}\n\nOur posts (median views ${board.median}), ranked by outlier multiple. followers_gained_next_day = the account's follower count the day after posting minus the day of posting (one reel a day since 30 Oct, so it belongs to that reel; before that two reels shared a day). Follows are the goal; rank by them first once there are any:\n${JSON.stringify(board.rows, null, 1)}\n\nAlso read each post's episode in content/posts/<post>/episode.json if you need to (the series is in "series", the hook in "hook", who delivered the turn in turn_by).\n\nWrite this week's entry for learnings.md: a "## Week of ${localDay()}" heading, then the audit as 3 to 6 bullets (top and bottom by outlier multiple and shares per reach, what separates them, what to STOP, what to DO MORE), each claim with its evidence and how confident it is. Say plainly when the sample is too small. Markdown only.`,
  });
  const f = P('brand/learnings.md'); const [h, ...rest] = readText(f).split('\n## ');
  fs.writeFileSync(f, `${h.trim()}\n\n${audit.trim()}\n\n## ${rest.join('\n## ')}`.replace(/\n## $/, '\n'));
  const strategy = await ask({
    system: SYSTEM(), effort: 'high',
    prompt: `Turn this week's audit into next week's strategy, using this planning method (adapted: every post is a reel episode of our sitcom, one a day at 20:00 IST; the "types" are our recurring series from the show bible: REAL FIX / MUM ASKS / AI RUNS MY SHOP, plus at most one new series being tested; the goal is followers, so judge everything by follows, keyword comments, shares and saves per 1,000 reach):\n\n${skill('ig-plan')}\n\nThis week's audit:\n${audit}\n\nWrite brand/strategy.md: a "# Strategy for the week of ${localDay()}" heading, then short sections: **Make more of**, **Stop**, **The mix** (how many of each series out of 7), **Hooks** (which hook wording to reuse, which to drop), **Length and endings**, **One experiment** (a single, measurable change). Plain markdown, under 300 words.`,
  });
  fs.writeFileSync(P('brand/strategy.md'), strategy.trim() + '\n');
  log('audit and strategy updated');
}

// ---------- caption check: /ig-caption and /ig-human, like every caption on the account ----------
function lintCaption(text) {
  const tmp = P('content', '.caption-check.txt'); fs.writeFileSync(tmp, text);
  const [py, pre] = require('./util').python(); const out = {};
  const a = spawnSync(py, [...pre, P('skills/ig-caption/caption.py'), tmp], { encoding: 'utf8' });
  const b = spawnSync(py, [...pre, P('skills/ig-human/detect.py'), tmp], { encoding: 'utf8' });
  fs.rmSync(tmp, { force: true });
  out.verdict = (((a.stdout || '') + (a.stderr || '')).match(/VERDICT\s+(\w+)/) || [])[1] || 'UNKNOWN';
  out.human = Number((((b.stdout || '') + (b.stderr || '')).match(/HUMAN SCORE[^\d]*([\d.]+)/) || [])[1] || 100);
  out.notes = ((((a.stdout || '') + (a.stderr || '')).match(/(WARN|FAIL).*/g)) || []).join('; ').slice(0, 600);
  return out;
}

// ---------- 2. research ----------
const research = (n) => ask({
  system: SYSTEM(), effort: 'medium', web: true,
  prompt: `Search the web for material for the next ${n} episodes. Our audience is young working Indians and their parents.
1. Problems that really hurt right now in India: job hunting and rejections, campus placements, appraisals and salary talks, late-night work messages, exams and forms, rent and bills, and the scams people are falling for this month (UPI, OTP, KYC, voice-clone calls, deepfake videos, fake forwards). Prefer news and threads from the last 2 weeks.
2. For each problem, a fix that REALLY works and is free: an official website, a free tool, a phone or app feature, or a simple method an AI assistant can help with. Give the official link and check that it is free today. No unknown apps, no paid tools sold as free, no financial, medical or legal advice.
3. Things AI assistants really do that make those moments funnier (agreeing with everything, an essay for a one-line reply, made-up confidence, sharing too much).
4. Dates in the next 10 days in India (festivals, exam dates, sales, deadlines) that raise the stakes.
5. What is working this month on fast-growing AI pages (@ashutoshwithclaude, @canwebuildthis and similar): which problems, hooks and giveaways got thousands of comments.
Return 8 to 12 short bullets, each a possible episode for one of our series (say which), with the problem, the real fix and its official link, and a source link for the problem. Skip anything political, tragic or about real private people.`,
});

// ---------- 3. pick the week ----------
const PACKS = () => readJSON(P('brand/free.json'), {});
function planWeek(count, notes) {
  const ideas = readText(P('brand/ideas.md')); const packs = PACKS();
  return askJSON({
    system: SYSTEM(), effort: 'high',
    validate: (v) => {
      const e = []; if (!Array.isArray(v.episodes) || v.episodes.length !== count) return [`episodes must have exactly ${count} entries`];
      v.episodes.forEach((x, i) => {
        if (!x.slug || !/^[a-z0-9-]{3,40}$/.test(x.slug)) e.push(`episodes[${i}].slug must be lowercase-dash, 3 to 40 characters`);
        if (!x.title || !x.problem || !x.escalation || !x.ending || !x.series || !x.hook || !x.true_behaviour || !x.fix) e.push(`episodes[${i}] needs title, series, hook, true_behaviour, problem, fix, escalation and ending`);
        if (/^SAME PROMPT/.test(x.series || '')) e.push(`episodes[${i}]: "same prompt" is retired`);
        if (/^REAL FIX/.test(x.series || '') && !/\d/.test(x.hook || '')) e.push(`episodes[${i}].hook: a REAL FIX hook needs a number with the tension`);
        if (x.fix_source && !/^https:\/\/\S+$/.test(x.fix_source)) e.push(`episodes[${i}].fix_source must be one https link`);
        if (!['codex', 'claude', 'gemini', 'twin'].includes(x.turn_by)) e.push(`episodes[${i}].turn_by must be codex, claude, gemini or twin`);
        const pack = packs[x.keyword] || (v.new_packs || {})[x.keyword];
        if (!/^[A-Z]{3,12}$/.test(x.keyword || '') || !pack) e.push(`episodes[${i}].keyword must be an existing pack (${Object.keys(packs).join(', ')}) or a key of new_packs`);
      });
      for (const [k, p] of Object.entries(v.new_packs || {})) {
        if (!/^[A-Z]{3,12}$/.test(k) || packs[k]) e.push(`new_packs.${k}: a new UPPER CASE keyword that is not already used`);
        if (!p?.title || !p?.intro || !p?.tip || !Array.isArray(p?.prompts) || !p.prompts.length || p.prompts.some((q) => !q.name || !q.text)) e.push(`new_packs.${k} needs title, intro, tip and prompts [{name, text}]`);
        if (p?.steps !== undefined && (!Array.isArray(p.steps) || p.steps.some((x) => typeof x !== 'string'))) e.push(`new_packs.${k}.steps must be a list of short strings`);
        if (p?.links !== undefined && (!Array.isArray(p.links) || p.links.some((l) => !l.name || !/^https:\/\/\S+$/.test(l.url || '')))) e.push(`new_packs.${k}.links must be [{name, url}] with https links`);
      }
      const turns = v.episodes.map((x) => x.turn_by), cap = Math.ceil(count * 0.4); for (const w of new Set(turns)) if (turns.filter((t) => t === w).length > cap) e.push(`${w} delivers the turn too often; at most ${cap} of ${count}`);
      const slugs = v.episodes.map((x) => x.slug); if (new Set(slugs).size !== slugs.length) e.push('every slug must be different');
      return e;
    },
    prompt: `Plan the next ${count} episodes (one is posted each day at 20:00 IST; neighbouring days must feel different: different series, problem and member delivering the turn).
Idea bank:\n${ideas}\n\nResearch notes:\n${notes || 'none'}\n\nDo NOT repeat these recent episodes:\n${recentTitles().join('\n') || 'none'}\n
Use the series in the show bible and the mix in this week's strategy (default for 7: 4 REAL FIX, 2 MUM ASKS, 1 AI RUNS MY SHOP or one new series test). Number the parts and days on from the last episodes of each series. Every episode starts from a real problem that hurts (in "problem"), rests on a TRUE behaviour of real AI assistants (in "true_behaviour"; no random disasters), and carries a fix that really works and is free (in "fix", with its official link in "fix_source" when there is one). Only use fixes from the research notes or ones you are certain of. Vary who delivers the turn, and let a different member be the useful one sometimes. Follow the experiment in the latest learnings.
Every episode also gives something away: a "keyword" that people comment to get the full fix by DM. A comment has to feel worth it: the pack names the free tool or feature, links to it and lists the steps, then the prompts. Reuse a pack that fits (${Object.entries(packs).map(([k, p]) => `${k}: ${p.title}`).join('; ')}) or add at most 4 new ones in "new_packs". A new pack must be genuinely useful on its own: "steps" (2 to 6 short strings), "links" (official https links only, [{name, url}]) and real prompts someone can paste into any AI assistant; correct and safe, no financial, medical or legal advice, no invented facts.
Reply with JSON only:
{"episodes":[{"slug":"zero-interviews","title":"Zero interviews","series":"REAL FIX · PART 1","hook":"87 applications. 0 interviews.","problem":"Meera has applied to 87 jobs on the big job sites and heard nothing","true_behaviour":"Claude writes a five-part essay on resilience; Gemini cheerfully applies to 40 more jobs for her","fix":"Codex: jobs go up on the company's own careers page first; a Google Alert for the company name plus careers catches them days earlier","fix_source":"https://www.google.com/alerts","escalation":"...","ending":"...","turn_by":"codex","keyword":"JOBS"}],"new_packs":{"JOBS":{"title":"...","intro":"...","steps":["...","..."],"links":[{"name":"Google Alerts","url":"https://www.google.com/alerts"}],"prompts":[{"name":"...","text":"..."}],"tip":"..."}}}`,
  });
}

// ---------- 4. write, then check every line by ear ----------
function voiceCheck(dir) {
  const r = spawnSync(process.execPath, [P('show/voices.mjs'), dir, '--check'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status) throw new Error(`voices failed: ${(r.stderr || '').slice(-600)}`);
  return ((r.stdout || '').match(/CHECK THESE WORDS: (.*)/) || [])[1] || '';
}
async function writeEpisode(id, idea) {
  const dir = path.join(POSTS(), id);
  const pack = PACKS()[idea.keyword];
  const cta = pack ? `Comment ${idea.keyword} and I'll DM you ` : null;
  const check = (v) => [...validateEpisode({ ...v, id }), ...(cta && !String(v.caption || '').includes(cta) ? [`the caption must have this line before the hashtags: "${cta}<what they get, in a few words: ${pack.title}>."`] : [])];
  let ep = await askJSON({
    system: SYSTEM(), effort: 'high', validate: check,
    prompt: `Write episode.json for this episode. Follow the show bible's rules and format exactly.\n\nThe idea:\n${JSON.stringify(idea, null, 2)}\n\nTwo finished episodes that rendered well (copy their rhythm and length, not their jokes):\n${examples()}\n\nReturn episode.json only (with "id": "${id}" and the caption inside).`,
  });
  ep.id = id; fs.mkdirSync(dir, { recursive: true }); writeJSON(path.join(dir, 'episode.json'), ep);
  let bad = voiceCheck(dir);
  if (bad) { // speech-to-text couldn't hear some lines: reword just those, once
    log('rewording lines that were misheard:', bad);
    ep = await askJSON({ system: SYSTEM(), effort: 'medium', validate: check, prompt: `The text-to-speech voices said these lines unclearly (a speech-to-text check heard something else): ${bad}\nReword only the "say" text of those lines with simpler, common words (keep the meaning, the joke and the length), update "show" if needed, and return the full episode.json.\n\n${JSON.stringify(ep)}` });
    ep.id = id; writeJSON(path.join(dir, 'episode.json'), ep);
    bad = voiceCheck(dir); if (bad) log('still unclear after one rewrite (left for the reviewer):', bad);
  }
  const lint = lintCaption(ep.caption);
  if (lint.verdict === 'FAIL') { // the show's lowercase deadpan style scores low on the human check by design, so only real rule failures are rewritten
    log('caption check:', lint.verdict, 'human', lint.human, lint.notes);
    const better = (await ask({ system: SYSTEM(), effort: 'medium', prompt: `Rewrite this Instagram caption so it passes the caption rules in the show bible and reads human (contractions, plain words, no em dashes, no AI-sounding phrases). Problems found: ${lint.notes || 'reads machine-written'} (human score ${lint.human}/100).\n\n${ep.caption}\n\nReturn the caption only.` })).trim();
    if (!require('./validate').validateCaption(better).length) { ep.caption = better; writeJSON(path.join(dir, 'episode.json'), ep); }
  }
  fs.writeFileSync(path.join(dir, 'caption.txt'), ep.caption.trim() + '\n');
  fs.rmSync(path.join(dir, 'voice'), { recursive: true, force: true }); // the render job records the final voices again
  return { id, unclear: bad };
}

// ---------- run ----------
const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 Sunday ... 6 Saturday
async function run({ start, days, force = false } = {}) {
  const cfg = config(); const today = localDay();
  const launch = readJSON(P('content/queue/launch/plan.json'), null);
  if (launch && !launch.start) { log('the launch posts have no dates yet: run the Launch workflow first'); return { skipped: true }; }
  const last = lastQueuedDay();
  start = start || (last && last >= today ? addDays(last, 1) : addDays(today, 1));
  days = days || ((6 - dow(start) + 7) % 7) + 1; // up to and including the next Saturday
  const week = start; const qdir = P('content/queue', week);
  if (!force && fs.existsSync(path.join(qdir, 'plan.json'))) { log(`${week} already planned`); return { week, skipped: true }; }
  const perDay = cfg.slots.length, count = days * perDay;
  log(`planning ${days} days from ${start}: ${count} episodes`);

  await learn().catch((e) => log('learning skipped:', e.message));
  const notes = await research(count).catch((e) => { log('research skipped:', e.message); return ''; });
  const plan = await planWeek(count, notes);
  if (plan.new_packs && Object.keys(plan.new_packs).length) { const packs = PACKS(); for (const [k, p] of Object.entries(plan.new_packs)) if (!packs[k]) packs[k] = p; writeJSON(P('brand/free.json'), packs); log('new free packs:', Object.keys(plan.new_packs).join(', ')); }
  const slots = [], problems = [], posts = [];
  let n = nextNumber();
  for (let i = 0; i < plan.episodes.length; i++) {
    const idea = plan.episodes[i], day = addDays(start, Math.floor(i / perDay)), slot = cfg.slots[i % perDay];
    const id = `${String(n++).padStart(3, '0')}-${idea.slug}`;
    try {
      const made = await writeEpisode(id, idea);
      posts.push(id);
      slots.push({ day, time: slot.time, format: slot.format, post: id, title: idea.title, turn_by: idea.turn_by, series: idea.series, keyword: idea.keyword, status: 'made', ...(made.unclear ? { note: `unclear words: ${made.unclear}` } : {}) });
      log('written', id);
    } catch (e) { problems.push(`${day} ${slot.time} ${idea.title}: ${e.message.split('\n')[0]}`); log('FAILED', day, e.message); }
  }
  writeJSON(path.join(qdir, 'plan.json'), { week, start, research: notes, slots });
  fs.writeFileSync(path.join(qdir, 'problems.txt'), problems.join('\n'));
  log(`planned ${week}: ${posts.length} episodes written, ${problems.length} failed`);
  return { week, posts, problems };
}

// after the render jobs: anything without its video or slides is held back instead of failing at posting time
function finish(week) {
  const f = P('content/queue', week, 'plan.json'); const plan = readJSON(f); const problems = readText(P('content/queue', week, 'problems.txt')).split('\n').filter(Boolean);
  for (const s of plan.slots) {
    const dir = P('content/posts', s.post);
    const ok = s.format === 'reel' ? fs.existsSync(path.join(dir, 'reel.mp4')) : fs.existsSync(path.join(dir, 'slide-01.jpg'));
    if (!ok && s.status === 'made') { s.status = 'skip'; problems.push(`${s.day} ${s.format} ${s.post}: render failed, held back`); }
  }
  writeJSON(f, plan); fs.writeFileSync(P('content/queue', week, 'problems.txt'), [...new Set(problems)].join('\n'));
}

module.exports = { run, finish, lastQueuedDay };
