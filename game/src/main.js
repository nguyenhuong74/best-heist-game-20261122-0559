// main.js — The Amber Vault: game loop, alarm, rooms and win/lose.
// The loop is a plain state machine: title -> playing -> gameover.
// Detection is fair by construction: the alarm climbs while a guard or a
// camera holds the thief in its cone, falls while hidden, and only at 100
// does a short grace period start before the bust lands.

import {
  TILE, VIEW_W, VIEW_H, ALARM_MAX, ALARM_RISE_GUARD, ALARM_RISE_CAMERA,
  ALARM_DECAY, SPOTTED_GRACE_SECONDS, LOOT_SCORE, ROOM_CLEAR_BONUS,
  TIME_BONUS_PER_SECOND_LEFT,
} from './config.js';
import { ROOMS, findTile, validateRoom } from './levels.js';
import { createInput } from './input.js';
import { createPlayer, movePlayer, useTool, updateCrack, isSolidTile } from './player.js';
import { createGuard, updateGuard, guardSeesThief } from './guards.js';
import { createCamera, updateCamera, cameraSeesThief } from './cameras.js';
import { createAudio } from './audio.js';
import { render, drawTitle, drawGameOver } from './render.js';
import { buildShotWorld } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const audio = createAudio();
const statusEl = document.getElementById('status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function buildWorld(roomIndex) {
  const room = ROOMS[roomIndex];
  const start = findTile(room, 'T');
  const vaultTile = findTile(room, 'V');
  const player = createPlayer(start);
  const pickups = [];
  room.map.forEach((row, ty) => {
    [...row].forEach((ch, tx) => {
      if (ch === 's' || ch === 'e' || ch === 'd' || ch === 'c') {
        pickups.push({
          kind: ch === 's' ? 'smoke' : ch === 'e' ? 'emp' : ch === 'd' ? 'disguise' : 'coin',
          x: (tx + 0.5) * TILE,
          y: (ty + 0.5) * TILE,
        });
      }
    });
  });
  return {
    room,
    roomIndex,
    player,
    guards: room.guards.map(createGuard),
    cameras: room.cameras.map(createCamera),
    vault: { x: (vaultTile.tx + 0.5) * TILE, y: (vaultTile.ty + 0.5) * TILE },
    exitPos: { x: (room.exit[0] + 0.5) * TILE, y: (room.exit[1] + 0.5) * TILE },
    pickups,
    smokeClouds: [],
    guardSeeing: new Map(),
    alarm: 0,
    empTimer: 0,
    spottedGrace: 0,
    spotted: false,
    lootTaken: false,
    timeLeft: 180,
    elapsed: 0,
  };
}

const game = {
  state: 'title', // 'title' | 'playing' | 'gameover'
  world: buildWorld(0),
  score: 0,
  roomsCleared: 0,
  won: false,
  elapsed: 0,
  alarmBeepTimer: 0,
};

// Exposed for automated play-testing only (headless Chrome + CDP):
// window.__amber.game lets a test drive the real loop and read real state.
window.__amber = { game, buildWorld, ROOMS };

function startGame() {
  game.state = 'playing';
  game.world = buildWorld(0);
  game.score = 0;
  game.roomsCleared = 0;
  game.won = false;
  game.elapsed = 0;
  setStatus('The heist begins. Reach the vault, grab the amber gem, escape.');
  input.clearPressed();
}

function endGame(won) {
  game.state = 'gameover';
  game.won = won;
  if (won) audio.win();
  else audio.caught();
  setStatus(won
    ? `Clean getaway! Final score ${game.score}.`
    : `Busted! Final score ${game.score}. Press R to try again.`);
}

function nextRoom() {
  game.roomsCleared += 1;
  game.score += ROOM_CLEAR_BONUS + Math.max(0, Math.round(game.world.timeLeft)) * TIME_BONUS_PER_SECOND_LEFT;
  if (game.world.roomIndex + 1 >= ROOMS.length) {
    endGame(true);
    return;
  }
  game.world = buildWorld(game.world.roomIndex + 1);
  setStatus(`${game.world.room.name}. The patrols are tighter here.`);
}

function throwSmokeAt(x, y) {
  const world = game.world;
  const result = useTool(world.player, 'smoke', game.score);
  if (!result) return;
  game.score = result.score;
  world.smokeClouds.push({ x, y, radius: 70, timer: result.duration });
  audio.smoke();
}

function updatePlaying(dt) {
  const world = game.world;
  const player = world.player;
  world.elapsed += dt;
  game.elapsed += dt;
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  if (world.timeLeft <= 0) world.alarm = Math.min(ALARM_MAX, world.alarm + 15 * dt);

  // Timers
  if (player.disguiseTimer > 0) player.disguiseTimer -= dt;
  if (world.empTimer > 0) world.empTimer -= dt;
  for (const cloud of world.smokeClouds) cloud.timer -= dt;
  world.smokeClouds = world.smokeClouds.filter((c) => c.timer > 0);

  // Movement
  player.sneaking = input.sneaking;
  player.running = false;
  movePlayer(player, world.room, input.moveX, input.moveY, dt);

  // Tools: keys 1/2/3, mouse click throws smoke at the cursor
  if (input.wasPressed('smoke')) throwSmokeAt(player.x, player.y);
  if (input.wasPressed('emp')) {
    const result = useTool(player, 'emp', game.score);
    if (result) { game.score = result.score; world.empTimer = result.duration; audio.emp(); }
  }
  if (input.wasPressed('disguise')) {
    const result = useTool(player, 'disguise', game.score);
    if (result) { game.score = result.score; audio.pickup(); }
  }
  const click = input.consumeClick();
  if (click && player.tools.smoke > 0) throwSmokeAt(click.x, click.y);
  if (input.wasPressed('mute')) audio.toggleMute();

  // Guards and cameras
  let seen = 0;
  for (const guard of world.guards) {
    updateGuard(guard, dt, world.alarm, player);
    const strength = guardSeesThief(guard, player, world.room, world.smokeClouds);
    world.guardSeeing.set(guard, strength);
    seen += strength;
  }
  let cameraSeen = 0;
  for (const camera of world.cameras) {
    updateCamera(camera, dt, world.empTimer);
    cameraSeen += cameraSeesThief(camera, player, world.room, world.smokeClouds);
  }

  // Alarm: climbs while seen, decays while hidden
  const seenNow = seen > 0 || cameraSeen > 0;
  if (seenNow) {
    world.alarm = Math.min(ALARM_MAX,
      world.alarm + (seen * ALARM_RISE_GUARD + cameraSeen * ALARM_RISE_CAMERA) * dt);
    if (!world.spotted) { world.spotted = true; audio.spotted(); }
    game.alarmBeepTimer -= dt;
    if (game.alarmBeepTimer <= 0) { audio.alarmLoop(); game.alarmBeepTimer = 0.55; }
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM_DECAY * dt);
    world.spotted = false;
  }

  // The fair caught moment: at full alarm the thief gets a grace window
  // to break line of sight; only if it runs out is she busted.
  if (world.alarm >= ALARM_MAX) {
    if (world.spottedGrace <= 0) world.spottedGrace = SPOTTED_GRACE_SECONDS;
    world.spottedGrace -= dt;
    if (world.spottedGrace <= 0) { endGame(false); return; }
  } else if (world.alarm < ALARM_MAX * 0.9) {
    world.spottedGrace = 0;
  }

  // Pickups
  for (const pickup of world.pickups) {
    if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 26) {
      pickup.taken = true;
      if (pickup.kind === 'coin') game.score += 50;
      else player.tools[pickup.kind] += 1;
      audio.pickup();
    }
  }
  world.pickups = world.pickups.filter((p) => !p.taken);

  // Vault: hold E beside it to crack it open
  const nearVault = Math.hypot(player.x - world.vault.x, player.y - world.vault.y) < 64;
  const crack = updateCrack(player, nearVault && !world.lootTaken, input.interacting, dt);
  if (crack === 'cracked') {
    world.lootTaken = true;
    game.score += LOOT_SCORE;
    audio.vaultOpen();
    setStatus('Amber gem secured! Get to the exit, bottom left.');
  } else if (crack === 'cracking' && Math.random() < dt * 4) {
    audio.crack();
  }

  // Exit: only opens once the loot is taken
  if (world.lootTaken) {
    const nearExit = Math.hypot(player.x - world.exitPos.x, player.y - world.exitPos.y) < 36;
    if (nearExit) nextRoom();
  }
}

function update(dt) {
  if (game.state === 'title') {
    if (input.wasPressed('confirm') || input.consumeClick()) startGame();
    return;
  }
  if (game.state === 'gameover') {
    if (input.wasPressed('restart') || input.wasPressed('confirm') || input.consumeClick()) startGame();
    return;
  }
  updatePlaying(dt);
}

let last = performance.now();
let time = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  update(dt);
  if (game.state === 'title') {
    render(ctx, game.world, time, game.score);
    drawTitle(ctx, time);
  } else if (game.state === 'gameover') {
    render(ctx, game.world, time, game.score);
    drawGameOver(ctx, {
      won: game.won,
      score: game.score,
      roomsCleared: game.roomsCleared,
      lootTaken: game.world.lootTaken,
      elapsed: game.elapsed,
    });
  } else {
    render(ctx, game.world, time, game.score);
  }
  requestAnimationFrame(frame);
}

// Screenshot mode: ?shot=start|play|alarm|win renders one deterministic
// frame for the entry's screenshots, so the cover shows the game at its
// best with guards, cones, cameras, loot and alarm all in one frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const shotWorld = buildShotWorld(shot, buildWorld);
  if (shotWorld) {
    game.state = shotWorld.state;
    game.world = shotWorld.world;
    game.score = shotWorld.score;
    game.roomsCleared = shotWorld.roomsCleared;
    game.won = shotWorld.won;
    game.elapsed = shotWorld.elapsed;
    render(ctx, game.world, 1.234, game.score);
    if (game.state === 'title') drawTitle(ctx, 1.234);
    if (game.state === 'gameover') {
      drawGameOver(ctx, {
        won: game.won,
        score: game.score,
        roomsCleared: game.roomsCleared,
        lootTaken: game.world.lootTaken,
        elapsed: game.elapsed,
      });
    }
    setStatus(`Screenshot: ${shot}`);
  } else {
    requestAnimationFrame(frame);
  }
} else {
  const errors = ROOMS.flatMap(validateRoom);
  if (errors.length > 0) console.error('Room errors:', errors);
  requestAnimationFrame(frame);
}
