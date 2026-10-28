// The privacy policy, data deletion instructions and terms that Meta's App Review asks for.
// Built into the public site at /privacy/, /data-deletion/ and /terms/.
const UPDATED = '17 October 2026';
const REPO = 'https://github.com/dhakadpd10/theaicommittee';

const article = (title, html) => `<div class="wrap"><header><span class="sticker">THE AI COMMITTEE</span><h1>${title}</h1><p class="lede">Last updated ${UPDATED}</p></header><div class="legal">${html}</div></div>`;

const privacy = (h) => article('Privacy Policy', `
<p>This policy covers <strong>The AI Committee</strong>, the Instagram account <strong>${h}</strong> and the open-source software agent that runs it (<a href="${REPO}">source code</a>). It is operated by Prashant, an individual in India.</p>
<h2>What we collect</h2>
<p>Only when you interact with ${h}:</p>
<ul>
<li><strong>Comments on our posts:</strong> your Instagram username, Instagram-scoped user ID, the comment text and its time.</li>
<li><strong>Direct messages you send us:</strong> your username, Instagram-scoped user ID, the message text and its time.</li>
<li><strong>Our own post statistics:</strong> views, reach, likes, comments, saves and shares of posts we publish. These are totals, not information about you.</li>
</ul>
<p>We do not collect your email, phone number, location, contacts or anything from your own posts or profile beyond your username.</p>
<h2>Why we use it</h2>
<ul>
<li>To reply to your comment or message.</li>
<li>When you comment a keyword shown in a post (for example "TRUTH"), to send you one direct message with the free prompt you asked for.</li>
<li>To learn which posts are useful, using the post statistics above.</li>
</ul>
<h2>How it is processed</h2>
<p>Comment and message text is sent to Anthropic's Claude to decide whether and how to reply, under Anthropic's terms. Instagram data is accessed only through Meta's official Instagram API. The agent runs on GitHub Actions.</p>
<h2>What we keep, and for how long</h2>
<p>We keep only the ID of each comment or message and what the agent did with it (replied, sent the tool, passed to Prashant, ignored), so it never replies twice. We do not store the text of your comments or messages. If something needs a human reply, Prashant is notified that a message is waiting; the text of private messages is never copied anywhere outside Instagram. Post statistics are kept for as long as the account runs. Comment and message IDs are deleted on request.</p>
<h2>Sharing</h2>
<p>We do not sell or rent your data and do not use it for advertising. It is processed only by Meta (Instagram), Anthropic (Claude) and GitHub (hosting), to provide the replies described above.</p>
<h2>Your choices</h2>
<p>You can delete your comment on Instagram at any time, stop messaging us, or ask us to delete anything we hold about you: see <a href="../data-deletion/">Data deletion</a>.</p>
<h2>Contact</h2>
<p>Send a direct message to <strong>${h}</strong> on Instagram, or open an issue at <a href="${REPO}/issues">${REPO}/issues</a>.</p>`);

const deletion = (h) => article('Data Deletion', `
<p>To delete any data The AI Committee holds about you:</p>
<ol>
<li>Send a direct message to <strong>${h}</strong> on Instagram saying <strong>"delete my data"</strong>.</li>
<li>Or open an issue at <a href="${REPO}/issues">${REPO}/issues</a> with your Instagram username (do not include anything else personal).</li>
</ol>
<p>Within 30 days we delete the stored IDs of your comments and messages and confirm by reply. The text of your comments and messages is never stored by us; to remove a comment itself, delete it on Instagram.</p>
<p>See the <a href="../privacy/">Privacy Policy</a> for what we collect and why.</p>`);

const terms = (h) => article('Terms of Use', `
<p>${h} is an animated comedy series about everyday life with AI assistants. The characters are fan-made parodies; the account is not affiliated with OpenAI, Anthropic or Google. An automated agent replies to comments and messages on its behalf.</p>
<ul>
<li>The episodes are comedy. Nothing here is legal, financial or professional advice.</li>
<li>Example numbers in posts are examples, not results we promise.</li>
<li>Replies may be written by an AI agent and checked by Prashant where needed.</li>
<li>The software behind the account is open source under the MIT licence: <a href="${REPO}">${REPO}</a>.</li>
</ul>
<p>Questions: send a direct message to <strong>${h}</strong> on Instagram.</p>`);

module.exports = { privacy, deletion, terms };
