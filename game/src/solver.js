import { DIR_NAMES, tilt, isWon, stateKey } from './engine.js';

// Breadth-first search over tilts. Returns the shortest list of directions that
// wins from `state`, or null if the level can't be won from here (or the search
// gives up after `maxNodes` states).
export function solve(board, state, maxNodes = 50000) {
  if (isWon(state)) return [];
  const seen = new Set([stateKey(state)]);
  let frontier = [{ state, path: [] }];
  while (frontier.length > 0) {
    const nextFrontier = [];
    for (const { state: s, path } of frontier) {
      for (const dir of DIR_NAMES) {
        const result = tilt(board, s, dir);
        if (!result.changed) continue;
        const nextPath = [...path, dir];
        if (isWon(result.state)) return nextPath;
        const key = stateKey(result.state);
        if (seen.has(key)) continue;
        seen.add(key);
        if (seen.size > maxNodes) return null;
        nextFrontier.push({ state: result.state, path: nextPath });
      }
    }
    frontier = nextFrontier;
  }
  return null;
}
