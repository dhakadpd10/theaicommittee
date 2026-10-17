// Every Saturday: plans the coming week (from the day after the last queued episode up to the next Saturday),
// two reels a day: learn from the numbers -> research what's current -> pick the episodes -> write them -> check every line by ear.
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
const examples = () => ['001-more-polite', '003-ninety-two-percent'].map((id) => readText(path.join(POSTS(), id, 'episode.json'))).join('\n\n');

// ---------- 1. learn ----------
async function learn() {
  const csv = readText(P('content/analytics/log.csv'));
  if (csv.split('\n').filter(Boolean).length < 4) { log('not enough numbers yet, skipping the learning step'); return; }
  const text = await ask({
    system: SYSTEM(), effort: 'high',
    prompt: `Per-post metrics log (one row per post per day; use each post's latest row):\n\n${csv.slice(-20000)}\n\nWrite this round's entry for learnings.md: a "## Week of ${localDay()}" heading, then 3 to 5 bullets: which episodes over-performed and why you think so (topic, which member delivered the turn, the ending, the length), what to stop, and one experiment for next week. Views, shares, saves and watch-through matter most. Say plainly when a sample is too small to conclude anything. Markdown only.`,
  });
  const f = P('brand/learnings.md'); const [head, ...rest] = readText(f).split('\n## ');
  fs.writeFileSync(f, `${head.trim()}\n\n${text.trim()}\n\n## ${rest.join('\n## ')}`.replace(/\n## $/, '\n'));
  log('learnings updated');
}

// ---------- 2. research ----------
const research = (n) => ask({
  system: SYSTEM(), effort: 'medium', web: true,
  prompt: `Search the web for material for the next ${n} episodes:
1. Funny or frustrating things people say AI assistants (ChatGPT, Claude, Gemini, Codex and other AI tools) did to them in the last 2 weeks: posts, threads, memes, news.
2. Everyday moments coming up in the next 10 days in India and worldwide (festivals, exams, sales, sports finals, weather, tax deadlines).
3. Workplace and family situations people are joking about right now.
4. What is working this month on animated AI-comedy pages like @canwebuildthis (our reference: an animated series where AI assistants are characters) and AI-humour creators: which situations and endings get shared.
Return 8 to 12 short bullets, each a possible everyday problem for Meera to bring to the committee, with a source link. Skip anything political, tragic or about real private people.`,
});

// ---------- 3. pick the week ----------
function planWeek(count, notes) {
  const ideas = readText(P('brand/ideas.md'));
  return askJSON({
    system: SYSTEM(), effort: 'high',
    validate: (v) => {
      const e = []; if (!Array.isArray(v.episodes) || v.episodes.length !== count) return [`episodes must have exactly ${count} entries`];
      v.episodes.forEach((x, i) => {
        if (!x.slug || !/^[a-z0-9-]{3,40}$/.test(x.slug)) e.push(`episodes[${i}].slug must be lowercase-dash, 3 to 40 characters`);
        if (!x.title || !x.problem || !x.escalation || !x.ending) e.push(`episodes[${i}] needs title, problem, escalation and ending`);
        if (!['codex', 'claude', 'gemini', 'twin'].includes(x.turn_by)) e.push(`episodes[${i}].turn_by must be codex, claude, gemini or twin`);
      });
      const turns = v.episodes.map((x) => x.turn_by), cap = Math.ceil(count * 0.4); for (const w of new Set(turns)) if (turns.filter((t) => t === w).length > cap) e.push(`${w} delivers the turn too often; at most ${cap} of ${count}`);
      const slugs = v.episodes.map((x) => x.slug); if (new Set(slugs).size !== slugs.length) e.push('every slug must be different');
      return e;
    },
    prompt: `Plan the next ${count} episodes (two are posted each day, 09:00 and 20:00 IST, so the two on the same day must feel different: different topic, different member delivering the turn).
Idea bank:\n${ideas}\n\nResearch notes:\n${notes || 'none'}\n\nDo NOT repeat these recent episodes:\n${recentTitles().join('\n') || 'none'}\n
Mix: about 70% everyday life (work, family, weather, money, friends, food, travel), the rest about Meera's candle side business or a seasonal moment. Vary who delivers the turn (the joke that makes it worse). Follow the experiment in the latest learnings.
Reply with JSON only:
{"episodes":[{"slug":"meeting-summary","title":"The meeting","problem":"Meera asks the committee to summarise a one-hour meeting","escalation":"Claude asks how the meeting made her feel; Codex: 'Nothing happened.'","ending":"Gemini says she accepted tomorrow's meeting for Meera, and the twin adds 'You're presenting.' Meera: 'Mute me.'","turn_by":"gemini"}]}`,
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
  const check = (v) => validateEpisode({ ...v, id });
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
  const slots = [], problems = [], posts = [];
  let n = nextNumber();
  for (let i = 0; i < plan.episodes.length; i++) {
    const idea = plan.episodes[i], day = addDays(start, Math.floor(i / perDay)), slot = cfg.slots[i % perDay];
    const id = `${String(n++).padStart(3, '0')}-${idea.slug}`;
    try {
      const made = await writeEpisode(id, idea);
      posts.push(id);
      slots.push({ day, time: slot.time, format: slot.format, post: id, title: idea.title, turn_by: idea.turn_by, status: 'made', ...(made.unclear ? { note: `unclear words: ${made.unclear}` } : {}) });
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
