// player.js — the thief, Mira: movement, collision, tools and the vault crack.
// The thief moves on the tile grid with circle-vs-wall collision, sneaks to
// shrink her detection profile, and carries three tools that each cost score.

import {
  PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RUN_SPEED,
  TILE, TOOL_SMOKE_DURATION, TOOL_EMP_DURATION, TOOL_DISGUISE_DURATION,
  TOOL_SMOKE_SCORE_COST, TOOL_EMP_SCORE_COST, TOOL_DISGUISE_SCORE_COST,
  TOOL_STARTING_USES, VAULT_CRACK_SECONDS, VAULT_CRACK_WITH_LOCKPICK,
} from './config.js';

// isSolidTile: walls, crates, plants and display cases all block movement.
export function isSolidTile(room, tx, ty) {
  if (ty < 0 || ty >= room.map.length || tx < 0 || tx >= room.map[0].length) return true;
  return '#CPD'.includes(room.map[ty][tx]);
}

export function createPlayer(startTile) {
  return {
    x: (startTile.tx + 0.5) * TILE,
    y: (startTile.ty + 0.5) * TILE,
    radius: PLAYER_RADIUS,
    facing: 0, // radians, updated from movement
    sneaking: false,
    running: false,
    tools: { ...TOOL_STARTING_USES },
    disguiseTimer: 0,
    crackProgress: 0, // 0..1 while holding E at the vault
    hasLockpick: true,
    moving: false,
  };
}

// movePlayer steps the thief, sliding along walls instead of sticking.
export function movePlayer(player, room, dx, dy, dt) {
  if (dx === 0 && dy === 0) { player.moving = false; return; }
  const len = Math.hypot(dx, dy);
  const nx = dx / len;
  const ny = dy / len;
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : (player.running ? PLAYER_RUN_SPEED : PLAYER_SPEED);
  player.facing = Math.atan2(ny, nx);
  player.moving = true;
  tryMove(player, room, nx * speed * dt, 0);
  tryMove(player, room, 0, ny * speed * dt);
}

function tryMove(player, room, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const r = player.radius;
  const corners = [
    [nx - r, ny - r], [nx + r, ny - r],
    [nx - r, ny + r], [nx + r, ny + r],
  ];
  for (const [cx, cy] of corners) {
    if (isSolidTile(room, Math.floor(cx / TILE), Math.floor(cy / TILE))) return;
  }
  player.x = nx;
  player.y = ny;
}

// useTool spends one use of a tool (and its score cost) and reports what
// happened, so the game loop can spawn the effect. Returns null when the
// tool cannot be used (no uses left).
export function useTool(player, kind, score) {
  if (player.tools[kind] <= 0) return null;
  player.tools[kind] -= 1;
  if (kind === 'smoke') {
    return { kind, duration: TOOL_SMOKE_DURATION, cost: TOOL_SMOKE_SCORE_COST, score: score - TOOL_SMOKE_SCORE_COST };
  }
  if (kind === 'emp') {
    return { kind, duration: TOOL_EMP_DURATION, cost: TOOL_EMP_SCORE_COST, score: score - TOOL_EMP_SCORE_COST };
  }
  player.disguiseTimer = TOOL_DISGUISE_DURATION;
  return { kind, duration: TOOL_DISGUISE_DURATION, cost: TOOL_DISGUISE_SCORE_COST, score: score - TOOL_DISGUISE_SCORE_COST };
}

// updateCrack advances the vault crack while E is held near the vault.
// Returns 'cracked' the frame the vault opens, 'cracking' while in progress,
// 'idle' otherwise. Letting go of E drains progress, so cracking under a
// sweeping camera is a real decision: stay and risk the alarm, or hide.
export function updateCrack(player, nearVault, interacting, dt) {
  if (!nearVault || !interacting) {
    player.crackProgress = Math.max(0, player.crackProgress - dt * 2);
    return player.crackProgress > 0 ? 'cracking' : 'idle';
  }
  const need = player.hasLockpick ? VAULT_CRACK_WITH_LOCKPICK : VAULT_CRACK_SECONDS;
  player.crackProgress += dt / need;
  if (player.crackProgress >= 1) {
    player.crackProgress = 1;
    return 'cracked';
  }
  return 'cracking';
}
