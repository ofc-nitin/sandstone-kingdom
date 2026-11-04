// Balance check: the test bot plays every level with 6 seeds, with and without special towers.
// Usage: node tools/balance.mjs [forgeBonus]   (e.g. 0.1 = every Forge track at +10%)
import { Game } from '../src/engine/game.js';
import { LEVELS } from '../src/engine/levels.js';
import { playLevel } from '../test/bot.js';
const SP = ['falconer', 'alchemist', 'elephant'];
const bonusArg = process.argv[2] ? Number(process.argv[2]) : 0;
const bonus = { archer: bonusArg, barracks: bonusArg, mage: bonusArg, cannon: bonusArg, royal: bonusArg, hero: bonusArg, spells: bonusArg / 2 };
for (const lv of LEVELS) {
  for (const specials of [[], SP]) {
    let w = 0, d = 0, lives = [];
    for (let s = 1; s <= 6; s++) { const g = new Game(lv, { seed: s, specials, bonus }); const r = playLevel(g, { useAbilities: true }); if (r === 'won') w++; d += g.diyas(); lives.push(g.lives); }
    console.log(`L${lv.id} ${specials.length ? 'specials' : 'basic   '} wins ${w}/6 avg diyas ${(d / 6).toFixed(1)} lives ${lives.join(',')}`);
  }
}
