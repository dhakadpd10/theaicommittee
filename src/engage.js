// Every 15 minutes: answer the page, in character.
//  - comments on the last week's posts -> Claude sorts them: reply (as one committee member), escalate to Prashant, or ignore
//  - new DMs (inside Instagram's 24-hour window) -> same sorting, replies as the page
// Anything escalated (collabs, sponsors, complaints, anyone upset) becomes a GitHub issue so Prashant gets a phone notification.
const { P, readJSON, writeJSON, readText, config, log } = require('./util');
const { askJSON } = require('./claude');
const ig = require('./ig');

const STATE = P('content/state/engage.json');
const DAY = 86400000;

async function openIssue(title, body) {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
  if (!repo || !token) { log('ESCALATE (no GitHub token here):', title); return; }
  await fetch(`https://api.github.com/repos/${repo}/issues`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, body: JSON.stringify({ title, body: `@${process.env.GITHUB_REPOSITORY_OWNER || 'dhakadpd10'} ${body}`, labels: ['inbox'] }) });
}

async function sortMessages(items) {
  if (!items.length) return [];
  const cfg = config();
  const res = await askJSON({
    effort: cfg.models.replies_effort, model: cfg.models.replies,
    system: `You answer comments and DMs for the Instagram page ${cfg.handle}, an animated comedy series. The show:\n${readText(P('brand/show.md')).split('## Episode rules')[0]}\n\nHow to handle comments (the /ig-reply method; our replies stay in character):\n${readText(P('skills/ig-reply/SKILL.md')).replace(/^---[\s\S]*?---\n/, '').slice(0, 5000)}`,
    validate: (v) => (Array.isArray(v.items) && v.items.length === items.length && v.items.every((x) => ['reply', 'escalate', 'ignore'].includes(x.action)) ? [] : [`return {"items":[...]} with exactly ${items.length} entries, each action reply|escalate|ignore`]),
    prompt: `For each message decide:
- "reply": jokes, "this is me", "which AI is this", tagging friends, questions about the show, thanks. Reply in character as ONE committee member who fits (Codex: 1 to 6 literal words; Claude: one gentle, over-polite sentence; Gemini: cheerful and slightly oversharing; the twin: 2 to 5 smug words), and sign it like "· Codex". At most 2 short sentences, no hashtags, no em dashes, at most one emoji. Never insult the person, never promise anything, never pretend to be the real company behind an AI. For DMs, reply as the page, warm and short, unsigned.
- "escalate": ${cfg.replies.escalate.join(', ')}, or anything you're unsure about. Give a one-line summary for Prashant.
- "ignore": spam, bots, emoji-only, "nice", "first".
Messages:\n${items.map((x, i) => `${i}. [${x.kind} on "${x.context}"] @${x.username}: ${x.text}`).join('\n')}

Return JSON only: {"items":[{"action":"reply","text":"..."} | {"action":"escalate","summary":"..."} | {"action":"ignore"}]}`,
  });
  return res.items;
}

async function run() {
  const cfg = config(); const st = readJSON(STATE, { comments: {}, dms: {} });
  const me = (process.env.IG_USERNAME || cfg.handle).replace('@', '').toLowerCase();
  const budget = cfg.limits.max_auto_replies_per_run; const todo = [];

  for (const m of await ig.recentMedia(14)) {
    if (Date.now() - new Date(m.timestamp) > 7 * DAY) continue;
    const list = await ig.comments(m.id);
    for (const c of list) {
      const who = (c.username || c.from?.username || '').toLowerCase(), whoId = c.from?.id;
      if (st.comments[c.id] || who === me || (whoId && whoId === process.env.IG_USER_ID)) continue;
      if ((c.replies?.data || []).some((r) => (r.username || r.from?.username || '').toLowerCase() === me)) { st.comments[c.id] = 'already'; continue; }
      todo.push({ kind: 'comment', id: c.id, username: who || 'someone', text: c.text, context: (m.caption || '').split('\n')[0].slice(0, 80) });
    }
  }
  try {
    for (const conv of await ig.conversations()) {
      const last = conv.messages?.data?.[0]; if (!last || st.dms[last.id]) continue;
      const fromMe = (last.from?.username || '').toLowerCase() === me || last.from?.id === process.env.IG_USER_ID;
      if (fromMe || Date.now() - new Date(last.created_time) > DAY) { st.dms[last.id] = 'skip'; continue; }
      todo.push({ kind: 'dm', id: last.id, from: last.from?.id, username: last.from?.username, text: last.message, context: 'direct message' });
    }
  } catch (e) { log('DM inbox not readable yet:', e.message); }

  const batch = todo.slice(0, budget);
  const decisions = await sortMessages(batch);
  const escalations = [];
  for (let i = 0; i < batch.length; i++) {
    const x = batch[i], d = decisions[i]; const book = x.kind === 'dm' ? st.dms : st.comments;
    try {
      if (d.action === 'reply' && cfg.replies.auto_reply) {
        if (x.kind === 'dm') await ig.sendMessage(x.from, d.text); else await ig.replyToComment(x.id, d.text);
        book[x.id] = 'replied'; log('replied', x.kind, '@' + x.username);
      } else if (d.action === 'escalate' || d.action === 'reply') {
        // the repo is public: DM contents never go into an issue, only that a DM is waiting
        escalations.push(x.kind === 'dm'
          ? `- A **direct message** from @${x.username} needs your reply. Open the Instagram inbox to read it.`
          : `- **@${x.username}** commented on "${x.context}": ${x.text}\n  - ${d.summary || 'Suggested reply: ' + d.text}`);
        book[x.id] = 'escalated';
      } else book[x.id] = 'ignored';
    } catch (e) { log('reply failed', x.id, e.message); book[x.id] = 'failed'; }
  }
  if (escalations.length) await openIssue(`Inbox: ${escalations.length} message${escalations.length > 1 ? 's' : ''} need you`, `The agent didn't answer these. Reply on Instagram yourself, then close this issue.\n\n${escalations.join('\n')}`);
  writeJSON(STATE, st);
  log(`engage done: ${batch.length} sorted, ${escalations.length} escalated`);
}

module.exports = { run };
