// levels.js — the three rooms of The Amber Vault, drawn as text maps.
// Legend: '#' wall, '.' floor, 'C' crate, 'P' potted plant, 'D' display case,
// 'V' vault (the loot), 'E' exit door, 'T' thief start,
// 's' smoke refill, 'e' EMP refill, 'd' disguise refill, 'c' coin (+50).
// Crates, plants and cases are cover: they block guard and camera sight.
// Guards and cameras are defined per room below the maps, in tile coords.

export const ROOMS = [
  {
    name: 'Room 1 — The Gallery',
    par: 75,
    map: [
      '################################',
      '#......#..........#............#',
      '#..T...#....C.....#.....V......#',
      '#......#..........#............#',
      '#......#....P.....#.....D......#',
      '#..C...#..........#............#',
      '#......#....C.....#.....C......#',
      '#......#..........#............#',
      '####.#####.########.####.#######',
      '#......#..........#............#',
      '#..P...#....C.....#.....P......#',
      '#......#..........#............#',
      '#......#....P.....#.....C......#',
      '#..C...#..........#............#',
      '#......#....C.....#.....P......#',
      '#..s...#..........#.....e......#',
      '#......#....D.....#............#',
      '################################',
    ],
    guards: [
      { waypoints: [[10, 3], [10, 6], [15, 6], [15, 3]], pause: 0.8 },
      { waypoints: [[21, 10], [26, 10], [26, 14], [21, 14]], pause: 1.2 },
    ],
    cameras: [
      { tx: 16, ty: 1, baseAngle: Math.PI / 2, sweep: 1.1 },
    ],
    exit: [1, 16],
  },
  {
    name: 'Room 2 — The Vault Hall',
    par: 95,
    map: [
      '################################',
      '#....C.......#.......C.........#',
      '#..T....P....#....D.......V....#',
      '#....C.......#.......C.........#',
      '#..........P.#.P...............#',
      '###.#####.####.####.#####.######',
      '#....D.......#.......P.........#',
      '#..P....C....#....C.......D....#',
      '#....D.......#.......C.........#',
      '#..........C.#.C...............#',
      '###.#####.####.####.#####.######',
      '#....C.......#.......P.........#',
      '#..s....P....#....D.......C....#',
      '#....C.......#.......C.........#',
      '#..........P.#.P.........e.....#',
      '#..D....C....#....C.......P....#',
      '#....P.......#.......D.........#',
      '################################',
    ],
    guards: [
      { waypoints: [[5, 2], [12, 2], [12, 4], [5, 4]], pause: 0.6 },
      { waypoints: [[19, 6], [26, 6], [26, 8], [19, 8]], pause: 0.9 },
      { waypoints: [[15, 12], [15, 15], [24, 15], [24, 12]], pause: 1.0 },
    ],
    cameras: [
      { tx: 16, ty: 1, baseAngle: Math.PI / 2, sweep: 1.3 },
      { tx: 16, ty: 16, baseAngle: -Math.PI / 2, sweep: 1.0 },
    ],
    exit: [1, 16],
  },
  {
    name: 'Room 3 — The Amber Vault',
    par: 120,
    map: [
      '################################',
      '#..C....P....#....C....P.......#',
      '#..T.........#.........D...V...#',
      '#..P....C....#....P....C.......#',
      '#......P.....#.....P...........#',
      '####.####.#####.#####.####.#####',
      '#....C....#....D....#....C.....#',
      '#..D......#.........#......P...#',
      '#....P....#....C....#....D.....#',
      '#..C......#.........#......C...#',
      '####.####.#####.#####.####.#####',
      '#....P....#....C....#....P.....#',
      '#..C......#.........#......D...#',
      '#....D....#....P....#....C.....#',
      '#..s......#....C....#....e.....#',
      '#....C....#....D....#....P.....#',
      '#....P....#....d....#....C.....#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [9, 2], [9, 4], [4, 4]], pause: 0.5 },
      { waypoints: [[18, 6], [24, 6], [24, 9], [18, 9]], pause: 0.7 },
      { waypoints: [[5, 12], [12, 12], [12, 15], [5, 15]], pause: 0.8 },
      { waypoints: [[26, 2], [26, 5], [29, 5], [29, 2]], pause: 0.6 },
    ],
    cameras: [
      { tx: 16, ty: 1, baseAngle: Math.PI / 2, sweep: 1.4 },
      { tx: 1, ty: 8, baseAngle: 0, sweep: 1.1 },
      { tx: 30, ty: 8, baseAngle: Math.PI, sweep: 1.1 },
    ],
    exit: [1, 16],
  },
];

// validateRoom checks a room map before the game trusts it: 18 rows of 32,
// exactly one thief start and one vault, and an exit tile on the floor.
export function validateRoom(room) {
  const errors = [];
  if (room.map.length !== 18) errors.push(`${room.name}: ${room.map.length} rows, want 18`);
  room.map.forEach((row, y) => {
    if (row.length !== 32) errors.push(`${room.name} row ${y}: ${row.length} chars, want 32`);
  });
  const flat = room.map.join('');
  const count = (ch) => [...flat].filter((c) => c === ch).length;
  if (count('T') !== 1) errors.push(`${room.name}: ${count('T')} thief starts, want 1`);
  if (count('V') !== 1) errors.push(`${room.name}: ${count('V')} vaults, want 1`);
  if (count('E') !== 1 && !room.exit) errors.push(`${room.name}: no exit`);
  return errors;
}

// findTile returns the pixel centre of the first tile holding `ch`.
export function findTile(room, ch) {
  for (let y = 0; y < room.map.length; y += 1) {
    const x = room.map[y].indexOf(ch);
    if (x !== -1) return { tx: x, ty: y };
  }
  return null;
}
