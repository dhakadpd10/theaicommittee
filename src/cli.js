#!/usr/bin/env node
// The AI Committee agent - entry point for every job (the GitHub Actions workflows call these).
//   node src/cli.js plan [--start YYYY-MM-DD] [--days N] [--force]   write next week (2 reels a day, up to Saturday)
//   node src/cli.js finish <week>                                   after rendering: hold back anything that failed
//   node src/cli.js review <week> <branch>                          print the approval pull-request text
//   node src/cli.js publish [--dry-run]                             post approved reels and carousels that are due
//   node src/cli.js engage                                          reply to comments and DMs in character
//   node src/cli.js analytics                                       log every live post's numbers
//   node src/cli.js site                                            build the public site (media + legal pages) into _site/
//   node src/cli.js refresh-token                                   print a refreshed Instagram token (workflow stores it)
//   node src/cli.js launch --start YYYY-MM-DD                       give the launch episodes real dates (Day 1 = start)
//   node src/cli.js check                                           check keys and the Instagram connection
const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(`--${name}`); return i < 0 ? def : args[i + 1] ?? true; };
const out = (k, v) => process.env.GITHUB_OUTPUT && require('fs').appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

// jobs that need a connected account skip quietly until the secrets exist
const NEEDS_IG = ['publish', 'engage', 'analytics', 'refresh-token'];
const NEEDS_CLAUDE = ['plan', 'engage'];

(async () => {
  const cmd = args[0];
  if (NEEDS_IG.includes(cmd) && (!process.env.IG_ACCESS_TOKEN || !process.env.IG_USER_ID)) { console.log('Instagram not connected yet (add the IG_ACCESS_TOKEN and IG_USER_ID secrets). Skipping.'); out('skipped', 'true'); return; }
  if (NEEDS_CLAUDE.includes(cmd) && !require('./claude').hasClaude()) { console.log('Claude not connected yet (add the CLAUDE_CODE_OAUTH_TOKEN secret). Skipping.'); out('skipped', 'true'); return; }
  if (cmd === 'plan') {
    const r = await require('./plan').run({ start: flag('start'), days: flag('days') ? Number(flag('days')) : undefined, force: args.includes('--force') });
    out('skipped', String(!!r.skipped || !(r.posts || []).length)); out('week', r.week || ''); out('posts', JSON.stringify(r.posts || []));
  } else if (cmd === 'finish') require('./plan').finish(args[1]);
  else if (cmd === 'review') console.log(require('./review').body(args[1], args[2]));
  else if (cmd === 'publish') await require('./publish').run({ dryRun: args.includes('--dry-run') });
  else if (cmd === 'engage') await require('./engage').run();
  else if (cmd === 'analytics') await require('./analytics').run();
  else if (cmd === 'site') require('./site').build();
  else if (cmd === 'launch') {
    const { P, readJSON, writeJSON, addDays } = require('./util'); const start = flag('start');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start || '')) throw new Error('give --start YYYY-MM-DD');
    const f = P('content/queue/launch/plan.json'); const plan = readJSON(f);
    for (const s of plan.slots) { const m = String(s.day).match(/^DAY(\d+)$/); if (m) s.day = addDays(start, Number(m[1]) - 1); }
    plan.start = start; delete plan.note; writeJSON(f, plan);
    console.log(`launch set: ${plan.slots.map((s) => `${s.day} ${s.time} ${s.format} ${s.post}`).join(' | ')}`);
  }
  else if (cmd === 'refresh-token') { const t = await require('./ig').refreshToken(); process.stdout.write(t.access_token); }
  else if (cmd === 'check') {
    const ok = (b) => (b ? 'yes' : 'NO');
    const claude = require('./claude');
    console.log('Claude connected:     ', claude.hasClaude() ? (claude.useClaudeCode() ? 'yes (subscription via Claude Code)' : 'yes (API key)') : 'NO');
    if (claude.useClaudeCode()) console.log('Subscription token:   ', claude.tokenShape());
    if (claude.hasClaude()) { try { const r = await claude.ask({ system: 'Reply with one word.', prompt: 'Say OK.', effort: 'low' }); console.log(`OK   Claude replied: ${r.trim().slice(0, 40)}`); } catch (e) { console.log(`FAIL Claude: ${e.message}`); } }
    console.log('IG_ACCESS_TOKEN set:  ', ok(process.env.IG_ACCESS_TOKEN));
    console.log('IG_USER_ID set:       ', ok(process.env.IG_USER_ID));
    if (process.env.IG_ACCESS_TOKEN) { // read-only: nothing is posted, replied or sent
      const ig = require('./ig'); const step = async (name, fn) => { try { console.log(`OK   ${name}: ${await fn()}`); } catch (e) { console.log(`FAIL ${name}: ${e.message}`); } };
      let me;
      await step('account', async () => { me = await ig.me(); return `@${me.username} (${me.account_type}), ${me.followers_count} followers, ${me.media_count} posts`; });
      await step('user id matches', async () => { if (!me) throw new Error('account not readable'); if (String(me.user_id) !== String(process.env.IG_USER_ID)) throw new Error(`IG_USER_ID is ${process.env.IG_USER_ID} but the token belongs to ${me.user_id}: update the IG_USER_ID secret to ${me.user_id}`); return me.user_id; });
      let media = [];
      await step('read posts', async () => { media = await ig.recentMedia(5); return `${media.length} recent`; });
      if (media[0]) await step('read comments', async () => `${(await ig.comments(media[0].id)).length} on the latest post (Instagram counts ${media[0].comments_count})`);
      if (media[0]) await step('read insights', async () => JSON.stringify(await ig.mediaInsights(media[0].id, 'reel')));
      await step('read DMs', async () => `${(await ig.conversations()).length} conversations visible`);
      await step('posting limit', async () => JSON.stringify((await ig.publishingLimit()).data?.[0] || {}));
    }
  } else { console.log(require('fs').readFileSync(__filename, 'utf8').split('\n').slice(1, 13).join('\n')); process.exit(cmd ? 1 : 0); }
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
