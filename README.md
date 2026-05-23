# Fixing Game

A browser-based engineering puzzle game for kids who like tinkering and fixing things. Touch-first for iPad, vanilla HTML/CSS/JS, no installs, no accounts — just a URL.

## Play it

**https://dontuhatepants.github.io/engineeringgame/**

## Mechanics — 9 workshops, 220 levels

| Workshop | Levels | How it plays |
|----------|--------|--------------|
| **Pipes** | 25 | Tap pipe tiles to rotate them. Route water from the tap to the tank. |
| **Robot** | 25 | Drag parts onto the robot. Transforms across 25 levels from friendly bot to giant anime mech. |
| **Circuits** | 25 | Tap sparking gaps to fix wires. Flip switches to close the loop. Light up the bulbs. |
| **Gears** | 25 | Drop the right-sized gears into slots. Crank turns; windmills, lifts, flags, drawbridges drive. |
| **Marbles** | 25 | Place ramps and chutes on the grid. Tap GO; the marble slides to the bucket. |
| **Cables** | 25 | Drag cable endpoints up and down to untangle them. No two cables can cross. |
| **Blocks** | 20 | Follow Lego-style instructions to build cars, animals, buildings, spaceships. |
| **Toolbox** | 25 | Drag the right tool to the broken thing. Multi-step repairs in later levels. |
| **Bridge** | 25 | Place planks and pillars to bridge gaps, canyons, and lava chasms. Vehicles drive across. |

All mechanics share a consistent visual language, synthesized Web Audio sound effects (no audio files), and a "FIXED!" star-burst win celebration. Progress saves locally; each level unlocks the next.

## Running locally

ES modules require a real server — opening `index.html` via `file://` won't work.

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Enabling GitHub Pages (one-time setup)

1. Push the code to GitHub.
2. Open <https://github.com/dontuhatepants/engineeringgame/settings/pages>
3. Under **Source**, choose **Deploy from a branch**.
4. Branch: **main**, folder: **/ (root)**. Click **Save**.
5. Wait ~30 seconds — the game is live at the URL above.

Future pushes to `main` auto-redeploy.

## Project layout

```
index.html              Entry point — loads styles + main.js
styles.css              Shared styles (hub, level select, win overlay, topbar)
styles-gears.css        Gears mechanic styles
styles-marble.css       Marble Run mechanic styles
styles-lego.css         Blocks mechanic styles
styles-toolbox.css      Toolbox mechanic styles
                        (cables.js and bridge.js self-inject their own CSS)

js/main.js              Router + workshop hub + level select + progress
js/sound.js             Web Audio synthesized SFX (no asset files)

js/pipes.js             Pipes mechanic
js/levels.js            Pipe level data
js/robot.js             Robot mechanic + level data (mech transformation arc)
js/circuits.js          Circuits mechanic + level data
js/gears.js             Gears mechanic + level data
js/marble.js            Marble Run mechanic + level data
js/cables.js            Cable Untangle mechanic + level data (self-injects CSS)
js/lego.js              Blocks (Lego-style) mechanic + level data
js/toolbox.js           Toolbox mechanic + level data
js/bridge.js            Bridge Building mechanic + level data (self-injects CSS)

js/_test_levels.mjs     Dev validator — brute-forces every pipe level for solvability
```

## Adding levels

Each mechanic stores its levels in an exported array (e.g. `PIPES_LEVELS`, `GEARS_LEVELS`). Append new entries to add more levels. For pipes, run `node js/_test_levels.mjs` to verify solvability.

## Design notes

- **Target player:** 6-year-old, Lego-fluent (completes 18+ kits unaided), basic reading. UX is icon-only — no game-text required to play.
- **Stack:** vanilla HTML5 + ES modules + CSS. No framework, no build step. All sounds synthesized via Web Audio API. Total repo size is mostly source code.
- **Touch-first:** 60px+ touch targets across all mechanics. Pointer events with `setPointerCapture` for drag-and-drop.
- **iOS Safari:** sound requires a user gesture before it plays — happens naturally on first tap.
