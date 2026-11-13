# The clay look (13 Nov 2026)

Prashant's call: both pages are Claymation. The AI Committee is drawn in our own three.js world, turned to plasticine in code:

- **Clay material** (`show/committee.js`: `clayMat`, `claymate`): every lit surface is matte plasticine (roughness 0.82) with a thumbprint bump map. Glossy bead eyes, screens, labels and unlit dots keep their look. `claymate(scene)` runs once the set is built (end of `show/scene.js`).
- **Stop-motion** (`show/render.js`): 12 drawings a second inside a 30 fps video. Each drawing is held for 2 or 3 frames, and the repeats aren't re-rendered (about 60% less render time).
- **The original cast** (brand/show.md): Byte (slate-blue pebble, antenna), Sage (sage-green egg, round glasses, mustard scarf), Gigi (pink bean, curl) and her twin Gogo (small lavender ball). They are not the AI companies' products or logos. The ids in episode.json stay `codex`, `claude`, `gemini` and `twin`.
- **Name plates and subtitle tags** say BYTE, SAGE, GIGI and GOGO.

What stays the same: shots, beats, moods, the laptop screen pages, cards and the comic-strip carousel.

## Writing for clay

- Clay looks best with clear, simple staging: one member at a time in close-up, big readable laptop screens for the fix.
- Short, punchy beats. Stop-motion pauses read as comic timing, so let the quiet ending breathe.
