// Builds the complete PRD as one self-contained document, docs/prd/Sandstone-Kingdom-PRD.html
// (plus a PDF of it), with pictures of everything in the game rendered from the game's own code:
// every level, character, enemy, tower, building, tree, animal and screen. Tables come from the
// game data, so the document always matches the build.
// Needs the local server (npm run serve). Usage: node tools/prd-doc.mjs [--artifact path]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENEMIES, TOWERS, TOWER_ORDER, HEROES, SPELLS, POWERUPS, ROYAL_TOWERS, SPECIAL_LOADOUT } from '../src/engine/data.js';
import { LEVELS } from '../src/engine/levels.js';
import { makePath } from '../src/engine/path.js';
import * as M from '../src/meta/profile.js';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '..', 'docs', 'prd');
mkdirSync(outDir, { recursive: true });
const artifactPath = process.argv.includes('--artifact') ? process.argv[process.argv.indexOf('--artifact') + 1] : null;

// ---------------------------------------------------------------- 1. capture pictures from the game
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1.5 });
const ALL_SEEN = Object.fromEntries(Object.keys(ENEMIES).map((k) => [k, true]));
await p.addInitScript((seen) => localStorage.setItem('sandstone-kingdom:v2', JSON.stringify({ introSeen: true, diyas: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 2, 5: 1 }, rubies: 860, coins: 2400, owned: { falconer: true, alchemist: true, elephant: true }, seen, daily: { day: 2, lastKey: '2000-01-01' }, workshop: { archer: 2, barracks: 1, royal: 1 } })), ALL_SEEN);
await p.goto('http://localhost:8090/');
await p.waitForFunction(() => window.__sk && window.__sk.screen === 'menu', null, { timeout: 120000 });
await p.evaluate(() => { window.__sk.screens.modal = null; });

const art = await p.evaluate(async () => {
  const { rasterize } = await import('/src/render/raster.js');
  const T = (o) => (s) => person(s, 0, 0, o);
  const L = [];
  const add = (group, id, name, note, draw, ui = false) => L.push({ group, id, name, note, draw, ui });
  // heroes, army and their animation
  for (const [id, name, o, note] of [['sun-knight', 'The Sun Knight', SUN, 'Hero · Sun Strike'], ['spearman', 'Spearmen', SPEAR, 'Barracks tier 1'], ['knight', 'Knights', KNIGHT, 'Barracks tier 2'], ['holy-knight', 'Holy Knights', HOLY, 'Barracks tier 3'], ['archer', 'Archers', ARCHER, 'on the Archer Tower'], ['mage', 'Magic Caster', MAGE, 'on the Mage Tower']]) {
    add('army', id, name, note, T({ ...o, s: 1.6 }));
    for (const [f, fo] of [['walk1', { step: 1 }], ['walk2', { step: -1 }], ['attack1', { swing: 0.55 }], ['attack2', { swing: 1 }]]) add('frames', `${id}-${f}`, name, f, T({ ...o, s: 1.6, ...fo, ...(o.weapon === 'bow' && f.startsWith('attack') ? { swing: 0, loose: f === 'attack2' } : {}) }));
  }
  add('army', 'war-elephant', 'The War Elephant', 'from the War Elephant Stable', (s) => { elephant(s, 0, 0, 1, false, false); person(s, 8, -38, { ...SPEAR, s: 0.8, shield: null }); });
  add('army', 'falcon', 'Royal Falcon', 'from the Royal Falconer', (s) => falcon(s, 0, 0, 2.4, true));
  // enemies of Region 1, with frames
  const R1 = [['bandit', T({ ...BANDIT, s: 1.6 })], ['wolfRider', (s) => wolfRider(s, 0, 0, 1.5)], ['banditArcher', T({ ...BANDIT, weapon: 'bow', quiver: true, s: 1.6 })], ['saboteur', T({ ...SABOTEUR, s: 1.6 })],
    ['barbarian', T({ ...BARBARIAN, s: 1.4 })], ['drummer', T({ ...DRUMMER, s: 1.6 })], ['brute', T({ ...BRUTE, s: 1.4 })], ['shieldBearer', T({ ...SHIELD_BEARER, s: 1.5 })], ['banditKing', (s) => banditKing(s, 0, 0, 1.4)]];
  for (const [id, d] of R1) add('enemy', id, id, '', d);
  for (const [id, o] of [['bandit', BANDIT], ['saboteur', SABOTEUR], ['drummer', DRUMMER], ['shieldBearer', SHIELD_BEARER], ['barbarian', BARBARIAN], ['brute', BRUTE]]) for (const [f, fo] of [['walk1', { step: 1 }], ['walk2', { step: -1 }], ['attack', { swing: 1 }]]) add('eframes', `${id}-${f}`, id, f, T({ ...o, s: 1.5, ...fo }));
  // enemies drawn for the later regions
  const future = [
    ['Thar Desert', [['Scorpion Swarm', (s) => scorpion(s, 0, 0, 1.5)], ['Camel Raider', (s) => camel(s, 0, 0, 1.15)], ['Sand Burrower', (s) => burrower(s, 0, 0, 1.5)], ['Boss: Dune Colossus', (s) => colossus(s, 0, 0, 1.2)]]],
    ['Western Ghats', [['River Raider', (s) => boat(s, 0, 0, 1.2)], ['Mud Brute', T({ ...MUD_BRUTE, s: 1.2 })], ['Storm Bat', (s) => bat(s, 0, -20, 1.5)], ['Boss: Storm Serpent', (s) => serpent(s, 0, 0, 1.05)]]],
    ['Deccan Ruins', [['Stone Golem', (s) => golem(s, 0, 0, 1.15)], ['Night Stalker', T({ ...NIGHT_STALKER, s: 1.4 })], ['Shaman', T({ ...SHAMAN, s: 1.4 })], ['Boss: Stone Titan', (s) => stoneTitan(s, 0, 0, 0.95)]]],
    ['Sundarbans', [['Crocodile', (s) => crocodile(s, 0, 0, 1.15)], ['River Pirate', T({ ...RIVER_PIRATE, s: 1.4 })], ['Swamp Witch', T({ ...SWAMP_WITCH, s: 1.4 })], ['Boss: Crocodile Warlord', (s) => crocodile(s, 0, 0, 1.85, false, { armor: true, crown: true, eyes: '#ff4a2a', color: '#3f5f2e' })]]],
    ['Himalayas', [['Ice Wolf', (s) => iceWolf(s, 0, 0, 1.25)], ['Frost Mage', T({ ...FROST_MAGE, s: 1.4 })], ['Yeti Brute', (s) => yeti(s, 0, 0, 1.2)], ['Final boss: Shadow Emperor', (s) => shadowEmperor(s, 0, 0, 1.25)]]],
  ];
  for (const [reg, list] of future) for (const [n, d] of list) add('future', `${reg}-${n}`, n, reg, d);
  // buildings, build spots
  add('building', 'fort', 'The Fort (Suryagarh gate)', 'what you defend', (s) => fortGate(s, 0, 0, 1));
  add('spot', 'open', 'Standard spot', 'the four basic towers', (s) => plot(s, 0, 0));
  add('spot', 'rubble', 'Rubble spot', 'clear with battle gold', (s) => { plot(s, 0, 0); for (const [x, y, r] of [[-10, -2, 0.42], [8, 0, 0.5], [0, -6, 0.36]]) rock(s, x, y, r); moss(s, [[-14, -4, 3], [14, -2, 2.6]]); });
  add('spot', 'special', 'Special spot (open)', 'special towers only', (s) => specialPlot(s, 0, 0));
  add('spot', 'specialLocked', 'Special spot (locked)', 'opens at its wave, or pay gold', (s) => { specialPlot(s, 0, 0); el('ellipse', { cx: 0, cy: -1, rx: 24, ry: 10, fill: '#2a1a10', opacity: 0.45 }, s); icon.lock(s, 0, -2, 1.1); }, true);
  // scenery: trees, plants, water, buildings, animals
  for (const [id, name, note, d] of [
    ['banyan', 'Banyan tree', 'tree', (s) => banyan(s, 0, 0, 1)], ['palm', 'Palm tree', 'tree', (s) => palm(s, 0, 0, 1)], ['marigold', 'Marigold bush', 'plant', (s) => marigold(s, 0, 0)], ['tuft', 'Grass tufts', 'plant', (s) => { for (let i = 0; i < 7; i++) tuft(s, (i - 3) * 9, (i % 2) * 4); }],
    ['haystack', 'Haystack', 'farm', (s) => haystack(s, 0, 0)], ['rock', 'Boulder', 'rock', (s) => rock(s, 0, 0, 1)], ['pond', 'Lotus pond', 'water', (s) => pond(s, 0, 0)], ['stepwell', 'Stepwell', 'water · building', (s) => stepwell(s, 0, 0)],
    ['shrine', 'Village shrine', 'building', (s) => shrine(s, 0, 0)], ['tents', 'Bandit tents', 'camp', (s) => { tent(s, -18, 0, 1); tent(s, 22, 6, 0.8); }], ['campfire', 'Campfire', 'camp', (s) => campfire(s, 0, 0)], ['cart', 'Bullock cart', 'village', (s) => cart(s, 0, 0)],
    ['pots', 'Clay pots', 'village', (s) => pots(s, 0, 0)], ['fence', 'Wooden fence', 'village', (s) => fence(s, -40, 0, 40, 4)], ['torch', 'Wall torch', 'detail', (s) => torch(s, 0, 0)], ['flag', 'Banner flag', 'detail', (s) => flag(s, 0, 0, 30, 'url(#red)', 18)],
    ['peacock', 'Peacock', 'animal · secret: tap it 10 times', (s) => peacock(s, 0, 0, 1.4)], ['butterflies', 'Butterflies', 'animal', (s) => { butterfly(s, -12, -6, '#ffd25a'); butterfly(s, 10, 4, '#ff9fc0'); butterfly(s, 0, -22, '#9fdcff'); }],
    ['war-boar', 'War boar', 'animal · the Bandit King rides it', (s) => warBoar(s, 0, 0, 1.2)], ['wolf-camel', 'Camel', 'animal · Thar Desert', (s) => camel(s, 0, 0, 1.1, false, false)], ['elephant-enemy', 'Enemy war elephant', 'animal · later regions', (s) => elephant(s, 0, 0, 1)],
  ]) add('scenery', id, name, note, d);
  // UI art
  for (const [id, name, d] of [['logo', 'Logo', (s) => logo(s, 0, 0, 1)], ['chest', 'Royal chest', (s) => royalChest(s, 0, 0, 1)], ['coin', 'Coin', (s) => coinIcon(s, 0, 0, 14)], ['ruby', 'Ruby', (s) => rubyIcon(s, 0, 0, 14)], ['diya', 'Diya (rating)', (s) => icon.diya(s, 0, 4, 12, true)], ['diya-off', 'Diya (unlit)', (s) => icon.diya(s, 0, 4, 12, false)]]) add('ui', id, name, '', d, true);
  const trim = (c) => {
    const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < x0) return c.toDataURL('image/webp', 0.86);
    const pad = 6, o = document.createElement('canvas');
    o.width = x1 - x0 + 1 + pad * 2; o.height = y1 - y0 + 1 + pad * 2;
    o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return o.toDataURL('image/webp', 0.86);
  };
  const out = [];
  for (const it of L) { const r = await rasterize(it.draw, [-130, -190, 260, 230], 2.2, { ui: it.ui }); out.push({ group: it.group, id: it.id, name: it.name, note: it.note, src: trim(r.canvas) }); }
  // towers at every stage, drawn by the game's own tower code at full resolution
  const A = window.__sk.assets;
  const { dressTower, TOWER_ART } = await import('/src/render/assets.js');
  for (const [type, artName, n] of [['archer', 'archerTower', 3], ['barracks', 'barracks', 3], ['mage', 'mageTower', 3], ['cannon', 'cannonTower', 3], ['falconer', 'falconer', 4], ['fountain', 'fountain', 4], ['alchemist', 'alchemist', 4], ['elephant', 'elephantStable', 4]]) {
    for (let st = 0; st < n; st++) { const r = await rasterize((s) => dressTower(s, TOWER_ART[artName], st), [-60, -122, 120, 140], 2.6); out.push({ group: 'tower', id: `${type}-${st}`, name: type, note: String(st), src: trim(r.canvas) }); }
  }
  // UI buttons and icons as one sheet
  const names = Object.keys(A.sprites).filter((k) => k.startsWith('btn:')).sort();
  const sheet = document.createElement('canvas'); const cell = 70, cols = 12; sheet.width = cols * cell; sheet.height = Math.ceil(names.length / cols) * (cell + 16);
  const sx = sheet.getContext('2d'); sx.font = '700 10px Martel, serif'; sx.textAlign = 'center'; sx.fillStyle = '#3a2414';
  names.forEach((n, i) => { const s = A.get(n), [bx, by, bw, bh] = s.box, k = 1.15; const cx = (i % cols) * cell + cell / 2, cy = Math.floor(i / cols) * (cell + 16) + cell / 2; sx.drawImage(s.canvas, cx + bx * k, cy + by * k, bw * k, bh * k); sx.fillText(n.slice(4), cx, cy + 40); });
  out.push({ group: 'uisheet', id: 'buttons', name: 'Buttons and icons', note: '', src: sheet.toDataURL('image/webp', 0.86) });
  return out;
});
console.log('art pieces:', art.length);

// the world map, whole and region by region
await p.evaluate(() => window.__sk.go('map', { mode: 'story' }));
await p.waitForFunction(() => window.__sk.screen === 'map');
const map = await p.evaluate(() => {
  const m = window.__sk.assets.map, H = m.chunks[0].canvas.height, W = m.chunks.reduce((a, c) => a + c.canvas.width, 0);
  const full = document.createElement('canvas'); full.width = W; full.height = H;
  let x = 0; for (const c of m.chunks) { full.getContext('2d').drawImage(c.canvas, x, 0); x += c.canvas.width; }
  const scale = (cv, w) => { const o = document.createElement('canvas'); o.width = w; o.height = Math.round(cv.height * w / cv.width); o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o; };
  const regions = BANDS.map((bnd) => { const k = W / MAP_W, o = document.createElement('canvas'); o.width = Math.round(300 * k); o.height = H; o.getContext('2d').drawImage(full, -Math.round((bnd.x0 - 10) * k), 0); return { name: bnd.name, season: bnd.season, src: scale(o, 900).toDataURL('image/jpeg', 0.82) }; });
  return { full: scale(full, 2600).toDataURL('image/jpeg', 0.8), regions };
});

const shotJpeg = async () => 'data:image/jpeg;base64,' + (await p.screenshot({ type: 'jpeg', quality: 80 })).toString('base64');
// every level: the empty battlefield, then a battle in full swing
const levels = [];
for (const lv of LEVELS) {
  await p.evaluate((id) => window.__sk.app.startBattle({ mode: 'story', level: id, specials: ['falconer', 'alchemist', 'elephant'] }), lv.id);
  await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 120000 });
  await p.evaluate(() => { window.__sk.hideHud = true; window.__sk.hud.banner = null; });
  await p.waitForTimeout(500);
  const empty = await shotJpeg();
  await p.evaluate((seen) => {
    const sk = window.__sk, g = sk.game; Object.assign(g.seen, seen); g.gold = 5000;
    const types = ['archer', 'barracks', 'mage', 'cannon'];
    g.plots.forEach((pl, i) => { if (i % 4 === 3) return; if (pl.lock && pl.lock.cost) g.clearPlot(pl.id); if (!pl.lock) { const ts = g.towersFor(pl.id); if (!ts.length) return; g.build(pl.id, pl.royal ? ts[i % ts.length] : types[i % 4]); for (let k = 0; k < i % 3; k++) g.upgrade(g.towers[g.towers.length - 1].id); } });
    g.callWave(); for (let i = 0; i < 60 * 9; i++) g.update(1 / 60);
    if (g.canCallWave) g.callWave(); for (let i = 0; i < 60 * 5; i++) g.update(1 / 60);
  }, ALL_SEEN);
  await p.waitForTimeout(200);
  await p.evaluate(() => { const h = window.__sk.hud; h.modal = null; h.banner = null; h.menu = null; window.__sk.hideHud = false; });
  await p.waitForTimeout(1600); // let the build and upgrade effects settle
  levels.push({ id: lv.id, empty, battle: await shotJpeg() });
}
console.log('levels:', levels.length);

// every screen
const screens = [];
const SCREENS = [['Main menu (live, animated)', 'menu'], ['Daily reward pop-up', 'menu-daily'], ['World map: story', 'map', { mode: 'story' }], ['World map: challenges', 'map', { mode: 'challenge' }], ['Challenge list', 'challenges'],
  ['Battle briefing: story', 'briefing', { mode: 'story', level: 5 }], ['Battle briefing: challenge', 'briefing', { mode: 'challenge', level: 2, ch: 2 }], ['Battle briefing: endless', 'briefing', { mode: 'endless', level: 5 }],
  ['Royal Treasury (real-money shop)', 'treasury'], ['Royal Bazaar: special towers', 'bazaar', { tab: 'royal' }], ['Royal Bazaar: heroes', 'bazaar', { tab: 'heroes' }], ['Royal Bazaar: power-ups', 'bazaar', { tab: 'power' }], ['Royal Bazaar: free chest', 'bazaar', { tab: 'free' }], ['Heroes', 'heroes'],
  ['Daily reward', 'daily'], ['Daily quests', 'quests'], ['Royal Forge', 'workshop'], ['Achievements', 'achievements'], ['Rankings', 'ranks'], ['Settings', 'settings']];
for (const [title, name, args = {}] of SCREENS) {
  await p.evaluate(async ([n, a]) => {
    const sk = window.__sk;
    if (n === 'workshop') sk.store.profile.forgeJob = { id: 'mage', rank: 1, start: Date.now() - 60000, ends: Date.now() + 2 * 60000 };
    if (a.ch !== undefined) { const M2 = await import('/src/meta/profile.js'); a.challenge = M2.CHALLENGES[a.level][a.ch]; }
    if (a.tab) sk.screens.shopTab = a.tab;
    if (n === 'menu-daily') { await sk.go('menu'); sk.screens.modal = { type: 'daily' }; return; }
    if (n === 'challenges') { await sk.go('map', { mode: 'challenge' }); sk.screens.modal = { type: 'challenges', level: 2 }; return; }
    await sk.go(n, a);
    sk.screens.modal = null;
  }, [name, args]);
  await p.waitForTimeout(700);
  screens.push({ title, src: await shotJpeg() });
}
// battle moments: build menu, a special spot, victory and defeat
const moments = [];
await p.evaluate(() => window.__sk.app.startBattle({ mode: 'story', level: 4, specials: ['falconer', 'alchemist', 'elephant'] }));
await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 120000 });
await p.evaluate(() => { const sk = window.__sk; sk.hud.banner = null; sk.hud.menu = { type: 'build', plotId: sk.game.plots.findIndex((x) => !x.lock && !x.royal) }; });
await p.waitForTimeout(400); moments.push({ title: 'Build menu on a standard spot', src: await shotJpeg() });
await p.evaluate(() => { const sk = window.__sk, g = sk.game; g.gold = 999; const sp = g.plots.find((x) => x.royal); g.clearPlot(sp.id); sk.hud.menu = { type: 'build', plotId: sp.id }; });
await p.waitForTimeout(400); moments.push({ title: 'Special spot: only special towers', src: await shotJpeg() });
await p.evaluate(() => { const sk = window.__sk; sk.hud.menu = null; sk.hud.modal = { type: 'newEnemy', enemy: 'shieldBearer' }; });
await p.waitForTimeout(400); moments.push({ title: 'New enemy card', src: await shotJpeg() });
await p.evaluate(() => { const sk = window.__sk; sk.hud.modal = { type: 'won', diyas: 3, reward: { coins: 120, rubies: 25, achievements: [{ name: 'First Victory' }] } }; });
await p.waitForTimeout(400); moments.push({ title: 'Victory', src: await shotJpeg() });
await p.evaluate(() => { const sk = window.__sk; sk.game.lives = 0; sk.game.state = 'lost'; sk.hud.modal = { type: 'lost', reward: {} }; });
await p.waitForTimeout(400); moments.push({ title: 'Defeat, with the revive offer', src: await shotJpeg() });
await b.close();

// ---------------------------------------------------------------- 2. write the document
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => Math.round(n).toLocaleString('en-IN');
const pick = (g) => art.filter((a) => a.group === g);
const find = (g, id) => art.find((a) => a.group === g && a.id === id);
const fig = (src, cap, cls = '') => `<figure class="${cls}"><img src="${src}" alt="${esc(cap)}" loading="lazy"><figcaption>${cap}</figcaption></figure>`;
const card = (a, title, sub = '') => `<figure class="sprite"><div class="stage"><img src="${a.src}" alt="${esc(title)}" loading="lazy"></div><figcaption><b>${esc(title)}</b>${sub ? `<span>${sub}</span>` : ''}</figcaption></figure>`;
const table = (head, rows, cls = '') => `<div class="tw"><table class="${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const rng = (d) => (Array.isArray(d) ? `${Math.round(d[0])}–${Math.round(d[1])}` : Math.round(d));
const sec = (v) => (typeof v === 'number' ? String(Math.round(v * 100) / 100) : v);
const SPELL = { arrowRain: 'Arrow Rain', reinforcements: 'Reinforcements', holyFire: 'Holy Fire' };

// level road diagrams, drawn from the level data
function diagram(lv) {
  const paths = lv.paths.map((sp) => makePath(sp));
  const roads = paths.map((pa) => `<path d="${pa.svg}" class="road-edge"/><path d="${pa.svg}" class="road"/>`).join('');
  // entrance badge: the first point of the road that is well inside the map
  const ents = paths.map((pa, i) => { let d = 0; while (d < pa.length * 0.4) { const t = pa.at(d); if (t.x > 18 && t.x < 826 && t.y > 18 && t.y < 372) break; d += 4; } const q = pa.at(d); return `<g class="ent"><circle cx="${q.x.toFixed(0)}" cy="${q.y.toFixed(0)}" r="13"/><text x="${q.x.toFixed(0)}" y="${(q.y + 5).toFixed(0)}">${i + 1}</text></g>`; }).join('');
  const portals = lv.paths.flatMap((sp, i) => (sp.portals || []).map((pt) => { const a = paths[i].at(pt.from * paths[i].length), c = paths[i].at(pt.to * paths[i].length); return `<g class="portal"><ellipse cx="${a.x.toFixed(0)}" cy="${a.y.toFixed(0)}" rx="16" ry="10"/><ellipse cx="${c.x.toFixed(0)}" cy="${c.y.toFixed(0)}" rx="16" ry="10"/><path d="M${a.x.toFixed(0)} ${a.y.toFixed(0)} Q${((a.x + c.x) / 2).toFixed(0)} ${(Math.min(a.y, c.y) - 60).toFixed(0)} ${c.x.toFixed(0)} ${c.y.toFixed(0)}" class="jump"/></g>`; })).join('');
  const plots = lv.plots.map((pl, i) => `<g class="plot ${pl.royal ? 'special' : pl.lock ? 'rubble' : 'std'}"><circle cx="${pl.x}" cy="${pl.y}" r="11"/><text x="${pl.x}" y="${pl.y + 4}">${pl.royal ? '★' : pl.lock ? pl.lock.cost : i + 1}</text></g>`).join('');
  return `<svg viewBox="0 0 844 390" class="diagram" role="img" aria-label="Road layout of ${esc(lv.name)}"><rect width="844" height="390" class="field"/>${roads}${portals}${plots}${ents}<g class="gate"><rect x="${lv.gate.x - 22}" y="${lv.gate.y - 36}" width="44" height="36" rx="4"/><text x="${lv.gate.x}" y="${lv.gate.y - 13}">FORT</text></g></svg>`;
}

const enemyName = (id) => ENEMIES[id].name;
const fonts = Object.fromEntries([['rozha', 'RozhaOne-400.woff2'], ['m7', 'Martel-700.woff2'], ['m9', 'Martel-900.woff2']].map(([k, f]) => [k, readFileSync(join(root, 'fonts', f)).toString('base64')]));
const today = new Date().toISOString().slice(0, 10);

const css = `
@font-face{font-family:'Rozha One';src:url(data:font/woff2;base64,${fonts.rozha}) format('woff2');font-display:swap}
@font-face{font-family:'Martel';font-weight:700;src:url(data:font/woff2;base64,${fonts.m7}) format('woff2');font-display:swap}
@font-face{font-family:'Martel';font-weight:900;src:url(data:font/woff2;base64,${fonts.m9}) format('woff2');font-display:swap}
/* Layout: one long reading column with full-width plates for art; a sticky contents rail on wide screens. */
:root{--paper:#fbf3e2;--card:#fffaf0;--ink:#2e1d10;--muted:#6f5338;--red:#a8230c;--gold:#c98a12;--line:#e6cfa2;--road:#e8c79a;--field:#a9c862;
--display:'Rozha One',Georgia,serif;--body:'Martel',Georgia,serif;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#1c130c;--card:#2a1d13;--ink:#f6e8cf;--muted:#cfb38a;--red:#ff8a62;--gold:#f2c04a;--line:#5a3e26;--road:#8a6a46;--field:#3f5a2a;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#1c130c;--card:#2a1d13;--ink:#f6e8cf;--muted:#cfb38a;--red:#ff8a62;--gold:#f2c04a;--line:#5a3e26;--road:#8a6a46;--field:#3f5a2a;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:700 16px/1.65 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.wrap{max-width:1080px;margin:0 auto;padding-block:24px 64px}
h1,h2,h3,h4{font-family:var(--display);font-weight:400;color:var(--red);line-height:1.15;text-wrap:balance;margin:1.6em 0 .4em}
h1{font-size:clamp(34px,6vw,58px);margin-top:.2em}h2{font-size:clamp(26px,4vw,36px);padding-top:.4em;border-top:3px double var(--line)}h3{font-size:24px}h4{font-size:19px;margin-top:1.2em}
p,li{max-width:72ch}a{color:var(--red)}
.cover{display:grid;gap:18px;padding-block:8px 20px}
.cover img{width:100%;max-width:100%;border-radius:14px;border:3px solid var(--gold)}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 20px;font-size:14px;color:var(--muted)}
.meta b{display:block;color:var(--ink);font-weight:900}.meta div{min-width:0;overflow-wrap:anywhere}
.eyebrow{font:900 12px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
nav.toc ol{columns:2 260px;padding-left:1.2em;margin:0}nav.toc li{margin:2px 0}
figure{margin:12px 0}figure img{display:block;max-width:100%;height:auto;border-radius:10px}
figcaption{font-size:13px;color:var(--muted);margin-top:4px}
.shot img{border:2px solid var(--line)}
.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:12px 0}
.grid.wide{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.sprite{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;min-width:0;break-inside:avoid}
.sprite .stage{height:150px;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(ellipse at 50% 85%,rgba(140,180,80,.35),transparent 70%)}
.grid.wide .sprite .stage{height:190px}
.grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}@media (max-width:620px){.grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sprite img{max-height:100%;max-width:100%;width:auto;border-radius:0}
.sprite figcaption{margin:0;text-align:center;line-height:1.35}.sprite figcaption b{display:block;color:var(--ink);font-size:14px}.sprite figcaption span{font-size:12px}
.tw{overflow-x:auto;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}
th{font:900 12px/1.3 var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:left;border-bottom:2px solid var(--gold);padding:6px 8px}
td{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.facts span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:2px 12px;font-size:13px}
.story{font-size:18px;border-left:4px solid var(--gold);padding-left:14px;margin:10px 0}
.diagram{width:100%;max-width:100%;height:auto;border-radius:10px;border:2px solid var(--line)}
.diagram .field{fill:var(--field)}.diagram .road-edge{fill:none;stroke:#7a5a32;stroke-width:30;stroke-linecap:round;stroke-linejoin:round;opacity:.5}
.diagram .road{fill:none;stroke:var(--road);stroke-width:24;stroke-linecap:round;stroke-linejoin:round}
.diagram .plot circle{stroke:#2e1d10;stroke-width:2}.diagram .std circle{fill:#fff7e6}.diagram .rubble circle{fill:#b5814a}.diagram .special circle{fill:#ffd25a}
.diagram text{font:900 11px var(--body);text-anchor:middle;fill:#2e1d10}
.diagram .ent circle{fill:#a8230c;stroke:#fff;stroke-width:2}.diagram .ent text{fill:#fff;font-size:14px}
.diagram .portal ellipse{fill:rgba(140,80,220,.55);stroke:#5a2fa8;stroke-width:2}.diagram .portal .jump{fill:none;stroke:#7a4fd0;stroke-width:3;stroke-dasharray:6 5}
.diagram .gate rect{fill:#e8b47a;stroke:#2e1d10;stroke-width:2}.diagram .gate text{font-size:10px}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:var(--muted)}.legend i{display:inline-block;width:12px;height:12px;border-radius:50%;border:1.5px solid #2e1d10;vertical-align:-1px;margin-right:4px}
.note{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.level{break-before:page}
h2,h3,h4{break-after:avoid}.keep{break-inside:avoid}
@media print{.pair.big{grid-template-columns:1fr}body{background:#fff;padding:0;font-size:11pt}.wrap{max-width:none;padding:0}h2{border-top:none}h2.major{break-before:page}figure,.sprite,table,.diagram{break-inside:avoid}nav.toc{break-after:page}a{color:inherit;text-decoration:none}.cover{break-after:page}}
@page{size:A4;margin:14mm 12mm}
`;

const lvlSections = LEVELS.map((lv) => {
  const L = levels.find((x) => x.id === lv.id);
  const seenBefore = new Set(LEVELS.filter((x) => x.id < lv.id).flatMap((x) => x.waves.flat().map((gr) => gr.type)));
  const types = [...new Set(lv.waves.flat().map((gr) => gr.type))];
  const fresh = types.filter((t) => !seenBefore.has(t));
  const spots = { std: lv.plots.filter((x) => !x.lock && !x.royal).length, rubble: lv.plots.filter((x) => x.lock && !x.royal).length, special: lv.plots.filter((x) => x.royal).length };
  const layout = lv.paths.length === 1 ? 'one road' : `${lv.paths.length} entrances`;
  const portals = lv.paths.reduce((n, sp) => n + (sp.portals || []).length, 0);
  return `<section class="level" id="level-${lv.id}">
<p class="eyebrow">${lv.id === 0 ? 'Tutorial' : `Level ${lv.id}`}${lv.boss ? ' · Boss' : ''} · Aravalli Hills · Spring</p>
<h3>${esc(lv.name)}</h3>
<p class="story">${esc(lv.story)}</p>
<div class="facts"><span>Start gold ${lv.gold}</span><span>Lives ${lv.lives ?? 20}</span><span>Enemy health ×${(lv.hpScale ?? 1).toFixed(2)}</span><span>${lv.waves.length} waves</span><span>${layout}${portals ? ` · ${portals} portal` : ''}</span><span>Spells: ${(lv.spells ?? []).map((x) => SPELL[x]).join(', ') || 'none'}</span><span>Hero: ${lv.hero === false ? 'none' : 'Sun Knight'}</span></div>
<div class="pair big">${fig(L.empty, 'The battlefield, empty', 'shot')}${fig(L.battle, 'Mid-battle, with towers at different tiers', 'shot')}</div>
<h4>Road layout and build spots</h4>
${diagram(lv)}
<div class="legend"><span><i style="background:#a8230c"></i>entrance (numbered)</span><span><i style="background:#fff7e6"></i>standard spot (${spots.std})</span><span><i style="background:#b5814a"></i>rubble, gold to clear (${spots.rubble})</span><span><i style="background:#ffd25a"></i>special spot (${spots.special})</span>${portals ? '<span><i style="background:#9a6ae0"></i>portal: in, then out further down</span>' : ''}</div>
${fresh.length ? `<div class="keep"><h4>New enemies here</h4><div class="grid">${fresh.map((t) => card(find('enemy', t), ENEMIES[t].name, esc(ENEMIES[t].tip))).join('')}</div></div>` : ''}
<h4>Waves</h4>
${table(['Wave', 'Enemies'], lv.waves.map((w, i) => [i + 1, w.map((gr) => `${gr.count} × ${enemyName(gr.type)}${lv.paths.length > 1 ? ` <small>(entrance ${(gr.lane || 0) + 1})</small>` : ''}`).join(', ')]))}
${lv.plots.some((x) => x.royal) ? `<p>Special spots open at wave ${lv.plots.filter((x) => x.royal).map((x) => `${x.lock.wave} (or ${x.lock.cost} gold earlier)`).join(', ')}.</p>` : ''}
${lv.tutorial ? `<h4>Tutorial steps</h4><ol>${lv.tutorial.map((t) => `<li>${esc(t.text)}</li>`).join('')}</ol>` : ''}
${M.CHALLENGES[lv.id] ? `<h4>Challenges (unlock after completing the level, rubies only, each pays once)</h4>${table(['Challenge', 'Rule', 'Rubies'], M.CHALLENGES[lv.id].map((c) => [`<b>${esc(c.name)}</b>`, esc(c.desc), c.rubies]))}` : ''}
</section>`;
}).join('\n');

const towerRows = (type) => TOWERS[type].tiers.map((t, i) => [i + 1, esc(t.label), t.cost, t.range ?? '–', t.dmg !== undefined ? rng(t.dmg) : t.soldiers ? `${t.soldiers} soldiers · ${t.hp} hp` : '–', sec(t.rate ?? '–'), [t.splash ? `splash ${Math.round(t.splash)}` : '', t.armor ? `armour ${Math.round(t.armor * 100)}%` : '', t.mark ? `mark ×${t.mark.mul.toFixed(2)}` : '', t.slow ? `slow ${Math.round(t.slow * 100)}%, heal ${t.heal}/s` : '', t.shred ? `armour −${Math.round(t.shred * 100)}%, poison ${t.poison}/s` : '', t.knock ? `knockback ${t.knock}, stun ${t.stun.toFixed(2)}s` : ''].filter(Boolean).join(' · ') || '–']);
const towerHead = ['Tier', 'Name', 'Cost', 'Range', 'Damage', 'Every (s)', 'Special'];
const TOWER_IMG = { archer: 'archer', barracks: 'barracks', mage: 'mage', cannon: 'cannon', falconer: 'falconer', fountain: 'fountain', alchemist: 'alchemist', elephant: 'elephant' };

const body = `<div class="wrap">
<header class="cover">
<p class="eyebrow">Product requirements document · Samvardhan Studios</p>
<h1>Sandstone Kingdom: Tower Defense</h1>
${fig(screens[0].src, 'The live main menu: the fort at sunrise')}
<div class="meta"><div><b>Platform</b>Android, Google Play, worldwide</div><div><b>Package</b>com.samvardhanstudios.sandstonekingdom</div><div><b>Version</b>1.0 · Region 1, Aravalli Hills</div><div><b>Document date</b>${today}</div><div><b>Status</b>Playable; Android APK and AAB built by CI</div><div><b>Pictures</b>Every image is rendered from the game's own code</div></div>
</header>
<nav class="toc" aria-label="Contents"><h2 style="border:none;margin-top:0">Contents</h2><ol>
<li><a href="#summary">Summary and goals</a></li><li><a href="#modes">Game modes</a></li><li><a href="#gameplay">Core gameplay</a></li><li><a href="#world">The world: six regions</a></li>
<li><a href="#levels">Every level</a></li><li><a href="#characters">Heroes and army</a></li><li><a href="#enemies">Enemies</a></li><li><a href="#buildings">Towers and buildings</a></li>
<li><a href="#environment">Environment: trees, water, buildings, animals</a></li><li><a href="#screens">Every screen</a></li><li><a href="#economy">Economy, shop and ads</a></li>
<li><a href="#meta">Daily reward, quests, Forge, achievements</a></li><li><a href="#audio">Audio and feel</a></li><li><a href="#tech">Devices, tech and privacy</a></li><li><a href="#roadmap">Roadmap and risks</a></li></ol></nav>

<h2 id="summary">1. Summary and goals</h2>
<p>A cartoon tower defense game set in medieval India. Players build Archer Towers, Barracks, Mage Towers and Cannons along winding roads, lead the Sun Knight and cast spells to stop bandits, barbarians and bosses. The story is a journey through six regions and seasons of India. Version 1.0 ships Region 1: a tutorial and 5 levels (the 5th a boss), three game modes and the full meta game. Regions 2 to 6 come as free updates; their enemy art is already drawn.</p>
${table(['Goal', 'Measure (first 90 days)'], [['Players enjoy it and come back', 'Day-1 retention ≥ 35%, day-7 ≥ 12%, Play rating ≥ 4.3'], ['Fair, healthy money', 'ARPDAU ≥ $0.03, ≥ 1.5% of players buy something, ≤ 1 interstitial per 3 minutes'], ['Stable on every phone', 'Crash-free users ≥ 99.5%, Android 7 (API 24) and up']])}
<p><b>Players:</b> casual and mid-core mobile players aged 13 to 35, India first, then worldwide. Sessions of 3 to 6 minutes. The tone is easy to read and a little cheeky, with short story lines Gen Z gets at once.</p>

<h2 id="modes">2. Game modes</h2>
${table(['Mode', 'Unlocks', 'What it is', 'Rewards'], [['<b>Story</b>', 'From the start (tutorial on first launch)', 'Levels in order on the world map; 1 to 3 diyas per level', 'Coins; diyas unlock Forge ranks'], ['<b>Challenges</b>', 'Each level\'s 3 challenges unlock when you complete that level', 'The same map with a rule: one tower type, no spells, no hero, few lives', '<b>Rubies only</b>, once each'], ['<b>Endless</b>', 'Beat the region boss', 'Waves never stop and grow harder; a boss returns every 10th wave', 'Coins per wave; leaderboards']])}

<h2 id="gameplay">3. Core gameplay</h2>
<div class="pair big">${moments.map((m) => fig(m.src, m.title, 'shot')).join('')}</div>
<ul>
<li><b>Roads grow more complex:</b> one winding road early on (a hairpin, then a road that crosses itself), then a crossroads with two entrances, an X crossing, and finally three entrances with a bandit portal.</li>
<li><b>Entrance markers</b> show where the next wave comes from and who is coming; tap one to call the wave early for bonus gold.</li>
<li><b>Three kinds of build spot:</b> standard; rubble cleared with battle gold; and special spots that open one by one during the battle (or earlier for gold) and take only special towers. Levels have 1 to 3 special spots (a design rule, not shown to players).</li>
<li><b>Towers</b> have three tiers that look clearly different; <b>special towers</b> have 8 levels and up to ${SPECIAL_LOADOUT} are taken into each battle.</li>
<li><b>Hero:</b> the Sun Knight (${HEROES.sunKnight.hp} hp). Tap him, then tap the road to move him. <b>Sun Strike</b>: ${HEROES.sunKnight.skill.dmg} magic damage and a ${HEROES.sunKnight.skill.stun}s stun around him, every ${HEROES.sunKnight.skill.cooldown}s.</li>
</ul>
<h4>Spells</h4>
${table(['Spell', 'Cooldown', 'Effect'], Object.entries(SPELLS).map(([k, s]) => [`<b>${s.name}</b>`, `${s.cooldown}s`, k === 'arrowRain' ? `${s.ticks} volleys of ${s.dmg} damage in a ${s.radius} radius` : k === 'holyFire' ? `${s.dmg} magic damage, burn ${s.burn}/s for ${s.burnTime}s, stun ${s.stun}s` : `${s.count} soldiers for ${s.life}s`]))}
<h4>Power-ups (one of each per level)</h4>
${table(['Power-up', 'Effect', 'Price'], Object.values(POWERUPS).map((x) => [`<b>${x.name}</b>`, x.desc, `${x.coins} coins or ${x.rubies} rubies`]))}

<h2 class="major" id="world">4. The world: six regions, six seasons</h2>
<p>The world map is a side-scrolling journey from the capital, Suryagarh, through six regions of India, each in its own season. Every 5th level is a boss.</p>
${fig(map.full, 'The whole world map (drag to scroll in the game)', 'shot')}
<div class="pair">${map.regions.map((r) => fig(r.src, `<b>${r.name}</b> · ${r.season}`, 'shot')).join('')}</div>

<h2 class="major" id="levels">5. Every level</h2>
<p>Each level below shows the empty battlefield, a battle in full swing, the road layout with every build spot, the new enemies, the waves and the challenges. All numbers come from the game data.</p>
${table(['#', 'Level', 'Gold', 'Lives', 'Enemy HP', 'Waves', 'Spots (std / rubble / special)', 'Entrances'], LEVELS.map((lv) => [lv.id, esc(lv.name), lv.gold, lv.lives ?? 20, `×${(lv.hpScale ?? 1).toFixed(2)}`, lv.waves.length, `${lv.plots.filter((x) => !x.lock && !x.royal).length} / ${lv.plots.filter((x) => x.lock && !x.royal).length} / ${lv.plots.filter((x) => x.royal).length}`, lv.paths.length]))}
${lvlSections}

<h2 class="major" id="characters">6. Heroes and army</h2>
<div class="grid">${pick('army').map((a) => card(a, a.name, a.note)).join('')}</div>
<h4>Animation frames</h4>
<p>Every soldier and hero has five frames: idle, two walking steps and two attack poses (archers draw and loose).</p>
${['sun-knight', 'spearman', 'knight', 'holy-knight', 'archer', 'mage'].map((id) => { const base = find('army', id); return `<div class="grid">${[card(base, base.name, 'idle'), ...['walk1', 'walk2', 'attack1', 'attack2'].map((f) => card(find('frames', `${id}-${f}`), base.name, f.replace('walk', 'walk ').replace('attack', 'attack ')))].join('')}</div>`; }).join('')}

<h2 class="major" id="enemies">7. Enemies</h2>
<h3>Region 1: Aravalli Hills (8 enemies and a boss)</h3>
<div class="grid wide">${['bandit', 'wolfRider', 'banditArcher', 'saboteur', 'barbarian', 'drummer', 'brute', 'shieldBearer', 'banditKing'].map((id) => card(find('enemy', id), ENEMIES[id].name, esc(ENEMIES[id].tip))).join('')}</div>
${table(['Enemy', 'HP', 'Speed', 'Armour', 'Magic res.', 'Gold', 'Lives taken', 'Ability'], Object.entries(ENEMIES).map(([id, e]) => [`<b>${e.name}</b>`, e.hp, e.speed, `${Math.round(e.armor * 100)}%`, `${Math.round(e.mres * 100)}%`, e.gold, e.lives, [e.ranged ? `shoots soldiers (range ${e.ranged.range})` : '', e.aura ? `war drum: +${Math.round(e.aura.speed * 100)}% speed and damage to allies within ${e.aura.range}` : '', e.shield ? `shields ${e.shield.count} strongest allies (${e.shield.amount} hp) every ${e.shield.every}s` : '', e.sabotage ? `jams towers for ${e.sabotage.time}s; ${Math.round(e.dodge * 100)}% slip past soldiers` : '', e.summon ? `calls ${e.summon.count} bandits every ${e.summon.every}s` : '', e.boss ? 'boss' : ''].filter(Boolean).join(' · ') || '–']))}
<h4>Enemy animation frames</h4>
${['bandit', 'saboteur', 'drummer', 'shieldBearer', 'barbarian', 'brute'].map((id) => `<div class="grid">${[card(find('enemy', id), ENEMIES[id].name, 'idle'), ...['walk1', 'walk2', 'attack'].map((f) => card(find('eframes', `${id}-${f}`), ENEMIES[id].name, f.replace('walk', 'walk ')))].join('')}</div>`).join('')}
<h3>Ready for the next regions (free updates)</h3>
${['Thar Desert', 'Western Ghats', 'Deccan Ruins', 'Sundarbans', 'Himalayas'].map((reg) => `<div class="keep"><h4>${reg}</h4><div class="grid">${pick('future').filter((a) => a.note === reg).map((a) => card(a, a.name)).join('')}</div></div>`).join('')}

<h2 class="major" id="buildings">8. Towers and buildings</h2>
<p>Each tower tier looks clearly different: a small outpost behind a wooden palisade, a taller stone tower with gold studs and pennants, then a grand tower on a marble plinth with domed pavilions, banners and a crest. Building plays a rise-from-the-ground effect; upgrading plays a pillar of golden light and "UPGRADED!".</p>
${TOWER_ORDER.map((type) => `<h3>${TOWERS[type].name}</h3><div class="grid wide">${[0, 1, 2].map((st) => card(find('tower', `${TOWER_IMG[type]}-${st}`), TOWERS[type].tiers[st].label, `tier ${st + 1} · ${TOWERS[type].tiers[st].cost} gold`)).join('')}</div>${table(towerHead, towerRows(type))}`).join('')}
<h3>Special towers</h3>
<p>Up to ${SPECIAL_LOADOUT} per battle, built only on special spots, 8 levels each. Their look changes every two levels and gold pips under the tower show the level. The Royal Falconer is a free story reward after Level 2; the others unlock with rubies or a large pile of coins.</p>
${Object.keys(ROYAL_TOWERS).map((type) => `<h4>${TOWERS[type].name} · ${ROYAL_TOWERS[type].rubies} rubies or ${fmt(ROYAL_TOWERS[type].coins)} coins</h4><p>${esc(TOWERS[type].tip)}</p><div class="grid four">${[0, 1, 2, 3].map((st) => card(find('tower', `${TOWER_IMG[type]}-${st}`), `Levels ${st * 2 + 1}–${st * 2 + 2}`)).join('')}</div>${table(towerHead.map((h) => (h === 'Tier' ? 'Level' : h)), towerRows(type))}`).join('')}
<h3>The fort and the build spots</h3>
<div class="grid wide">${card(find('building', 'fort'), 'The Fort', 'what you defend; enemies that reach it take lives')}${pick('spot').map((a) => card(a, a.name, a.note)).join('')}</div>

<h2 class="major" id="environment">9. Environment: trees, water, buildings and animals</h2>
<p>Scenery is placed per level and kept clear of roads and build spots. Grass, flowers and shadows are scattered in code, so every battlefield looks hand-made. In battle, cloud shadows drift over the map, birds cross the sky, butterflies flutter and spring petals fall.</p>
<h4>Trees and plants</h4><div class="grid">${['banyan', 'palm', 'marigold', 'tuft', 'haystack', 'rock'].map((id) => { const a = find('scenery', id); return card(a, a.name, a.note); }).join('')}</div>
<h4>Water and buildings</h4><div class="grid">${['pond', 'stepwell', 'shrine', 'tents', 'campfire', 'cart', 'pots', 'fence', 'torch', 'flag'].map((id) => { const a = find('scenery', id); return card(a, a.name, a.note); }).join('')}</div>
<h4>Animals</h4><div class="grid">${['peacock', 'butterflies', 'war-boar', 'wolf-camel', 'elephant-enemy'].map((id) => { const a = find('scenery', id); return card(a, a.name, a.note); }).concat([card(find('army', 'falcon'), 'Royal falcon', 'hunts for the Falconer'), card(find('enemy', 'wolfRider'), 'War wolf', 'ridden by Wolf Riders'), card(find('army', 'war-elephant'), 'War elephant', 'charges for the Stable')]).join('')}</div>
<h4>Where each level uses them</h4>
${table(['Level', 'Scenery'], LEVELS.map((lv) => [esc(lv.name), [...new Set((lv.scenery || []).map((x) => x[0]).filter((x) => x !== 'tuftField'))].join(', ')]))}

<h2 class="major" id="screens">10. Every screen</h2>
<p>Every screen fits all phones and tablets without stretching. The HUD and menus are anchored to the screen edges and notch-safe areas, and every tap area is at least 44 px.</p>
<div class="pair big">${screens.map((x) => fig(x.src, x.title, 'shot')).join('')}</div>
<h4>UI art</h4>
<div class="grid">${pick('ui').map((a) => card(a, a.name)).join('')}</div>
${fig(find('uisheet', 'buttons').src, 'Every round button and icon used in the game')}

<h2 class="major" id="economy">11. Economy, shop and ads</h2>
${table(['Currency', 'Earned by', 'Spent on'], [['Battle gold (per level)', 'Kills, calling waves early', 'Towers, upgrades, clearing rubble, opening special spots early'], ['Coins', 'Story wins (first win full; replays 40%), daily login, endless', 'Power-ups, Royal Forge, special towers (high cost)'], ['Rubies (premium)', '<b>Challenges and daily quests (rubies only)</b>, achievements, daily login, ad chest, purchases', 'Special towers, power-ups, finishing Forge jobs early'], ['Diyas', 'Level ratings (3 = no lives lost, 2 = 5 or fewer lost)', 'Unlock Forge ranks']])}
<h4>Shop products (Google Play Billing)</h4>
${table(['Product ID', 'Name', 'Type', 'India', 'USA', 'Contents'], M.PRODUCTS.map((x) => [`<code>${x.id}</code>`, `<b>${x.name}</b>`, x.type === 'once' ? 'one-time' : 'consumable', `₹${x.inr}`, `$${x.usd}`, x.grant.removeAds ? 'No interstitials or banner' : [x.grant.rubies ? `${fmt(x.grant.rubies)} rubies` : '', x.grant.coins ? `${x.grant.coins} coins` : '', x.grant.powerups ? 'one of each power-up' : ''].filter(Boolean).join(' + ')]))}
<h4>Ads (AdMob), with player-friendly rules in code</h4>
<ul><li><b>Rewarded, always optional:</b> double a win's coins, revive once (+5 lives), try a special tower for one battle, −15 minutes on a Forge job, the free ruby chest (${M.AD_CHEST_RUBIES} rubies, 3 a day). At most ${M.REWARDED_PER_DAY} a day.</li><li><b>Interstitial:</b> only between levels, never before level 4, never after a loss, at most every ${M.INTERSTITIAL_GAP / 60000} minutes, never with Remove Ads.</li><li><b>Banner:</b> small, top centre, only on the world map after 3 wins.</li><li><b>Consent:</b> Google's UMP form where the law needs it; ads limited to Teen content.</li></ul>

<h2 id="meta">12. Daily reward, quests, Royal Forge, achievements</h2>
<h4>Daily reward (pops up on the main menu once a day until claimed)</h4>
${table(['Day', 'Reward'], M.DAILY_REWARDS.map((r, i) => [i + 1, [r.coins ? `${r.coins} coins` : '', r.rubies ? `${r.rubies} rubies` : '', r.powerups ? Object.keys(r.powerups).map((k) => POWERUPS[k].name).join(', ') : '', r.chest ? '<b>royal chest</b>' : ''].filter(Boolean).join(' + ')]))}
<p>Signed-in players get +${Math.round((M.SIGNED_IN_BONUS - 1) * 100)}%. Missing a day restarts the calendar; moving the phone clock back gives nothing.</p>
<h4>Daily quests (3 a day, rubies only, +${M.QUEST_BONUS} bonus for all three)</h4>
<p>Examples: Defeat 60 Bandits · Defeat 150 enemies · Win 2 levels · Earn 3 diyas on a level · Win using only Archer Towers · Cast 8 spells · Call 5 waves early · Upgrade 2 towers to the top tier · Build 15 towers.</p>
<h4>Royal Forge: upgrades that take real time</h4>
${table(['Track', 'Bonus per rank'], M.FORGE.map((t) => [`<b>${t.name}</b>`, t.desc]))}
${table(['Rank', 'Coins', 'Time', 'Needs diyas'], M.FORGE_RANKS.map((r, i) => [i + 1, fmt(r.coins), r.time >= 3600000 ? `${r.time / 3600000} h` : `${r.time / 60000} min`, r.diyas]))}
<p>One job at a time. Finish early with rubies (1 per 4 minutes left) or watch an ad for −15 minutes. Later levels are tuned around these upgrades.</p>
<h4>Achievements (${M.ACHIEVEMENTS.length}, each pays rubies; mirrored to Google Play Games)</h4>
${table(['Achievement', 'How', 'Rubies'], M.ACHIEVEMENTS.map((a) => [`<b>${esc(a.name)}</b>${a.secret ? ' (secret)' : ''}`, esc(a.desc), a.rubies]))}

<h2 id="audio">13. Audio and feel</h2>
<p>All music and sound are synthesised in code, so there is nothing to license. The music uses raga Bhupali with a tanpura drone, a bansuri-like flute and tabla, and it follows the battle: calm before the first wave, faster while fighting, a war-horn drone and pounding dhol when the fort is in danger or on the final wave, a shehnai-like lead for the boss, and a heartbeat at low lives. Birdsong and wind fill the hills; each wave starts with a war horn and battle cries. Every tower and event has its own sound.</p>
<p>Feel: walk and attack animation for every unit, hit flashes, enemies falling, cannon recoil, archers loosing, a golden pillar on upgrades, shields, war-drum rings, poison, portals, slow motion for the boss entrance and the final kill, and a red pulse when the fort is in danger.</p>

<h2 id="tech">14. Devices, tech and privacy</h2>
<ul><li>Plain JavaScript on an HTML canvas, wrapped with Capacitor 8 for Android (Android 7 and up). AdMob, Google Play Billing and a native Google Play Games plugin (sign-in, achievements, leaderboards, cloud save, review).</li>
<li>The battlefield (844 × 390) scales without stretching; wider screens see more scenery. The HUD scales 0.74–1.25 and is pinned to the safe area.</li>
<li>Every build runs the rule tests and a bot that must win every level and challenge, then checks every screen on 7 phone and tablet shapes, then builds the APK and AAB.</li>
<li>Privacy policy, terms, age rating, <code>ads.txt</code> and <code>app-ads.txt</code> live on the website branch; in-game Delete my data, Ad privacy choices and Restore purchases.</li></ul>

<h2 id="roadmap">15. Roadmap and risks</h2>
${table(['Version', 'Contents'], [['1.0', 'Region 1 (tutorial + 5 levels, 8 enemy types and a boss), Story, 15 Challenges, Endless, 4 special towers (8 levels), Royal Forge, full meta game, ads, purchases, Play Games'], ['1.1', 'Region 2: Thar Desert, sandstorms, the Dune Colossus'], ['1.2', 'Region 3: Western Ghats, monsoon and river paths, the Storm Serpent'], ['1.3–1.5', 'Regions 4 to 6 and the Shadow Emperor finale; more heroes; boss cutscenes; translations (Hindi first)']])}
${table(['Risk', 'Mitigation'], [['Too hard or too easy', 'The bot plays every level and challenge on every build; tuning by data later'], ['Ad revenue below plan', 'Rewarded ads first; add mediation after launch'], ['Store policy rejection', 'No loot boxes, clear ad rules, complete data-safety answers'], ['Low-end phones stutter', 'Art pre-rendered once to bitmaps; battery saver (30 fps)']])}
<p class="note">This document is generated by <code>node game/tools/prd-doc.mjs</code> from the game itself, so every picture and number matches the current build.</p>
</div>`;

const standalone = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Sandstone Kingdom PRD</title><style>${css}</style></head><body>${body}</body></html>\n`;
const htmlPath = join(outDir, 'Sandstone-Kingdom-PRD.html');
writeFileSync(htmlPath, standalone);
if (artifactPath) writeFileSync(artifactPath, `<title>Sandstone Kingdom PRD</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>${css}</style>\n${body}\n`);
console.log('html:', (standalone.length / 1e6).toFixed(1), 'MB');

// ---------------------------------------------------------------- 3. the PDF
const b2 = await pw.chromium.launch();
const pp = await b2.newPage();
await pp.emulateMedia({ media: 'print', colorScheme: 'light' });
await pp.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 180000 });
await pp.evaluate(async () => { document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))); await document.fonts.ready; });
await pp.pdf({ path: join(outDir, 'Sandstone-Kingdom-PRD.pdf'), format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' }, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#6f5338">Sandstone Kingdom PRD · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>' });
await b2.close();
console.log('pdf written');
