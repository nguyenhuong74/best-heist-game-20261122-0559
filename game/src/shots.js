// shots.js — deterministic game states for the entry's screenshots.
// ?shot=start shows the title over room 1; ?shot=play shows the thief
// mid-room with guards, cones, cameras, vault and a mid alarm; ?shot=alarm
// shows the fair caught moment at high alarm; ?shot=win shows the getaway.
// Each state is built from fixed numbers, never from Math.random, so the
// same URL always renders the same frame.

import { TILE } from './config.js';
import { updateGuard, guardSeesThief } from './guards.js';
import { updateCamera } from './cameras.js';

// stepWorld runs the patrols forward a fixed number of steps so guards and
// cameras sit mid-sweep instead of at their spawn poses. The step count is
// fixed per shot, so the frame is identical on every load.
function stepWorld(world, steps, dt) {
  for (let i = 0; i < steps; i += 1) {
    for (const guard of world.guards) updateGuard(guard, dt, 0, world.player);
    for (const camera of world.cameras) updateCamera(camera, dt, 0);
  }
  for (const guard of world.guards) {
    world.guardSeeing.set(guard, guardSeesThief(guard, world.player, world.room, world.smokeClouds));
  }
}

export function buildShotWorld(shot, buildWorld) {
  if (shot === 'start') {
    const world = buildWorld(0);
    stepWorld(world, 40, 1 / 30);
    return { state: 'title', world, score: 0, roomsCleared: 0, won: false, elapsed: 0 };
  }
  if (shot === 'play') {
    const world = buildWorld(0);
    // Thief mid-room, sneaking past the first patrol with the vault in sight.
    world.player.x = 13.5 * TILE;
    world.player.y = 6.5 * TILE;
    world.player.sneaking = true;
    world.player.facing = 0;
    world.alarm = 35;
    world.score = 150;
    world.elapsed = 24;
    world.timeLeft = 156;
    stepWorld(world, 90, 1 / 30);
    return { state: 'playing', world, score: 150, roomsCleared: 0, won: false, elapsed: 24 };
  }
  if (shot === 'alarm') {
    const world = buildWorld(1);
    // Thief caught in the open under a guard's cone: alarm high, SPOTTED!
    world.player.x = 20.5 * TILE;
    world.player.y = 7.5 * TILE;
    world.player.facing = Math.PI;
    world.alarm = 82;
    world.score = 700;
    world.elapsed = 61;
    world.timeLeft = 119;
    world.lootTaken = true;
    world.smokeClouds = [{ x: 19 * TILE, y: 8 * TILE, radius: 70, timer: 4 }];
    stepWorld(world, 60, 1 / 30);
    for (const guard of world.guards) {
      world.guardSeeing.set(guard, guardSeesThief(guard, world.player, world.room, world.smokeClouds));
    }
    return { state: 'playing', world, score: 700, roomsCleared: 1, won: false, elapsed: 61 };
  }
  if (shot === 'win') {
    const world = buildWorld(2);
    world.player.x = 2.5 * TILE;
    world.player.y = 16.5 * TILE;
    world.lootTaken = true;
    world.alarm = 12;
    world.score = 2450;
    world.elapsed = 148;
    world.timeLeft = 32;
    stepWorld(world, 30, 1 / 30);
    return { state: 'gameover', world, score: 2450, roomsCleared: 3, won: true, elapsed: 148 };
  }
  return null;
}
