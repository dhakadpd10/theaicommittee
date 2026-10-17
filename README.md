# The AI Committee

**One question. Three AIs. Zero help.** An animated 3D comedy series on Instagram ([@theaicommittee](https://www.instagram.com/theaicommittee/)): Meera brings one everyday problem to the tiny committee on her desk, and Codex, Claude and Gemini each make it worse in their own way.

This repository is the open-source agent that runs the page on GitHub Actions, with no computer switched on:

| Job | When | What it does |
|---|---|---|
| **Plan** | 06:00 IST, when fewer than 3 days are queued | learns from the numbers, researches what's current, writes 7 episodes, checks every spoken line with speech-to-text, renders them all in parallel (3D, voices, music), then opens a pull request. **Merging = approving.** |
| **Publish** | every 15 min | posts approved episodes on time: 09:00 the reel, 20:30 the comic-strip carousel (IST) |
| **Engage** | every 15 min | replies to comments in character; collabs, sponsors and anything unsure become GitHub issues |
| **Daily** | 10:00 IST | logs every post's views, reach, likes, saves and shares |
| **Token** | Mondays | keeps the Instagram connection alive |
| **Site** | on merge | publishes the media Instagram fetches, plus the privacy pages |

How it's made: `show/` is the episode engine (three.js scene drawn by headless Chrome, Kokoro voices, synthesised music and sound, ffmpeg), `brand/show.md` is the show bible the writer follows, `src/` is the agent. Setup: [docs/SETUP.md](docs/SETUP.md).

Make an episode by hand: `npm ci`, then `node show/make.js content/posts/<id>`.

Fan-made parody characters, not affiliated with OpenAI, Anthropic or Google. MIT licence.
