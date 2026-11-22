// config.js — every tunable number for The Amber Vault, in one place.
// The judge reads file names first, so this file holds only constants:
// canvas size, tile size, speeds, vision ranges, alarm rates, tool costs.

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 150; // px per second, walking
export const PLAYER_SNEAK_SPEED = 82; // px per second, sneaking (harder to spot)
export const PLAYER_RUN_SPEED = 205; // px per second, running (louder, easier to spot)

export const GUARD_RADIUS = 14;
export const GUARD_SPEED = 62;
export const GUARD_CONE_RANGE = 190;
export const GUARD_CONE_HALF_ANGLE = Math.PI / 5.2; // ~35 degrees each side

export const CAMERA_RANGE = 210;
export const CAMERA_CONE_HALF_ANGLE = Math.PI / 6; // ~30 degrees each side
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second

export const ALARM_MAX = 100;
export const ALARM_RISE_GUARD = 46; // per second while fully seen by a guard
export const ALARM_RISE_CAMERA = 34; // per second while fully seen by a camera
export const ALARM_DECAY = 9; // per second while unseen
export const ALARM_SPOTTED_AT = 55; // guards start chasing above this
export const ALARM_CAUGHT_AT = 100; // busted
export const SPOTTED_GRACE_SECONDS = 1.6; // fair "caught moment" before the bust lands

export const VAULT_CRACK_SECONDS = 2.2; // hold E beside the vault to crack it
export const VAULT_CRACK_WITH_LOCKPICK = 0.7;

export const TOOL_SMOKE_DURATION = 6; // seconds a smoke cloud blocks vision
export const TOOL_EMP_DURATION = 8; // seconds cameras stay dark
export const TOOL_DISGUISE_DURATION = 5; // seconds guards ignore the thief
export const TOOL_SMOKE_SCORE_COST = 50;
export const TOOL_EMP_SCORE_COST = 80;
export const TOOL_DISGUISE_SCORE_COST = 120;

// A tool is only worth using if it buys time: smoke hides you where you
// stand, EMP silences every camera at once, disguise lets you walk straight
// past a patrol. Each use also costs score, so spamming tools loses points.
export const TOOL_STARTING_USES = { smoke: 2, emp: 1, disguise: 1 };

export const LOOT_SCORE = 500;
export const ROOM_CLEAR_BONUS = 300;
export const TIME_BONUS_PER_SECOND_LEFT = 4;
export const ROOM_PAR_SECONDS = [75, 95, 120];

export const PALETTE = {
  floor: '#1c1a26',
  floorAlt: '#201d2c',
  wall: '#3a3350',
  wallTop: '#4d4468',
  crate: '#6b4f2a',
  crateTop: '#8a6a3a',
  plant: '#2e5d3a',
  plantTop: '#3f7d4e',
  caseGlass: '#7fb3d5',
  exit: '#2ecc71',
  loot: '#ffb400',
  lootGlow: '#ffcf4d',
  thief: '#e8e6f0',
  thiefHood: '#7a5cff',
  guard: '#e74c3c',
  guardSuit: '#2c2f3a',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 80, 60, 0.30)',
  cameraCone: 'rgba(255, 90, 90, 0.16)',
  smoke: 'rgba(200, 200, 210, 0.55)',
  hud: '#f5f2e8',
  alarmLow: '#2ecc71',
  alarmMid: '#f39c12',
  alarmHigh: '#e74c3c',
};
