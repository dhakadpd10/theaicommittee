// The Doctor (doctor.yml): something failed, find out why and fix it without waiting for Prashant.
//  - Claude usage limit      -> wait until it resets, then start the failed job again
//  - GitHub / network outage -> wait 10 minutes, start it again
//  - anything else           -> Claude Code reads the log and the code, makes the smallest fix, the fix is tested,
//                               saved to main, and the failed job starts again. If the tests fail, nothing is saved.
// Every visit leaves a short note as a GitHub issue (label "doctor"). At most 4 visits a day, so it can never loop.
const fs = require('fs');
const { spawnSync, spawn } = require('child_process');
const { P, log, readText } = require('./util');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
const gh = (...a) => sh('gh', [...a, '--repo', process.env.GITHUB_REPOSITORY]);
// notes that need Prashant @mention him (phone + email); routine "fixed it" notes stay quiet
const note = (title, body) => sh('gh', ['issue', 'create', '--repo', process.env.GITHUB_REPOSITORY, '--title', title, '--label', 'doctor', '--body-file', '-'],
  { input: /needs you|needs a look|restart later|may need you/i.test(title + body) ? `@${process.env.GITHUB_REPOSITORY_OWNER || 'dhakadpd10'} this needs you.\n\n${body}` : body });

function resetTime(text) { // "resets 2:50pm (UTC)" -> ms until then (next occurrence)
  const m = text.match(/resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\(UTC\)/i); if (!m) return null;
  let h = Number(m[1]) % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0); const min = Number(m[2] || 0);
  const now = new Date(), t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, min));
  if (t < now) t.setUTCDate(t.getUTCDate() + 1);
  return t - now;
}
const restart = (file) => { if (file) { const r = gh('workflow', 'run', file); log(r.status ? `could not restart ${file}` : `restarted ${file}`); } };

function tests() {
  const files = [...fs.readdirSync(P('src')).map((f) => `src/${f}`), ...['show/render.js', 'show/make.js', 'show/comic.js', 'show/audio.js', 'show/timeline.js', 'show/hf.js']].filter((f) => f.endsWith('.js') && fs.existsSync(P(f)));
  for (const f of files) { const r = sh(process.execPath, ['--check', P(f)]); if (r.status) return `${f}: ${r.stderr.slice(0, 300)}`; }
  for (const f of ['show/scene.js', 'show/committee.js', 'show/voices.mjs']) { const r = sh(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(P(f), 'utf8') }); if (r.status) return `${f}: ${r.stderr.slice(0, 300)}`; }
  const v = sh(process.execPath, ['-e', "const {validateEpisode}=require('./src/validate');for(const id of ['046-mum-asks-prompt','058-voice-clone']){const e=require('./content/posts/'+id+'/episode.json');const p=validateEpisode(e);if(p.length)throw new Error(id+': '+p.join('; '))}"], { cwd: P() });
  if (v.status) return `validator: ${v.stderr.slice(0, 300)}`;
  const s = sh(process.execPath, [P('src/cli.js'), 'site'], { cwd: P() }); if (s.status) return `site build: ${s.stderr.slice(0, 300)}`;
  fs.rmSync(P('_site'), { recursive: true, force: true });
  return null;
}

function askClaude(prompt) {
  return new Promise((resolve) => {
    const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: (process.env.CLAUDE_CODE_OAUTH_TOKEN || '').replace(/\s+/g, '') };
    for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN']) if (!env[k]) delete env[k];
    const p = spawn('claude', ['-p', '--output-format', 'text', '--max-turns', '60', '--model', 'claude-opus-5-5',
      '--allowedTools', 'Read,Edit,Write,Glob,Grep,Bash(node:*),Bash(npm ls:*),Bash(git diff:*),Bash(git status:*),Bash(git log:*),Bash(ls:*),Bash(cat:*),Bash(head:*),Bash(tail:*),Bash(grep:*)'],
    { cwd: P(), env });
    let out = '', err = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('close', () => resolve(out || err)); p.stdin.end(prompt);
  });
}

async function run({ file = '' } = {}) {
  const reason = readText(P('reason.txt')).trim(), failure = readText(P('failure.log'));
  const all = reason + '\n' + failure;
  log('doctor called for:', reason);
  // never loop: at most 4 visits a day
  const today = new Date().toISOString().slice(0, 10);
  const visits = (gh('issue', 'list', '--label', 'doctor', '--state', 'all', '--search', `created:>=${today}`, '--json', 'number', '-q', 'length').stdout || '0').trim();
  if (Number(visits) >= 4) { log('the doctor already came 4 times today: leaving this one for Prashant'); note('Doctor: needs you', `Four automatic repairs today already, so this one waits for you.\n\n**What failed:** ${reason}\n\n\`\`\`\n${failure.slice(-3000)}\n\`\`\``); return; }

  if (/hit your .*limit|usage limit|session limit/i.test(all)) {
    const wait = resetTime(all) ?? 60 * 60000;
    if (wait > 5 * 3600000) { note('Doctor: Claude limit, restart later', `Claude's usage limit resets in ${Math.round(wait / 3600000)} h, longer than this job can wait. Run the failed job again after it resets.\n\n${reason}`); return; }
    log(`Claude usage limit: waiting ${Math.round(wait / 60000)} min for it to reset`);
    await sleep(wait + 3 * 60000); restart(file);
    note('Doctor: waited out the Claude limit', `${reason}\n\nClaude's usage limit was reached. The doctor waited for it to reset and started **${file || 'the job'}** again.`);
    return;
  }
  if (/Could not resolve host|ECONNRESET|ETIMEDOUT|502 Bad Gateway|503 Service|internal server error|github\.com.*(timed out|unavailable)/i.test(all) && !/at .*src\//.test(failure)) {
    log('looks like a GitHub or network outage: waiting 10 minutes'); await sleep(10 * 60000); restart(file);
    note('Doctor: retried after an outage', `${reason}\n\nThe log points to a network or GitHub outage, not our code. Waited 10 minutes and started **${file || 'the job'}** again.`);
    return;
  }

  const answer = await askClaude(`You are the repair agent for this repository: an Instagram agent for "The AI Committee" that writes, renders and posts animated episodes (read README.md, src/, show/). A job just failed.

What failed: ${reason}

The end of the failed log:
${failure.slice(-12000) || '(no log; only the reason above)'}

Find the root cause. If it is in this repository's code or config, fix it with the smallest safe change. Rules:
- Never touch secrets, never print tokens, never change brand/ files, the posting times, the approval rule or the workflow triggers.
- Never delete episodes, posts, plans or analytics. Never change a slot that is "published".
- If the cause is outside this repo (Instagram, Meta, GitHub, Claude limits, a bad token), make NO code change.
- After editing, run \`node --check\` on every file you changed.
End your answer with exactly one line: "SUMMARY: <what you changed and why, in one plain sentence>" or "NOFIX: <the cause, in one plain sentence>".`);
  const line = (answer.match(/^(SUMMARY|NOFIX): .*$/m) || [`NOFIX: no clear answer (${answer.trim().slice(-200)})`])[0];
  log(line);
  const changed = sh('git', ['status', '--porcelain', '--', 'src', 'show', 'config', '.github', 'package.json']).stdout.trim();
  if (!changed) { note(`Doctor: ${line.replace(/^\w+: /, '').slice(0, 80)}`, `**What failed:** ${reason}\n\n**Diagnosis:** ${line}\n\nNo code change was needed or possible. If it says Instagram, Meta or a token, it may need you.`); return; }
  const bad = tests();
  if (bad) {
    sh('git', ['checkout', '--', '.']);
    note('Doctor: a fix was tried but did not pass the checks', `**What failed:** ${reason}\n\n**Tried:** ${line}\n\n**The checks said:** ${bad}\n\nNothing was saved. This one needs a look.`);
    return;
  }
  sh('git', ['add', 'src', 'show', 'config', '.github', 'package.json', 'package-lock.json']);
  sh('git', ['commit', '-q', '-m', `Doctor: ${line.replace(/^SUMMARY: /, '').slice(0, 120)}`]);
  for (let i = 0; i < 4; i++) { if (!sh('git', ['push', '-q']).status) break; sh('git', ['pull', '--rebase', '-q']); }
  restart(file);
  note(`Doctor fixed: ${line.replace(/^SUMMARY: /, '').slice(0, 80)}`, `**What failed:** ${reason}\n\n**Fix:** ${line}\n\nThe checks passed, the fix is saved on main, and **${file || 'the job'}** was started again.\n\n<details><summary>Claude's notes</summary>\n\n${answer.slice(-4000)}\n</details>`);
}

module.exports = { run, resetTime };
