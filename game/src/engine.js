// Core rules for Gravity Flip Sort. Pure functions, no DOM, so they run in the
// browser and in Node tests alike.
//
// Level map characters:
//   '#'      wall
//   '.'      floor
//   'a'-'f'  hole that accepts only the matching ball colour
//   'A'-'F'  ball of that colour, standing on floor

export const DIRS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const DIR_NAMES = Object.keys(DIRS);

const isBall = (ch) => ch >= 'A' && ch <= 'F';
const isHole = (ch) => ch >= 'a' && ch <= 'f';

// Turns a map (array of equal-length strings) into a static board and the
// starting state. The board never changes; the state is what moves.
export function parseLevel(map) {
  const h = map.length;
  const w = map[0].length;
  const cells = [];
  const holes = [];
  const balls = [];
  for (let y = 0; y < h; y++) {
    if (map[y].length !== w) throw new Error(`Row ${y} has length ${map[y].length}, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      if (ch === '#') cells.push('wall');
      else if (ch === '.') cells.push('floor');
      else if (isHole(ch)) {
        cells.push('hole');
        holes.push({ x, y, color: ch.toUpperCase() });
      } else if (isBall(ch)) {
        cells.push('floor');
        balls.push({ id: balls.length, x, y, color: ch });
      } else throw new Error(`Unknown map character '${ch}' at ${x},${y}`);
    }
  }
  const board = { w, h, cells, holes };
  const state = { balls, filled: holes.map(() => false) };
  return { board, state };
}

const holeIndexAt = (board, x, y) => board.holes.findIndex((hl) => hl.x === x && hl.y === y);

// Tilts the board. Every ball slides in `dir` until it hits a wall, the edge, a
// hole of another colour or another ball. A ball that reaches an empty hole of
// its own colour drops in and the hole becomes ordinary floor.
// Returns { state, moves, changed } where moves lists each ball's path for animation.
export function tilt(board, state, dir) {
  const { dx, dy } = DIRS[dir];
  const balls = state.balls.map((b) => ({ ...b }));
  const filled = state.filled.slice();
  const occupied = new Set(balls.map((b) => `${b.x},${b.y}`));

  // Move the ball nearest the far wall first, so balls behind it see where it stopped.
  const order = balls
    .map((b, i) => i)
    .sort((i, j) => (balls[j].x * dx + balls[j].y * dy) - (balls[i].x * dx + balls[i].y * dy));

  const moves = [];
  const sunkIds = new Set();
  for (const i of order) {
    const b = balls[i];
    const from = { x: b.x, y: b.y };
    occupied.delete(`${b.x},${b.y}`);
    let sunk = false;
    for (;;) {
      const nx = b.x + dx;
      const ny = b.y + dy;
      if (nx < 0 || ny < 0 || nx >= board.w || ny >= board.h) break;
      const cell = board.cells[ny * board.w + nx];
      if (cell === 'wall' || occupied.has(`${nx},${ny}`)) break;
      if (cell === 'hole') {
        const hi = holeIndexAt(board, nx, ny);
        if (!filled[hi]) {
          if (board.holes[hi].color !== b.color) break;
          b.x = nx;
          b.y = ny;
          filled[hi] = true;
          sunk = true;
          break;
        }
      }
      b.x = nx;
      b.y = ny;
    }
    if (sunk) sunkIds.add(b.id);
    else occupied.add(`${b.x},${b.y}`);
    if (sunk || from.x !== b.x || from.y !== b.y) {
      moves.push({ id: b.id, from, to: { x: b.x, y: b.y }, sunk });
    }
  }

  const next = { balls: balls.filter((b) => !sunkIds.has(b.id)), filled };
  return { state: next, moves, changed: moves.length > 0 };
}

export const isWon = (state) => state.balls.length === 0;

// A compact, order-independent key for a state, used by the solver.
export function stateKey(state) {
  const balls = state.balls.map((b) => `${b.color}${b.x},${b.y}`).sort().join(';');
  const filled = state.filled.map((f) => (f ? 1 : 0)).join('');
  return `${balls}|${filled}`;
}

// Stars earned for finishing in `moves` when the best possible is `par`.
export function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}
