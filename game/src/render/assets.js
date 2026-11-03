// Builds every bitmap the battle needs, sized for the current screen.
/* global person, wolfRider, banditKing, archerTower, barracks, mageTower, cannonTower, fortGate, plot,
   banyan, palm, rock, marigold, pond, peacock, tent, campfire, cart, stepwell, shrine, haystack, pots, fence,
   tuft, coinIcon, rubyIcon, icon, roundBtn, button, panel, ribbon, royalChest, el, g, outlined, shadow, moss, rnd,
   BANDIT, BARBARIAN, BRUTE, SPEAR, KNIGHT, HOLY, SUN, ARCHER, MAGE, OUT */
import { rasterize } from './raster.js';
import { WORLD_W, WORLD_H } from './view.js';

export const UNIT_SCALE = 0.8; // characters on the battlefield are drawn at 80% of art size
export const TOWER_SCALE = 1;

const PERSON_BOX = [-30, -64, 64, 72];
const BIG_BOX = [-40, -84, 84, 94];
const TOWER_BOX = [-56, -118, 112, 132];

const ENEMY_ART = {
  bandit: { box: PERSON_BOX, draw: (s) => person(s, 0, 0, { ...BANDIT }) },
  wolfRider: { box: [-36, -62, 74, 70], draw: (s) => wolfRider(s, 0, 0, 1) },
  barbarian: { box: BIG_BOX, draw: (s) => person(s, 0, 0, { ...BARBARIAN }) },
  banditArcher: { box: PERSON_BOX, draw: (s) => person(s, 0, 0, { ...BANDIT, weapon: 'bow', quiver: true }) },
  brute: { box: BIG_BOX, draw: (s) => person(s, 0, 0, { ...BRUTE }) },
  banditKing: { box: [-56, -118, 112, 128], draw: (s) => banditKing(s, 0, 0, 1) },
};
const SOLDIER_ART = { spearman: SPEAR, knight: KNIGHT, holyKnight: { ...HOLY, aura: false } };
const TOWER_ART = { archerTower, barracks, mageTower, cannonTower };

// Tier 2 adds gold trim, tier 3 a golden glow and banner: the upgrade shows on the building.
function tierDressing(s, tier) {
  if (tier >= 1) {
    for (const x of [-16, 16]) outlined(s, 'path', { d: `M${x - 3} -2 l3 -6 l3 6 Z`, fill: 'url(#gold)' }, 0.7);
  }
  if (tier >= 2) {
    const halo = el('ellipse', { cx: 0, cy: -2, rx: 34, ry: 12, fill: 'url(#holy)', opacity: 0.8 }, s);
    s.insertBefore(halo, s.firstChild.nextSibling);
    outlined(s, 'path', { d: 'M-4 -8 l4 -8 l4 8 Z', fill: 'url(#gold)' }, 0.8);
  }
}

function rubble(s) {
  plot(s, 0, 0);
  for (const [x, y, r] of [[-10, -2, 0.42], [8, 0, 0.5], [0, -6, 0.36]]) rock(s, x, y, r);
  moss(s, [[-14, -4, 3], [14, -2, 2.6]]);
}
function sundialPlot(s) {
  plot(s, 0, 0);
  outlined(s, 'ellipse', { cx: 0, cy: -4, rx: 10, ry: 4, fill: '#e8d8b8' }, 1);
  outlined(s, 'path', { d: 'M0 -4 L6 -12 L2 -4 Z', fill: '#8a6a4a' }, 0.6);
}

export class Assets {
  constructor() { this.sprites = {}; this.key = ''; this.bg = null; }

  get(name) { return this.sprites[name]; }

  async build(view, level, paths) {
    const key = `${view.cssW}x${view.cssH}@${view.dpr}:${level.id}`;
    if (key === this.key) return;
    this.key = key;
    const jobs = [];
    const add = (name, draw, box, k, ui = false) => jobs.push(rasterize(draw, box, view.px(k), { ui }).then((r) => { this.sprites[name] = r; }));
    for (const [name, a] of Object.entries(ENEMY_ART)) add('enemy:' + name, a.draw, a.box, UNIT_SCALE);
    for (const [name, o] of Object.entries(SOLDIER_ART)) add('soldier:' + name, (s) => person(s, 0, 0, o), PERSON_BOX, UNIT_SCALE);
    add('hero:sunKnight', (s) => person(s, 0, 0, { ...SUN, s: 1.15 }), [-36, -80, 76, 90], UNIT_SCALE);
    add('ui:heroFace', (s) => { el('circle', { cx: 0, cy: -2, r: 22, fill: 'url(#holy)' }, s); person(s, 0, 30, { ...SUN, s: 1.6, weapon: null, shield: null, aura: false, cape: null }); }, [-24, -26, 48, 48], view.u * 1.1, true);
    for (const [name, fn] of Object.entries(TOWER_ART)) for (let t = 0; t < 3; t++) add(`tower:${name}:${t}`, (s) => { fn(s, 0, 0, 1); tierDressing(s, t); }, TOWER_BOX, TOWER_SCALE);
    add('plot:open', (s) => plot(s, 0, 0), [-32, -28, 64, 44], 1);
    add('plot:rubble', rubble, [-32, -30, 64, 46], 1);
    add('plot:timed', sundialPlot, [-32, -28, 64, 44], 1);
    add('gate', (s) => fortGate(s, 0, 0, 1), [-90, -140, 180, 160], level.gate.s);
    // HUD icons, drawn at UI scale
    const ui = view.u;
    add('ui:coin', (s) => coinIcon(s, 0, 0, 10), [-12, -12, 24, 24], ui, true);
    add('ui:ruby', (s) => rubyIcon(s, 0, 0, 10), [-12, -12, 24, 24], ui, true);
    add('ui:heart', (s) => outlined(s, 'path', { d: 'M0 9 C-14 -1 -10 -11 0 -5 C10 -11 14 -1 0 9 Z', fill: 'url(#red)' }, 1.4), [-12, -12, 24, 24], ui, true);
    add('ui:wave', (s) => { outlined(s, 'circle', { cx: 0, cy: 0, r: 10, fill: '#3a2414' }, 1.4); el('path', { d: 'M-9 2 A9 9 0 0 1 9 2 Z', fill: 'url(#saffron)' }, s); }, [-12, -12, 24, 24], ui, true);
    add('ui:diya', (s) => icon.diya(s, 0, 4, 9, true), [-14, -18, 28, 28], ui, true);
    add('ui:diyaOff', (s) => icon.diya(s, 0, 4, 9, false), [-14, -18, 28, 28], ui, true);
    add('ui:lock', (s) => icon.lock(s, 0, 4, 1.2), [-12, -16, 24, 26], ui, true);
    for (const [name, color, drawIcon] of [
      ['pause', 'blue', (q, a, b) => { el('rect', { x: a - 6, y: b - 8, width: 4.5, height: 16, rx: 1, fill: '#fff4dc' }, q); el('rect', { x: a + 1.5, y: b - 8, width: 4.5, height: 16, rx: 1, fill: '#fff4dc' }, q); }],
      ['speed1', 'green', (q, a, b) => icon.play(q, a, b, 1)],
      ['speed2', 'gold', (q, a, b) => { icon.play(q, a - 4, b, 0.8); icon.play(q, a + 5, b, 0.8); }],
      ['swords', 'red', (q, a, b) => icon.swords(q, a, b, 1)],
      ['up', 'green', (q, a, b) => el('path', { d: `M${a} ${b - 8} L${a + 7} ${b + 1} H${a + 3} V${b + 8} H${a - 3} V${b + 1} H${a - 7} Z`, fill: '#fff4dc', stroke: OUT, 'stroke-width': 0.8 }, q)],
      ['sell', 'gold', (q, a, b) => coinIcon(q, a, b, 7)],
      ['clear', 'green', (q, a, b) => { el('path', { d: `M${a - 7} ${b + 6} L${a + 5} ${b - 6}`, stroke: '#8a5a2e', 'stroke-width': 3 }, q); outlined(q, 'path', { d: `M${a + 2} ${b - 9} L${a + 9} ${b - 2} L${a + 5} ${b + 2} L${a - 2} ${b - 5} Z`, fill: 'url(#steel)' }, 0.8); }],
      ['grey', 'grey', () => {}],
      ['arrowRain', 'green', (q, a, b) => { for (let k = -1; k <= 1; k++) { el('path', { d: `M${a + k * 6 - 3} ${b - 9} l6 15`, stroke: '#fff4dc', 'stroke-width': 2, 'stroke-linecap': 'round' }, q); el('path', { d: `M${a + k * 6 + 3} ${b + 6} l-1 -4.5 l3.6 1.6 Z`, fill: '#fff4dc' }, q); } }],
      ['reinforcements', 'red', (q, a, b) => { icon.helmet(q, a - 5, b + 2, 0.9); icon.helmet(q, a + 6, b + 4, 0.9); }],
      ['holyFire', 'gold', (q, a, b) => el('path', { d: `M${a} ${b - 11} Q${a + 10} ${b} ${a} ${b + 9} Q${a - 10} ${b} ${a} ${b - 11} Z`, fill: '#fff4dc', stroke: '#c8361d', 'stroke-width': 1 }, q)],
      ['sunStrike', 'purple', (q, a, b) => { for (let i = 0; i < 8; i++) { const t = (i / 8) * Math.PI * 2; el('path', { d: `M${a + Math.cos(t) * 5} ${b + Math.sin(t) * 5} L${a + Math.cos(t) * 10} ${b + Math.sin(t) * 10}`, stroke: '#ffe28a', 'stroke-width': 2 }, q); } el('circle', { cx: a, cy: b, r: 4, fill: '#ffe28a' }, q); }],
    ]) add('btn:' + name, (s) => roundBtn(s, 0, 0, 22, color, drawIcon), [-26, -26, 52, 54], ui, true);
    for (const [name, fn] of Object.entries(TOWER_ART)) add('icon:' + name, (s) => fn(s, 0, 0, 1), TOWER_BOX, ui * 0.36, true);
    add('chest', (s) => royalChest(s, 0, 0, 1), [-44, -82, 88, 90], ui, true);
    await Promise.all(jobs);
  }

  // Paints exactly the part of the world the screen shows, at screen resolution.
  async buildBackground(view, level, paths) {
    const box = [-view.ox / view.s, -view.oy / view.s, view.cssW / view.s, view.cssH / view.s];
    this.bg = await rasterize((s) => paintBackground(s, level, paths, box), box, view.s * view.dpr);
    return this.bg;
  }
}

// ---------------------------------------------------------------- background
const SCENERY = { banyan, palm, rock, marigold, pond, peacock, tent, campfire, cart, stepwell, shrine, haystack, pots };

export function paintBackground(svg, level, paths, [bx, by, bw, bh]) {
  const nearRoad = (x, y, r) => paths.some((p) => p.nearest(x, y).dist < r);
  const nearPlot = (x, y, r) => level.plots.some((p) => Math.hypot(p.x - x, p.y - y) < r);
  el('rect', { x: bx, y: by, width: bw, height: bh, fill: 'url(#grass)' }, svg);
  const ground = g(svg);
  for (let i = 0; i < 40; i++) el('ellipse', { cx: bx + rnd() * bw, cy: by + rnd() * bh, rx: 30 + rnd() * 70, ry: 14 + rnd() * 28, fill: rnd() > 0.5 ? '#a0cf58' : '#5f9433', opacity: 0.35 }, ground);
  // the road
  for (const path of paths) {
    const d = path.svg;
    el('path', { d, stroke: '#6f5530', 'stroke-width': 52, fill: 'none', 'stroke-linecap': 'round', opacity: 0.45, filter: 'url(#soft)' }, svg);
    el('path', { d, stroke: '#c9a86a', 'stroke-width': 46, fill: 'none', 'stroke-linecap': 'round' }, svg);
    el('path', { d, stroke: 'url(#road)', 'stroke-width': 40, fill: 'none', 'stroke-linecap': 'round' }, svg);
    el('path', { d, stroke: '#c2a066', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', opacity: 0.55 }, svg);
    el('path', { d, stroke: 'url(#road)', 'stroke-width': 15, fill: 'none', 'stroke-linecap': 'round' }, svg);
    el('path', { d, stroke: '#f6e6bd', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.5, 'stroke-dasharray': '30 26' }, svg);
    for (let i = 0; i < 140; i++) {
      const p = path.at(rnd() * path.length), r = 1.3 + rnd() * 1.8;
      const px = p.x + (rnd() - 0.5) * 34, py = p.y + (rnd() - 0.5) * 30;
      el('ellipse', { cx: px, cy: py, rx: r, ry: r * 0.7, fill: '#b89462', opacity: 0.85 }, svg);
      el('ellipse', { cx: px - r * 0.3, cy: py - r * 0.3, rx: r * 0.45, ry: r * 0.3, fill: '#f6e6bd', opacity: 0.8 }, svg);
    }
    const edge = g(svg);
    for (let i = 0; i < 260; i++) {
      const a = path.at((i / 260) * path.length), b = path.at(((i + 1) / 260) * path.length);
      const nx = -(b.y - a.y), ny = b.x - a.x, n = Math.hypot(nx, ny) || 1;
      for (const side of [-1, 1]) el('circle', { cx: a.x + (nx / n) * side * (21 + rnd() * 2), cy: a.y + (ny / n) * side * (21 + rnd() * 2), r: 3 + rnd() * 3.5, fill: rnd() > 0.5 ? '#7fb145' : '#89bb4c' }, edge);
    }
  }
  // grass, flowers, then scenery that keeps clear of the road and build spots
  const field = g(svg);
  for (let i = 0; i < 2200; i++) {
    const x = bx + rnd() * bw, y = by + rnd() * bh;
    if (nearRoad(x, y, 26)) continue;
    el('path', { d: `M${x} ${y} q${(rnd() - 0.5) * 3} -3 ${(rnd() - 0.5) * 4} -${3 + rnd() * 3}`, stroke: rnd() > 0.5 ? '#5d9632' : '#a6d462', 'stroke-width': 0.9, fill: 'none', opacity: 0.85 }, field);
  }
  for (let i = 0; i < 240; i++) {
    const x = bx + rnd() * bw, y = by + rnd() * bh;
    if (nearRoad(x, y, 26)) continue;
    el('circle', { cx: x, cy: y, r: 1.15, fill: ['#ffffff', '#ffe066', '#ff9fc0', '#ffb14a'][Math.floor(rnd() * 4)] }, field);
  }
  for (let i = 0; i < 100; i++) { const x = bx + rnd() * bw, y = by + rnd() * bh; if (!nearRoad(x, y, 28)) tuft(field, x, y); }
  // extra scenery for the bleed area so wide phones and tablets never see empty grass
  const extra = [];
  for (let i = 0; i < 26; i++) {
    const x = bx + rnd() * bw, y = by + rnd() * bh;
    if (x > 20 && x < WORLD_W - 20 && y > 20 && y < WORLD_H - 20) continue;
    extra.push([['banyan', 'palm', 'rock', 'marigold', 'haystack'][Math.floor(rnd() * 5)], x, y, 0.8 + rnd() * 0.4]);
  }
  const items = [...level.scenery.filter((it) => SCENERY[it[0]] || it[0] === 'fence'), ...extra].sort((a, b) => a[2] - b[2]);
  for (const [kind, x, y, s, y2] of items) {
    if (kind === 'fence') { fence(svg, x, y, s, y2); continue; }
    if (nearRoad(x, y, kind === 'banyan' ? 40 : 30) || nearPlot(x, y, 38)) continue;
    SCENERY[kind](svg, x, y, s ?? 1);
  }
  el('rect', { x: bx, y: by, width: bw, height: bh, fill: 'url(#sunlight)' }, svg);
}
