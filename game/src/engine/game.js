// The battle simulation. No drawing and no DOM here: the renderer reads this state and
// the tests drive it directly. Everything advances in update(dt).
import { makePath } from './path.js';
import { ENEMIES, TOWERS, TOWER_ORDER, SELL_REFUND, HEROES, SPELLS, SPELL_ORDER, POWERUPS, SPECIAL_LOADOUT } from './data.js';

export const WAVE_GAP = 16; // seconds between the end of one wave's spawns and the next wave
export const EARLY_CALL_GOLD_PER_SECOND = 1;
const SOLDIER_REACH = 12; // a soldier blocks an enemy once this close
const SOLDIER_LEASH = 46; // how far a soldier will leave its post to chase
const HIT_RADIUS = 6;

export function createRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  // opts.rules: a map challenge ({ towers: [...], lives, noSpells, noHero }).
  // opts.specials: up to 3 special (royal) towers taken into this battle; they stand only on
  // special spots, and special spots take only them. opts.endless: waves never stop.
  // opts.powerups: how many of each power-up the player can use (one each per level).
  constructor(level, { seed = 1, seen = {}, rules = null, specials = null, special = null, hero, endless = false, powerups = {}, bonus = {} } = {}) {
    this.level = level;
    this.rules = rules || {};
    this.bonus = bonus || {}; // Royal Workshop: { archer: 0.16, barracks: 0.24, spells: 0.08, hero: 0.1, ... }
    this.endless = !!endless;
    this.waves = level.waves.slice();
    const allowed = (t) => !this.rules.towers || this.rules.towers.includes(t);
    this.specials = [...new Set(specials || (special ? [special] : []))].filter((t) => TOWERS[t] && TOWERS[t].royal && allowed(t)).slice(0, SPECIAL_LOADOUT);
    this.special = this.specials[0] || null;
    this.available = [...TOWER_ORDER.filter(allowed), ...this.specials];
    this.powerups = {};
    for (const k of Object.keys(POWERUPS)) this.powerups[k] = Math.min(1, powerups[k] || 0);
    this.stats = { kills: {}, built: {}, spells: 0, earlyCalls: 0, tier3: 0, tier3Types: [], heroSkills: 0, powerups: 0 };
    this.score = 0;
    this.scale = level.hpScale ?? 1;
    this.revived = false;
    this.paths = level.paths.map((spec) => makePath(spec));
    this.rng = createRng(seed);
    this.gold = level.gold;
    this.maxLives = this.rules.lives ?? level.lives ?? 20;
    this.lives = this.maxLives;
    this.time = 0;
    this.state = 'ready'; // ready -> playing -> won | lost
    this.plots = level.plots.map((p, id) => ({ id, x: p.x, y: p.y, lock: p.lock ? { ...p.lock } : null, royal: !!p.royal, tower: null }));
    this.beasts = []; // war elephants charging down the road
    this.portals = this.paths.map((path, lane) => (level.paths[lane].portals || []).map((pt) => ({ from: pt.from * path.length, to: pt.to * path.length, a: path.at(pt.from * path.length), b: path.at(pt.to * path.length) })));
    this.towers = [];
    this.enemies = [];
    this.soldiers = [];
    this.projectiles = [];
    this.events = [];
    this.waveIndex = -1;
    this.spawnQueue = [];
    this.nextWaveTimer = null;
    this.seen = { ...seen };
    this.nextId = 1;
    this.areaEffects = [];
    // spells unlock as the campaign goes on; each level lists the ones it allows
    this.spells = {};
    if (!this.rules.noSpells) for (const name of level.spells ?? SPELL_ORDER) this.spells[name] = { cd: 0 };
    this.hero = null;
    // opts.hero: the hero chosen in the briefing; null means the player has no hero yet
    if (level.hero !== false && !this.rules.noHero && hero !== null) this.spawnHero(hero || level.hero || 'sunKnight');
  }

  // ---------------------------------------------------------------- hero
  spawnHero(type) {
    const def = HEROES[type], path = this.paths[0];
    const start = this.level.heroStart || (() => { const p = path.at(path.length * 0.55); return { x: p.x, y: p.y }; })();
    const h = { id: this.nextId++, hero: type, def, start: { ...start }, home: { ...start }, x: start.x, y: start.y, hp: def.hp * this.mul('hero'), maxHp: def.hp * this.mul('hero'), armor: def.armor, target: null, atkCd: 0, dead: false, respawnT: 0, facing: 1, skillCd: 0 };
    this.hero = h;
    this.soldiers.push(h);
  }

  moveHero(x, y) {
    const h = this.hero;
    if (!h || h.dead || this.isOver()) return false;
    this.releaseSoldier(h);
    // stand on the road if the tap was close to it, so he can block enemies there
    let best = null;
    for (const path of this.paths) { const n = path.nearest(x, y); if (!best || n.dist < best.dist) best = { ...n, path }; }
    if (best && best.dist < 90) { const p = best.path.at(best.d); x = p.x; y = p.y; }
    h.home = { x: Math.max(10, Math.min(834, x)), y: Math.max(20, Math.min(380, y)) };
    this.emit({ type: 'heroMove', x: h.home.x, y: h.home.y });
    return true;
  }

  heroSkill() {
    const h = this.hero;
    if (!h || h.dead || h.skillCd > 0 || this.isOver()) return false;
    const sk = h.def.skill;
    h.skillCd = sk.cooldown;
    this.stats.heroSkills++;
    const near = this.enemies.filter((e) => !e.dead && e.portalT <= 0 && Math.hypot(e.x - h.x, e.y - h.y) <= sk.radius);
    if (sk.type === 'volley') {
      // the nearest enemies each take an arrow and are slowed
      near.sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y)).slice(0, sk.targets).forEach((e) => {
        this.damage(e, sk.dmg * this.mul('hero'), 'physical');
        e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, sk.slow); e.slowT = sk.slowTime;
        this.emit({ type: 'enemyShot', x: h.x, y: h.y - 22, tx: e.x, ty: e.y - 14 });
      });
    } else if (sk.type === 'bless') {
      for (const e of near) this.damage(e, sk.dmg * this.mul('hero'), 'magic');
      for (const s2 of this.soldiers) if (!s2.dead && Math.hypot(s2.x - h.x, s2.y - h.y) <= sk.radius) s2.hp = s2.maxHp;
    } else if (sk.type === 'warcry') {
      for (const e of near) { this.damage(e, sk.dmg * this.mul('hero'), 'physical'); e.stun = Math.max(e.stun || 0, sk.stun); }
      for (const s2 of this.soldiers) if (!s2.dead && Math.hypot(s2.x - h.x, s2.y - h.y) <= sk.radius * 1.4) s2.hp = Math.min(s2.maxHp + sk.shield, s2.hp + sk.shield);
    } else {
      for (const e of near) { this.damage(e, sk.dmg * this.mul('hero'), 'magic'); e.stun = Math.max(e.stun || 0, sk.stun); }
    }
    this.emit({ type: 'heroSkill', x: h.x, y: h.y, r: sk.radius });
    return true;
  }

  // ---------------------------------------------------------------- spells
  castSpell(name, x, y) {
    const sp = this.spells[name], def = SPELLS[name];
    if (!sp || sp.cd > 0 || this.isOver() || this.state === 'ready') return false;
    sp.cd = def.cooldown * (1 - (this.bonus.spells || 0));
    if (name === 'arrowRain') this.areaEffects.push({ x, y, r: def.radius, ticks: def.ticks, interval: def.interval, t: 0, dmg: def.dmg, kind: def.kind });
    if (name === 'holyFire') {
      for (const e of this.enemies) {
        if (e.dead || Math.hypot(e.x - x, e.y - y) > def.radius) continue;
        this.damage(e, def.dmg, 'magic');
        e.burn = { dps: def.burn, t: def.burnTime };
        e.stun = Math.max(e.stun || 0, def.stun);
      }
    }
    if (name === 'reinforcements') {
      let best = null;
      this.paths.forEach((path) => { const n = path.nearest(x, y); if (!best || n.dist < best.dist) best = { ...n, path }; });
      const c = best.path.at(best.d);
      for (let i = 0; i < def.count; i++) {
        const home = { x: c.x + (i ? 6 : -6), y: c.y + (i ? 4 : -4) };
        this.soldiers.push({ id: this.nextId++, temp: true, stats: def.stats, life: def.life, home, x: home.x, y: home.y - 30, hp: def.stats.hp, maxHp: def.stats.hp, armor: def.stats.armor, target: null, atkCd: 0, dead: false, facing: 1 });
      }
    }
    this.stats.spells++;
    this.emit({ type: 'spell', spell: name, x, y, r: def.radius || 30 });
    return true;
  }

  // ---------------------------------------------------------------- power-ups and revive
  usePowerup(name) {
    const def = POWERUPS[name];
    if (!def || !(this.powerups[name] > 0) || this.isOver() || this.state === 'ready') return false;
    this.powerups[name]--;
    this.stats.powerups++;
    if (name === 'freeze') for (const e of this.enemies) if (!e.dead) e.stun = Math.max(e.stun || 0, def.time);
    if (name === 'gold') this.gold += def.amount;
    if (name === 'lives') this.lives += def.amount;
    this.emit({ type: 'powerup', powerup: name });
    return true;
  }

  // A rewarded ad can bring a lost battle back once: +5 lives and the road near the gate cleared.
  get canRevive() { return this.state === 'lost' && !this.revived && !this.endless; }
  revive(lives = 5) {
    if (!this.canRevive) return false;
    this.revived = true;
    this.lives = lives;
    for (const e of this.enemies) if (!e.def.boss && e.d > this.paths[e.lane].length * 0.7) { e.dead = true; this.emit({ type: 'banish', x: e.x, y: e.y }); }
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.state = 'playing';
    this.emit({ type: 'revived' });
    return true;
  }

  // Which towers can go on this spot (special spots also take the chosen special tower).
  towersFor(plotId) {
    const plot = this.plots[plotId];
    return this.available.filter((t) => !!TOWERS[t].royal === !!(plot && plot.royal));
  }

  // Lanes the next wave comes down, so the HUD can show a warning at each of those entrances.
  get nextLanes() {
    const w = this.waves[this.waveIndex + 1];
    return w ? [...new Set(w.map((g) => g.lane || 0))] : [];
  }

  // Everything the meta game needs once a battle ends: quests, achievements, rewards.
  summary() {
    const types = new Set(this.towers.map((t) => t.type));
    for (const k of Object.keys(this.stats.built)) types.add(k);
    return {
      level: this.level.id, won: this.state === 'won', diyas: this.diyas(), livesLost: Math.max(0, this.maxLives - this.lives),
      kills: { ...this.stats.kills }, built: { ...this.stats.built }, towerTypes: [...types], spells: this.stats.spells,
      earlyCalls: this.stats.earlyCalls, tier3: this.stats.tier3, tier3Types: [...this.stats.tier3Types], heroSkills: this.stats.heroSkills, powerups: this.stats.powerups,
      wave: this.waveIndex + 1, score: this.score, endless: this.endless, boss: !!this.level.boss, revived: this.revived, rules: this.rules,
    };
  }

  soldierStats(s) {
    if (s.hero) return s.def;
    if (s.temp) return s.stats;
    return s.tower.def.tiers[s.tower.tier];
  }

  get waveCount() { return this.endless ? Infinity : this.waves.length; }
  get canCallWave() { return this.state === 'ready' || (this.nextWaveTimer !== null && this.waveIndex < this.waveCount - 1); }

  mul(key) { return 1 + (this.bonus[key] || 0); }
  emit(e) { this.events.push(e); }
  drainEvents() { const e = this.events; this.events = []; return e; }
  roll([lo, hi]) { return lo + (hi - lo) * this.rng(); }

  // ---------------------------------------------------------------- player actions
  build(plotId, type) {
    const plot = this.plots[plotId], def = TOWERS[type];
    if (!plot || !def || plot.tower || plot.lock || this.isOver() || !this.available.includes(type)) return false;
    if (!!def.royal !== plot.royal) return false; // special towers stand only on special spots, and special spots take only them
    const cost = def.tiers[0].cost;
    if (this.gold < cost) return false;
    this.gold -= cost;
    const tower = { id: this.nextId++, type, def, tier: 0, plot, x: plot.x, y: plot.y, cd: 0.3, spent: cost, rangeBonus: plot.royal ? 1.15 : 1 };
    plot.tower = tower;
    this.towers.push(tower);
    if (def.kind === 'soldiers') this.spawnSoldiers(tower);
    this.stats.built[type] = (this.stats.built[type] || 0) + 1;
    this.emit({ type: 'built', tower });
    return true;
  }

  upgrade(towerId) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower || tower.tier >= tower.def.tiers.length - 1 || this.isOver()) return false;
    const cost = tower.def.tiers[tower.tier + 1].cost;
    if (this.gold < cost) return false;
    this.gold -= cost;
    tower.spent += cost;
    tower.tier++;
    if (tower.tier === tower.def.tiers.length - 1) { this.stats.tier3++; if (!this.stats.tier3Types.includes(tower.type)) this.stats.tier3Types.push(tower.type); }
    if (tower.def.kind === 'soldiers') {
      const st = tower.def.tiers[tower.tier];
      for (const s of this.soldiers.filter((x) => x.tower === tower)) { s.maxHp = st.hp * this.mul('barracks'); s.hp = s.maxHp; s.armor = st.armor; }
    }
    this.emit({ type: 'upgraded', tower });
    return true;
  }

  sell(towerId) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower || this.isOver()) return false;
    const refund = Math.floor(tower.spent * SELL_REFUND);
    this.gold += refund;
    for (const s of this.soldiers.filter((x) => x.tower === tower)) this.releaseSoldier(s);
    this.soldiers = this.soldiers.filter((x) => x.tower !== tower);
    this.towers = this.towers.filter((t) => t !== tower);
    tower.plot.tower = null;
    this.emit({ type: 'sold', tower, refund });
    return true;
  }

  // Locked spots: pay battle gold to clear rubble. Timed spots open by themselves.
  clearPlot(plotId) {
    const plot = this.plots[plotId];
    if (!plot || !plot.lock || !(plot.lock.cost > 0) || this.isOver()) return false;
    if (this.gold < plot.lock.cost) return false;
    this.gold -= plot.lock.cost;
    plot.lock = null;
    this.emit({ type: 'plotOpened', plot, paid: true });
    return true;
  }

  // Start the first wave, or call the next one early for bonus gold.
  callWave() {
    if (!this.canCallWave) return 0;
    let bonus = 0;
    if (this.state === 'playing' && this.nextWaveTimer !== null) {
      bonus = Math.ceil(Math.min(this.nextWaveTimer, WAVE_GAP)) * EARLY_CALL_GOLD_PER_SECOND;
      this.gold += bonus;
      this.stats.earlyCalls++;
      if (this.endless) this.score += bonus * 5;
    }
    this.startNextWave();
    return bonus;
  }

  isOver() { return this.state === 'won' || this.state === 'lost'; }

  diyas() {
    if (this.state !== 'won') return 0;
    const lost = this.maxLives - this.lives;
    return lost === 0 ? 3 : lost <= 5 ? 2 : 1;
  }

  // ---------------------------------------------------------------- simulation
  startNextWave() {
    if (this.waveIndex >= this.waveCount - 1) return;
    this.waveIndex++;
    this.state = 'playing';
    this.nextWaveTimer = null;
    if (this.endless && this.waveIndex >= this.waves.length) this.waves.push(this.endlessWave(this.waveIndex));
    if (this.endless) {
      const extra = Math.max(0, this.waveIndex - this.level.waves.length + 1);
      this.scale = (this.level.hpScale ?? 1) * (1 + 0.09 * extra + 0.004 * extra * extra);
      if (this.waveIndex > 0) this.score += 100 * this.waveIndex;
    }
    const wave = this.waves[this.waveIndex];
    for (const gr of wave) {
      for (let i = 0; i < gr.count; i++) this.spawnQueue.push({ t: this.time + (gr.delay || 0) + i * (gr.every ?? 1.2), type: gr.type, lane: gr.lane || 0, wave: this.waveIndex });
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);
    // the clock to the next wave starts now and keeps running: this wave's marching time plus a breather
    if (this.waveIndex < this.waveCount - 1) {
      const lastSpawn = this.spawnQueue.length ? this.spawnQueue[this.spawnQueue.length - 1].t - this.time : 0;
      this.nextWaveTotal = Math.max(0, lastSpawn) + WAVE_GAP;
      this.nextWaveTimer = this.nextWaveTotal;
    }
    for (const plot of this.plots) {
      if (plot.lock && plot.lock.wave && this.waveIndex + 1 >= plot.lock.wave) {
        plot.lock = null;
        this.emit({ type: 'plotOpened', plot, paid: false });
      }
    }
    this.emit({ type: 'waveStart', wave: this.waveIndex });
  }

  // Endless waves after the hand-made ones: bigger and more mixed every time, a boss every 10th.
  endlessWave(n) {
    const pool = this.level.endlessPool || Object.keys(ENEMIES).filter((k) => !ENEMIES[k].boss);
    const lanes = this.paths.length, groups = [];
    const size = 6 + Math.floor(n * 0.9);
    const kinds = 2 + Math.min(3, Math.floor(n / 6));
    for (let i = 0; i < kinds; i++) {
      const type = pool[Math.floor(this.rng() * pool.length)], def = ENEMIES[type];
      const count = Math.max(1, Math.round((size / kinds) * Math.min(1.6, 40 / def.hp + 0.4)));
      groups.push({ type, count, every: 0.9 + this.rng() * 0.6, delay: i * 2.5, lane: (i + n) % lanes });
    }
    if ((n + 1) % 10 === 0 && this.level.boss) groups.push({ type: this.level.boss, count: 1, every: 1, delay: 4, lane: 0 });
    return groups;
  }

  spawnEnemy(type, lane, d = 0) {
    const def = ENEMIES[type], path = this.paths[lane];
    const hp = Math.round(def.hp * this.scale);
    const e = {
      id: this.nextId++, type, def, lane, d, hp, maxHp: hp, offset: (this.rng() - 0.5) * 14,
      x: 0, y: 0, angle: 0, blocker: null, atkCd: 0, summonCd: def.summon ? def.summon.every : 0, walk: this.rng() * 10,
      shieldCd: def.shield ? 2 : 0, shieldHp: 0, buff: 0, evasive: !!def.dodge && this.rng() < def.dodge, ported: [], portalT: 0,
    };
    this.placeEnemy(e, path);
    this.enemies.push(e);
    if (!this.seen[type]) { this.seen[type] = true; this.emit({ type: 'newEnemy', enemy: type }); }
    if (def.boss) this.emit({ type: 'bossArrives', enemy: e });
    return e;
  }

  placeEnemy(e, path) {
    const p = path.at(e.d);
    e.x = p.x - Math.sin(p.angle) * e.offset;
    e.y = p.y + Math.cos(p.angle) * e.offset;
    e.angle = p.angle;
  }

  setRally(tower) {
    let best = null;
    this.paths.forEach((path, lane) => { const n = path.nearest(tower.x, tower.y); if (!best || n.dist < best.dist) best = { ...n, lane, path }; });
    const rd = Math.max(20, Math.min(best.path.length - 20, best.d));
    const c = best.path.at(rd);
    tower.rally = { x: c.x, y: c.y, lane: best.lane, d: rd, angle: c.angle };
    return c;
  }

  spawnSoldiers(tower) {
    const st = tower.def.tiers[tower.tier];
    const c = this.setRally(tower);
    for (let i = 0; i < st.soldiers; i++) {
      const a = c.angle + Math.PI / 2, off = (i - (st.soldiers - 1) / 2) * 9;
      const home = { x: c.x + Math.cos(a) * off + Math.cos(c.angle) * (i % 2 ? 4 : -4), y: c.y + Math.sin(a) * off };
      this.soldiers.push({ id: this.nextId++, tower, slot: i, home, x: home.x, y: home.y, hp: st.hp * this.mul('barracks'), maxHp: st.hp * this.mul('barracks'), armor: st.armor, target: null, atkCd: 0, dead: false, respawnT: 0, facing: 1 });
    }
  }

  hurtSoldier(b, amount) {
    b.hp -= amount * (1 - b.armor);
    if (b.hp > 0) return;
    b.dead = true;
    this.releaseSoldier(b);
    this.emit({ type: b.hero ? 'heroDown' : 'soldierDown', x: b.x, y: b.y });
    if (b.temp) return;
    b.respawnT = this.soldierStats(b).respawn;
  }

  releaseSoldier(s) {
    if (s.target && s.target.blocker === s) s.target.blocker = null;
    s.target = null;
  }

  damage(e, amount, kind, quiet = false) {
    const shred = e.shredT > 0 ? e.shred : 0;
    const resist = Math.max(0, (kind === 'magic' ? e.def.mres : kind === 'fire' || kind === 'poison' ? 0 : e.def.armor) - shred);
    const mark = e.mark && e.mark.t > 0 ? e.mark.mul : 1;
    let dealt = (quiet ? amount : Math.max(1, amount * (1 - resist))) * mark;
    if (e.shieldHp > 0) { const soak = Math.min(e.shieldHp, dealt); e.shieldHp -= soak; dealt -= soak; if (e.shieldHp <= 0) this.emit({ type: 'shieldBreak', x: e.x, y: e.y - 16 }); }
    e.hp -= dealt;
    if (!quiet) this.emit({ type: 'hit', x: e.x, y: e.y - 14, kind, id: e.id });
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      this.gold += e.def.gold;
      this.stats.kills[e.type] = (this.stats.kills[e.type] || 0) + 1;
      if (this.endless) this.score += e.def.gold * 10;
      if (e.blocker) e.blocker.target = null;
      this.emit({ type: 'kill', id: e.id, x: e.x, y: e.y, gold: e.def.gold, enemy: e.type, art: e.def.art, flip: Math.cos(e.angle) < -0.2, boss: !!e.def.boss });
    }
  }

  update(dt) {
    if (this.isOver()) return;
    this.time += dt;

    // spawning and the gap between waves
    while (this.spawnQueue.length && this.spawnQueue[0].t <= this.time) {
      const s = this.spawnQueue.shift();
      this.spawnEnemy(s.type, s.lane);
    }
    if (this.nextWaveTimer !== null) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.startNextWave();
    }

    // support enemies: war drums speed up and strengthen everyone near them
    for (const e of this.enemies) e.buff = 0;
    for (const d of this.enemies) {
      if (d.dead || !d.def.aura || d.portalT > 0) continue;
      for (const e of this.enemies) if (e !== d && !e.dead && Math.hypot(e.x - d.x, e.y - d.y) <= d.def.aura.range) e.buff = Math.max(e.buff, d.def.aura.speed);
    }

    // enemies: walk, fight a blocking soldier, call reinforcements, or slip past the gate
    for (const e of this.enemies) {
      if (e.dead) continue;
      const path = this.paths[e.lane];
      if (e.shredT > 0) e.shredT -= dt;
      if (e.poison) { e.poison.t -= dt; this.damage(e, e.poison.dps * dt, 'poison', true); if (e.poison.t <= 0) e.poison = null; if (e.dead) continue; }
      if (e.portalT > 0) { e.portalT -= dt; if (e.portalT <= 0) { this.placeEnemy(e, path); this.emit({ type: 'portalOut', x: e.x, y: e.y }); } continue; }
      if (e.def.shield) {
        e.shieldCd -= dt;
        if (e.shieldCd <= 0) {
          e.shieldCd = e.def.shield.every;
          // strongest comrades first: bosses, then brutes, down to bandits
          const near = this.enemies.filter((o) => o !== e && !o.dead && o.portalT <= 0 && Math.hypot(o.x - e.x, o.y - e.y) <= e.def.shield.range)
            .sort((a, b) => (b.def.rank || 0) - (a.def.rank || 0) || b.maxHp - a.maxHp).slice(0, e.def.shield.count);
          const amt = e.def.shield.amount * this.scale;
          for (const o of near) { o.shieldHp = Math.max(o.shieldHp, amt); o.shieldMax = amt; }
          if (near.length) this.emit({ type: 'shieldUp', x: e.x, y: e.y, targets: near.map((o) => ({ x: o.x, y: o.y })) });
        }
      }
      if (e.def.sabotage) {
        for (const t of this.towers) {
          if (t.jammedBy && t.jammedBy.has(e.id)) continue;
          if (Math.hypot(t.x - e.x, t.y - e.y) <= e.def.sabotage.range) {
            (t.jammedBy || (t.jammedBy = new Set())).add(e.id);
            t.jam = Math.max(t.jam || 0, e.def.sabotage.time);
            this.emit({ type: 'jam', x: t.x, y: t.y - 30, tower: t });
          }
        }
      }
      if (e.mark) { e.mark.t -= dt; if (e.mark.t <= 0) e.mark = null; }
      const slow = e.slowT > 0 ? e.slowAmt : 0;
      if (e.slowT > 0) e.slowT -= dt;
      if (e.burn) { e.burn.t -= dt; this.damage(e, e.burn.dps * dt, 'fire', true); if (e.burn.t <= 0) e.burn = null; if (e.dead) continue; }
      if (e.stun > 0) { e.stun -= dt; continue; }
      if (e.def.summon) {
        e.summonCd -= dt;
        if (e.summonCd <= 0) {
          e.summonCd = e.def.summon.every;
          for (let i = 0; i < e.def.summon.count; i++) this.spawnEnemy(e.def.summon.type, e.lane, Math.max(0, e.d - 10 - i * 8));
          this.emit({ type: 'summon', x: e.x, y: e.y });
        }
      }
      const b = e.blocker;
      if (b && !b.dead && b.target === e) {
        e.atkCd -= dt;
        if (e.atkCd <= 0) {
          e.atkCd = e.def.atk;
          this.hurtSoldier(b, e.def.dmg * (1 + e.buff));
          this.emit({ type: 'enemyHit', enemy: e });
        }
        continue;
      }
      e.blocker = null;
      // archers stop to shoot soldiers in range instead of walking past them
      if (e.def.ranged) {
        const r = e.def.ranged;
        const victim = this.soldiers.find((s) => !s.dead && Math.hypot(s.x - e.x, s.y - e.y) <= r.range);
        if (victim) {
          e.atkCd -= dt;
          if (e.atkCd <= 0) { e.atkCd = r.rate; this.hurtSoldier(victim, r.dmg); this.emit({ type: 'enemyShot', x: e.x, y: e.y - 20, tx: victim.x, ty: victim.y - 14 }); }
          continue;
        }
      }
      e.walk += dt;
      e.d += e.def.speed * (1 - slow) * (1 + e.buff) * dt;
      // portals: step in, vanish, step out further down the road
      const pts = this.portals[e.lane];
      for (let i = 0; i < pts.length; i++) {
        if (e.ported[i] || e.d < pts[i].from) continue;
        e.ported[i] = true;
        this.emit({ type: 'portalIn', x: e.x, y: e.y, lane: e.lane, portal: i });
        e.d = pts[i].to;
        e.portalT = 0.7;
        e.blocker = null;
        break;
      }
      if (e.portalT > 0) continue;
      if (e.d >= path.length) {
        e.dead = true;
        e.leaked = true;
        this.lives = Math.max(0, this.lives - e.def.lives);
        this.emit({ type: 'leak', lives: e.def.lives });
        continue;
      }
      this.placeEnemy(e, path);
    }

    // barracks soldiers: intercept, hold the line, fight, respawn
    for (const s of this.soldiers) {
      if (s.temp) { s.life -= dt; if (s.life <= 0 && !s.dead) { s.dead = true; this.releaseSoldier(s); } }
      if (s.dead) {
        if (s.temp) continue;
        s.respawnT -= dt;
        if (s.respawnT <= 0) {
          s.dead = false; s.hp = s.maxHp;
          if (s.hero) { s.home = { ...s.start }; this.emit({ type: 'heroBack' }); }
          s.x = s.home.x; s.y = s.home.y;
        }
        continue;
      }
      if (s.hero && s.skillCd > 0) s.skillCd -= dt;
      if (s.hero && s.def.ranged) {
        // ranged heroes walk to where they were sent and shoot from there; they never block the road
        const dx = s.home.x - s.x, dy = s.home.y - s.y, dist = Math.hypot(dx, dy);
        if (dist > 0.5) { const step = Math.min(dist, s.def.speed * dt); s.x += (dx / dist) * step; s.y += (dy / dist) * step; s.facing = dx >= 0 ? 1 : -1; s.target = null; continue; }
        s.atkCd -= dt;
        let target = null, progress = -1;
        for (const e of this.enemies) {
          if (e.dead || e.portalT > 0 || Math.hypot(e.x - s.x, e.y - s.y) > s.def.ranged.range) continue;
          const pr = e.d / this.paths[e.lane].length;
          if (pr > progress) { progress = pr; target = e; }
        }
        s.target = target;
        if (target) {
          s.facing = target.x >= s.x ? 1 : -1;
          if (s.atkCd <= 0) { s.atkCd = s.def.rate; this.projectiles.push({ kind: s.def.ranged.kind, x: s.x, y: s.y - 22, target, dmg: this.roll(s.def.dmg) * this.mul('hero'), speed: s.def.ranged.kind === 'magic' ? 260 : 340 }); }
        } else if (s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + s.def.regen * dt);
        continue;
      }
      const leash = s.hero ? s.def.leash : SOLDIER_LEASH;
      if (s.target && (s.target.dead || (s.target.blocker && s.target.blocker !== s) || Math.hypot(s.target.x - s.home.x, s.target.y - s.home.y) > leash)) this.releaseSoldier(s);
      if (!s.target) {
        let best = null, bd = Infinity;
        for (const e of this.enemies) {
          if (e.dead || e.blocker || e.def.flying || e.evasive || e.portalT > 0) continue;
          if (this.soldiers.some((o) => o !== s && o.target === e)) continue;
          const d = Math.hypot(e.x - s.home.x, e.y - s.home.y);
          if (d < leash * 0.8 && d < bd) { bd = d; best = e; }
        }
        s.target = best;
      }
      const st = this.soldierStats(s);
      const speed = s.hero ? st.speed : 46;
      if (s.target) {
        const e = s.target, dx = e.x - s.x, dy = e.y - s.y, dist = Math.hypot(dx, dy);
        s.facing = dx >= 0 ? 1 : -1;
        if (dist > SOLDIER_REACH - 3) { const step = Math.min(dist - (SOLDIER_REACH - 4), speed * dt); s.x += (dx / dist) * step; s.y += (dy / dist) * step; }
        if (dist <= SOLDIER_REACH) {
          if (!e.blocker) e.blocker = s;
          s.atkCd -= dt;
          if (s.atkCd <= 0) { s.atkCd = st.rate; this.damage(e, this.roll(st.dmg) * (s.hero ? this.mul('hero') : 1), 'physical'); }
        }
      } else {
        const dx = s.home.x - s.x, dy = s.home.y - s.y, dist = Math.hypot(dx, dy);
        if (dist > 0.5) { const step = Math.min(dist, (s.hero ? speed : 40) * dt); s.x += (dx / dist) * step; s.y += (dy / dist) * step; s.facing = dx >= 0 ? 1 : -1; }
        if (s.hero && s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + st.regen * dt);
      }
    }
    this.soldiers = this.soldiers.filter((s) => !(s.temp && s.dead));

    // spell cooldowns and timed area effects (Arrow Rain lands in volleys)
    for (const sp of Object.values(this.spells)) if (sp.cd > 0) sp.cd = Math.max(0, sp.cd - dt);
    for (const a of this.areaEffects) {
      a.t -= dt;
      if (a.t > 0) continue;
      a.t = a.interval; a.ticks--;
      for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - a.x, e.y - a.y) <= a.r) this.damage(e, a.dmg, a.kind);
      this.emit({ type: 'volley', x: a.x, y: a.y, r: a.r });
    }
    this.areaEffects = this.areaEffects.filter((a) => a.ticks > 0);

    // towers pick the enemy furthest along the road within range
    for (const t of this.towers) {
      if (t.def.kind === 'soldiers') continue;
      if (t.jam > 0) { t.jam -= dt; continue; }
      t.cd -= dt;
      if (t.cd > 0) continue;
      const st = t.def.tiers[t.tier], range = st.range * t.rangeBonus;
      if (t.def.kind === 'aura') {
        t.cd = st.rate;
        for (const e of this.enemies) {
          if (e.dead || e.def.flying || Math.hypot(e.x - t.x, (e.y - t.y) * 1.2) > range) continue;
          e.slowAmt = e.slowT > 0 ? Math.max(e.slowAmt, st.slow) : st.slow;
          e.slowT = st.rate + 0.15;
        }
        for (const s of this.soldiers) if (!s.dead && s.hp < s.maxHp && Math.hypot(s.x - t.x, (s.y - t.y) * 1.2) <= range) s.hp = Math.min(s.maxHp, s.hp + st.heal * st.rate);
        continue;
      }
      if (t.def.kind === 'elephant') {
        // charge back up the road from the rally point when enemies are coming
        if (!t.rally) this.setRally(t);
        const r = t.rally;
        const coming = this.enemies.some((e) => !e.dead && e.portalT <= 0 && e.lane === r.lane && e.d < r.d + 10 && e.d > r.d - st.range);
        if (!coming) { t.cd = 0.4; continue; }
        t.cd = st.rate;
        this.beasts.push({ id: this.nextId++, tower: t, lane: r.lane, d: r.d, end: Math.max(0, r.d - st.range), x: r.x, y: r.y, angle: 0, hits: new Set(), dmg: st.dmg * this.mul('royal'), knock: st.knock, stun: st.stun, done: false, walk: 0 });
        this.emit({ type: 'charge', tower: t });
        continue;
      }
      let target = null, progress = -1;
      for (const e of this.enemies) {
        if (e.dead || e.portalT > 0 || (e.def.flying && !t.def.air)) continue;
        if (Math.hypot(e.x - t.x, e.y - (t.y - 6)) > range) continue;
        const pr = e.d / this.paths[e.lane].length;
        if (pr > progress) { progress = pr; target = e; }
      }
      if (!target) continue;
      t.cd = st.rate;
      t.aim = Math.atan2(target.y - t.y, target.x - t.x);
      // cannonballs leave from the muzzle of the turned barrel; arrows and spells from the top
      let sx = t.x, sy = t.y - (t.def.kind === 'flask' ? 30 : 44);
      if (t.def.kind === 'shell') { sx = t.x - 5 + Math.cos(t.aim) * 27; sy = t.y - 22 + Math.sin(t.aim) * 27; }
      const dmg = this.roll(st.dmg) * this.mul(t.def.royal ? 'royal' : t.type);
      if (t.def.kind === 'shell' || t.def.kind === 'flask') {
        const flight = Math.max(0.5, Math.hypot(target.x - sx, target.y - sy) / 170);
        this.projectiles.push({ kind: t.def.kind, sx, sy, tx: target.x, ty: target.y, t: 0, flight, dmg, splash: st.splash, x: sx, y: sy, shred: st.shred, poison: st.poison, poisonTime: st.poisonTime });
      } else {
        this.projectiles.push({ kind: t.def.kind, x: sx, y: sy, target, dmg, speed: t.def.kind === 'magic' ? 260 : t.def.kind === 'falcon' ? 300 : 340, mark: st.mark });
      }
      this.emit({ type: 'fire', tower: t });
    }

    // war elephants: trample back up the road, knocking enemies back
    for (const b of this.beasts) {
      const path = this.paths[b.lane];
      b.d -= 105 * dt; b.walk += dt;
      const p = path.at(Math.max(0, b.d)); b.x = p.x; b.y = p.y; b.angle = p.angle;
      for (const e of this.enemies) {
        if (e.dead || e.portalT > 0 || b.hits.has(e.id) || e.def.flying) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) > 16) continue;
        b.hits.add(e.id);
        this.damage(e, b.dmg, 'physical');
        if (!e.dead) { if (!e.def.boss) { e.d = Math.max(0, e.d - b.knock); this.placeEnemy(e, this.paths[e.lane]); } e.stun = Math.max(e.stun || 0, b.stun); }
      }
      if (b.d <= b.end) { b.done = true; this.emit({ type: 'beastDone', x: b.x, y: b.y }); }
    }
    this.beasts = this.beasts.filter((b) => !b.done);

    // projectiles: arrows and magic home in, cannon shells arc to a spot and splash
    for (const p of this.projectiles) {
      if (p.kind === 'shell' || p.kind === 'flask') {
        p.t += dt / p.flight;
        const k = Math.min(1, p.t);
        p.x = p.sx + (p.tx - p.sx) * k;
        p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 40;
        if (p.t >= 1) {
          p.done = true;
          for (const e of this.enemies) {
            if (e.dead || e.def.flying) continue;
            const d = Math.hypot(e.x - p.tx, e.y - p.ty);
            if (d > p.splash) continue;
            this.damage(e, p.dmg * (1 - (d / p.splash) * 0.5), p.kind === 'flask' ? 'poison' : 'physical');
            if (p.kind === 'flask' && !e.dead) { e.shred = p.shred; e.shredT = 4; e.poison = { dps: p.poison, t: p.poisonTime }; }
          }
          this.emit({ type: p.kind === 'flask' ? 'poisonCloud' : 'explosion', x: p.tx, y: p.ty, r: p.splash });
        }
        continue;
      }
      const e = p.target;
      if (e.dead) { p.done = true; continue; }
      const tx = e.x, ty = e.y - 14, dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy);
      p.angle = Math.atan2(dy, dx);
      const step = p.speed * dt;
      if (dist <= Math.max(step, HIT_RADIUS)) {
        p.done = true;
        this.damage(e, p.dmg, p.kind === 'magic' ? 'magic' : 'physical');
        if (p.kind === 'arrow') this.emit({ type: 'arrowHit', x: e.x, y: e.y });
        if (p.mark && !e.dead) e.mark = { mul: p.mark.mul, t: p.mark.t };
      }
      else { p.x += (dx / dist) * step; p.y += (dy / dist) * step; }
    }

    this.projectiles = this.projectiles.filter((p) => !p.done);
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (this.lives <= 0) { this.state = 'lost'; this.emit({ type: 'lost' }); return; }
    if (this.waveIndex === this.waveCount - 1 && !this.spawnQueue.length && !this.enemies.length) {
      this.state = 'won';
      this.emit({ type: 'won', diyas: this.diyas() });
    }
  }
}
