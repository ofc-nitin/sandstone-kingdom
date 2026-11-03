// The battle simulation. No drawing and no DOM here: the renderer reads this state and
// the tests drive it directly. Everything advances in update(dt).
import { makePath } from './path.js';
import { ENEMIES, TOWERS, SELL_REFUND, HEROES, SPELLS, SPELL_ORDER } from './data.js';

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
  constructor(level, { seed = 1, seen = {} } = {}) {
    this.level = level;
    this.paths = level.paths.map((spec) => makePath(spec));
    this.rng = createRng(seed);
    this.gold = level.gold;
    this.maxLives = level.lives ?? 20;
    this.lives = this.maxLives;
    this.time = 0;
    this.state = 'ready'; // ready -> playing -> won | lost
    this.plots = level.plots.map((p, id) => ({ id, x: p.x, y: p.y, lock: p.lock ? { ...p.lock } : null, royal: !!p.royal, tower: null }));
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
    for (const name of level.spells ?? SPELL_ORDER) this.spells[name] = { cd: 0 };
    this.hero = null;
    if (level.hero !== false) this.spawnHero(level.hero || 'sunKnight');
  }

  // ---------------------------------------------------------------- hero
  spawnHero(type) {
    const def = HEROES[type], path = this.paths[0];
    const start = this.level.heroStart || (() => { const p = path.at(path.length * 0.55); return { x: p.x, y: p.y }; })();
    const h = { id: this.nextId++, hero: type, def, start: { ...start }, home: { ...start }, x: start.x, y: start.y, hp: def.hp, maxHp: def.hp, armor: def.armor, target: null, atkCd: 0, dead: false, respawnT: 0, facing: 1, skillCd: 0 };
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
    for (const e of this.enemies) {
      if (e.dead || Math.hypot(e.x - h.x, e.y - h.y) > sk.radius) continue;
      this.damage(e, sk.dmg, 'magic');
      e.stun = Math.max(e.stun || 0, sk.stun);
    }
    this.emit({ type: 'heroSkill', x: h.x, y: h.y, r: sk.radius });
    return true;
  }

  // ---------------------------------------------------------------- spells
  castSpell(name, x, y) {
    const sp = this.spells[name], def = SPELLS[name];
    if (!sp || sp.cd > 0 || this.isOver() || this.state === 'ready') return false;
    sp.cd = def.cooldown;
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
    this.emit({ type: 'spell', spell: name, x, y, r: def.radius || 30 });
    return true;
  }

  soldierStats(s) {
    if (s.hero) return s.def;
    if (s.temp) return s.stats;
    return s.tower.def.tiers[s.tower.tier];
  }

  get waveCount() { return this.level.waves.length; }
  get canCallWave() { return this.state === 'ready' || (this.nextWaveTimer !== null && this.waveIndex < this.waveCount - 1); }

  emit(e) { this.events.push(e); }
  drainEvents() { const e = this.events; this.events = []; return e; }
  roll([lo, hi]) { return lo + (hi - lo) * this.rng(); }

  // ---------------------------------------------------------------- player actions
  build(plotId, type) {
    const plot = this.plots[plotId], def = TOWERS[type];
    if (!plot || !def || plot.tower || plot.lock || this.isOver()) return false;
    const cost = def.tiers[0].cost;
    if (this.gold < cost) return false;
    this.gold -= cost;
    const tower = { id: this.nextId++, type, def, tier: 0, plot, x: plot.x, y: plot.y, cd: 0.3, spent: cost, rangeBonus: plot.royal ? 1.15 : 1 };
    plot.tower = tower;
    this.towers.push(tower);
    if (def.kind === 'soldiers') this.spawnSoldiers(tower);
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
    if (tower.def.kind === 'soldiers') {
      const st = tower.def.tiers[tower.tier];
      for (const s of this.soldiers.filter((x) => x.tower === tower)) { s.maxHp = st.hp; s.hp = st.hp; s.armor = st.armor; }
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
    if (!plot || !plot.lock || plot.lock.type !== 'gold' || this.isOver()) return false;
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
      bonus = Math.ceil(this.nextWaveTimer) * EARLY_CALL_GOLD_PER_SECOND;
      this.gold += bonus;
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
    const wave = this.level.waves[this.waveIndex];
    for (const gr of wave) {
      for (let i = 0; i < gr.count; i++) this.spawnQueue.push({ t: this.time + (gr.delay || 0) + i * (gr.every ?? 1.2), type: gr.type, lane: gr.lane || 0, wave: this.waveIndex });
    }
    this.spawnQueue.sort((a, b) => a.t - b.t);
    for (const plot of this.plots) {
      if (plot.lock && plot.lock.type === 'wave' && this.waveIndex + 1 >= plot.lock.wave) {
        plot.lock = null;
        this.emit({ type: 'plotOpened', plot, paid: false });
      }
    }
    this.emit({ type: 'waveStart', wave: this.waveIndex });
  }

  spawnEnemy(type, lane, d = 0) {
    const def = ENEMIES[type], path = this.paths[lane];
    const hp = Math.round(def.hp * (this.level.hpScale ?? 1));
    const e = {
      id: this.nextId++, type, def, lane, d, hp, maxHp: hp, offset: (this.rng() - 0.5) * 14,
      x: 0, y: 0, angle: 0, blocker: null, atkCd: 0, summonCd: def.summon ? def.summon.every : 0, walk: this.rng() * 10,
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

  spawnSoldiers(tower) {
    const st = tower.def.tiers[tower.tier];
    let best = null;
    this.paths.forEach((path, lane) => { const n = path.nearest(tower.x, tower.y); if (!best || n.dist < best.dist) best = { ...n, lane, path }; });
    const rd = Math.max(20, Math.min(best.path.length - 20, best.d));
    const c = best.path.at(rd);
    tower.rally = { x: c.x, y: c.y };
    for (let i = 0; i < st.soldiers; i++) {
      const a = c.angle + Math.PI / 2, off = (i - (st.soldiers - 1) / 2) * 9;
      const home = { x: c.x + Math.cos(a) * off + Math.cos(c.angle) * (i % 2 ? 4 : -4), y: c.y + Math.sin(a) * off };
      this.soldiers.push({ id: this.nextId++, tower, slot: i, home, x: home.x, y: home.y, hp: st.hp, maxHp: st.hp, armor: st.armor, target: null, atkCd: 0, dead: false, respawnT: 0, facing: 1 });
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
    const resist = kind === 'magic' ? e.def.mres : kind === 'fire' ? 0 : e.def.armor;
    const dealt = quiet ? amount : Math.max(1, amount * (1 - resist));
    e.hp -= dealt;
    if (!quiet) this.emit({ type: 'hit', x: e.x, y: e.y - 14, kind });
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      this.gold += e.def.gold;
      if (e.blocker) e.blocker.target = null;
      this.emit({ type: 'kill', x: e.x, y: e.y, gold: e.def.gold, enemy: e.type });
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
    if (this.state === 'playing' && this.nextWaveTimer === null && !this.spawnQueue.length && this.waveIndex < this.waveCount - 1) {
      this.nextWaveTimer = WAVE_GAP;
    }
    if (this.nextWaveTimer !== null) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.startNextWave();
    }

    // enemies: walk, fight a blocking soldier, call reinforcements, or slip past the gate
    for (const e of this.enemies) {
      if (e.dead) continue;
      const path = this.paths[e.lane];
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
          this.hurtSoldier(b, e.def.dmg);
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
      e.d += e.def.speed * dt;
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
      const leash = s.hero ? s.def.leash : SOLDIER_LEASH;
      if (s.target && (s.target.dead || (s.target.blocker && s.target.blocker !== s) || Math.hypot(s.target.x - s.home.x, s.target.y - s.home.y) > leash)) this.releaseSoldier(s);
      if (!s.target) {
        let best = null, bd = Infinity;
        for (const e of this.enemies) {
          if (e.dead || e.blocker || e.def.flying) continue;
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
          if (s.atkCd <= 0) { s.atkCd = st.rate; this.damage(e, this.roll(st.dmg), 'physical'); }
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
      t.cd -= dt;
      if (t.cd > 0) continue;
      const st = t.def.tiers[t.tier], range = st.range * t.rangeBonus;
      let target = null, progress = -1;
      for (const e of this.enemies) {
        if (e.dead || (e.def.flying && !t.def.air)) continue;
        if (Math.hypot(e.x - t.x, e.y - (t.y - 6)) > range) continue;
        const pr = e.d / this.paths[e.lane].length;
        if (pr > progress) { progress = pr; target = e; }
      }
      if (!target) continue;
      t.cd = st.rate;
      t.aim = Math.atan2(target.y - t.y, target.x - t.x);
      const sx = t.x, sy = t.y - (t.def.kind === 'shell' ? 26 : 44);
      const dmg = this.roll(st.dmg);
      if (t.def.kind === 'shell') {
        const flight = Math.max(0.5, Math.hypot(target.x - sx, target.y - sy) / 170);
        this.projectiles.push({ kind: 'shell', sx, sy, tx: target.x, ty: target.y, t: 0, flight, dmg, splash: st.splash, x: sx, y: sy });
      } else {
        this.projectiles.push({ kind: t.def.kind, x: sx, y: sy, target, dmg, speed: t.def.kind === 'magic' ? 260 : 340 });
      }
      this.emit({ type: 'fire', tower: t });
    }

    // projectiles: arrows and magic home in, cannon shells arc to a spot and splash
    for (const p of this.projectiles) {
      if (p.kind === 'shell') {
        p.t += dt / p.flight;
        const k = Math.min(1, p.t);
        p.x = p.sx + (p.tx - p.sx) * k;
        p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 40;
        if (p.t >= 1) {
          p.done = true;
          for (const e of this.enemies) {
            if (e.dead || e.def.flying) continue;
            const d = Math.hypot(e.x - p.tx, e.y - p.ty);
            if (d <= p.splash) this.damage(e, p.dmg * (1 - (d / p.splash) * 0.5), 'physical');
          }
          this.emit({ type: 'explosion', x: p.tx, y: p.ty, r: p.splash });
        }
        continue;
      }
      const e = p.target;
      if (e.dead) { p.done = true; continue; }
      const tx = e.x, ty = e.y - 14, dx = tx - p.x, dy = ty - p.y, dist = Math.hypot(dx, dy);
      p.angle = Math.atan2(dy, dx);
      const step = p.speed * dt;
      if (dist <= Math.max(step, HIT_RADIUS)) { p.done = true; this.damage(e, p.dmg, p.kind === 'magic' ? 'magic' : 'physical'); }
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
