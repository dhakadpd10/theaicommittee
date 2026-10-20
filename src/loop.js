// The agent's heartbeat. One GitHub job runs this for about 5 h 40 min, then the next run takes over
// (agent.yml queues a successor every hour, so there is never a gap, even when GitHub skips a timer).
//   every minute: pick up approved weeks, post what's due, deal with any problem (doctor)
//   every 15 min: answer comments and DMs in character
//   once a day after 10:00 IST: log every post's numbers
const { spawnSync } = require('child_process');
const fs = require('fs');
const { P, log, localDay, config } = require('./util');
const doctor = require('./doctor');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const git = (...a) => spawnSync('git', a, { encoding: 'utf8' });

function sync() { // newest main (a merged week, Prashant's edits) before acting on it
  const r = git('pull', '--rebase', '--autostash', '-q');
  if (r.status) { log('git pull problem:', (r.stderr || '').trim().slice(0, 200)); git('rebase', '--abort'); }
}
function save(message) { // commit what changed and push it, retrying if someone else pushed first
  git('add', 'content/queue', 'content/state', 'content/analytics');
  if (!git('diff', '--cached', '--quiet').status) return;
  git('commit', '-q', '-m', message);
  for (let i = 0; i < 5; i++) {
    if (!git('push', '-q').status) return;
    const r = git('pull', '--rebase', '-q');
    if (r.status) { log('rebase conflict, keeping both sides is not possible; retrying from a clean pull'); git('rebase', '--abort'); }
  }
  log('could not push status after 5 tries (will try again next minute)');
}
const hourIST = () => Number(new Date(Date.now() + 5.5 * 3600000).toISOString().slice(11, 13));
const loggedToday = () => { try { return fs.readFileSync(P('content/analytics/log.csv'), 'utf8').includes(`\n${localDay()},`); } catch { return false; } };

async function run({ minutes = 340 } = {}) {
  const end = Date.now() + minutes * 60000; let lastEngage = 0, lastNumbers = 0;
  const hasIG = !!(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID);
  const hasClaude = require('./claude').hasClaude();
  log(`agent loop started for ${minutes} min (${config().handle})`);
  while (Date.now() < end) {
    sync();
    if (hasIG) {
      try { await require('./publish').run(); } catch (e) { await doctor.handle('publish', e); }
      try { await doctor.reviewSlots(); } catch (e) { log('doctor problem:', e.message); }
      save('Agent: posting status');
      if (hasClaude && Date.now() - lastEngage > 15 * 60000) {
        lastEngage = Date.now();
        try { await require('./engage').run(); } catch (e) { await doctor.handle('engage', e); }
        save('Agent: replies');
      }
      if (hourIST() >= 10 && !loggedToday() && Date.now() - lastNumbers > 60 * 60000) { // at most one try an hour
        lastNumbers = Date.now();
        try { await require('./analytics').run(); } catch (e) { await doctor.handle('analytics', e); }
        save('Agent: daily numbers');
      }
      try { doctor.checkQueue(); } catch (e) { log('queue check problem:', e.message); }
      save('Agent: checks');
      if (doctor.isTokenBroken()) { // the token in this run's memory is dead: end now so the next run reads the new secret
        log('Instagram token is broken: handing over so the next run picks up a new token'); break;
      }
    }
    await sleep(60000);
  }
  log('agent loop handing over to the next run');
}

module.exports = { run };
