// A simple player used by the tests: builds and upgrades greedily and calls waves on time.
import { TOWERS } from '../src/engine/data.js';

// How much of the road a spot can cover with a given range: a rough value of the spot.
export function coverage(game, plot, range) {
  let n = 0;
  for (const path of game.paths) for (const [x, y] of path.points) if (Math.hypot(x - plot.x, y - plot.y) <= range) n++;
  return n;
}

export function playLevel(game, { plan = ['archer', 'barracks', 'archer', 'mage', 'archer', 'cannon', 'archer', 'archer'], build = true, useAbilities = build, maxTime = 900 } = {}) {
  const dt = 1 / 30;
  let next = 0;
  plan = plan.filter((t) => game.available.includes(t));
  if (!plan.length) plan = game.available.slice(0, 2);
  game.callWave();
  while (!game.isOver() && game.time < maxTime) {
    if (build) {
      // mix building and upgrading: add a new tower until there are 3 + 2 per tier level, then upgrade
      const open = game.plots.filter((p) => !p.tower && !p.lock).sort((a, b) => coverage(game, b, 90) - coverage(game, a, 90));
      const weakest = game.towers.filter((x) => x.tier < 2).sort((a, b) => a.tier - b.tier)[0];
      const minTier = weakest ? weakest.tier : 2;
      const wantBuild = open.length && game.towers.length < 3 + 2 * minTier;
      const type = plan[next % plan.length];
      if (wantBuild) { if (game.gold >= TOWERS[type].tiers[0].cost && game.build(open[0].id, type)) next++; }
      else if (weakest && game.gold >= weakest.def.tiers[weakest.tier + 1].cost) game.upgrade(weakest.id);
      else if (!open.length) {
        const locked = game.plots.find((p) => p.lock && p.lock.type === 'gold' && game.gold >= p.lock.cost);
        if (locked) game.clearPlot(locked.id);
      }
      if (!weakest && open.length && game.gold >= TOWERS[type].tiers[0].cost && game.build(open[0].id, type)) next++;
    }
    if (useAbilities) {
      // cast ready spells on the enemy furthest along, and use the hero's skill on a crowd
      const lead = [...game.enemies].sort((a, b) => b.d / game.paths[b.lane].length - a.d / game.paths[a.lane].length)[0];
      if (lead) for (const name of Object.keys(game.spells)) if (game.spells[name].cd <= 0) game.castSpell(name, lead.x, lead.y);
      const h = game.hero;
      if (h && !h.dead && game.enemies.filter((e) => Math.hypot(e.x - h.x, e.y - h.y) < 48).length >= 2) game.heroSkill();
    }
    game.update(dt);
    game.drainEvents();
  }
  return game.state;
}
