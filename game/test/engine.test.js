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
    const won = new Game(level, { seed: 7 });
    assert.equal(playLevel(won), 'won', `bot lost with ${won.lives} lives at wave ${won.waveIndex + 1}`);
    const lazy = new Game(level, { seed: 7 });
    assert.equal(playLevel(lazy, { build: false }), 'lost');
  });
}
