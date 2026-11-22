// cameras.js — wall-mounted security cameras that sweep their cones.
// A camera never moves, but its cone sweeps back and forth on a fixed arc,
// so the safe moment to cross its view is a rhythm to learn. An EMP
// blackout freezes every camera at once for a few seconds.

import { TILE, CAMERA_RANGE, CAMERA_CONE_HALF_ANGLE, CAMERA_SWEEP_SPEED } from './config.js';
import { hasLineOfSight } from './guards.js';

export function createCamera(def) {
  return {
    x: (def.tx + 0.5) * TILE,
    y: (def.ty + 0.5) * TILE,
    baseAngle: def.baseAngle,
    sweep: def.sweep ?? 1.1,
    phase: 0,
    angle: def.baseAngle,
    disabledTimer: 0,
  };
}

export function updateCamera(camera, dt, empTimer) {
  // The sweep is a sine, so the cone slows at each end of its arc — the
  // fair moment to cross is while it lingers at the far side.
  if (empTimer > 0) {
    camera.disabledTimer = empTimer;
    return; // frozen mid-sweep while the EMP lasts
  }
  camera.disabledTimer = 0;
  camera.phase += dt * CAMERA_SWEEP_SPEED;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
}

// cameraSeesThief mirrors guardSeesThief for a fixed, sweeping eye.
// Returns 0..1: how strongly the camera has the thief in frame.
export function cameraSeesThief(camera, thief, room, smokeClouds) {
  if (camera.disabledTimer > 0 || thief.disguiseTimer > 0) return 0;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = thief.sneaking ? CAMERA_RANGE * 0.62 : CAMERA_RANGE;
  if (dist > range || dist < 1) return 0;
  let angleDiff = Math.atan2(dy, dx) - camera.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  if (Math.abs(angleDiff) > CAMERA_CONE_HALF_ANGLE) return 0;
  if (!hasLineOfSight(room, camera.x, camera.y, thief.x, thief.y)) return 0;
  for (const cloud of smokeClouds) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) return 0;
  }
  const centre = 1 - Math.abs(angleDiff) / CAMERA_CONE_HALF_ANGLE;
  const closeness = 1 - dist / range;
  return Math.min(1, 0.3 + 0.7 * (centre * 0.6 + closeness * 0.4));
}
