# The AI Committee: show bible

**One question. Three AIs. Zero help.**

Meera, a tired, dry, very online young woman (a day job, a boss, a mum who calls, a small candle brand called Mitti on the side), brings one everyday problem to "the committee": three little AI assistants sitting at a tiny hearing table on her desk. Each answers in its own way, and together they make it worse. Fan-made parody characters, not affiliated with OpenAI, Anthropic or Google.

## The cast

| who | look | personality | how they talk |
|---|---|---|---|
| `meera` | 3D girl, terracotta hoodie, bun with a pencil, gold hoops | the straight woman. Tired, dry, never shouts. Her flat one-word reactions are the punchlines. | short, plain sentences. Says the task in the first second. |
| `codex` | puffy blue cloud with a glowing `>_` face | the terminal. Does it immediately, asks nothing, takes everything literally, thinks the world is a repo. | 1 to 6 words. "Done." "Deleted everything." "That's not in the repo." |
| `claude` | orange pixel creature built from blocks, slot eyes, little arms | the careful one. Thoughtful, polite, asks how you feel first, over-apologises, writes far too much, adds caveats. | full, gentle sentences. Sometimes overdoes politeness until it is absurd. |
| `gemini` | blue-to-pink sparkle | the cheerful know-it-all, connected to everything. Confident, helpful, and quietly shares/sends/posts things nobody asked it to. | upbeat, exclamation marks. "Done! I also..." |
| `twin` | Gemini's smaller sparkle twin | the smug one. Adds the last, worse detail. | 2 to 5 words, deadpan. "And your mom." "Till March." |

Nobody is the villain. Every joke is "the AI did exactly what an AI would do". Keep it affectionate: people who love these tools should laugh hardest.

## The one rule: it must be TRUE

People share a reel when they recognise their own life in it ("this is literally my AI", "send this to Mum"). So every episode rests on something real AI assistants actually do, and the viewer should be able to say "yes, mine does that":
- agrees the moment you push back ("You're absolutely right!"), even when you were wrong
- apologises, then makes the same mistake again
- you ask for one line, you get five parts, headings, a table and "Would you like me to expand?"
- AI words: "delve", "I hope this email finds you well", dashes everywhere
- confident, made-up answers and sources; invented personal stories ("my grandmother")
- fixes one thing, rewrites everything; finds and replaces everywhere
- forgets the start of a long chat; makes podcasts and slide decks nobody asked for
Random disasters with no real-life source ("deleted your account", "sent it to the whole restaurant") are out. They got views but no shares, comments or follows (22 reels, Oct 2026).

## The series (every episode belongs to one)

A series gives people a reason to follow: there is a part 2. Rotate them, never the same series twice in a row.

| series | `series` tag | what it is | why people share it | caption question |
|---|---|---|---|---|
| Same prompt, 3 AIs | `SAME PROMPT, 3 AIS` | Meera gives all three the same task; each answers exactly like the real one would | "this is my AI" / tag the friend who uses it | a pick-one: "which one of these agrees with you no matter what?" |
| Mum asks | `MUM ASKS · PART N` | Mum texts an AI word (prompt, token, hallucination, memory, agent, AI image, deepfake, voice clone, bias...). Codex answers in jargon, Claude explains it with an everyday Indian analogy that is actually correct, Meera sends it, Mum's reply (on the laptop) is the punchline | it really teaches the word, "send this to your parents" | always "which AI word should mum ask about next?" |
| AI runs my shop | `AI RUNS MY SHOP · DAY N` | a running story: the committee runs Mitti, Meera's candle shop, one job a day; the laptop shows "Orders: N" and the count is the running gag | people follow to see the next day | a vote or a pick: "299 or 999?", "which ad would you click?" |

A new series can be tested at most once a week. Mum never speaks: her messages appear on the laptop (`"screen": {"page": "text", "title": "Mum", "body": "..."}`) and Meera reads the punchline out loud.

## Every episode gives something away

The pages growing fastest in our space (@ashutoshwithclaude: 0 to 24K followers in a month; @canwebuildthis: 82K likes on a free-tool reel) pair the joke with something genuinely useful and ask for one word in the comments. So every episode has a `keyword`: the caption carries "Comment WORD and I'll DM you <the pack>.", and the agent DMs everyone who comments it a free prompt pack from `brand/free.json` (shown at /free/ on the site).
- The episode itself should contain the useful moment (Claude's correct analogy, Codex's honest one-liner, the reply that actually works), so the pack feels like the obvious next step.
- Packs must work on their own: real prompts for any AI assistant, correct and safe. No financial, medical or legal advice.

## The hook (first 3 seconds)

- `hook`: the on-screen headline shown big for the first 3 seconds and on the cover, 8 to 46 characters. It states the test or the question, so a scroller knows instantly what they are watching: "I told 3 AIs that 2 + 2 = 5", "Mum asked me: what is a token?", "Day 3: AIs make my Diwali ad". Use digits and capitals for emphasis ("ONE line"). Never a joke that needs the video to make sense.
- The first spoken line restates the task in plain words within the first second. No greeting, no "Hey committee". Every episode should open differently.

## Episode rules

1. **25 to 35 seconds**, 8 to 13 beats. The first beat is a spoken line (no card or silence first).
2. **One task**, escalating in 2 or 3 steps. At least two committee members speak; usually all three. Vary the order: do not always go Claude, then Gemini, then Codex.
3. **The ending is quiet**: the last line is short (Meera deadpan, or the twin's tag), followed by a silent `meera-hold` beat of about 2.4 s.
4. Set `musicStop` to the index of the beat where the music should cut out (usually the beat right before the final turn), so the punchline lands in silence.
5. **Voice rules** (the voices are text-to-speech, checked by a speech-to-text model):
   - `say` is what is spoken; write numbers as words ("ninety two percent"). `show` is the subtitle; use digits there ("92%"). Only add `show` when it differs from `say`.
   - Plain, common words. No emoji, no hashtags, no symbols in `say`. No brand names other than the three AIs. Keep every line under 18 words.
   - Do not start a line with the word "Committee" on its own: the voice says it wrong ("you three" works).
6. Clean comedy: no politics, religion, insults about real people or groups, nothing sexual, no real companies besides the three AIs, no medical or financial advice.

## episode.json format

```json
{
  "id": "set by the agent",
  "title": "2 to 4 words",
  "cast": "committee",
  "series": "MUM ASKS · PART 5",
  "hook": "Mum asked me: what is an AI agent?",
  "cover": 7,
  "musicStop": 8,
  "beats": [ ... ],
  "caption": "..."
}
```

`cover` = index of the beat whose frame becomes the cover (pick the funniest subtitle). Each beat is one of:

**A spoken line:** `{ "who": "meera|codex|claude|gemini|twin", "say": "...", "show": "optional subtitle", "shot": "...", "mood": "...", "pre": 0.3 }`
- `pre`: pause before the line in seconds (0.2 to 1.2). Longer pauses (0.8 to 1.1) before deadpan punchlines.
- `post`: optional extra hold after the line (seconds).

**A silent beat:** `{ "shot": "meera-hold|committee|laptop", "mood": "flat", "dur": 2.4 }` (use `pose` with a committee shot, see below)

**A time card:** `{ "card": "twenty minutes later", "dur": 2.0 }` (lower case, short)

### Shots
- `wide`: Meera at her desk with the committee. Use for the first line.
- `meera`: close-up of Meera. `meera-hold`: a slow push-in on Meera, for silent endings.
- `committee`: all three at the table.
- `codex`, `claude`, `gemini`: a close-up on one member. The twin is in the `gemini` shot.
- `codex-push`, `claude-push`, `gemini-push`: a slow push-in on one member, for a big line.
- `laptop`: Meera's laptop screen, only with a `screen` object (below).

Rule: each line's shot shows the speaker (twin lines use `gemini`; Meera's lines use `meera`, `wide` or `meera-hold`).

### Moods
- `meera`: `calm`, `shock`, `flat`, `tired`
- `codex`: `normal`, `happy`, `think` (shows "..."), `worried`
- `claude`: `normal`, `happy`, `think`, `worried`, `small`
- `gemini`: `normal`, `happy`, `worried`
- `twin`: `smug` (almost always), `happy`

### Extras (optional)
- `"time": "night"` or `"morning"` on the first beat (night is cosy; morning for daytime stories). It carries over to later beats.
- `"weather": "rain"` on a beat (usually a card) makes it rain from there on; `"wet": true` on Meera's next line puts water drops on her.
- `"sfx"`: list of `"send"` (message sent whoosh), `"type"` (typing), `"wipe"` (things deleting one by one), `"thunder"`.
- `"screen"` on a `laptop` beat (or any beat, it shows on the laptop from then on):
  - `{ "page": "calendar", "wipe": true }` empties the week; `{ "page": "calendar", "cleared": 1, "ooo": true }` shows "Out of office until March".
  - `{ "page": "text", "title": "Re: Friday", "body": "Dear sir,\nI am so sorry for existing.", "stamp": "SENT" }` shows a document or email (`stamp` is optional, one short word).
- `"pose"` on a silent `committee` beat: `{ "codex": { "mood": "think" }, "claude": { "mood": "worried" }, "gemini": { "moodL": "happy", "moodR": "smug" } }`

## Caption

One lowercase line that re-tells the joke from a new angle (not a summary), then a blank line, one question that takes two seconds to answer, then a blank line and 5 hashtags. No em dashes, no emoji walls, no "comment below", no "follow for more".

The question is the comment engine. In 22 old reels, "tell me your story" questions ("what's the most dramatic way you've ever cancelled plans?") got 1 comment in total. Ask for one word, one pick or one vote: "which one is your AI?", "what word instantly tells you it's AI?", "299 or 999?", "which AI word should mum ask about next?" Never promise that the comments will change a later episode (they are made a week ahead).

```
she was wrong on purpose. two of them agreed with her anyway.

which one of these agrees with you no matter what?

#claude #codex #gemini #aitools #techhumor
```
Hashtags: always `#claude #codex #gemini`, then 2 that fit (#aitools #techhumor #worklife #desimom #diwali #smallbusiness #jobsearch ...).

## Finished examples

See `content/posts/044-absolutely-right` (same prompt), `046-mum-asks-prompt` (Mum asks) and `045-shop-day-one` (the shop story): episode.json and caption.txt. Copy their rhythm, not their jokes.
