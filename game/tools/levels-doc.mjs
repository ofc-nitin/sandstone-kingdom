// Writes docs/prd/levels.md from the level data, so the design doc always matches the game.
import { LEVELS } from '../src/engine/levels.js';
import { ENEMIES } from '../src/engine/data.js';
import { CHALLENGES } from '../src/meta/profile.js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPELL = { arrowRain: 'Arrow Rain', reinforcements: 'Reinforcements', holyFire: 'Holy Fire' };
let md = '# Level design: Region 1, Aravalli Hills (Spring)\n\nGenerated from `game/src/engine/levels.js` by `node tools/levels-doc.mjs`, so the numbers match the game. The images show each battlefield mid-battle.\n\n';
md += '| # | Level | Start gold | Lives | Enemy HP | Waves | Spots (open / locked / special) | Spells | New enemy |\n|---|---|---|---|---|---|---|---|---|\n';
const seen = new Set();
for (const l of LEVELS) {
  const fresh = [...new Set(l.waves.flat().map((g) => g.type))].filter((t) => !seen.has(t));
  fresh.forEach((t) => seen.add(t));
  const pl = l.plots;
  md += `| ${l.id} | ${l.name} | ${l.gold} | ${l.lives ?? 20} | ×${(l.hpScale ?? 1).toFixed(2)} | ${l.waves.length} | ${pl.filter((p) => !p.lock).length} / ${pl.filter((p) => p.lock).length} / ${pl.filter((p) => p.royal).length} | ${(l.spells ?? []).length} | ${fresh.map((t) => ENEMIES[t].name).join(', ') || '-'} |\n`;
}
for (const l of LEVELS) {
  md += `\n## ${l.id === 0 ? 'Tutorial' : 'Level ' + l.id}: ${l.name}${l.boss ? ' (boss)' : ''}\n\n![${l.name} battlefield](img/level-${l.id}.png)\n\n`;
  md += `**Why we fight:** ${l.story}\n\n`;
  md += `**Roads:** ${l.paths.length} · **Hero:** ${l.hero === false ? 'none (tutorial)' : 'Sun Knight'} · **Spells:** ${(l.spells ?? []).map((s) => SPELL[s] || s).join(', ') || 'none'}\n\n`;
  const locks = l.plots.filter((p) => p.lock).map((p) => (p.lock.type === 'gold' ? `rubble (${p.lock.cost} gold)` : `opens at wave ${p.lock.wave}`));
  if (locks.length) md += `**Locked spots:** ${locks.join(', ')}\n\n`;
  md += '| Wave | Enemies |\n|---|---|\n';
  l.waves.forEach((w, i) => { md += `| ${i + 1} | ${w.map((g) => `${g.count} × ${ENEMIES[g.type].name}${l.paths.length > 1 ? ' (road ' + ((g.lane || 0) + 1) + ')' : ''}`).join(', ')} |\n`; });
  if (l.tutorial) md += '\n**Tutorial steps:** ' + l.tutorial.map((t, i) => `${i + 1}. ${t.text}`).join(' ') + '\n';
  if (CHALLENGES[l.id]) md += '\n**Challenges (unlock after completing the level, each pays rubies once):**\n\n' + CHALLENGES[l.id].map((c) => `- **${c.name}**: ${c.desc} · ${c.rubies} rubies`).join('\n') + '\n';
}
md += '\n## Endless mode\n\nUnlocked by beating the Bandit King and played on his camp. After the 10 hand-made waves, new waves are generated: each one is bigger and mixes more enemy types. Enemy health grows about 9% per wave (a little faster each wave), and the Bandit King returns every 10th wave. Score: 10 × gold value per kill, 100 × wave number for each wave reached, plus a bonus for calling waves early.\n';
md += '\n## Regions 2 to 6 (free updates)\n\nThe enemy art for every region is ready (see the [art bible](art-bible.md)). Levels 6 to 30 follow the same pattern: a new enemy in most levels and a boss every 5th level.\n';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../docs/prd/levels.md'), md);
console.log('docs/prd/levels.md written');
