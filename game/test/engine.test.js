import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePath } from '../src/engine/path.js';
import { Game, WAVE_GAP } from '../src/engine/game.js';
import { LEVELS } from '../src/engine/levels.js';
import { ENEMIES, TOWERS } from '../src/engine/data.js';
import { playLevel } from './bot.js';

const straight = { start: [0, 100], curves: [[100, 100, 200, 100, 300, 100]] };
const tinyLevel = (extra = {}) => ({
  id: 99, name: 'Test', gold: 500, lives: 5, hero: false, paths: [straight], plots: [{ x: 150, y: 60 }, { x: 250, y: 140, lock: { type: 'gold', cost: 40 } }, { x: 60, y: 140, lock: { type: 'wave', wave: 2 } }],
  waves: [[{ type: 'bandit', count: 1, every: 1 }], [{ type: 'bandit', count: 1, every: 1 }]], ...extra,
});
const SPECIALS = ['falconer', 'alchemist', 'elephant'];
const FORGE_MID = { archer: 0.15, barracks: 0.15, mage: 0.15, cannon: 0.15, royal: 0.15, hero: 0.15, spells: 0.08 };
const run = (game, seconds) => { for (let t = 0; t < seconds; t += 1 / 30) game.update(1 / 30); };

test('path length and positions follow the curve', () => {
  const p = makePath(straight);
  assert.ok(Math.abs(p.length - 300) < 0.5);
  const mid = p.at(150);
  assert.ok(Math.abs(mid.x - 150) < 1 && Math.abs(mid.y - 100) < 0.01);
  assert.ok(Math.abs(p.nearest(150, 60).dist - 40) < 0.01);
});

test('building costs gold and a full tower cannot be built twice', () => {
  const g = new Game(tinyLevel());
  assert.equal(g.build(0, 'archer'), true);
  assert.equal(g.gold, 500 - TOWERS.archer.tiers[0].cost);
  assert.equal(g.build(0, 'mage'), false);
});

test('you cannot build without enough gold', () => {
  const g = new Game(tinyLevel({ gold: 10 }));
  assert.equal(g.build(0, 'archer'), false);
  assert.equal(g.towers.length, 0);
});

test('upgrade goes through three tiers and selling refunds 60%', () => {
  const g = new Game(tinyLevel({ gold: 2000 }));
  g.build(0, 'archer');
  const t = g.towers[0];
  assert.ok(g.upgrade(t.id) && g.upgrade(t.id));
  assert.equal(g.upgrade(t.id), false, 'no fourth tier');
  const spent = TOWERS.archer.tiers.reduce((a, x) => a + x.cost, 0);
  const before = g.gold;
  g.sell(t.id);
  assert.equal(g.gold - before, Math.floor(spent * 0.6));
  assert.equal(g.plots[0].tower, null);
});

test('rubble spots cost gold to clear; timed spots open on their wave', () => {
  const g = new Game(tinyLevel());
  assert.equal(g.build(1, 'archer'), false, 'locked spot');
  assert.equal(g.clearPlot(1), true);
  assert.equal(g.gold, 460);
  assert.equal(g.build(1, 'archer'), true);
  assert.ok(g.plots[2].lock);
  g.callWave(); // wave 1
  assert.ok(g.plots[2].lock, 'still locked during wave 1');
  g.callWave(); // too early: no gap yet, nothing happens
  run(g, 2);
  g.callWave(); // wave 2 called early
  assert.equal(g.plots[2].lock, null);
});

test('an undefended road leaks lives and the game is lost at zero', () => {
  const lvl = tinyLevel({ lives: 2, waves: [[{ type: 'bandit', count: 3, every: 0.5 }]] });
  const g = new Game(lvl);
  g.callWave();
  run(g, 30);
  assert.equal(g.state, 'lost');
});

test('an archer tower kills a bandit before it reaches the gate', () => {
  const g = new Game(tinyLevel({ waves: [[{ type: 'bandit', count: 1 }]] }));
  g.build(0, 'archer');
  g.callWave();
  run(g, 40);
  assert.equal(g.state, 'won');
  assert.equal(g.lives, 5);
  assert.equal(g.diyas(), 3);
});

test('barracks soldiers stop enemies on the road', () => {
  const g = new Game(tinyLevel({ waves: [[{ type: 'barbarian', count: 1 }]] }));
  g.build(0, 'barracks');
  g.callWave();
  run(g, 12);
  const e = g.enemies[0];
  assert.ok(e, 'barbarian still alive');
  assert.ok(e.blocker, 'blocked by a soldier');
  const d = e.d;
  run(g, 1);
  if (g.enemies[0] && g.enemies[0].blocker) assert.equal(g.enemies[0].d, d, 'does not move while blocked');
});

test('magic ignores armour but arrows are reduced by it', () => {
  const g = new Game(tinyLevel());
  const e = g.spawnEnemy('brute', 0, 50);
  const hp = e.hp;
  g.damage(e, 100, 'physical');
  assert.equal(Math.round(hp - e.hp), Math.round(100 * (1 - ENEMIES.brute.armor)));
  const hp2 = e.hp;
  g.damage(e, 100, 'magic');
  assert.equal(Math.round(hp2 - e.hp), 100);
});

test('the first time an enemy appears, a new-enemy card is announced once', () => {
  const g = new Game(tinyLevel());
  g.spawnEnemy('wolfRider', 0);
  g.spawnEnemy('wolfRider', 0);
  const cards = g.drainEvents().filter((e) => e.type === 'newEnemy');
  assert.equal(cards.length, 1);
  const g2 = new Game(tinyLevel(), { seen: { wolfRider: true } });
  g2.spawnEnemy('wolfRider', 0);
  assert.equal(g2.drainEvents().filter((e) => e.type === 'newEnemy').length, 0);
});

test('calling the next wave early pays bonus gold', () => {
  const g = new Game(tinyLevel());
  g.callWave();
  run(g, 1.5); // wave 1 spawned; the gap timer is running
  assert.ok(g.nextWaveTimer > 0 && g.nextWaveTimer <= WAVE_GAP);
  const before = g.gold;
  const bonus = g.callWave();
  assert.ok(bonus > 0);
  assert.equal(g.gold, before + bonus);
});

test('the Bandit King keeps calling bandits', () => {
  const g = new Game(tinyLevel({ waves: [[{ type: 'banditKing', count: 1 }]] }));
  g.callWave();
  run(g, 10);
  assert.ok(g.enemies.filter((e) => e.type === 'bandit').length >= 2);
});

test('the hero holds the road, can be moved, and his skill stuns everything near him', () => {
  const g = new Game(tinyLevel({ hero: 'sunKnight', heroStart: { x: 150, y: 100 }, waves: [[{ type: 'barbarian', count: 1 }]] }));
  assert.ok(g.hero);
  g.callWave();
  run(g, 8);
  const e = g.enemies[0];
  assert.ok(e && e.blocker === g.hero, 'barbarian blocked by the hero');
  assert.equal(g.heroSkill(), true);
  assert.ok(e.stun > 0);
  assert.equal(g.heroSkill(), false, 'skill is on cooldown');
  assert.equal(g.moveHero(60, 100), true);
  assert.deepEqual(g.hero.home, { x: 60, y: 100 });
});

test('the hero respawns at his start after falling', () => {
  const g = new Game(tinyLevel({ hero: 'sunKnight', heroStart: { x: 150, y: 100 } }));
  g.hurtSoldier(g.hero, 99999);
  assert.ok(g.hero.dead);
  run(g, 15);
  assert.equal(g.hero.dead, false);
  assert.equal(g.hero.hp, g.hero.maxHp);
});

test('spells: Arrow Rain hits in volleys, Holy Fire burns and stuns, Reinforcements are temporary', () => {
  const g = new Game(tinyLevel({ spells: ['arrowRain', 'reinforcements', 'holyFire'], waves: [[{ type: 'brute', count: 1 }]] }));
  assert.equal(g.castSpell('arrowRain', 100, 100), false, 'no spells before the battle starts');
  g.callWave();
  const brute = g.spawnEnemy('brute', 0, 100);
  const hp = brute.hp;
  assert.equal(g.castSpell('arrowRain', brute.x, brute.y), true);
  assert.equal(g.castSpell('arrowRain', brute.x, brute.y), false, 'cooldown');
  run(g, 1.5);
  assert.ok(brute.hp < hp, 'arrow rain did damage');
  assert.equal(g.castSpell('holyFire', brute.x, brute.y), true);
  assert.ok(brute.burn && brute.stun > 0);
  assert.equal(g.castSpell('reinforcements', 200, 100), true);
  assert.equal(g.soldiers.filter((s) => s.temp).length, 2);
  run(g, 20);
  assert.equal(g.soldiers.filter((s) => s.temp).length, 0, 'reinforcements leave after their time');
});

test('bandit archers stop to shoot soldiers in range', () => {
  const g = new Game(tinyLevel());
  g.build(0, 'barracks');
  const archer = g.spawnEnemy('banditArcher', 0, 60);
  const soldier = g.soldiers[0];
  const hp = soldier.hp;
  const d = archer.d;
  run(g, 3);
  assert.ok(soldier.hp < hp || soldier.dead, 'soldier was shot');
  assert.ok(archer.d - d < 60, 'archer stopped walking to shoot');
});

for (const level of LEVELS) {
  test(`level ${level.id} "${level.name}": build spots sit beside the road, on screen and apart`, () => {
    const paths = level.paths.map((p) => makePath(p));
    for (const p of level.plots) {
      const d = Math.min(...paths.map((path) => path.nearest(p.x, p.y).dist));
      assert.ok(d >= 30 && d <= 70, `spot (${p.x},${p.y}) is ${d.toFixed(1)} from the road`);
      assert.ok(p.x >= 24 && p.x <= 820 && p.y >= 40 && p.y <= 372, `spot (${p.x},${p.y}) on screen`);
    }
    for (let i = 0; i < level.plots.length; i++) for (let j = i + 1; j < level.plots.length; j++) {
      const a = level.plots[i], b = level.plots[j];
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 48, `spots ${i} and ${j} overlap`);
    }
  });
  test(`level ${level.id} "${level.name}": a sensible player wins, doing nothing loses`, () => {
    // later levels expect special towers, and the boss also expects some Forge upgrades
    const opts = { specials: level.id >= 4 ? SPECIALS : [], bonus: level.id >= 5 ? FORGE_MID : {} };
    let wins = 0, last = null;
    for (let seed = 1; seed <= 4 && wins === 0; seed++) { last = new Game(level, { seed, ...opts }); if (playLevel(last, { useAbilities: true }) === 'won') wins++; }
    assert.ok(wins > 0, `bot lost with ${last.lives} lives at wave ${last.waveIndex + 1}`);
    const lazy = new Game(level, { seed: 7 });
    assert.equal(playLevel(lazy, { build: false }), 'lost');
  });
}

test('challenge rules limit towers, lives, spells and hero', () => {
  const g = new Game(LEVELS[1], { rules: { towers: ['archer'], lives: 1, noSpells: true, noHero: true } });
  assert.equal(g.maxLives, 1);
  assert.equal(g.hero, null);
  assert.deepEqual(Object.keys(g.spells), []);
  g.gold = 1000;
  const free = g.plots.find((p) => !p.lock).id;
  assert.equal(g.build(free, 'mage'), false);
  assert.equal(g.build(free, 'archer'), true);
});

test('special spots take only the special towers brought into battle, up to 3', () => {
  const lvl = tinyLevel({ gold: 3000 });
  lvl.plots = [{ x: 150, y: 60, royal: true }, { x: 250, y: 140 }, { x: 100, y: 140, royal: true }];
  assert.equal(new Game(lvl).build(0, 'falconer'), false, 'not brought');
  const g = new Game(lvl, { specials: ['falconer', 'fountain', 'alchemist', 'elephant'] });
  assert.deepEqual(g.specials, ['falconer', 'fountain', 'alchemist'], 'at most 3');
  assert.equal(g.build(0, 'elephant'), false, 'not in the loadout');
  assert.equal(g.build(1, 'falconer'), false, 'not on a standard spot');
  assert.equal(g.build(0, 'archer'), false, 'special spots host only special towers');
  assert.equal(g.build(0, 'falconer'), true);
  assert.deepEqual(g.towersFor(1), ['archer', 'barracks', 'mage', 'cannon']);
  assert.deepEqual(g.towersFor(2), ['falconer', 'fountain', 'alchemist']);
});

test('special spots open one by one at their wave, or earlier for gold', () => {
  const lvl = tinyLevel({ gold: 200, waves: [[{ type: 'bandit', count: 1 }], [{ type: 'bandit', count: 1 }], [{ type: 'bandit', count: 1 }]] });
  lvl.plots = [{ x: 150, y: 60, royal: true, lock: { type: 'special', wave: 2, cost: 70 } }, { x: 250, y: 60, royal: true, lock: { type: 'special', wave: 3, cost: 100 } }];
  const g = new Game(lvl, { specials: ['falconer'] });
  g.callWave();
  assert.ok(g.plots[0].lock);
  run(g, 30);
  assert.equal(g.plots[0].lock, null, 'opened at wave 2');
  assert.ok(g.plots[1].lock);
  assert.equal(g.clearPlot(1), true, 'paid to open early');
  assert.equal(g.plots[1].lock, null);
});

test('special towers upgrade through 8 levels', () => {
  const lvl = tinyLevel({ gold: 99999 }); lvl.plots[0].royal = true;
  const g = new Game(lvl, { specials: ['falconer'] });
  g.build(0, 'falconer');
  const t = g.towers[0];
  for (let i = 0; i < 10; i++) g.upgrade(t.id);
  assert.equal(t.tier, 7);
  assert.equal(t.def.tiers.length, 8);
});

test('the war drummer makes nearby enemies faster', () => {
  const a = new Game(tinyLevel()), b = new Game(tinyLevel());
  const ea = a.spawnEnemy('bandit', 0, 50); ea.offset = 0;
  const eb = b.spawnEnemy('bandit', 0, 50); eb.offset = 0;
  b.spawnEnemy('drummer', 0, 40);
  run(a, 1); run(b, 1);
  assert.ok(eb.d > ea.d + 3, 'drummed bandit is ahead');
});

test('the shield bearer shields the highest-ranked comrades first', () => {
  const g = new Game(tinyLevel());
  const bandit = g.spawnEnemy('bandit', 0, 60), brute = g.spawnEnemy('brute', 0, 62), barb = g.spawnEnemy('barbarian', 0, 64), wolf = g.spawnEnemy('wolfRider', 0, 58);
  for (const e of [bandit, brute, barb, wolf]) e.stun = 99;
  const sb = g.spawnEnemy('shieldBearer', 0, 55); sb.stun = 99; sb.shieldCd = 0;
  sb.stun = 0;
  run(g, 0.1);
  assert.ok(brute.shieldHp > 0 && barb.shieldHp > 0, 'strongest shielded');
  assert.equal(bandit.shieldHp, 0, 'weakest left out');
  const hp = brute.hp; g.damage(brute, 10, 'magic');
  assert.equal(brute.hp, hp, 'the shield soaks damage first');
});

test('the saboteur jams towers it passes and slips past soldiers', () => {
  const g = new Game(tinyLevel({ gold: 1000 }));
  g.build(0, 'archer');
  const e = g.spawnEnemy('saboteur', 0, 140); e.offset = 0;
  run(g, 0.2);
  assert.ok(g.towers[0].jam > 0, 'tower jammed');
});

test('portals move enemies further down the road', () => {
  const lvl = tinyLevel({ paths: [{ ...straight, portals: [{ from: 0.2, to: 0.7 }] }] });
  const g = new Game(lvl);
  const e = g.spawnEnemy('bandit', 0, 55);
  run(g, 1.5);
  assert.ok(e.d >= 0.7 * g.paths[0].length, 'came out of the far portal');
});

test('the alchemist strips armour and the war elephant tramples and knocks back', () => {
  const lvl = tinyLevel({ gold: 3000 }); lvl.plots[0].royal = true;
  const g = new Game(lvl, { specials: ['alchemist'] });
  g.build(0, 'alchemist');
  const b = g.spawnEnemy('brute', 0, 150); b.stun = 99;
  run(g, 2.5);
  assert.ok(b.shredT > 0 && b.poison, 'armour shredded and poisoned');
  const h = new Game(lvl, { specials: ['elephant'] });
  h.build(0, 'elephant');
  const e = h.spawnEnemy('barbarian', 0, 120); e.stun = 99; const hp0 = e.hp;
  run(h, 1.5);
  assert.ok(e.hp < hp0, 'trampled');
});

test('every level has at most 3 special spots', () => {
  for (const l of LEVELS) assert.ok(l.plots.filter((p) => p.royal).length <= 3, l.name);
});

test('the falconer marks prey so it takes extra damage', () => {
  const lvl = tinyLevel({ gold: 1000 }); lvl.plots[0].royal = true;
  const g = new Game(lvl, { specials: ['falconer'] });
  assert.equal(g.build(0, 'falconer'), true);
  const e = g.spawnEnemy('brute', 0, 120);
  e.stun = 99;
  run(g, 1.2);
  assert.ok(e.mark && e.mark.mul > 1, 'enemy is marked');
  const before = e.hp; g.damage(e, 10, 'magic', true);
  assert.ok(Math.abs(before - e.hp - 10 * e.mark.mul) < 1e-6);
});

test('the stepwell fountain slows enemies in its water', () => {
  const lvl = tinyLevel({ gold: 1000, waves: [[{ type: 'barbarian', count: 1 }]] }); lvl.plots[0].royal = true;
  const slowGame = new Game(lvl, { special: 'fountain' }); assert.equal(slowGame.build(0, 'fountain'), true);
  const fast = new Game(lvl), slow = slowGame;
  for (const g of [fast, slow]) { const e = g.spawnEnemy('barbarian', 0, 100); e.offset = 0; }
  run(fast, 3); run(slow, 3);
  assert.ok(slow.enemies[0].d < fast.enemies[0].d - 10, 'slowed enemy is behind');
});

test('power-ups: one of each per level, only after the battle starts', () => {
  const g = new Game(tinyLevel(), { powerups: { gold: 3, freeze: 1 } });
  assert.equal(g.usePowerup('gold'), false, 'not before the first wave');
  g.callWave();
  const gold = g.gold;
  assert.equal(g.usePowerup('gold'), true);
  assert.equal(g.gold, gold + 120);
  assert.equal(g.usePowerup('gold'), false, 'only one per level');
  assert.equal(g.usePowerup('lives'), false, 'not owned');
  run(g, 1);
  g.usePowerup('freeze');
  assert.ok(g.enemies.every((e) => e.stun >= 4));
});

test('a lost battle can be revived once', () => {
  const g = new Game(tinyLevel({ lives: 1 }));
  g.callWave();
  run(g, 30);
  assert.equal(g.state, 'lost');
  assert.equal(g.revive(), true);
  assert.equal(g.state, 'playing');
  assert.equal(g.lives, 5);
  assert.equal(g.canRevive, false);
});

test('endless mode keeps making harder waves and scores', () => {
  const g = new Game(LEVELS[5], { endless: true });
  assert.equal(g.waveCount, Infinity);
  g.lives = 1e6;
  for (let i = 0; i < 400 && g.waves.length < 14; i++) { g.callWave(); run(g, 1); }
  assert.ok(g.waves.length >= 14);
  assert.ok(g.scale > LEVELS[5].hpScale);
  assert.notEqual(g.state, 'won');
  run(g, 20);
  assert.ok(g.score > 0);
});

test('summary reports what happened in the battle', () => {
  const g = new Game(LEVELS[1], { seed: 3 });
  const res = playLevel(g, { useAbilities: true });
  const s = g.summary();
  assert.equal(s.won, g.state === 'won');
  assert.ok(res);
  assert.ok(Object.values(s.kills).reduce((a, b) => a + b, 0) > 20);
  assert.ok(s.towerTypes.length >= 1);
});

test('ranged heroes shoot from where they stand and never block', () => {
  const g = new Game(tinyLevel({ hero: undefined }), { hero: 'archerQueen' });
  const h = g.hero; h.home = { x: 150, y: 70 }; h.x = 150; h.y = 70;
  const e = g.spawnEnemy('barbarian', 0, 140); e.stun = 99;
  run(g, 2);
  assert.ok(e.hp < e.maxHp, 'shot');
  assert.equal(e.blocker, null, 'not blocked');
});

test('hero skills: volley slows a crowd, blessing heals soldiers, war cry stuns', () => {
  const lvl = tinyLevel({ hero: undefined, gold: 1000 });
  const q = new Game(lvl, { hero: 'archerQueen' }); q.callWave();
  const qa = q.spawnEnemy('bandit', 0, q.paths[0].nearest(q.hero.x, q.hero.y).d);
  assert.equal(q.heroSkill(), true);
  assert.ok(qa.slowT > 0);
  const sg = new Game(lvl, { hero: 'sage' }); sg.build(0, 'barracks');
  const sol = sg.soldiers.find((x) => !x.hero); sol.hp = 1; sol.x = sg.hero.x; sol.y = sg.hero.y;
  sg.heroSkill();
  assert.equal(sol.hp, sol.maxHp);
  const v = new Game(lvl, { hero: 'vikram' });
  const ve = v.spawnEnemy('brute', 0, v.paths[0].nearest(v.hero.x, v.hero.y).d);
  v.heroSkill();
  assert.ok(ve.stun >= 2);
});

test('no hero in the tutorial and Level 1; none when the player has none', () => {
  assert.equal(new Game(LEVELS[0]).hero, null);
  assert.equal(new Game(LEVELS[1]).hero, null);
  assert.equal(new Game(LEVELS[2], { hero: null }).hero, null);
  assert.equal(new Game(LEVELS[2], { hero: 'sage' }).hero.hero, 'sage');
});
