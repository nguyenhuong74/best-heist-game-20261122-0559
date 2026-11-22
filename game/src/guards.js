// guards.js — patrol guards and their vision cones.
// A guard walks a loop of waypoints, pauses at each, and looks where he
// walks. His cone is the thing the player reads before moving: step into
// it in the open and the alarm climbs; stay behind cover and it cannot
// see you at all. Above the spotted threshold a guard leaves his patrol
// and chases the thief's last seen position.

import {
  TILE, GUARD_RADIUS, GUARD_SPEED, GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE, ALARM_SPOTTED_AT,
} from './config.js';
import { isSolidTile } from './player.js';

export function createGuard(def) {
  const points = def.waypoints.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
  return {
    points,
    x: points[0].x,
    y: points[0].y,
    radius: GUARD_RADIUS,
    targetIndex: 1 % points.length,
    pause: 0,
    pauseTime: def.pause ?? 1,
    facing: 0,
    chasing: false,
    chaseX: 0,
    chaseY: 0,
    spottedTimer: 0,
  };
}

export function updateGuard(guard, dt, alarm, thief) {
  // A guard only chases what he has actually seen: the alarm is the shared
  // "someone saw something" signal, and the chase target is the thief's
  // position at the moment the chase began, not a live tracker.
  if (alarm >= ALARM_SPOTTED_AT && !guard.chasing) {
    guard.chasing = true;
    guard.chaseX = thief.x;
    guard.chaseY = thief.y;
  }
  if (guard.chasing) {
    const dx = guard.chaseX - guard.x;
    const dy = guard.chaseY - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12 || alarm < ALARM_SPOTTED_AT * 0.6) {
      guard.chasing = false; // lost the trail: back to the patrol
    } else {
      const step = Math.min(dist, GUARD_SPEED * 1.5 * dt);
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      guard.facing = Math.atan2(dy, dx);
      return;
    }
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  const target = guard.points[guard.targetIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    guard.targetIndex = (guard.targetIndex + 1) % guard.points.length;
    guard.pause = guard.pauseTime;
    return;
  }
  const step = Math.min(dist, GUARD_SPEED * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
}

// hasLineOfSight walks the segment in small steps and fails on any solid tile.
export function hasLineOfSight(room, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (isSolidTile(room, Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

// guardSeesThief: inside the cone, inside range, with a clear line of sight.
// A sneaking thief is spotted at shorter range; a disguised thief not at all.
export function guardSeesThief(guard, thief, room, smokeClouds) {
  if (thief.disguiseTimer > 0) return 0;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = thief.sneaking ? GUARD_CONE_RANGE * 0.62 : GUARD_CONE_RANGE;
  if (dist > range || dist < 1) return 0;
  let angleDiff = Math.atan2(dy, dx) - guard.facing;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  if (Math.abs(angleDiff) > GUARD_CONE_HALF_ANGLE) return 0;
  if (!hasLineOfSight(room, guard.x, guard.y, thief.x, thief.y)) return 0;
  for (const cloud of smokeClouds) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) return 0;
  }
  // Closer and more centred in the cone means spotted faster: 0..1.
  const centre = 1 - Math.abs(angleDiff) / GUARD_CONE_HALF_ANGLE;
  const closeness = 1 - dist / range;
  return Math.min(1, 0.35 + 0.65 * (centre * 0.6 + closeness * 0.4));
}
