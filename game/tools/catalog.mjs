// Renders the PRD art catalog: every character, enemy, tower tier, build spot, scenery piece,
// each level's battlefield and every screen, straight from the game's code.
// Needs the local server (npm run serve). Usage: node tools/catalog.mjs [outDir]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, '..', 'docs', 'prd', 'img');
mkdirSync(out, { recursive: true });
const save = (name, dataUrl) => writeFileSync(join(out, name + '.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));

const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
await p.addInitScript(() => localStorage.setItem('sandstone-kingdom:v2', JSON.stringify({ introSeen: true, diyas: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 2, 5: 1 }, rubies: 860, coins: 2400, owned: { falconer: true }, seen: { bandit: true, wolfRider: true, barbarian: true, banditArcher: true, brute: true, banditKing: true } })));
await p.goto('http://localhost:8090/');
await p.waitForFunction(() => window.__sk && window.__sk.screen === 'menu', null, { timeout: 120000 });

// ---- single pieces of art, each trimmed to its own image
const pieces = await p.evaluate(async () => {
  const { rasterize } = await import('/src/render/raster.js');
  const T = (o) => (s) => person(s, 0, 0, o);
  const tier = (s, t) => {
    if (t >= 1) for (const x of [-16, 16]) outlined(s, 'path', { d: `M${x - 3} -2 l3 -6 l3 6 Z`, fill: 'url(#gold)' }, 0.7);
    if (t >= 2) { const halo = el('ellipse', { cx: 0, cy: -2, rx: 34, ry: 12, fill: 'url(#holy)', opacity: 0.8 }, s); s.insertBefore(halo, s.firstChild.nextSibling); outlined(s, 'path', { d: 'M-4 -8 l4 -8 l4 8 Z', fill: 'url(#gold)' }, 0.8); }
  };
  const list = [
    // heroes and your army
    ['hero-sun-knight', (s) => person(s, 0, 0, { ...SUN, s: 1.6 })],
    ['ally-spearman', T({ ...SPEAR, s: 1.6 })], ['ally-knight', T({ ...KNIGHT, s: 1.6 })], ['ally-holy-knight', T({ ...HOLY, s: 1.6 })],
    ['ally-archer', T({ ...ARCHER, s: 1.6 })], ['ally-magic-caster', T({ ...MAGE, s: 1.6 })],
    // Region 1 enemies (in the game now)
    ['enemy-bandit', T({ ...BANDIT, s: 1.6 })], ['enemy-bandit-archer', T({ ...BANDIT, weapon: 'bow', quiver: true, s: 1.6 })],
    ['enemy-wolf-rider', (s) => wolfRider(s, 0, 0, 1.5)], ['enemy-barbarian', T({ ...BARBARIAN, s: 1.4 })], ['enemy-armored-brute', T({ ...BRUTE, s: 1.4 })],
    ['boss-bandit-king', (s) => banditKing(s, 0, 0, 1.4)],
    // later regions (art ready, levels come in updates)
    ['r2-scorpion', (s) => scorpion(s, 0, 0, 1.5)], ['r2-camel-raider', (s) => camel(s, 0, 0, 1.15)], ['r2-sand-burrower', (s) => burrower(s, 0, 0, 1.5)], ['r2-boss-dune-colossus', (s) => colossus(s, 0, 0, 1.2)],
    ['r3-river-raider', (s) => boat(s, 0, 0, 1.2)], ['r3-mud-brute', T({ ...MUD_BRUTE, s: 1.2 })], ['r3-storm-bat', (s) => bat(s, 0, -20, 1.5)], ['r3-boss-storm-serpent', (s) => serpent(s, 0, 0, 1.05)],
    ['r4-stone-golem', (s) => golem(s, 0, 0, 1.15)], ['r4-night-stalker', T({ ...NIGHT_STALKER, s: 1.4 })], ['r4-shaman', T({ ...SHAMAN, s: 1.4 })], ['r4-boss-stone-titan', (s) => stoneTitan(s, 0, 0, 0.95)],
    ['r5-crocodile', (s) => crocodile(s, 0, 0, 1.15)], ['r5-river-pirate', T({ ...RIVER_PIRATE, s: 1.4 })], ['r5-swamp-witch', T({ ...SWAMP_WITCH, s: 1.4 })], ['r5-boss-crocodile-warlord', (s) => crocodile(s, 0, 0, 1.85, false, { armor: true, crown: true, eyes: '#ff4a2a', color: '#3f5f2e' })],
    ['r6-ice-wolf', (s) => iceWolf(s, 0, 0, 1.25)], ['r6-frost-mage', T({ ...FROST_MAGE, s: 1.4 })], ['r6-yeti-brute', (s) => yeti(s, 0, 0, 1.2)], ['r6-boss-shadow-emperor', (s) => shadowEmperor(s, 0, 0, 1.25)],
    // buildings: every tower at every tier, the royal towers, the fort, build spots
    ...[['archer', archerTower], ['barracks', barracks], ['mage', mageTower], ['cannon', cannonTower]].flatMap(([n, fn]) => [0, 1, 2].map((t) => [`tower-${n}-tier${t + 1}`, (s) => { fn(s, 0, 0, 1); tier(s, t); }])),
    ['royal-falconer', (s) => falconer(s, 0, 0, 1)], ['royal-stepwell-fountain', (s) => fountain(s, 0, 0, 1)],
    ['building-fort-gate', (s) => fortGate(s, 0, 0, 1)],
    ['spot-open', (s) => plot(s, 0, 0)], ['spot-special', (s) => specialPlot(s, 0, 0)],
    ['spot-rubble', (s) => { plot(s, 0, 0); for (const [x, y, r] of [[-10, -2, 0.42], [8, 0, 0.5], [0, -6, 0.36]]) rock(s, x, y, r); moss(s, [[-14, -4, 3], [14, -2, 2.6]]); }],
    ['spot-timed', (s) => { plot(s, 0, 0); outlined(s, 'ellipse', { cx: 0, cy: -4, rx: 10, ry: 4, fill: '#e8d8b8' }, 1); outlined(s, 'path', { d: 'M0 -4 L6 -12 L2 -4 Z', fill: '#8a6a4a' }, 0.6); }],
    // scenery
    ['scenery-banyan', (s) => banyan(s, 0, 0, 1)], ['scenery-palm', (s) => palm(s, 0, 0, 1)], ['scenery-rock', (s) => rock(s, 0, 0, 1)], ['scenery-stepwell', (s) => stepwell(s, 0, 0)],
    ['scenery-shrine', (s) => shrine(s, 0, 0)], ['scenery-peacock', (s) => peacock(s, 0, 0, 1.4)], ['scenery-tents', (s) => { tent(s, -18, 0, 1); tent(s, 22, 6, 0.8); }], ['scenery-campfire', (s) => campfire(s, 0, 0)],
    ['scenery-cart', (s) => cart(s, 0, 0)], ['scenery-pond', (s) => pond(s, 0, 0)], ['scenery-haystack', (s) => haystack(s, 0, 0)], ['scenery-pots', (s) => pots(s, 0, 0)],
    // UI pieces
    ['ui-logo', (s) => logo(s, 0, 0, 1)], ['ui-royal-chest', (s) => royalChest(s, 0, 0, 1)], ['ui-coin', (s) => coinIcon(s, 0, 0, 14)], ['ui-ruby', (s) => rubyIcon(s, 0, 0, 14)],
    ['ui-diya', (s) => icon.diya(s, 0, 4, 12, true)],
  ];
  const trim = (c) => {
    const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < x0) return c.toDataURL('image/png');
    const pad = 8, o = document.createElement('canvas');
    o.width = x1 - x0 + 1 + pad * 2; o.height = y1 - y0 + 1 + pad * 2;
    o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return o.toDataURL('image/png');
  };
  const res = {};
  for (const [name, draw] of list) {
    const r = await rasterize(draw, [-130, -190, 260, 230], 3, { ui: name.startsWith('ui-') });
    res[name] = trim(r.canvas);
  }
  return res;
});
for (const [n, d] of Object.entries(pieces)) save(n, d);
console.log('art pieces:', Object.keys(pieces).length);

// ---- every battlefield, mid-battle
const { LEVELS } = await p.evaluate(async () => ({ LEVELS: (await import('/src/engine/levels.js')).LEVELS.map((l) => ({ id: l.id, name: l.name })) }));
for (const lv of LEVELS) {
  await p.evaluate((id) => window.__sk.app.startBattle({ mode: 'story', level: id, special: 'falconer' }), lv.id);
  await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 120000 });
  await p.evaluate(() => {
    const sk = window.__sk, g = sk.game;
    for (const k of Object.keys(g.seen)) g.seen[k] = true;
    for (const k of ['bandit', 'wolfRider', 'barbarian', 'banditArcher', 'brute', 'banditKing']) g.seen[k] = true;
    g.gold = 3000;
    const types = ['archer', 'barracks', 'mage', 'cannon'];
    g.plots.forEach((pl, i) => { if (i % 3 === 2) return; if (pl.lock && pl.lock.type === 'gold') g.clearPlot(pl.id); if (!pl.lock) { g.build(pl.id, pl.royal && g.special ? g.special : types[i % 4]); if (i % 2) g.upgrade(g.towers[g.towers.length - 1].id); } });
    g.callWave(); for (let i = 0; i < 60 * 9; i++) g.update(1 / 60);
    if (g.canCallWave) g.callWave(); for (let i = 0; i < 60 * 5; i++) g.update(1 / 60);
  });
  await p.waitForTimeout(200);
  await p.evaluate(() => { const h = window.__sk.hud; h.modal = null; h.banner = null; h.menu = null; });
  await p.waitForTimeout(300);
  writeFileSync(join(out, `level-${lv.id}.png`), await p.screenshot());
}
console.log('levels:', LEVELS.length);

// ---- every screen
const screens = [['screen-menu', 'menu'], ['screen-map-story', 'map', { mode: 'story' }], ['screen-map-challenge', 'map', { mode: 'challenge' }], ['screen-briefing', 'briefing', { mode: 'story', level: 4 }],
  ['screen-briefing-challenge', 'briefing', { mode: 'challenge', level: 2, challenge: null }], ['screen-briefing-endless', 'briefing', { mode: 'endless', level: 5 }],
  ['screen-shop', 'shop'], ['screen-daily', 'daily'], ['screen-quests', 'quests'], ['screen-workshop', 'workshop'], ['screen-achievements', 'achievements'], ['screen-ranks', 'ranks'], ['screen-settings', 'settings']];
for (const [file, name, args] of screens) {
  await p.evaluate(async ([n, a]) => {
    if (a && a.mode === 'challenge' && n === 'briefing') { const M = await import('/src/meta/profile.js'); a.challenge = M.CHALLENGES[a.level][2]; }
    await window.__sk.go(n, a);
  }, [name, args]);
  await p.waitForFunction((n) => window.__sk.screen === n, name, { timeout: 120000 });
  await p.waitForTimeout(300);
  writeFileSync(join(out, file + '.png'), await p.screenshot());
}
for (const tab of ['rubies', 'royal', 'power']) {
  await p.evaluate((t) => { window.__sk.screens.shopTab = t; return window.__sk.go('shop'); }, tab);
  await p.waitForTimeout(400);
  writeFileSync(join(out, `screen-shop-${tab}.png`), await p.screenshot());
}
await p.evaluate(() => window.__sk.go('map', { mode: 'challenge' }));
await p.waitForTimeout(300);
await p.evaluate(() => { window.__sk.screens.modal = { type: 'challenges', level: 2 }; });
await p.waitForTimeout(300);
writeFileSync(join(out, 'screen-challenges.png'), await p.screenshot());
console.log('screens done');
await b.close();
