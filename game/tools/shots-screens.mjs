// Screenshots of the menu, briefing, Heroes, Treasury, Bazaar and a battle (needs npm run serve).
// Usage: node tools/shots-screens.mjs <outDir>
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
const shot = async (name, wait = 400) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${name}.png` }); };
await p.evaluate(() => { window.__sk.screens.modal = null; });
await shot('menu');
for (const [n, a] of [['briefing', { mode: 'story', level: 4 }], ['heroes'], ['treasury'], ['bazaar']]) {
  await p.evaluate(([x, y]) => window.__sk.go(x, y), [n, a]);
  await p.waitForFunction((x) => window.__sk.screen === x, n, { timeout: 120000 });
  await shot(n, 500);
}
await p.evaluate(() => { window.__sk.screens.shopTab = 'heroes'; });
await shot('bazaar-heroes');
await p.evaluate(() => window.__sk.app.startBattle({ mode: 'story', level: 3, specials: ['falconer', 'alchemist'], hero: 'sage' }));
await p.waitForFunction(() => window.__sk.screen === 'battle', null, { timeout: 120000 });
await p.evaluate(() => { window.__sk.hud.banner = null; });
await shot('battle-ready', 300);
await p.evaluate(() => { const sk = window.__sk; sk.hud.armed = sk.hud.time; });
await shot('battle-armed', 100);
await p.evaluate(() => {
  const sk = window.__sk, g = sk.game; g.gold = 5000;
  g.plots.forEach((pl, i) => { if (pl.lock && pl.lock.cost) g.clearPlot(pl.id); if (!pl.lock) { const ts = g.towersFor(pl.id); if (ts.length) g.build(pl.id, pl.royal ? ts[0] : ['archer', 'cannon', 'mage', 'barracks'][i % 4]); } });
  g.callWave(); for (let i = 0; i < 60 * 6; i++) g.update(1 / 60);
});
await p.evaluate(() => { const h = window.__sk.hud; h.modal = null; h.banner = null; h.menu = null; });
await shot('battle', 700);
console.log(errors.length ? [...new Set(errors)].join('\n') : 'no errors');
await b.close();
