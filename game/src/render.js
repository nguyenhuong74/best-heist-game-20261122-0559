// render.js — everything the player sees, drawn on one canvas.
// The look is a night museum: dark violet floor, warm pools of light, amber
// loot that glows, pale thief against red guards, and vision cones in
// translucent yellow so safe cover, danger and loot read at a glance.
// Draw order: floor, cover, cones, loot, exit, smoke, actors, HUD, overlays.

import { TILE, VIEW_W, VIEW_H, PALETTE, ALARM_MAX } from './config.js';

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawRoomFloor(ctx, room) {
  for (let ty = 0; ty < room.map.length; ty += 1) {
    for (let tx = 0; tx < room.map[ty].length; tx += 1) {
      const ch = room.map[ty][tx];
      const px = tx * TILE;
      const py = ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = PALETTE.wallTop;
        ctx.fillRect(px, py, TILE, 6);
        continue;
      }
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === 'C') {
        ctx.fillStyle = PALETTE.crate;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = PALETTE.crateTop;
        ctx.fillRect(px + 4, py + 4, TILE - 8, 5);
        ctx.strokeStyle = '#4a3517';
        ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
      } else if (ch === 'P') {
        ctx.fillStyle = '#1f3d28';
        ctx.fillRect(px + 8, py + 10, TILE - 16, TILE - 14);
        ctx.fillStyle = PALETTE.plant;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2 - 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.plantTop;
        ctx.beginPath();
        ctx.arc(px + TILE / 2 - 4, py + TILE / 2 - 6, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'D') {
        ctx.fillStyle = '#232030';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = PALETTE.caseGlass;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(px + 7, py + 7, TILE - 14, TILE - 14);
        ctx.globalAlpha = 1;
        ctx.fillStyle = PALETTE.loot;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawVault(ctx, vault, cracked, time) {
  const pulse = 1 + Math.sin(time * 3) * 0.12;
  ctx.save();
  ctx.translate(vault.x, vault.y);
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(-26, -22, 52, 44);
  ctx.strokeStyle = '#55555f';
  ctx.lineWidth = 2;
  ctx.strokeRect(-26, -22, 52, 44);
  if (!cracked) {
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(0, 0, 11 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.lootGlow;
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7d6';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', 0, -30);
  } else {
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(-26, -22, 52, 44);
    ctx.fillStyle = PALETTE.lootGlow;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', 0, 4);
  }
  ctx.restore();
}

function drawExit(ctx, exit, open, time) {
  const px = exit.x;
  const py = exit.y;
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = open ? PALETTE.exit : '#3f6b4f';
  ctx.globalAlpha = open ? 0.55 + Math.sin(time * 4) * 0.15 : 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#eafff0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', 0, 4);
  ctx.restore();
}

function drawThief(ctx, thief, time) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  if (thief.disguiseTimer > 0) ctx.globalAlpha = 0.65;
  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // body: hooded figure in violet
  ctx.fillStyle = PALETTE.thiefHood;
  ctx.beginPath();
  ctx.arc(0, 0, thief.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(0, 0, thief.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  // facing tick
  ctx.strokeStyle = PALETTE.thief;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.cos(thief.facing) * 8, Math.sin(thief.facing) * 8);
  ctx.lineTo(Math.cos(thief.facing) * 17, Math.sin(thief.facing) * 17);
  ctx.stroke();
  if (thief.sneaking) {
    ctx.fillStyle = '#9be8ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', 0, -20);
  }
  ctx.restore();
}

function drawGuard(ctx, guard, seeing, time) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.guardSuit;
  ctx.beginPath();
  ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = seeing > 0 ? '#ff5a4a' : PALETTE.guard;
  ctx.beginPath();
  ctx.arc(0, 0, guard.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  // cap brim points where he looks
  ctx.strokeStyle = '#ffd66a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.cos(guard.facing) * 8, Math.sin(guard.facing) * 8);
  ctx.lineTo(Math.cos(guard.facing) * 18, Math.sin(guard.facing) * 18);
  ctx.stroke();
  if (guard.chasing) {
    ctx.fillStyle = '#ff6a5a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -22);
  }
  ctx.restore();
}

function drawCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.fillStyle = camera.disabledTimer > 0 ? '#555' : '#c0392b';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  if (camera.disabledTimer > 0) {
    ctx.fillStyle = '#9be8ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', 0, -16);
  }
  ctx.restore();
}

function drawSmoke(ctx, cloud) {
  ctx.save();
  ctx.fillStyle = PALETTE.smoke;
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,230,240,0.5)';
  ctx.beginPath();
  ctx.arc(cloud.x - 18, cloud.y + 8, cloud.radius * 0.5, 0, Math.PI * 2);
  ctx.arc(cloud.x + 16, cloud.y - 10, cloud.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPickup(ctx, pickup, time) {
  const bob = Math.sin(time * 3 + pickup.x) * 3;
  ctx.save();
  ctx.translate(pickup.x, pickup.y + bob);
  ctx.fillStyle = pickup.kind === 'coin' ? PALETTE.loot : '#9be8ff';
  ctx.beginPath();
  ctx.arc(0, 0, pickup.kind === 'coin' ? 6 : 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1a26';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pickup.kind === 'coin' ? '$' : pickup.kind[0].toUpperCase(), 0, 3.5);
  ctx.restore();
}

function drawHud(ctx, state) {
  const { alarm, score, roomIndex, timeLeft, tools, lootTaken, crackProgress } = state;
  ctx.save();
  // top bar
  ctx.fillStyle = 'rgba(10, 9, 16, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 54);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 16, 22);
  ctx.fillText(`ROOM ${roomIndex + 1}/3`, 16, 42);
  ctx.textAlign = 'center';
  ctx.fillText(state.roomName, VIEW_W / 2, 22);
  ctx.fillText(`TIME ${Math.max(0, Math.ceil(timeLeft))}s`, VIEW_W / 2, 42);
  // alarm meter, right side: green to red as it climbs
  const meterX = VIEW_W - 320;
  const meterW = 300;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hud;
  ctx.fillText('ALARM', meterX, 22);
  ctx.fillStyle = '#33303f';
  ctx.fillRect(meterX, 28, meterW, 14);
  const frac = alarm / ALARM_MAX;
  ctx.fillStyle = frac < 0.4 ? PALETTE.alarmLow : frac < 0.75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  ctx.fillRect(meterX, 28, meterW * frac, 14);
  ctx.strokeStyle = '#f5f2e8';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX, 28, meterW, 14);
  // tools, bottom bar
  ctx.fillStyle = 'rgba(10, 9, 16, 0.82)';
  ctx.fillRect(0, VIEW_H - 40, VIEW_W, 40);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  const toolsText = `TOOLS  [1] Smoke x${tools.smoke}  [2] EMP x${tools.emp}  [3] Disguise x${tools.disguise}    Click: throw smoke   Shift: sneak   E: crack vault / grab loot`;
  ctx.fillText(toolsText, 16, VIEW_H - 15);
  ctx.textAlign = 'right';
  ctx.fillText(lootTaken ? 'LOOT SECURED — GET TO THE EXIT!' : 'STEAL THE AMBER GEM', VIEW_W - 16, VIEW_H - 15);
  ctx.textAlign = 'left';
  // vault crack progress ring above the thief is drawn by the caller; here the bar:
  if (crackProgress > 0 && crackProgress < 1) {
    ctx.fillStyle = '#33303f';
    ctx.fillRect(VIEW_W / 2 - 110, 62, 220, 10);
    ctx.fillStyle = PALETTE.loot;
    ctx.fillRect(VIEW_W / 2 - 110, 62, 220 * crackProgress, 10);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING THE VAULT…', VIEW_W / 2, 86);
  }
  ctx.restore();
}

function drawCenterPanel(ctx, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 7, 14, 0.88)';
  ctx.fillRect(VIEW_W / 2 - 330, VIEW_H / 2 - 190, 660, 380);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(VIEW_W / 2 - 330, VIEW_H / 2 - 190, 660, 380);
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? accent : PALETTE.hud;
    ctx.font = i === 0 ? 'bold 30px sans-serif' : '15px sans-serif';
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 140 + i * 32);
  });
  ctx.restore();
}

export function drawTitle(ctx, time) {
  drawCenterPanel(ctx, [
    'THE AMBER VAULT',
    'A top-down heist in three rooms.',
    'Dodge the guards’ cones and the cameras.',
    'Crack the vault, grab the amber gem,',
    'then slip out the exit before the alarm peaks.',
    '',
    'WASD / Arrows — move    Shift — sneak',
    'E — crack vault / grab loot    1/2/3 — smoke / EMP / disguise',
    'Click — throw smoke at the mouse',
    '',
    'Press SPACE or click to start',
  ], PALETTE.loot);
}

export function drawGameOver(ctx, state) {
  const title = state.won ? 'CLEAN GETAWAY!' : 'BUSTED!';
  const accent = state.won ? PALETTE.exit : PALETTE.alarmHigh;
  const lines = [
    title,
    state.won ? 'Mira slipped out with the amber gem.' : 'The guards caught Mira in the gallery.',
    `Final score: ${state.score}`,
    `Rooms cleared: ${state.roomsCleared} / 3    Loot: ${state.lootTaken ? 'secured' : 'left behind'}`,
    `Time: ${Math.round(state.elapsed)}s`,
    '',
    'Press R or click to play again',
  ];
  drawCenterPanel(ctx, lines, accent);
}

export function drawSpottedBanner(ctx, alarm) {
  if (alarm < 55) return;
  ctx.save();
  ctx.fillStyle = alarm >= 90 ? 'rgba(231,76,60,0.9)' : 'rgba(243,156,18,0.9)';
  ctx.fillRect(VIEW_W / 2 - 130, 66, 260, 34);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(alarm >= 90 ? '!! SPOTTED — RUN !!' : 'SPOTTED!', VIEW_W / 2, 89);
  ctx.restore();
}

// render draws one full frame of the live game. Score lives on the game,
// not the world, so it arrives as its own argument.
export function render(ctx, world, time, score = 0) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoomFloor(ctx, world.room);
  // vision cones under the actors, so the player reads danger first
  for (const camera of world.cameras) {
    if (camera.disabledTimer <= 0) {
      drawCone(ctx, camera.x, camera.y, camera.angle, 0.52, 210, PALETTE.cameraCone);
    }
  }
  for (const guard of world.guards) {
    const seeing = world.guardSeeing.get(guard) ?? 0;
    drawCone(ctx, guard.x, guard.y, guard.facing, 0.60, 190,
      seeing > 0 ? PALETTE.coneHot : PALETTE.cone);
  }
  drawVault(ctx, world.vault, world.lootTaken, time);
  drawExit(ctx, world.exitPos, world.lootTaken, time);
  for (const pickup of world.pickups) drawPickup(ctx, pickup, time);
  for (const cloud of world.smokeClouds) drawSmoke(ctx, cloud);
  for (const camera of world.cameras) drawCamera(ctx, camera);
  for (const guard of world.guards) drawGuard(ctx, guard, world.guardSeeing.get(guard) ?? 0, time);
  drawThief(ctx, world.player, time);
  drawHud(ctx, {
    alarm: world.alarm,
    score,
    roomIndex: world.roomIndex,
    roomName: world.room.name,
    timeLeft: world.timeLeft,
    tools: world.player.tools,
    lootTaken: world.lootTaken,
    crackProgress: world.player.crackProgress,
  });
  drawSpottedBanner(ctx, world.alarm);
}
