// Places build spots for every level the way a level designer would, then writes them into
// src/engine/levels.js. Spots go where they matter, in this order:
//   1. junctions: where roads cross or merge, one spot in each wedge between the roads
//   2. bends: a pair on the inside of every sharp bend (covers both legs of the road),
//      and a spot close on the outside of the apex for Barracks to block
//   3. the fort approach: a pair flanking the last stretch of road
//   4. entrances: one spot near where each road enters
// Every spot is 36-58 from the nearest road, 52+ from other spots, clear of the HUD corners.
// Special spots go to junctions and the strongest bends; rubble (gold) to the second spot of
// pairs and the fort approach, so the best spots cost something.
// Usage: node tools/place-plots.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../src/engine/levels.js';
import { makePath } from '../src/engine/path.js';

const file = join(dirname(fileURLToPath(import.meta.url)), '../src/engine/levels.js');
const PLAN = { 0: { n: 6, special: 0, gold: 1 }, 1: { n: 8, special: 0, gold: 2 }, 2: { n: 9, special: 0, gold: 2 }, 3: { n: 10, special: 1, gold: 3 }, 4: { n: 11, special: 2, gold: 3 }, 5: { n: 12, special: 3, gold: 3 } };
const HUD = [[0, 0, 270, 62], [716, 0, 844, 60], [0, 318, 132, 390], [688, 334, 844, 390], [0, 62, 50, 210]];
const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
let src = readFileSync(file, 'utf8');

for (const lv of LEVELS) {
  const plan = PLAN[lv.id];
  const paths = lv.paths.map((p) => makePath(p));
  const roadDist = (x, y) => Math.min(...paths.map((p) => p.nearest(x, y).dist));
  const ok = (x, y, picked, minD = 36, maxD = 58) => {
    if (x < 30 || x > 814 || y < 44 || y > 366) return false;
    if (HUD.some(([a, b, c, e]) => x > a && x < c && y > b && y < e)) return false;
    if (Math.hypot(x - lv.gate.x, y - lv.gate.y) < 78) return false;
    const d = roadDist(x, y);
    if (d < minD || d > maxD) return false;
    return !picked.some((q) => Math.hypot(q.x - x, q.y - y) < 54);
  };
  // nudge a wanted point to the nearest valid spot within a small radius
  const settle = (x, y, picked, minD, maxD) => {
    for (let r = 0; r <= 22; r += 3) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
      if (ok(px, py, picked, minD, maxD)) return { x: px, y: py };
      if (r === 0) break;
    }
    return null;
  };
  const onScreen = (q) => q.x > 0 && q.x < 844 && q.y > 0 && q.y < 390;
  const wants = [];
  // 1. junctions: two roads closer than 10 units after running apart (merge or crossing)
  const junctions = [];
  for (let i = 0; i < paths.length; i++) for (let j = i; j < paths.length; j++) {
    const A = paths[i], B = paths[j];
    let close = true; // only the moment two roads come together counts, not the shared road after a merge
    for (let d = 20; d < A.length - 20; d += 4) {
      const a = A.at(d);
      let dist = Infinity, nd = 0;
      if (i === j) { for (let e = 0; e < B.length; e += 4) { if (Math.abs(e - d) < 120) continue; const b = B.at(e), q = Math.hypot(b.x - a.x, b.y - a.y); if (q < dist) { dist = q; nd = e; } } }
      else { const n = B.nearest(a.x, a.y); dist = n.dist; nd = n.d; }
      const now = dist < 6;
      if (now && !close && onScreen(a) && !junctions.some((k) => Math.hypot(k.x - a.x, k.y - a.y) < 90)) junctions.push({ x: a.x, y: a.y, dirs: [A.at(d).angle, B.at(nd).angle] });
      close = now;
    }
  }
  for (const [ki, k] of junctions.entries()) {
    // the wedges between the road directions (both ways along each road)
    const dirs = k.dirs.flatMap((a) => [a, a + Math.PI]).map(wrap).sort((a, b) => a - b);
    dirs.forEach((a, i) => {
      const b = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + Math.PI * 2, mid = (a + b) / 2;
      if (b - a < 0.5) return;
      // the widest wedges first: they leave the most room and see the most road
      wants.push({ x: k.x + Math.cos(mid) * 54, y: k.y + Math.sin(mid) * 54, why: 'junction', jk: ki, prio: 3.6 + (b - a) * 0.2, min: 36, max: 58 });
    });
  }
  // 2. bends: the sharpest turns of every road
  for (const P of paths) {
    const bends = [];
    for (let d = 40; d < P.length - 40; d += 4) {
      const turn = wrap(P.at(d + 50).angle - P.at(d - 50).angle);
      const c = P.at(d);
      if (!onScreen(c)) continue;
      if (Math.abs(turn) > 0.9) bends.push({ d, turn, c });
    }
    // keep the apex of each run of bend samples
    const apexes = [];
    for (const b of bends) { const last = apexes[apexes.length - 1]; if (last && b.d - last.d < 110) { if (Math.abs(b.turn) > Math.abs(last.turn)) apexes[apexes.length - 1] = b; } else apexes.push(b); }
    for (const { c, turn } of apexes) {
      const side = Math.sign(turn); // +1: the road turns clockwise on screen, the inside is to its right
      const nx = -Math.sin(c.angle) * side, ny = Math.cos(c.angle) * side; // points to the inside of the turn
      const tx = Math.cos(c.angle), ty = Math.sin(c.angle);
      const strength = Math.min(1, Math.abs(turn) / 2.4);
      wants.push({ x: c.x + nx * 50 - tx * 26, y: c.y + ny * 50 - ty * 26, why: 'bend', prio: 3 + strength, min: 38, max: 58 });
      wants.push({ x: c.x + nx * 50 + tx * 26, y: c.y + ny * 50 + ty * 26, why: 'bend2', prio: 2.6 + strength, min: 38, max: 58 });
      wants.push({ x: c.x - nx * 40, y: c.y - ny * 40, why: 'outside', prio: 2 + strength, min: 36, max: 46 });
    }
  }
  // 3. the fort approach
  const P0 = paths[0], fa = P0.at(P0.length - 90);
  for (const sgn of [1, -1]) wants.push({ x: fa.x - Math.sin(fa.angle) * 46 * sgn, y: fa.y + Math.cos(fa.angle) * 46 * sgn, why: 'fort', prio: 2.4, min: 36, max: 58 });
  // 4. entrances
  for (const P of paths) { let d = 0; while (d < P.length && !onScreen(P.at(d))) d += 4; const e = P.at(d + 70); wants.push({ x: e.x - Math.sin(e.angle) * 44, y: e.y + Math.cos(e.angle) * 44, why: 'entrance', prio: 1.8, min: 36, max: 58 }); }

  wants.sort((a, b) => b.prio - a.prio);
  const picked = [];
  const perJunction = {};
  for (const w of wants) {
    if (picked.length >= plan.n) break;
    if (w.why === 'junction' && (perJunction[w.jk] = (perJunction[w.jk] || 0) + 1) > 3) continue;
    const s = settle(w.x, w.y, picked, w.min, w.max);
    if (s) picked.push({ ...s, why: w.why, prio: w.prio });
  }
  // top up with the best remaining coverage if the level still needs spots
  const pts = paths.flatMap((pa) => pa.points.filter(([x, y]) => onScreen({ x, y })));
  for (let guard = 0; picked.length < plan.n && guard < 50; guard++) {
    let best = null, bs = -1;
    for (let x = 36; x <= 808; x += 8) for (let y = 48; y <= 372; y += 8) {
      if (!ok(x, y, picked)) continue;
      const sc = pts.reduce((n, [px, py]) => n + (Math.hypot(px - x, py - y) <= 88 ? 1 : 0), 0);
      if (sc > bs) { bs = sc; best = { x, y, why: 'fill', prio: 1 }; }
    }
    if (!best) break;
    picked.push(best);
  }
  // kinds: special spots at junctions and the strongest bends; rubble on premium second spots
  const specials = picked.filter((q) => q.why === 'junction').concat(picked.filter((q) => q.why === 'bend').sort((a, b) => b.prio - a.prio)).slice(0, plan.special);
  const goldPool = picked.filter((q) => !specials.includes(q)).sort((a, b) => ({ bend2: 0, fort: 1, outside: 2 }[a.why] ?? 3) - ({ bend2: 0, fort: 1, outside: 2 }[b.why] ?? 3));
  const golds = goldPool.slice(0, plan.gold);
  // order along the main road; specials are numbered in the order they open
  const along = (q) => Math.min(...paths.map((pa) => pa.nearest(q.x, q.y).d / pa.length));
  picked.sort((a, b) => along(a) - along(b));
  if (lv.id === 0) {
    // the tutorial points at spot 0 (first tower) and spot 3 (the rubble by the fort)
    const g = golds[0], rest = picked.filter((q) => q !== g);
    picked.splice(0, picked.length, ...rest.slice(0, 3), g, ...rest.slice(3));
  }
  let spIndex = 0;
  const items = picked.map((q) => {
    if (specials.includes(q)) { const k = spIndex++; return `{ x: ${q.x}, y: ${q.y}, royal: true, lock: { type: 'special', wave: ${2 + k * 2}, cost: ${70 + k * 30} } } /* ${q.why} */`; }
    if (golds.includes(q)) return `{ x: ${q.x}, y: ${q.y}, lock: { type: 'gold', cost: ${40 + golds.indexOf(q) * 15} } } /* ${q.why} */`;
    return `{ x: ${q.x}, y: ${q.y} } /* ${q.why} */`;
  });
  const re = new RegExp(`(id: ${lv.id}, name:[\\s\\S]*?plots: )\\[[\\s\\S]*?\\],\\n(\\s+waves:)`);
  if (!re.test(src)) throw new Error('level ' + lv.id + ' not found');
  src = src.replace(re, (m, a, b) => `${a}[\n      ${items.join(',\n      ')},\n    ],\n${b}`);
  const count = (w) => picked.filter((q) => q.why === w).length;
  console.log(`level ${lv.id}: ${picked.length} spots · junction ${count('junction')}, bend ${count('bend') + count('bend2')}, outside ${count('outside')}, fort ${count('fort')}, entrance ${count('entrance')}, fill ${count('fill')} · ${specials.length} special, ${golds.length} rubble · ${junctions.length} junctions found`);
}
writeFileSync(file, src);
