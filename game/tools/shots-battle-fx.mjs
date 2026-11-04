// Screenshot of a late Level 5 battle with the boss, a leak, a sale and low fort health, to check effects.
// Usage: node tools/shots-battle-fx.mjs <outDir>  (needs npm run serve)
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_NODE_PATH || '/opt/node-tools/');
const pw = require('/opt/node-tools/node_modules/playwright');
const out = process.argv[2];
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 800, height: 360 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
p.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('missing sprite')) errors.push(m.text()); });
await p.addInitScript(() => localStorage.setItem('sandstone-kingdom:v2', JSON.stringify({ introSeen: true, diyas: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 2 }, rubies: 900, coins: 9000, owned: { falconer: true, alchemist: true }, heroes: { sunKnight: true, sage: true }, lastHero: 'sage', daily: { day: 2, lastKey: '2000-01-01' }, seen: { bandit: true, wolfRider: true, barbarian: true, banditArcher: true, brute: true, drummer: true, shieldBearer: true, saboteur: true, banditKing: true } })));
await p.goto('http://localhost:8090/');
await p.waitForFunction(() => window.__sk && window.__sk.screen === 'menu', null, { timeout: 120000 });
await p.evaluate(() => { window.__sk.screens.modal = null; });
await p.evaluate(() => window.__sk.app.startBattle({ mode: 'story', level: 5, specials: ['falconer', 'alchemist'], hero: 'sunKnight' }));
await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 120000 });
await p.evaluate(() => {
  const sk = window.__sk, g = sk.game; g.gold = 9000; sk.hud.banner = null;
  g.plots.forEach((pl, i) => { if (pl.lock && pl.lock.cost) g.clearPlot(pl.id); if (!pl.lock) { const ts = g.towersFor(pl.id); if (ts.length) g.build(pl.id, pl.royal ? ts[0] : ['archer', 'cannon', 'mage', 'archer'][i % 4]); } });
  g.callWave(); for (let i = 0; i < 60 * 3; i++) g.update(1 / 60);
  g.waveIndex = g.waveCount - 2; g.callWave(); for (let i = 0; i < 60 * 14; i++) g.update(1 / 60);
  g.lives = Math.ceil(g.maxLives * 0.2);
});
await p.waitForTimeout(250);
await p.evaluate(() => { const g = window.__sk.game; g.emit({ type: 'leak', lives: 1 }); const t = g.towers[0]; if (t) g.sell(t.id); });
await p.waitForTimeout(200);
await p.evaluate(() => { const h = window.__sk.hud; h.modal = null; h.banner = null; h.menu = null; });
await p.screenshot({ path: `${out}/fx1.png` });
await p.waitForTimeout(350);
await p.screenshot({ path: `${out}/fx2.png` });
console.log(await p.evaluate(() => window.__sk.game.enemies.map((e) => e.type).join(',')));
console.log(errors.length ? [...new Set(errors)].join('\n') : 'no errors');
await b.close();
