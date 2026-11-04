// Places build spots for every level and writes them into src/engine/levels.js.
// Spots sit 34-60 units from a road, at least 52 apart, clear of the HUD corners, the gate and
// the screen edge; the best-covering ones are picked first. Then some become gold-locked rubble
// and 1-3 become special spots that open one by one (or earlier for gold).
// Usage: node tools/place-plots.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../src/engine/levels.js';
import { makePath } from '../src/engine/path.js';

const file = join(dirname(fileURLToPath(import.meta.url)), '../src/engine/levels.js');
const PLAN = { 0: { n: 6, special: 0, gold: 1 }, 1: { n: 8, special: 0, gold: 2 }, 2: { n: 9, special: 0, gold: 2 }, 3: { n: 10, special: 1, gold: 3 }, 4: { n: 11, special: 2, gold: 3 }, 5: { n: 12, special: 3, gold: 3 } };
const HUD = [[0, 0, 270, 58], [716, 0, 844, 56], [0, 320, 130, 390], [690, 336, 844, 390], [0, 58, 46, 200]];
let src = readFileSync(file, 'utf8');

for (const lv of LEVELS) {
  const plan = PLAN[lv.id];
  const paths = lv.paths.map((p) => makePath(p));
  const roadDist = (x, y) => Math.min(...paths.map((p) => p.nearest(x, y).dist));
  const cover = (x, y) => paths.reduce((n, p) => n + p.points.filter(([px, py]) => Math.hypot(px - x, py - y) <= 88).length / Math.max(1, paths.length * 0.6), 0);
  const cands = [];
  for (let x = 36; x <= 808; x += 6) for (let y = 48; y <= 372; y += 6) {
    const d = roadDist(x, y);
    if (d < 36 || d > 58) continue;
    if (HUD.some(([a, b, c, e]) => x > a && x < c && y > b && y < e)) continue;
    if (Math.hypot(x - lv.gate.x, y - lv.gate.y) < 80) continue;
    cands.push({ x, y, c: cover(x, y) });
  }
  // greedy, with diminishing returns: road already covered by earlier spots counts for less,
  // so the spots spread over every entrance instead of piling up where the roads meet
  const pts = paths.flatMap((pa) => pa.points.filter(([x, y]) => x > 0 && x < 844 && y > 0 && y < 390));
  const covered = new Array(pts.length).fill(0);
  const picked = [];
  while (picked.length < plan.n) {
    let best = null, bestScore = -1;
    for (const c of cands) {
      if (picked.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < 54)) continue;
      let sc = 0;
      pts.forEach(([x, y], i) => { if (Math.hypot(x - c.x, y - c.y) <= 88) sc += 1 / (1 + covered[i] * 1.5); });
      if (sc > bestScore) { bestScore = sc; best = c; }
    }
    if (!best) break;
    picked.push(best);
    pts.forEach(([x, y], i) => { if (Math.hypot(x - best.x, y - best.y) <= 88) covered[i]++; });
  }
  // order along the first road, so locks and specials spread out over the map
  const along = (p) => Math.min(...paths.map((pa) => pa.nearest(p.x, p.y).d / pa.length));
  picked.sort((a, b) => along(a) - along(b));
  // special spots: good but not the very best spots, spread along the road
  const byCover = [...picked].sort((a, b) => b.c - a.c);
  const specials = [];
  for (const p of byCover.slice(1)) { if (specials.length >= plan.special) break; if (specials.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > 110)) specials.push(p); }
  const rest = picked.filter((p) => !specials.includes(p));
  // gold locks: every other spot from the back half, so clearing rubble is worth it later
  const golds = rest.slice(Math.floor(rest.length / 2)).filter((_, i) => i % 2 === 0).slice(0, plan.gold);
  const items = picked.map((p) => {
    const sp = specials.indexOf(p);
    if (sp >= 0) return `{ x: ${p.x}, y: ${p.y}, royal: true, lock: { type: 'special', wave: ${2 + sp * 2}, cost: ${70 + sp * 30} } }`;
    if (golds.includes(p)) return `{ x: ${p.x}, y: ${p.y}, lock: { type: 'gold', cost: ${40 + golds.indexOf(p) * 15} } }`;
    return `{ x: ${p.x}, y: ${p.y} }`;
  });
  const re = new RegExp(`(id: ${lv.id}, name:[\\s\\S]*?plots: )\\[[\\s\\S]*?\\],\\n(\\s+waves:)`);
  if (!re.test(src)) throw new Error('level ' + lv.id + ' not found');
  src = src.replace(re, (m, a, b) => `${a}[\n      ${items.join(',\n      ')},\n    ],\n${b}`);
  console.log(`level ${lv.id}: ${picked.length} spots (${specials.length} special, ${golds.length} gold) from ${cands.length} candidates`);
}
writeFileSync(file, src);
