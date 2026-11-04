// Builds every bitmap the battle needs, sized for the current screen.
/* global person, wolfRider, banditKing, archerTower, barracks, mageTower, cannonTower, falconer, fountain, alchemist, elephantStable, elephant, falcon, specialPlot, fortGate, plot,
   banyan, palm, rock, marigold, pond, peacock, tent, campfire, cart, stepwell, shrine, haystack, pots, fence,
   tuft, coinIcon, rubyIcon, icon, roundBtn, button, panel, ribbon, royalChest, el, g, outlined, shadow, moss, rnd,
   BANDIT, BARBARIAN, BRUTE, SPEAR, KNIGHT, HOLY, SUN, ARCHER, MAGE, OUT, DRUMMER, SHIELD_BEARER, SABOTEUR, logo, menuScene, menuLayer, MENU_HEROES, MENU_SUN, mapScene, MAP_W */
import { rasterize } from './raster.js';
import { WORLD_W, WORLD_H } from './view.js';

export const UNIT_SCALE = 0.8; // characters on the battlefield are drawn at 80% of art size
export const TOWER_SCALE = 1;

const PERSON_BOX = [-30, -64, 64, 72];
const BIG_BOX = [-40, -84, 84, 94];
const TOWER_BOX = [-56, -118, 112, 132];

// Animation frames: idle, two walking steps (legs swing opposite ways) and two attack poses.
// Riders and big beasts walk by tilting and bobbing instead.
export const FRAMES = ['idle', 'w1', 'w2', 'a1', 'a2'];
const POSE = { idle: {}, w1: { step: 1 }, w2: { step: -1 }, a1: { swing: 0.55 }, a2: { swing: 1 } };
const humanoid = (o) => (s, f) => person(s, 0, 0, { ...o, ...POSE[f] });
const rider = (fn) => (s, f) => {
  const tilt = { idle: 0, w1: -4, w2: 4, a1: -6, a2: 6 }[f], up = f === 'w1' || f === 'a1' ? -1.6 : 0;
  fn(g(s, { transform: `translate(0 ${up}) rotate(${tilt} 0 -4)` }));
};
const ENEMY_ART = {
  bandit: { box: PERSON_BOX, draw: humanoid(BANDIT) },
  wolfRider: { box: [-36, -62, 74, 70], draw: rider((s) => wolfRider(s, 0, 0, 1)) },
  barbarian: { box: BIG_BOX, draw: humanoid(BARBARIAN) },
  banditArcher: { box: PERSON_BOX, draw: humanoid({ ...BANDIT, weapon: 'bow', quiver: true }) },
  brute: { box: BIG_BOX, draw: humanoid(BRUTE) },
  drummer: { box: PERSON_BOX, draw: humanoid(DRUMMER) },
  shieldBearer: { box: [-38, -72, 76, 80], draw: humanoid(SHIELD_BEARER) },
  saboteur: { box: PERSON_BOX, draw: humanoid(SABOTEUR) },
  banditKing: { box: [-56, -118, 112, 128], draw: rider((s) => banditKing(s, 0, 0, 1)) },
};
const SOLDIER_ART = { spearman: SPEAR, knight: KNIGHT, holyKnight: { ...HOLY, aura: false } };
export const TOWER_ART = { archerTower, barracks, mageTower, cannonTower, falconer, fountain, alchemist, elephantStable };
const BASE_TOWERS = ['archerTower', 'barracks', 'mageTower', 'cannonTower'];
export const ROYAL_STAGES = 4; // looks across a special tower's 8 levels: levels 1-2, 3-4, 5-6, 7-8
export const stageOf = (tower) => (tower.def.royal ? Math.min(ROYAL_STAGES - 1, Math.floor(tower.tier / 2)) : tower.tier);

// A small domed pavilion (chhatri) that flanks a top-tier tower.
function chhatri(t, x, y, k = 1) {
  const c = g(t, { transform: `translate(${x} ${y}) scale(${k})` });
  outlined(c, 'rect', { x: -6, y: -2, width: 12, height: 3, rx: 1, fill: 'url(#sandV)' }, 0.9);
  for (const px of [-4, 4]) outlined(c, 'rect', { x: px - 1, y: -12, width: 2, height: 10, fill: '#f6dcae' }, 0.6);
  outlined(c, 'path', { d: 'M-6.4 -12 Q0 -22 6.4 -12 Z', fill: 'url(#marble)' }, 0.9);
  outlined(c, 'path', { d: 'M-6.8 -12 H6.8 L6 -10.6 H-6 Z', fill: 'url(#gold)' }, 0.5);
  el('circle', { cx: 0, cy: -21.6, r: 1.2, fill: '#ffd23a', stroke: OUT, 'stroke-width': 0.4 }, c);
}
// Each upgrade changes the building so it is obvious at a glance:
//  stage 0 small with a wooden palisade, 1 taller with gold studs and pennants,
//  2 grand on a marble plinth with domed pavilions, banners, a halo and a crest; 3 (special only) adds a sacred aura.
export function dressTower(s, fn, stage, o = {}) {
  const sc = [0.84, 0.93, 1, 1.04][stage];
  const back = g(s);
  if (stage >= 2) {
    const halo = el('ellipse', { cx: 0, cy: -4, rx: 40, ry: 14, fill: 'url(#holy)', opacity: stage >= 3 ? 1 : 0.75 }, back);
    void halo;
    outlined(back, 'ellipse', { cx: 0, cy: 3, rx: 36, ry: 12, fill: '#efe6d6' }, 1.4);
    outlined(back, 'ellipse', { cx: 0, cy: 1, rx: 32, ry: 10, fill: '#fff7ea' }, 0.8);
    el('path', { d: 'M-30 3 Q0 11 30 3', stroke: '#e0a21c', 'stroke-width': 1, fill: 'none' }, back);
    chhatri(back, -31, -2, 0.9); chhatri(back, 31, -2, 0.9);
  }
  if (stage >= 3) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el('path', { d: `M${Math.cos(a) * 20} ${-60 + Math.sin(a) * 20} l1 -3 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 Z`, fill: '#fff4c0', opacity: 0.9 }, back); }
  const mid = g(s, { transform: `scale(${sc})` });
  fn(mid, 0, 0, 1, o);
  const front = g(s);
  if (stage === 0) {
    // a wooden palisade: the outpost before it is built in stone
    for (let i = -5; i <= 5; i++) {
      const x = i * 4.6, yy = 6 - Math.abs(i) * 0.5;
      outlined(front, 'path', { d: `M${x - 1.8} ${yy} V${yy - 8} L${x} ${yy - 11} L${x + 1.8} ${yy - 8} V${yy} Z`, fill: i % 2 ? '#a8703e' : '#8a5a32' }, 0.7);
    }
    el('path', { d: 'M-25 1 Q0 6 25 1', stroke: '#5a3a22', 'stroke-width': 1.2, fill: 'none' }, front);
  }
  if (stage >= 1) {
    for (const x of [-18, -9, 9, 18]) outlined(front, 'path', { d: `M${x - 2.4} 1 l2.4 -5 l2.4 5 Z`, fill: 'url(#gold)' }, 0.6);
    for (const x of [-27, 27]) { el('path', { d: `M${x} 4 V-22`, stroke: OUT, 'stroke-width': 1.6 }, front); outlined(front, 'path', { d: `M${x} -22 L${x + (x < 0 ? -9 : 9)} -18.5 L${x} -15 Z`, fill: stage >= 2 ? 'url(#gold)' : 'url(#red)' }, 0.6); }
  }
  if (stage >= 2) {
    outlined(front, 'path', { d: 'M-5 6 l5 -9 l5 9 Z', fill: 'url(#gold)' }, 0.8);
    el('circle', { cx: 0, cy: 2.6, r: 1.6, fill: '#e2342a' }, front);
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

  get(name) { const sp = this.sprites[name]; if (!sp && this.key && !(this.missing || (this.missing = new Set())).has(name)) { this.missing.add(name); console.warn('missing sprite', name); } return sp; }

  async build(view, level, paths) {
    const key = `${view.cssW}x${view.cssH}@${view.dpr}:${level.id}`;
    if (key === this.key) return;
    this.key = key;
    const jobs = [];
    const add = (name, draw, box, k, ui = false) => jobs.push(rasterize(draw, box, view.px(k), { ui }).then((r) => { this.sprites[name] = r; }));
    for (const f of FRAMES) {
      const sfx = f === 'idle' ? '' : ':' + f;
      for (const [name, a] of Object.entries(ENEMY_ART)) add('enemy:' + name + sfx, (s) => a.draw(s, f), a.box, UNIT_SCALE);
      for (const [name, o] of Object.entries(SOLDIER_ART)) add('soldier:' + name + sfx, (s) => humanoid(o)(s, f), PERSON_BOX, UNIT_SCALE);
      add('hero:sunKnight' + sfx, (s) => humanoid({ ...SUN, s: 1.15 })(s, f), [-36, -80, 76, 90], UNIT_SCALE);
    }
    for (const f of ['idle', 'w1']) add('beast:elephant' + (f === 'idle' ? '' : ':' + f), (s) => rider((q) => { elephant(q, 0, 0, 0.62, false, false); person(q, 4, -24, { ...SPEAR, s: 0.5, shield: null }); })(s, f), [-40, -72, 80, 80], UNIT_SCALE);
    add('ui:heroFace', (s) => { el('circle', { cx: 0, cy: -2, r: 22, fill: 'url(#holy)' }, s); person(s, 0, 30, { ...SUN, s: 1.6, weapon: null, shield: null, aura: false, cape: null }); }, [-24, -26, 48, 48], view.u * 1.1, true);
    for (const [name, fn] of Object.entries(TOWER_ART)) {
      const stages = BASE_TOWERS.includes(name) ? 3 : ROYAL_STAGES;
      for (let t = 0; t < stages; t++) {
        add(`tower:${name}:${t}`, (s) => dressTower(s, fn, t), TOWER_BOX, TOWER_SCALE);
        // archers loose their arrows: a second frame shown for a moment after each shot
        if (name === 'archerTower') add(`tower:${name}:${t}:fire`, (s) => dressTower(s, fn, t, { loose: true }), TOWER_BOX, TOWER_SCALE);
      }
    }
    add('plot:specialLocked', (s) => { specialPlot(s, 0, 0); el('ellipse', { cx: 0, cy: -1, rx: 24, ry: 10, fill: '#2a1a10', opacity: 0.45 }, s); icon.lock(s, 0, -2, 1.1); }, [-34, -30, 68, 46], 1, true);
    add('plot:open', (s) => plot(s, 0, 0), [-32, -28, 64, 44], 1);
    add('plot:rubble', rubble, [-32, -30, 64, 46], 1);
    add('plot:timed', sundialPlot, [-32, -28, 64, 44], 1);
    add('plot:special', (s) => specialPlot(s, 0, 0), [-34, -30, 68, 46], 1);
    add('proj:falcon', (s) => falcon(s, 0, 0, 0.6, true), [-12, -10, 24, 18], 1);
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
    for (const name of ['falconer', 'fountain', 'alchemist', 'elephantStable']) add('card:' + name, (s) => TOWER_ART[name](s, 0, 0, 1), TOWER_BOX, ui * 0.5, true);
    add('chest', (s) => royalChest(s, 0, 0, 1), [-44, -82, 88, 90], ui, true);
    // menu icons and power-ups
    for (const [name, color, drawIcon] of [
      ['settings', 'blue', (q, a, b) => icon.gear(q, a, b, 1)],
      ['trophy', 'gold', (q, a, b) => icon.trophy(q, a, b + 2, 1)],
      ['ranks', 'green', (q, a, b) => icon.bars(q, a, b, 1)],
      ['daily', 'red', (q, a, b) => icon.chest(q, a, b + 6, 0.8)],
      ['quests', 'green', (q, a, b) => { outlined(q, 'rect', { x: a - 7, y: b - 9, width: 14, height: 18, rx: 2, fill: '#fff4dc' }, 1); el('path', { d: `M${a - 4} ${b - 4} h8 M${a - 4} ${b} h8 M${a - 4} ${b + 4} h5`, stroke: '#8a5a2e', 'stroke-width': 1.4 }, q); }],
      ['workshop', 'purple', (q, a, b) => { el('path', { d: `M${a - 7} ${b + 8} L${a + 3} ${b - 2}`, stroke: '#c89a5a', 'stroke-width': 3, 'stroke-linecap': 'round' }, q); outlined(q, 'path', { d: `M${a - 1} ${b - 9} L${a + 9} ${b + 1} L${a + 6} ${b + 4} L${a - 4} ${b - 6} Z`, fill: '#e6e9ef' }, 0.9); }],
      ['shop', 'red', (q, a, b) => rubyIcon(q, a, b, 8)],
      ['back', 'red', (q, a, b) => el('path', { d: `M${a + 5} ${b - 8} L${a - 5} ${b} L${a + 5} ${b + 8}`, stroke: '#fff4dc', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, q)],
      ['close', 'red', (q, a, b) => icon.close(q, a, b, 1.2)],
      ['left', 'blue', (q, a, b) => el('path', { d: `M${a + 4} ${b - 7} L${a - 4} ${b} L${a + 4} ${b + 7}`, stroke: '#fff4dc', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, q)],
      ['right', 'blue', (q, a, b) => el('path', { d: `M${a - 4} ${b - 7} L${a + 4} ${b} L${a - 4} ${b + 7}`, stroke: '#fff4dc', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, q)],
      ['freeze', 'blue', (q, a, b) => { for (let i = 0; i < 3; i++) { const t = (i / 3) * Math.PI; el('path', { d: `M${a + Math.cos(t) * 9} ${b + Math.sin(t) * 9} L${a - Math.cos(t) * 9} ${b - Math.sin(t) * 9}`, stroke: '#ffffff', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, q); } el('circle', { cx: a, cy: b, r: 2.4, fill: '#cfeaff' }, q); }],
      ['gold', 'gold', (q, a, b) => coinIcon(q, a, b, 8)],
      ['lives', 'red', (q, a, b) => outlined(q, 'path', { d: `M${a} ${b + 8} C${a - 12} ${b - 1} ${a - 9} ${b - 10} ${a} ${b - 4} C${a + 9} ${b - 10} ${a + 12} ${b - 1} ${a} ${b + 8} Z`, fill: '#ff8a7a' }, 1)],
      ['play', 'green', (q, a, b) => icon.play(q, a + 1, b, 1.1)],
      ['ad', 'purple', (q, a, b) => { outlined(q, 'rect', { x: a - 9, y: b - 6, width: 18, height: 12, rx: 2, fill: '#fff4dc' }, 1); el('path', { d: `M${a - 2} ${b - 3} L${a + 3} ${b} L${a - 2} ${b + 3} Z`, fill: '#6a3fc0' }, q); }],
    ]) add('btn:' + name, (s) => roundBtn(s, 0, 0, 22, color, drawIcon), [-26, -26, 52, 54], ui, true);
    add('ui:logo', (s) => logo(s, 0, 0, 1), [-112, -78, 224, 128], ui, true);
    add('ui:chestSmall', (s) => icon.chest(s, 0, 8, 1.4), [-20, -26, 40, 38], ui, true);
    add('ui:trophy', (s) => { el('circle', { cx: 0, cy: 0, r: 12, fill: '#c8921c' }, s); icon.trophy(s, 0, 2, 1); }, [-14, -14, 28, 28], ui, true);
    await Promise.all(jobs);
  }

  // The main menu painting (cover-fit, cropped to the screen) at screen resolution.
  async buildMenu(view) {
    const key = `${view.cssW}x${view.cssH}@${view.dpr}`;
    if (this.menuKey === key) return;
    this.menuKey = key;
    const sc = Math.max(view.cssW / WORLD_W, view.cssH / WORLD_H), w = view.cssW / sc, h = view.cssH / sc;
    const box = [(WORLD_W - w) / 2, (WORLD_H - h) / 2, w, h];
    // the full painting backs the other menu screens; the live main menu is drawn from layers
    const [bg, sky, land, ...heroes] = await Promise.all([
      rasterize((s) => menuScene(s), box, sc * view.dpr, { ui: true }),
      rasterize((s) => menuLayer(s, 'sky'), box, sc * view.dpr, { ui: true }),
      rasterize((s) => menuLayer(s, 'land'), box, sc * view.dpr, { ui: true }),
      ...MENU_HEROES.map((hr) => rasterize((s) => person(s, 0, 0, hr.o()), [-110, -230, 220, 250], sc * view.dpr, { ui: true })),
    ]);
    this.menuBg = bg;
    this.menuLive = { sc, x0: box[0], y0: box[1], sky, land, sun: MENU_SUN, heroes: MENU_HEROES.map((hr, i) => ({ ...hr, sprite: heroes[i] })) };
  }

  // The world map is wide (six regions), so it is painted in chunks the height of the screen.
  async buildMap(view) {
    const key = `${view.cssW}x${view.cssH}@${view.dpr}`;
    if (this.mapKey === key) return;
    this.mapKey = key;
    const ms = view.cssH / WORLD_H, n = 6, cw = MAP_W / n;
    this.map = { scale: ms, width: MAP_W * ms, chunks: await Promise.all(Array.from({ length: n }, (_, i) => rasterize((s) => mapScene(s), [i * cw, 0, cw, WORLD_H], ms * view.dpr, { ui: true }).then((r) => ({ x: i * cw * ms, w: cw * ms, canvas: r.canvas })))) };
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
