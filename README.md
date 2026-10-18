# The AI Committee

**One question. Three AIs. Zero help.** An animated 3D comedy series on Instagram ([@theaicommittee](https://www.instagram.com/theaicommittee/)): Meera brings one everyday problem to the tiny committee on her desk, and Codex, Claude and Gemini each make it worse in their own way.

This repository is the open-source agent that runs the page on GitHub Actions, with no computer switched on:

| Job | When | What it does |
|---|---|---|
| **Plan** | Saturdays 06:00 IST | audits last week with the ig-audit method, sets the strategy with ig-plan (brand/strategy.md), researches what's current, writes next week (2 reels a day), checks every spoken line with speech-to-text, renders them all in parallel (3D, voices, music), then opens a pull request. **Merging = approving.** |
| **Agent** | non-stop | one loop posts what's due (09:00 and 20:00 IST), answers comments in character every 15 min and logs the numbers daily; an hourly timer queues the next run so nothing is missed |
| **Doctor** | when something fails | posts that Instagram refuses become a "post by hand" issue; an expired token is refreshed; a missing video triggers a site rebuild; anything else, Claude reads the log, fixes the code, tests it and restarts the job |
| **Token** | Mondays | keeps the Instagram connection alive |
| **Site** | on merge | publishes the media Instagram fetches, plus the privacy pages |

How it's made: `show/` is the episode engine (three.js scene drawn by headless Chrome, Kokoro voices, synthesised music and sound, ffmpeg), `brand/show.md` is the show bible the writer follows, `src/` is the agent. Setup: [docs/SETUP.md](docs/SETUP.md).

Make an episode by hand: `npm ci`, then `node show/make.js content/posts/<id>`.

Fan-made parody characters, not affiliated with OpenAI, Anthropic or Google. MIT licence.
