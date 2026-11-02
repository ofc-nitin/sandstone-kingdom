import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, tilt, isWon, starsFor, stateKey } from '../src/engine.js';
import { solve } from '../src/solver.js';
import { LEVELS } from '../src/levels.js';

const at = (state) => state.balls.map((b) => `${b.color}@${b.x},${b.y}`).sort();

test('parseLevel reads walls, holes and balls', () => {
  const { board, state } = parseLevel(['#a.', '.A.']);
  assert.equal(board.w, 3);
  assert.equal(board.h, 2);
  assert.equal(board.cells[0], 'wall');
  assert.deepEqual(board.holes, [{ x: 1, y: 0, color: 'A' }]);
  assert.deepEqual(at(state), ['A@1,1']);
  assert.deepEqual(state.filled, [false]);
});

test('parseLevel rejects unknown characters and ragged rows', () => {
  assert.throws(() => parseLevel(['.x.']), /Unknown map character/);
  assert.throws(() => parseLevel(['...', '..']), /Row 1/);
});

test('a ball slides until it hits the edge', () => {
  const { board, state } = parseLevel(['A...']);
  const r = tilt(board, state, 'right');
  assert.deepEqual(at(r.state), ['A@3,0']);
  assert.equal(r.changed, true);
});

test('a ball stops in front of a wall', () => {
  const { board, state } = parseLevel(['A.#.']);
  assert.deepEqual(at(tilt(board, state, 'right').state), ['A@1,0']);
});

test('balls stack against each other instead of overlapping', () => {
  const { board, state } = parseLevel(['A.B.']);
  assert.deepEqual(at(tilt(board, state, 'right').state), ['A@2,0', 'B@3,0']);
  assert.deepEqual(at(tilt(board, state, 'left').state), ['A@0,0', 'B@1,0']);
});

test('a ball drops into a hole of its own colour, which then becomes floor', () => {
  const { board, state } = parseLevel(['A.a.', 'B...']);
  const r = tilt(board, state, 'right');
  assert.deepEqual(at(r.state), ['B@3,1']);
  assert.deepEqual(r.state.filled, [true]);
  assert.deepEqual(r.moves.find((m) => m.id === 0), { id: 0, from: { x: 0, y: 0 }, to: { x: 2, y: 0 }, sunk: true });
});

test('a ball is blocked by an empty hole of another colour', () => {
  const { board, state } = parseLevel(['B.a.']);
  assert.deepEqual(at(tilt(board, state, 'right').state), ['B@1,0']);
});

test('once a hole is filled, other balls roll over it', () => {
  const { board, state } = parseLevel(['A.a.', '..B.']);
  const first = tilt(board, state, 'right'); // A drops into a, B goes to the edge
  const second = tilt(board, first.state, 'up'); // B rises to the top row
  const third = tilt(board, second.state, 'left'); // B crosses the filled hole
  assert.deepEqual(at(third.state), ['B@0,0']);
});

test('the second ball in a row can follow the first into a matching hole', () => {
  const { board, state } = parseLevel(['AA.a']);
  const r = tilt(board, state, 'right');
  assert.deepEqual(at(r.state), ['A@3,0']);
  assert.deepEqual(r.state.filled, [true]);
});

test('tilting into a wall reports no change', () => {
  const { board, state } = parseLevel(['..A']);
  assert.equal(tilt(board, state, 'right').changed, false);
});

test('tilt does not mutate the state it is given', () => {
  const { board, state } = parseLevel(['A..a']);
  const before = JSON.stringify(state);
  tilt(board, state, 'right');
  assert.equal(JSON.stringify(state), before);
});

test('isWon is true only when every ball is in a hole', () => {
  const { board, state } = parseLevel(['A..a']);
  assert.equal(isWon(state), false);
  assert.equal(isWon(tilt(board, state, 'right').state), true);
});

test('stateKey ignores ball order', () => {
  const s1 = { balls: [{ color: 'A', x: 0, y: 0 }, { color: 'B', x: 1, y: 0 }], filled: [false] };
  const s2 = { balls: [{ color: 'B', x: 1, y: 0 }, { color: 'A', x: 0, y: 0 }], filled: [false] };
  assert.equal(stateKey(s1), stateKey(s2));
});

test('starsFor gives 3 at par, 2 within two moves, else 1', () => {
  assert.equal(starsFor(4, 4), 3);
  assert.equal(starsFor(6, 4), 2);
  assert.equal(starsFor(7, 4), 1);
});

test('solve finds the shortest solution', () => {
  const { board, state } = parseLevel(['A...', '...a']);
  assert.equal(solve(board, state).length, 2);
});

test('solve returns null for an impossible level', () => {
  // The hole is walled off on every side.
  const { board, state } = parseLevel(['A.#.', '..#a', '..##']);
  assert.equal(solve(board, state), null);
});

test('every shipped level is winnable in exactly its par', () => {
  assert.equal(LEVELS.length, 60);
  LEVELS.forEach((level, i) => {
    const { board, state } = parseLevel(level.map);
    const solution = solve(board, state, 100000);
    assert.ok(solution, `level ${i + 1} has no solution`);
    assert.equal(solution.length, level.par, `level ${i + 1} par`);
    let s = state;
    for (const dir of solution) s = tilt(board, s, dir).state;
    assert.ok(isWon(s), `level ${i + 1} solution replays to a win`);
  });
});

test('ball and hole counts match per colour in every level', () => {
  LEVELS.forEach((level, i) => {
    const text = level.map.join('');
    for (const c of 'ABCDEF') {
      const balls = [...text].filter((ch) => ch === c).length;
      const holes = [...text].filter((ch) => ch === c.toLowerCase()).length;
      assert.equal(balls, holes, `level ${i + 1} colour ${c}`);
    }
  });
});
