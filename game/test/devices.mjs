// Opens the game at many Android screen shapes and checks the layout holds: nothing
// stretched, every button fully on screen, no errors. Saves screenshots for review.
// Needs a local server: npm run serve (port 8090). Usage: node test/devices.mjs [outDir]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const out = process.argv[2] || 'test/screens';
mkdirSync(out, { recursive: true });
const URL = process.env.GAME_URL || 'http://localhost:8090/';

export const DEVICES = [
  { name: 'small-phone-16x9', width: 640, height: 360, dpr: 2 },
  { name: 'galaxy-s20-20x9', width: 800, height: 360, dpr: 3 },
  { name: 'pixel-7-20x9', width: 915, height: 412, dpr: 2.625 },
  { name: 'tall-phone-21x9', width: 960, height: 412, dpr: 2.75 },
  { name: 'budget-phone-hd', width: 720, height: 360, dpr: 1.5 },
  { name: 'tablet-16x10', width: 1280, height: 800, dpr: 1.5 },
  { name: 'tablet-4x3', width: 1024, height: 768, dpr: 2 },
];

const b = await pw.chromium.launch();
let failures = 0;
for (const d of DEVICES) {
  const p = await b.newPage({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.dpr, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(URL);
  await p.waitForFunction(() => window.__sk && window.__sk.screen === 'title', null, { timeout: 90000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${d.name}-1-levels.png` });

  // a battle in progress with every tower type
  await p.evaluate(() => window.__sk.startLevel(1));
  await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 90000 });
  const report = await p.evaluate(() => {
    const sk = window.__sk, g = sk.game;
    g.gold = 2000;
    ['archer', 'barracks', 'mage'].forEach((t, i) => g.build(i, t));
    g.upgrade(g.towers[0].id);
    g.callWave();
    for (let i = 0; i < 60 * 16; i++) g.update(1 / 60);
    g.callWave();
    for (let i = 0; i < 60 * 4; i++) g.update(1 / 60);
    for (const e of g.drainEvents()) if (e.type === 'newEnemy') g.seen[e.enemy] = true; // skip the cards for this screenshot
    sk.hud.modal = null; sk.hud.banner = null;
    sk.hud.menu = { type: 'build', plotId: 3 };
    const v = sk.view, c = document.getElementById('game');
    return { cssW: v.cssW, cssH: v.cssH, canvasW: c.width, canvasH: c.height, dpr: v.dpr, s: v.s };
  });
  await p.waitForTimeout(400);
  const targets = await p.evaluate(() => window.__sk.hud.targets.filter((t) => !(t.x === 0 && t.y === 0)).map((t) => (t.round ? { x: t.x - t.w, y: t.y - t.w, w: t.w * 2, h: t.w * 2 } : t)));
  const off = targets.filter((t) => t.x < -1 || t.y < -1 || t.x + t.w > d.width + 1 || t.y + t.h > d.height + 1);
  await p.screenshot({ path: `${out}/${d.name}-2-battle.png` });

  await p.evaluate(() => { window.__sk.hud.menu = null; window.__sk.hud.modal = { type: 'newEnemy', enemy: 'wolfRider' }; });
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${out}/${d.name}-3-new-enemy.png` });

  // the boss level with hero, spells and effects in flight
  await p.evaluate(() => window.__sk.startLevel(5));
  await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 90000 });
  await p.evaluate(() => {
    const sk = window.__sk, g = sk.game;
    g.gold = 3000;
    for (const k of ['bandit', 'wolfRider', 'barbarian', 'banditArcher', 'brute', 'banditKing']) g.seen[k] = true;
    g.plots.forEach((pl, i) => { if (pl.lock) g.clearPlot(pl.id); if (i < 6) g.build(pl.id, ['archer', 'mage', 'cannon', 'barracks'][i % 4]); });
    for (let w = 0; w < 9; w++) { g.callWave(); for (let i = 0; i < 60 * 3; i++) g.update(1 / 60); }
    for (let i = 0; i < 60 * 10 && !g.enemies.some((e) => e.boss); i++) g.update(1 / 60);
    const lead = g.enemies[0];
    if (lead) { g.castSpell('holyFire', lead.x, lead.y); g.castSpell('arrowRain', lead.x, lead.y); g.heroSkill(); }
    for (let i = 0; i < 20; i++) g.update(1 / 60);
  });
  await p.waitForTimeout(120);
  await p.evaluate(() => { const h = window.__sk.hud; h.modal = null; h.banner = null; h.menu = null; });
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${out}/${d.name}-5-boss.png` });

  await p.evaluate(() => window.__sk.startLevel(0));
  await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 90000 });
  await p.evaluate(() => { window.__sk.hud.banner = null; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${d.name}-4-tutorial.png` });

  const ok = !errors.length && !off.length && report.canvasW === Math.round(d.width * report.dpr) && report.canvasH === Math.round(d.height * report.dpr);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${d.name.padEnd(18)} ${d.width}x${d.height}@${d.dpr}x  canvas ${report.canvasW}x${report.canvasH}  scale ${report.s.toFixed(2)}  off-screen buttons: ${off.length}${errors.length ? '  errors: ' + errors.join(' | ') : ''}`);
  await p.close();
}
await b.close();
process.exit(failures ? 1 : 0);
