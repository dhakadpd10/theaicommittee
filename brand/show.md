# The AI Committee: show bible

**One question. Three AIs. Zero help.**

Meera, a tired, dry, very online young woman (a day job, a boss, a mum who calls, a small candle brand called Mitti on the side), brings one everyday problem to "the committee": three little AI assistants sitting at a tiny hearing table on her desk. Each answers in its own way, and together they make it worse. Fan-made parody characters, not affiliated with OpenAI, Anthropic or Google.

## The cast

| who | look | personality | how they talk |
|---|---|---|---|
| `meera` | 3D girl, terracotta hoodie, bun with a pencil, gold hoops | the straight woman. Tired, dry, never shouts. Her flat one-word reactions are the punchlines. | short, plain sentences. Opens with "Hey committee, ..." |
| `codex` | puffy blue cloud with a glowing `>_` face | the terminal. Does it immediately, asks nothing, takes everything literally, thinks the world is a repo. | 1 to 6 words. "Done." "Deleted everything." "That's not in the repo." |
| `claude` | orange pixel creature built from blocks, slot eyes, little arms | the careful one. Thoughtful, polite, asks how you feel first, over-apologises, writes far too much, adds caveats. | full, gentle sentences. Sometimes overdoes politeness until it is absurd. |
| `gemini` | blue-to-pink sparkle | the cheerful know-it-all, connected to everything. Confident, helpful, and quietly shares/sends/posts things nobody asked it to. | upbeat, exclamation marks. "Done! I also..." |
| `twin` | Gemini's smaller sparkle twin | the smug one. Adds the last, worse detail. | 2 to 5 words, deadpan. "And your mom." "Till March." |

Nobody is the villain. Every joke is "the AI did exactly what an AI would do". Keep it affectionate: people who love these tools should laugh hardest.

## What makes an episode land (from research, Oct 2026)

- AI acting like a flawed coworker beats everything else: too literal, too eager, too confident, asks too many questions, overshares.
- Everyday pain multiplies it: bosses, meetings, leave emails, calendars, family, weather, money, dating texts, shopping, food, festivals, exams, interviews.
- Recurring characters, quiet endings. Never explain the joke.
- Flops: sentimental "AI forgets me" stories and AI product news.

## Episode rules

1. **25 to 35 seconds**, 8 to 12 beats. Meera speaks first, in the first second, and opens with "Hey committee, ...".
2. **One problem**, escalating in 2 or 3 steps. At least two committee members speak; usually all three.
3. **The ending is quiet**: the last line is short (Meera deadpan, or the twin's tag), followed by a silent `meera-hold` beat of about 2.4 s.
4. Set `musicStop` to the index of the beat where the music should cut out (usually the beat right before the final turn), so the punchline lands in silence.
5. **Voice rules** (the voices are text-to-speech, checked by a speech-to-text model):
   - `say` is what is spoken; write numbers as words ("ninety two percent"). `show` is the subtitle; use digits there ("92%"). Only add `show` when it differs from `say`.
   - Plain, common words. No emoji, no hashtags, no symbols in `say`. No brand names other than the three AIs. Keep every line under 18 words.
   - Meera says "Hey committee, ..." (with "Hey"); the word "Committee." alone at the start is misheard.
6. Clean comedy: no politics, religion, insults about real people or groups, nothing sexual, no real companies besides the three AIs, no medical or financial advice.

## episode.json format

```json
{
  "id": "set by the agent",
  "title": "2 to 4 words",
  "cast": "committee",
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

One lowercase line that re-tells the joke from a new angle (not a summary), then a blank line, one question that gets people to tell their own story, then a blank line and 5 hashtags. No em dashes, no emoji walls, no "comment below", no "follow for more".

```
she asked for polite. she got an apology for existing, HR and her mom.

which one of these is your AI?

#claude #codex #gemini #aitools #officehumor
```
Hashtags: always `#claude #codex #gemini`, then 2 that fit the story (#aitools #officehumor #relatable #worklife #techhumor #desimom #studentlife ...).

## Finished examples

See `content/posts/001-more-polite`, `002-clear-my-calendar` and `003-ninety-two-percent` (episode.json and caption.txt). They rendered well; copy their rhythm.
