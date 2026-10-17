// Writes the approval pull-request description: every episode with its cover, day and caption.
// Merging the pull request = approving them.
const { P, readJSON, readText, config } = require('./util');

function body(week, branch) {
  const repo = process.env.GITHUB_REPOSITORY || 'OWNER/theaicommittee';
  const plan = readJSON(P('content/queue', week, 'plan.json'));
  const raw = (p) => `https://raw.githubusercontent.com/${repo}/${branch}/${p}`;
  const blob = (p) => `https://github.com/${repo}/blob/${branch}/${p}`;
  const times = config().slots.map((s) => `${s.time} ${s.format}`).join(' and ');
  const days = [...new Set(plan.slots.map((s) => s.post))].map((post, i) => {
    const s = plan.slots.find((x) => x.post === post); const dir = `content/posts/${post}`;
    const cap = readText(P(dir, 'caption.txt')).split('\n')[0].replace(/\|/g, '/');
    const held = plan.slots.filter((x) => x.post === post && x.status === 'skip').length ? ' (held back)' : '';
    return `| ${i + 1} | ${s.day} | **${s.title}**${held} | <img src="${raw(`${dir}/cover.jpg`)}" width="140"> | ${cap} | [video](${blob(`${dir}/reel.mp4`)}) |`;
  });
  const problems = readText(P('content/queue', week, 'problems.txt')).trim();
  const notes = plan.slots.filter((s) => s.note).map((s) => `- ${s.day} ${s.title}: ${s.note}`);
  return `## ${days.length} new episodes, from ${plan.start}

**Merge this pull request to approve them.** Nothing is posted before you merge. Each day posts the episode as a reel and as a comic-strip carousel (${times} IST).
To hold one back, open \`content/queue/${week}/plan.json\` in this PR and set its \`"status"\` to \`"skip"\`. Close the PR to reject all of them.

| # | Day | Episode | Cover | Caption line 1 | Watch |
|---|---|---|---|---|---|
${days.join('\n')}

Every video, slide and caption is in the **Files changed** tab.
${notes.length ? `\n### Lines the speech check found unclear (listen to these)\n${notes.join('\n')}\n` : ''}${problems ? `\n### Couldn't make\n${problems.split('\n').map((p) => `- ${p}`).join('\n')}\n` : ''}
### What the agent learned
${readText(P('brand/learnings.md')).split('\n## ').slice(1, 2).map((s) => '#### ' + s).join('') || 'No posts live yet.'}
`;
}

module.exports = { body };
