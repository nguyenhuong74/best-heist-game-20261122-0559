# The Amber Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nguyenhuong74/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nguyenhuong74/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Amber Vault** is an original top-down heist game: Mira the thief slips
through three rooms of a night museum — the Gallery, the Vault Hall, and the
Amber Vault itself — past patrolling guards and sweeping security cameras, to
crack the vault, steal the amber gem, and slip out the exit before the alarm
peaks.

## How it plays

- **Move** with WASD or the arrow keys. **Shift** sneaks (slower, harder to
  spot). Hold **E** beside the vault to crack it — a lockpick makes it fast.
- **Read the cones before you move.** Guards patrol fixed routes with yellow
  vision cones; cameras sweep red cones on a rhythm. Crates, plants and
  display cases block sight: hide behind them and the alarm falls.
- **The alarm is fair, not instant.** Being seen raises the meter; hiding
  lowers it. At 100% you get a short grace window to break line of sight
  before the bust lands.
- **Tools cost score and have limited uses:** `1` smoke bomb (blocks vision,
  click to throw it at the mouse), `2` EMP (freezes every camera for 8s),
  `3` disguise (guards ignore you for 5s). Tool refills and coins are hidden
  around each room.
- **Three rooms, escalating:** more guards, more cameras, tighter patrols.
  Grab the gem, then reach the glowing exit. Score comes from the loot, room
  bonuses, time left — minus every tool you spend.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network
requests: `game/` is plain static files (HTML + ES modules + canvas, sounds
synthesised with WebAudio).

## Files

- `game/index.html` — the page, canvas only
- `game/src/main.js` — game loop, alarm, rooms, win/lose
- `game/src/levels.js` — the three hand-drawn room maps
- `game/src/config.js` — every tunable number in one place
- `game/src/input.js` — keyboard + mouse
- `game/src/player.js` — the thief: movement, tools, vault cracking
- `game/src/guards.js` — patrols, vision cones, line of sight
- `game/src/cameras.js` — sweeping security cameras
- `game/src/render.js` — all drawing: floor, cones, actors, HUD, overlays
- `game/src/audio.js` — synthesised sound effects (WebAudio, no files)
- `game/src/shots.js` — deterministic states for the screenshots
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`
  to `/output`, writes `dossier.json` via `vendor/makefun-game.ts`)
- `screenshots/` — 4 real renders of the game running in headless Chrome

## Screenshots

The cover (`1-cover.jpg`) shows the game at its best: the thief sneaking
mid-room, guard cones, a sweeping camera, the glowing vault and the alarm
meter all in one frame. `2-alarm.jpg` is the fair caught moment at high
alarm, `3-win.jpg` the clean getaway, `4-title.jpg` the title screen.
