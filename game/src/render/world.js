// Draws the battlefield: background, build spots, towers, soldiers, enemies, shots, effects and
// the little things that make it feel alive (cloud shadows, birds, butterflies, petals).
import { blit } from './raster.js';
import { UNIT_SCALE, stageOf, CREW, STAGE_SCALE, liveScenery } from './assets.js';

const WALK = ['w1', 'idle', 'w2', 'idle'];
const frameKey = (base, f, assets) => (f === 'idle' || !assets.get(base + ':' + f) ? base : base + ':' + f);

export class WorldRenderer {
  constructor() { this.reset(); }

  reset() {
    this.effects = []; this.shake = 0; this.clock = 0;
    this.flash = new Map(); // enemy id -> seconds of white hit flash left
    this.towerFx = new Map(); // tower id -> { born, up, fire }
    this.ambient = null;
    this.arc = new WeakMap(); // arrow -> where it left the bow, for its curved flight
    this.steps = new Map(); // heavy walker id -> seconds to the next dust puff
    this.hudAt = null; // world points of the gold and lives counters, set by the HUD
  }

  // Turn game events into short-lived visual effects.
  onEvent(e) {
    const fx = (o) => this.effects.push({ t: 0, ...o });
    const gate = this.gate || { x: 0, y: 0 };
    const tfx = (t) => { let o = this.towerFx.get(t.id); if (!o) this.towerFx.set(t.id, (o = { born: 9, up: 9, fire: 9, angle: 0, target: 0 })); return o; };
    if (e.type === 'hit') { fx({ kind: e.kind === 'magic' ? 'magicHit' : 'spark', x: e.x, y: e.y, life: 0.25 }); if (e.id) this.flash.set(e.id, 0.1); }
    if (e.type === 'kill') {
      if (e.id) this.steps.delete(e.id);
      fx({ kind: 'coin', x: e.x, y: e.y - 30, text: `+${e.gold}`, life: 0.9 });
      // a few coins hop up and fly to the gold counter
      const n = Math.min(5, 1 + Math.floor(e.gold / 8));
      for (let i = 0; i < n; i++) fx({ kind: 'coinFly', x: e.x, y: e.y - 14, dx: (Math.random() - 0.5) * 30, delay: i * 0.06, life: 0.95 + i * 0.06 });
      fx({ kind: 'fall', x: e.x, y: e.y, art: e.art, flip: e.flip, boss: e.boss, life: e.boss ? 1.4 : 0.75 });
    }
    if (e.type === 'banish') fx({ kind: 'poof', x: e.x, y: e.y - 8, life: 0.45 });
    if (e.type === 'explosion') { fx({ kind: 'boom', x: e.x, y: e.y, r: e.r, life: 0.5 }); fx({ kind: 'scorch', x: e.x, y: e.y, r: e.r, life: 6 }); this.shake = Math.max(this.shake, 0.12); }
    if (e.type === 'poisonCloud') fx({ kind: 'poison', x: e.x, y: e.y, r: e.r, life: 2.2 });
    if (e.type === 'plotOpened') { fx({ kind: 'dust', x: e.plot.x, y: e.plot.y, life: 0.7 }); if (e.plot.royal) fx({ kind: 'pillar', x: e.plot.x, y: e.plot.y, life: 1.1 }); }
    if (e.type === 'soldierDown') fx({ kind: 'poof', x: e.x, y: e.y - 8, life: 0.45 });
    if (e.type === 'summon') fx({ kind: 'smoke', x: e.x, y: e.y - 10, life: 0.8 });
    if (e.type === 'built') { tfx(e.tower).born = 0; fx({ kind: 'dust', x: e.tower.x, y: e.tower.y, life: 0.7 }); }
    if (e.type === 'upgraded') {
      tfx(e.tower).up = 0;
      fx({ kind: 'pillar', x: e.tower.x, y: e.tower.y, life: 1 });
      fx({ kind: 'ring', x: e.tower.x, y: e.tower.y, r: 40, life: 0.6 });
      fx({ kind: 'levelUp', x: e.tower.x, y: e.tower.y - 80, text: e.tower.def.royal ? `LEVEL ${e.tower.tier + 1}` : 'UPGRADED!', life: 1.2 });
    }
    if (e.type === 'fire') { const o = tfx(e.tower); o.fire = 0; if (e.tower.aim !== undefined) o.target = e.tower.aim; if (e.tower.def.kind === 'shell') { const ta = e.tower.aim || 0; fx({ kind: 'muzzle', x: e.tower.x - 5 + Math.cos(ta) * 29, y: e.tower.y - 22 + Math.sin(ta) * 29, life: 0.35 }); } if (e.tower.def.kind === 'magic') fx({ kind: 'cast', x: e.tower.x, y: e.tower.y - 74, life: 0.3 }); }
    if (e.type === 'bossArrives') this.shake = 0.5;
    if (e.type === 'leak') { this.leak = 0; this.shake = Math.max(this.shake, 0.18); fx({ kind: 'heartFly', x: gate.x, y: gate.y - 40, life: 0.9 }); fx({ kind: 'debris', x: gate.x, y: gate.y - 20, life: 0.8, seed: Math.random() * 9 }); }
    if (e.type === 'sold') { fx({ kind: 'crumble', x: e.tower.x, y: e.tower.y, life: 0.9, seed: Math.random() * 9 }); fx({ kind: 'coin', x: e.tower.x, y: e.tower.y - 50, text: `+${e.refund}`, life: 1.1 }); this.towerFx.delete(e.tower.id); }
    if (e.type === 'built') fx({ kind: 'cost', x: e.tower.x, y: e.tower.y - 56, text: `-${e.tower.spent || e.tower.def.tiers[0].cost}`, life: 1 });
    if (e.type === 'arrowHit' && Math.random() < 0.3) fx({ kind: 'stuck', x: e.x + (Math.random() - 0.5) * 18, y: e.y + 12 + Math.random() * 6, a: -0.6 - Math.random() * 0.8, life: 3 });
    if (e.type === 'volley') fx({ kind: 'volley', x: e.x, y: e.y, r: e.r, life: 0.45, seed: Math.random() * 100 });
    if (e.type === 'spell' && e.spell === 'holyFire') { fx({ kind: 'holy', x: e.x, y: e.y, r: e.r, life: 0.9 }); this.shake = Math.max(this.shake, 0.15); }
    if (e.type === 'spell' && e.spell === 'reinforcements') fx({ kind: 'dust', x: e.x, y: e.y, life: 0.7 });
    if (e.type === 'heroSkill') { fx({ kind: 'shock', x: e.x, y: e.y - 6, r: e.r, life: 0.6 }); this.shake = Math.max(this.shake, 0.2); }
    if (e.type === 'enemyShot') fx({ kind: 'shot', x: e.x, y: e.y, tx: e.tx, ty: e.ty, life: 0.25 });
    if (e.type === 'heroMove') fx({ kind: 'flag', x: e.x, y: e.y, life: 1.2 });
    if (e.type === 'heroDown') fx({ kind: 'poof', x: e.x, y: e.y - 10, life: 0.7 });
    if (e.type === 'shieldUp') for (const t of e.targets) fx({ kind: 'beam', x: e.x, y: e.y - 16, tx: t.x, ty: t.y - 16, life: 0.5 });
    if (e.type === 'shieldBreak') fx({ kind: 'shards', x: e.x, y: e.y, life: 0.5 });
    if (e.type === 'jam') fx({ kind: 'smoke', x: e.x, y: e.y, life: 1.6 });
    if (e.type === 'portalIn' || e.type === 'portalOut') fx({ kind: 'warp', x: e.x, y: e.y - 10, life: 0.5 });
    if (e.type === 'charge') this.shake = Math.max(this.shake, 0.08);
    if (e.type === 'beastDone') fx({ kind: 'dust', x: e.x, y: e.y, life: 0.6 });
  }

  update(dt) {
    this.clock += dt;
    for (const f of this.effects) f.t += dt;
    this.effects = this.effects.filter((f) => f.t < f.life);
    for (const [id, v] of this.flash) { if (v - dt <= 0) this.flash.delete(id); else this.flash.set(id, v - dt); }
    for (const o of this.towerFx.values()) {
      o.born += dt; o.up += dt; o.fire += dt;
      // crews and barrels swing round toward the last target, quickly but not instantly
      let d = o.target - o.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      o.angle += d * Math.min(1, dt * 12);
    }
    this.shake = Math.max(0, this.shake - dt);
    if (this.leak !== undefined) this.leak += dt;
    if (this.ambient) this.updateAmbient(dt);
  }

  // ---------------------------------------------------------------- ambient life
  initAmbient(game) {
    const r = (a, b) => a + Math.random() * (b - a);
    this.ambient = {
      clouds: Array.from({ length: 4 }, (_, i) => ({ x: r(-200, 900), y: r(20, 360), rx: r(90, 150), ry: r(40, 70), v: r(6, 12) * (i % 2 ? 1 : 0.8) })),
      birds: [], birdT: r(4, 10),
      butterflies: Array.from({ length: 5 }, () => ({ x: r(40, 800), y: r(60, 360), a: r(0, 6), c: ['#ffd25a', '#ff9fc0', '#9fdcff', '#ffffff'][Math.floor(r(0, 4))] })),
      petals: Array.from({ length: 14 }, () => ({ x: r(-40, 880), y: r(-40, 400), s: r(0.6, 1.2), a: r(0, 6) })),
      live: liveScenery(game.level, game.paths),
      embers: [], ripples: [],
    };
  }
  updateAmbient(dt) {
    const A = this.ambient;
    for (const c of A.clouds) { c.x += c.v * dt; if (c.x - c.rx > 960) c.x = -260; }
    A.birdT -= dt;
    if (A.birdT <= 0) {
      A.birdT = 8 + Math.random() * 10;
      const y = 30 + Math.random() * 120, n = 3 + Math.floor(Math.random() * 3), dir = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) A.birds.push({ x: dir > 0 ? -40 - i * 14 : 900 + i * 14, y: y + (i % 2) * 8 + i * 3, v: 46 * dir, f: Math.random() * 6 });
    }
    for (const b of A.birds) { b.x += b.v * dt; b.f += dt * 9; }
    A.birds = A.birds.filter((b) => b.x > -120 && b.x < 980);
    for (const b of A.butterflies) { b.a += dt; b.x += Math.cos(b.a * 0.7) * 14 * dt; b.y += Math.sin(b.a * 1.3) * 9 * dt; }
    for (const it of A.live) {
      if (it.kind === 'campfire' && Math.random() < dt * 5) A.embers.push({ x: it.x + (Math.random() - 0.5) * 6 * it.s, y: it.y - 10 * it.s, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 16, t: 0, life: 0.8 + Math.random() * 0.8 });
      if (it.kind === 'pond' && Math.random() < dt * 0.9) A.ripples.push({ x: it.x + (Math.random() - 0.5) * 50 * it.s, y: it.y + (Math.random() - 0.5) * 14 * it.s, t: 0, life: 1.8, s: it.s });
    }
    for (const m of A.embers) { m.t += dt; m.x += (m.vx + Math.sin(m.t * 6) * 6) * dt; m.y += m.vy * dt; }
    for (const q of A.ripples) q.t += dt;
    A.embers = A.embers.filter((m) => m.t < m.life); A.ripples = A.ripples.filter((q) => q.t < q.life);
    for (const p of A.petals) { p.a += dt; p.x += (10 + Math.sin(p.a) * 8) * dt; p.y += 14 * dt * p.s; if (p.y > 410 || p.x > 900) { p.y = -20; p.x = Math.random() * 860 - 40; } }
  }
  drawAmbientGround(ctx) {
    const A = this.ambient;
    if (!A) return;
    // soft cloud shadows drifting over the battlefield
    ctx.fillStyle = 'rgba(20,40,10,0.08)';
    for (const c of A.clouds) { ctx.beginPath(); ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2); ctx.fill(); }
    // ponds: rings spreading where a fish or a drop broke the surface, and a slow glint
    ctx.lineWidth = 0.8;
    for (const q of A.ripples) { const k = q.t / q.life; ctx.strokeStyle = `rgba(235,250,255,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, (2 + 9 * k) * q.s, (0.8 + 3.4 * k) * q.s, 0, 0, Math.PI * 2); ctx.stroke(); }
    for (const it of A.live) if (it.kind === 'pond') {
      const g = (Math.sin(this.clock * 0.9 + it.x) + 1) / 2;
      ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.2 * g})`; ctx.beginPath(); ctx.ellipse(it.x - 10 * it.s + g * 12 * it.s, it.y - 3 * it.s, 7 * it.s, 1.4 * it.s, 0, 0, Math.PI * 2); ctx.fill();
    }
    // campfires: warm light on the grass that breathes with the flame
    for (const it of A.live) if (it.kind === 'campfire') {
      const fl = 0.8 + 0.2 * Math.sin(this.clock * 13 + it.x) * Math.sin(this.clock * 7.3);
      const r = 34 * it.s * fl, gr = ctx.createRadialGradient(it.x, it.y - 4, 0, it.x, it.y - 4, r);
      gr.addColorStop(0, 'rgba(255,190,90,0.35)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(it.x, it.y - 2, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawAmbientAir(ctx) {
    const A = this.ambient;
    if (!A) return;
    for (const b of A.butterflies) {
      const flap = Math.abs(Math.sin(b.a * 14)) * 3 + 0.8;
      ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.ellipse(b.x - flap / 2, b.y, flap, 2.2, -0.4, 0, Math.PI * 2); ctx.ellipse(b.x + flap / 2, b.y, flap, 2.2, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    for (const it of A.live) if (it.kind === 'campfire') {
      // a living flame over the painted one: it leans, stretches and flickers
      const t = this.clock * 9 + it.x, h = (14 + Math.sin(t) * 2.5 + Math.sin(t * 2.3) * 1.5) * it.s, lean = Math.sin(t * 0.6) * 2 * it.s;
      ctx.fillStyle = 'rgba(255,120,30,0.9)'; ctx.beginPath(); ctx.moveTo(it.x - 5 * it.s, it.y - 1 * it.s); ctx.quadraticCurveTo(it.x - 6 * it.s, it.y - h * 0.6, it.x + lean, it.y - h - 2 * it.s); ctx.quadraticCurveTo(it.x + 6 * it.s, it.y - h * 0.6, it.x + 5 * it.s, it.y - 1 * it.s); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,140,0.95)'; ctx.beginPath(); ctx.moveTo(it.x - 2.4 * it.s, it.y - 1 * it.s); ctx.quadraticCurveTo(it.x - 2.5 * it.s, it.y - h * 0.45, it.x + lean * 0.6, it.y - h * 0.7); ctx.quadraticCurveTo(it.x + 2.5 * it.s, it.y - h * 0.45, it.x + 2.4 * it.s, it.y - 1 * it.s); ctx.fill();
    }
    for (const m of A.embers) { ctx.fillStyle = `rgba(255,${180 - m.t * 80},60,${1 - m.t / m.life})`; ctx.fillRect(m.x - 0.8, m.y - 0.8, 1.6, 1.6); }
    ctx.fillStyle = 'rgba(255,190,210,0.85)';
    for (const p of A.petals) { ctx.beginPath(); ctx.ellipse(p.x, p.y, 2.4 * p.s, 1.2 * p.s, p.a, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (const b of A.birds) {
      const w = Math.sin(b.f) * 3;
      ctx.beginPath(); ctx.moveTo(b.x - 6, b.y - w); ctx.quadraticCurveTo(b.x - 3, b.y - 2, b.x, b.y); ctx.quadraticCurveTo(b.x + 3, b.y - 2, b.x + 6, b.y - w); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  draw(ctx, view, game, assets, ui) {
    const { dpr, s, ox, oy } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (assets.bg) ctx.drawImage(assets.bg.canvas, 0, 0, view.cssW, view.cssH);
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * 6 * this.shake; sy = (Math.random() - 0.5) * 6 * this.shake; }
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + sx), dpr * (oy + sy));
    if (!this.ambient) this.initAmbient(game);
    this.gate = game.level.gate;
    // where the HUD counters sit, in world units, so coins and hearts can fly to them
    const toWorld = (q) => (q ? { x: (q.x - ox) / s, y: (q.y - oy) / s } : null);
    this.hudAt = { gold: toWorld(ui.goldAt), lives: toWorld(ui.livesAt) };
    this.drawAmbientGround(ctx);
    for (const f of this.effects) if (f.kind === 'stuck') {
      // a spent arrow in the dirt, fading out
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - f.t / f.life) * 3); ctx.translate(f.x, f.y); ctx.rotate(f.a);
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 0); ctx.stroke();
      ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-11, 0); ctx.stroke(); ctx.restore();
    }
    for (const f of this.effects) if (f.kind === 'scorch') { ctx.fillStyle = `rgba(40,24,12,${0.25 * (1 - f.t / f.life)})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.7, f.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }

    // portals: swirling rings where enemies vanish and reappear
    game.portals.forEach((list) => list.forEach((pt) => { for (const end of [pt.a, pt.b]) this.portal(ctx, end.x, end.y - 6); }));

    // build spots
    for (const p of game.plots) {
      if (p.tower) continue;
      const sel = ui.menu && ui.menu.plotId === p.id;
      const name = p.royal ? (p.lock ? 'plot:specialLocked' : 'plot:special') : !p.lock ? 'plot:open' : 'plot:rubble';
      const sprite = assets.get(name);
      if (sprite) blit(ctx, sprite, p.x, p.y, 1);
      if (p.royal && p.lock && p.lock.wave) {
        ctx.font = '900 8px Martel, serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.4; ctx.strokeStyle = '#3a2414'; ctx.fillStyle = '#ffd66b';
        const label = `wave ${p.lock.wave}`; ctx.strokeText(label, p.x, p.y + 15); ctx.fillText(label, p.x, p.y + 15);
      }
      if (sel || ui.pointAt === p.id) {
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 1, 26, 11, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,244,220,0.95)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // the fountain's holy water, always visible
    for (const t of game.towers) if (t.def.kind === 'aura') {
      const r = t.def.tiers[t.tier].range * t.rangeBonus, k = 0.5 + 0.5 * Math.sin(this.clock * 2 + t.id);
      ctx.beginPath(); ctx.ellipse(t.x, t.y, r, r / 1.2 * 0.62, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(110,200,255,${0.1 + 0.05 * k})`; ctx.fill();
      ctx.strokeStyle = `rgba(160,225,255,${0.35 + 0.25 * k})`; ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -this.clock * 8; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    // war drums: a pulsing ring on the beat
    for (const e of game.enemies) if (e.def.aura && e.portalT <= 0) {
      const beat = (this.clock * 2) % 1;
      ctx.strokeStyle = `rgba(255,90,60,${0.5 * (1 - beat)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.def.aura.range * beat, e.def.aura.range * beat * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // range of the selected tower
    const selTower = ui.menu && ui.menu.towerId ? game.towers.find((t) => t.id === ui.menu.towerId) : null;
    if (selTower && selTower.def.kind !== 'soldiers') this.range(ctx, selTower.x, selTower.y - 6, selTower.def.tiers[selTower.tier].range * selTower.rangeBonus);
    if (selTower && selTower.rally) this.range(ctx, selTower.rally.x, selTower.rally.y, 40, true);

    // depth-sorted actors
    const actors = [];
    for (const t of game.towers) actors.push({ y: t.y, draw: () => this.drawTower(ctx, t, assets) });
    for (const so of game.soldiers) {
      if (so.dead) continue;
      const base = so.hero ? 'hero:' + so.hero : 'soldier:' + (so.temp ? so.stats.art : so.tower.def.tiers[so.tower.tier].art);
      const fighting = so.target && Math.hypot(so.target.x - so.x, so.target.y - so.y) <= 14;
      const moving = !fighting && Math.hypot(so.home.x - so.x, so.home.y - so.y) > 1.5;
      const f = fighting ? (Math.floor(this.clock * 5 + so.id) % 2 ? 'a2' : 'a1') : moving ? WALK[Math.floor(this.clock * 8 + so.id) % 4] : 'idle';
      const sprite = assets.get(frameKey(base, f, assets));
      const alpha = so.temp && so.life < 2 ? Math.max(0.2, so.life / 2) : 1;
      actors.push({ y: so.y, draw: () => {
        if (so.hero && ui.heroSelected) { ctx.beginPath(); ctx.ellipse(so.x, so.y + 1, 15, 6, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2.2; ctx.stroke(); }
        blit(ctx, sprite, so.x, so.y, UNIT_SCALE, so.facing < 0, alpha);
        if (so.hp < so.maxHp) this.bar(ctx, so.x, so.y - (so.hero ? 52 : 40), so.hp / so.maxHp, so.hero ? 18 : 12, so.hero ? '#ffd25a' : '#7ad0ff');
      } });
    }
    for (const b of game.beasts) {
      const f = Math.floor(this.clock * 6) % 2 ? 'w1' : 'idle';
      if (Math.random() < 0.12) this.effects.push({ t: 0, kind: 'step', x: b.x + (Math.random() - 0.5) * 14, y: b.y + 2, r: 1.5, life: 0.6 });
      actors.push({ y: b.y, draw: () => blit(ctx, assets.get(frameKey('beast:elephant', f, assets)), b.x, b.y, UNIT_SCALE, Math.cos(b.angle) > 0) });
    }
    for (const e of game.enemies) {
      if (e.portalT > 0) continue;
      if ((e.def.boss || e.def.armor >= 0.5) && !e.def.flying && e.stun <= 0 && !(e.blocker && e.blocker.target === e)) {
        // heavy feet kick up dust
        const next = this.steps.get(e.id) ?? this.clock;
        if (this.clock >= next) { this.steps.set(e.id, this.clock + (e.def.boss ? 0.42 : 0.55)); this.effects.push({ t: 0, kind: 'step', x: e.x + (Math.random() - 0.5) * 6, y: e.y + 1, r: e.def.boss ? 1.6 : 1, life: 0.6 }); if (e.def.boss) this.shake = Math.max(this.shake, 0.03); }
      }
      const base = 'enemy:' + e.def.art;
      const fighting = (e.blocker && e.blocker.target === e) || (e.def.ranged && e.atkCd > 0 && e.atkCd < e.def.ranged.rate);
      const f = e.stun > 0 ? 'idle' : fighting ? (e.atkCd > (e.def.atk || 1) * 0.5 ? 'a2' : 'a1') : WALK[Math.floor(e.walk * (5 + e.def.speed / 8)) % 4];
      const sprite = assets.get(frameKey(base, f, assets));
      const flip = Math.cos(e.angle) < -0.2;
      const big = e.def.boss ? 1 : 0.6;
      const flash = this.flash.get(e.id) || 0;
      actors.push({ y: e.y, draw: () => {
        if (e.buff > 0) { ctx.strokeStyle = 'rgba(255,90,60,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const yy = e.y - 8 - i * 7; ctx.beginPath(); ctx.moveTo(e.x + (flip ? 8 : -8), yy); ctx.lineTo(e.x + (flip ? 16 : -16), yy); ctx.stroke(); } }
        if (e.slowT > 0) { ctx.fillStyle = 'rgba(120,200,255,0.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
        if (e.burn) { ctx.fillStyle = 'rgba(255,140,40,0.55)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(e.x + (i - 1) * 5, e.y - 10 - ((this.clock * 30 + i * 7) % 14), 2.4, 4, 0, 0, Math.PI * 2); ctx.fill(); } }
        if (e.poison) { ctx.fillStyle = 'rgba(120,240,110,0.6)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(e.x + (i - 1) * 4, e.y - 8 - ((this.clock * 18 + i * 5) % 18), 1.6, 0, Math.PI * 2); ctx.fill(); } }
        if (sprite) {
          if (flash > 0) { ctx.save(); ctx.filter = 'brightness(2.4)'; blit(ctx, sprite, e.x, e.y, UNIT_SCALE, flip); ctx.restore(); }
          else blit(ctx, sprite, e.x, e.y, UNIT_SCALE, flip);
        }
        if (e.shieldHp > 0) {
          const k = e.shieldHp / (e.shieldMax || 1), hh = e.def.boss ? 70 : 34;
          ctx.strokeStyle = `rgba(140,200,255,${0.4 + 0.5 * k})`; ctx.fillStyle = `rgba(120,180,255,${0.12 + 0.1 * k})`; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.ellipse(e.x, e.y - hh / 2, hh * 0.5, hh * 0.62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        if (e.mark) { const my = e.y - (e.def.boss ? 60 : 30); ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e.x, my, 5, 0, Math.PI * 2); ctx.moveTo(e.x - 8, my); ctx.lineTo(e.x - 3, my); ctx.moveTo(e.x + 3, my); ctx.lineTo(e.x + 8, my); ctx.stroke(); }
        if (e.stun > 0) { ctx.fillStyle = '#ffe28a'; for (let i = 0; i < 3; i++) { const a = this.clock * 5 + i * 2.1; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 8, e.y - (e.def.boss ? 70 : 44) + Math.sin(a) * 3, 1.8, 0, Math.PI * 2); ctx.fill(); } }
        if (e.hp < e.maxHp || e.shieldHp > 0) this.bar(ctx, e.x, e.y - (e.def.boss ? 96 : 50) * big - 6, e.hp / e.maxHp, e.def.boss ? 34 : 16, null, e.shieldHp > 0 ? e.shieldHp / (e.shieldMax || 1) : 0);
      } });
    }
    for (const f of this.effects) if (f.kind === 'fall') actors.push({ y: f.y - 0.1, draw: () => this.drawFall(ctx, f, assets) });
    const gate = assets.get('gate');
    if (gate) actors.push({ y: game.level.gate.y, draw: () => {
      const G = game.level.gate, hit = this.leak !== undefined && this.leak < 0.35;
      const jolt = hit ? Math.sin(this.leak * 60) * 2 * (1 - this.leak / 0.35) : 0;
      blit(ctx, gate, G.x + jolt, G.y, G.s);
      if (hit) { ctx.save(); ctx.globalAlpha = 0.55 * (1 - this.leak / 0.35); ctx.filter = 'brightness(0.6) sepia(1) saturate(6) hue-rotate(-35deg)'; blit(ctx, gate, G.x + jolt, G.y, G.s); ctx.restore(); }
      this.fortDamage(ctx, G, game.lives / game.maxLives);
    } });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

    // projectiles
    for (const p of game.projectiles) {
      if (p.kind === 'arrow') {
        // arrows fly in a shallow arc over the straight homing line, with a shadow on the ground
        let st = this.arc.get(p); if (!st) this.arc.set(p, (st = { x: p.x, y: p.y }));
        const done = Math.hypot(p.x - st.x, p.y - st.y), left = p.target ? Math.hypot(p.target.x - p.x, p.target.y - 14 - p.y) : 0, total = done + left || 1;
        const k = done / total, amp = Math.min(26, total * 0.2), lift = Math.sin(k * Math.PI) * amp;
        const a0 = p.angle || 0, slope = (amp * Math.PI / total) * Math.cos(k * Math.PI), ang = Math.atan2(Math.sin(a0) - slope, Math.cos(a0));
        ctx.fillStyle = 'rgba(30,20,8,0.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 14, 4, 1.2, a0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(p.x, p.y - lift); ctx.rotate(ang);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(4, 0); ctx.stroke();
        ctx.fillStyle = '#e8ecf2'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(3, -2.4); ctx.lineTo(3, 2.4); ctx.fill();
        ctx.restore();
      } else if (p.kind === 'falcon') {
        const fs = assets.get('proj:falcon');
        if (fs) blit(ctx, fs, p.x, p.y, 1, Math.cos(p.angle || 0) < 0);
      } else if (p.kind === 'magic') {
        const ta = p.angle || 0;
        for (let i = 1; i <= 4; i++) { ctx.fillStyle = `rgba(170,220,255,${0.5 - i * 0.1})`; ctx.beginPath(); ctx.arc(p.x - Math.cos(ta) * i * 5 + Math.sin(this.clock * 30 + i) * 1.5, p.y - Math.sin(ta) * i * 5, 3.4 - i * 0.6, 0, Math.PI * 2); ctx.fill(); }
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, 'rgba(127,208,255,0.9)'); gr.addColorStop(1, 'rgba(79,107,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'shell' || p.kind === 'flask') {
        ctx.fillStyle = 'rgba(30,20,8,0.25)'; ctx.beginPath(); ctx.ellipse(p.sx + (p.tx - p.sx) * Math.min(1, p.t), p.sy + (p.ty - p.sy) * Math.min(1, p.t) + 26, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        if (p.kind === 'shell') { ctx.fillStyle = '#2e2f36'; ctx.strokeStyle = '#120c08'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 12);
          ctx.fillStyle = '#7ef06a'; ctx.strokeStyle = '#1e3a18'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 1, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#c8a070'; ctx.fillRect(-1, -4.4, 2, 2.6); ctx.restore();
        }
      }
    }
    this.drawEffects(ctx);
    this.drawAmbientAir(ctx);
  }

  drawTower(ctx, t, assets) {
    const o = this.towerFx.get(t.id) || { born: 9, up: 9, fire: 9, angle: 0 };
    const stage = stageOf(t);
    const sprite = assets.get(`tower:${t.def.art}:${stage}`);
    if (!sprite) return;
    // built: rises out of the ground; upgraded: squash-and-stretch pop; cannon: recoil
    let sxk = 1, syk = 1;
    if (o.born < 0.45) { const k = o.born / 0.45; syk = 0.2 + 0.8 * (1 - (1 - k) ** 3); sxk = 1 + (1 - k) * 0.15; }
    if (o.up < 0.5) { const k = o.up / 0.5; const w = Math.sin(k * Math.PI * 2) * (1 - k); syk *= 1 + w * 0.18; sxk *= 1 - w * 0.1; }
    if (t.def.kind === 'shell' && o.fire < 0.2) { const k = o.fire / 0.2; syk *= 0.94 + 0.06 * k; sxk *= 1.04 - 0.04 * k; }
    ctx.save();
    ctx.translate(t.x, t.y); ctx.scale(sxk, syk);
    blit(ctx, sprite, 0, 0, 1);
    // the crew turns to face the enemy; the cannon barrel points at it and kicks back when it fires
    const crew = CREW[t.def.art];
    if (crew) {
      const sc = STAGE_SCALE[stage], a = o.angle, left = Math.cos(a) < 0, firing = o.fire < 0.22;
      for (const c of crew) {
        if (c.barrel) {
          const kick = t.def.kind === 'shell' && o.fire < 0.15 ? (1 - o.fire / 0.15) * 4 : 0;
          ctx.save(); ctx.translate(c.x * sc, c.y * sc); ctx.rotate(a); if (left) ctx.scale(1, -1);
          blit(ctx, assets.get('crew:barrel'), -kick, 0, sc);
          ctx.restore();
        } else blit(ctx, assets.get('crew:' + c.key + (firing ? ':fire' : '')), c.x * sc, c.y * sc, sc, left);
      }
    }
    ctx.restore();
    if (t.jam > 0) {
      ctx.fillStyle = `rgba(70,60,80,${Math.min(0.7, t.jam)})`;
      for (let i = 0; i < 4; i++) { const a = this.clock * 2 + i * 1.6; ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * 12, t.y - 40 + Math.sin(a) * 6, 8, 0, Math.PI * 2); ctx.fill(); }
    }
    if (t.def.royal) {
      // level pips under a special tower: one gold pip per level
      for (let i = 0; i <= t.tier; i++) { ctx.fillStyle = '#ffd25a'; ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 0.8; const px = t.x - (t.tier * 5) / 2 + i * 5; ctx.beginPath(); ctx.arc(px, t.y + 9, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
  }

  // the fort shows the battle: smoke rises once half the lives are gone, flames when few are left
  fortDamage(ctx, G, health) {
    if (health > 0.5) return;
    const n = health > 0.25 ? 2 : 4, top = G.y - 62 * G.s;
    for (let i = 0; i < n; i++) {
      const bx = G.x + (i - (n - 1) / 2) * 16 * G.s;
      for (let j = 0; j < 4; j++) {
        const k = ((this.clock * 0.35 + j / 4 + i * 0.17) % 1);
        ctx.fillStyle = `rgba(70,62,58,${0.45 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(bx + Math.sin(k * 5 + i) * 6 + k * 14, top - k * 70, 5 + k * 12, 0, Math.PI * 2); ctx.fill();
      }
      if (health <= 0.25) { const fl = 6 + Math.sin(this.clock * 14 + i * 2) * 2; ctx.fillStyle = 'rgba(255,130,30,0.85)'; ctx.beginPath(); ctx.ellipse(bx, top + 4, 3.5, fl, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,230,140,0.9)'; ctx.beginPath(); ctx.ellipse(bx, top + 6, 1.6, fl * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  drawFall(ctx, f, assets) {
    const k = f.t / f.life, sprite = assets.get('enemy:' + f.art);
    if (!sprite) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    const rot = Math.min(1, k * 2.2) * (Math.PI / 2) * (f.flip ? -1 : 1);
    ctx.rotate(rot * 0.92);
    blit(ctx, sprite, 0, 0, UNIT_SCALE, f.flip);
    ctx.restore();
  }

  portal(ctx, x, y) {
    const t = this.clock;
    ctx.save(); ctx.translate(x, y);
    const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, 20); gr.addColorStop(0, 'rgba(230,200,255,0.9)'); gr.addColorStop(0.6, 'rgba(120,60,200,0.55)'); gr.addColorStop(1, 'rgba(60,20,120,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${200 - i * 30},${140 - i * 30},255,0.85)`; ctx.beginPath(); ctx.ellipse(0, 0, 16 - i * 4, 10 - i * 2.6, 0, t * (2 + i) + i, t * (2 + i) + i + 4); ctx.stroke(); }
    ctx.restore();
  }

  range(ctx, x, y, r, rally = false) {
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = rally ? 'rgba(122,208,255,0.12)' : 'rgba(255,214,107,0.12)'; ctx.fill();
    ctx.strokeStyle = rally ? 'rgba(122,208,255,0.9)' : 'rgba(255,214,107,0.95)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
  }

  bar(ctx, x, y, v, w, col, shield = 0) {
    ctx.fillStyle = '#3a2414'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 4);
    ctx.fillStyle = '#5a1a12'; ctx.fillRect(x - w / 2, y, w, 2);
    ctx.fillStyle = col || (v > 0.5 ? '#6fd04a' : v > 0.25 ? '#f0c23a' : '#e8452a'); ctx.fillRect(x - w / 2, y, w * Math.max(0, v), 2);
    if (shield > 0) { ctx.fillStyle = '#8fc8ff'; ctx.fillRect(x - w / 2, y - 3, w * Math.min(1, shield), 1.6); }
  }

  drawEffects(ctx) {
    for (const f of this.effects) {
      const k = f.t / f.life;
      ctx.save();
      if (f.kind === 'spark') {
        ctx.globalAlpha = 1 - k;
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a) * 6 * (0.5 + k), f.y + Math.sin(a) * 6 * (0.5 + k)); } ctx.strokeStyle = '#fff6c4'; ctx.lineWidth = 1.4; ctx.stroke();
      } else if (f.kind === 'magicHit') {
        ctx.globalAlpha = 1 - k; const r = 6 + 10 * k;
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, 'rgba(230,247,255,0.9)'); gr.addColorStop(1, 'rgba(79,107,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'boom') {
        const r = f.r * (0.4 + k * 0.8);
        ctx.globalAlpha = 1 - k;
        const gr = ctx.createRadialGradient(f.x, f.y - 6, 0, f.x, f.y - 6, r); gr.addColorStop(0, 'rgba(255,251,224,1)'); gr.addColorStop(0.35, 'rgba(255,192,74,0.95)'); gr.addColorStop(0.7, 'rgba(240,98,29,0.6)'); gr.addColorStop(1, 'rgba(200,54,29,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(f.x, f.y - 6, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(216,207,194,${0.7 * (1 - k)})`; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(f.x + (i - 1.5) * 8, f.y - 14 - k * 20, 6 + k * 6, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'poison') {
        ctx.globalAlpha = 0.6 * (1 - k);
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + f.t; ctx.fillStyle = i % 2 ? 'rgba(126,240,106,0.6)' : 'rgba(80,180,70,0.5)'; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * f.r * 0.5, f.y - 6 + Math.sin(a) * f.r * 0.25 - f.t * 6, f.r * 0.32, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'volley') {
        ctx.strokeStyle = `rgba(255,244,220,${1 - k})`; ctx.lineWidth = 1.3;
        for (let i = 0; i < 9; i++) { const a = (f.seed + i * 2.4) % (Math.PI * 2), r = ((f.seed * 7 + i * 13) % f.r); const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.6; ctx.beginPath(); ctx.moveTo(x - 4, y - 26 * (1 - k)); ctx.lineTo(x, y - 18 * (1 - k) + 4); ctx.stroke(); }
      } else if (f.kind === 'holy') {
        ctx.globalAlpha = 1 - k; const r = f.r * (0.6 + 0.5 * k);
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, 'rgba(255,250,220,0.9)'); gr.addColorStop(0.5, 'rgba(255,190,70,0.7)'); gr.addColorStop(1, 'rgba(230,80,30,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'shock' || f.kind === 'ring') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.kind === 'ring' ? '#fff4c0' : '#ffe28a'; ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * k * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'pillar') {
        // a column of golden light: a tower was upgraded or a special spot opened
        ctx.globalAlpha = Math.sin(Math.min(1, k) * Math.PI);
        const gr = ctx.createLinearGradient(0, f.y - 140, 0, f.y); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.6, 'rgba(255,220,120,0.55)'); gr.addColorStop(1, 'rgba(255,250,220,0.85)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(f.x - 14, f.y); ctx.lineTo(f.x - 6, f.y - 140); ctx.lineTo(f.x + 6, f.y - 140); ctx.lineTo(f.x + 14, f.y); ctx.fill();
        ctx.fillStyle = '#fff4c0';
        for (let i = 0; i < 7; i++) { const yy = f.y - ((k * 120 + i * 19) % 120), xx = f.x + Math.sin(i * 2.1 + k * 6) * 16; ctx.beginPath(); ctx.arc(xx, yy, 1.6, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'levelUp') {
        ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
        const sc = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
        ctx.translate(f.x, f.y - k * 14); ctx.scale(sc, sc);
        ctx.font = '400 13px "Rozha One", Georgia, serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
        ctx.lineWidth = 4; ctx.strokeStyle = '#3a2414'; ctx.strokeText(f.text, 0, 0); ctx.fillStyle = '#ffd25a'; ctx.fillText(f.text, 0, 0);
      } else if (f.kind === 'shot') {
        ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.4; ctx.beginPath(); const px = f.x + (f.tx - f.x) * k, py = f.y + (f.ty - f.y) * k; ctx.moveTo(px - (f.tx - f.x) * 0.15, py - (f.ty - f.y) * 0.15); ctx.lineTo(px, py); ctx.stroke();
      } else if (f.kind === 'beam') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.tx, f.ty); ctx.stroke(); ctx.setLineDash([]);
      } else if (f.kind === 'shards') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = '#bfe2ff';
        for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 14 * k, f.y + Math.sin(a) * 10 * k, 2, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'warp') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#d8b8ff'; ctx.lineWidth = 3 * (1 - k) + 0.5;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 6 + 14 * k, 10 + 18 * k, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'muzzle') {
        ctx.globalAlpha = 1 - k;
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 10); gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, 10 * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(200,195,185,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(f.x + 6 + k * 10, f.y - k * 12, 5 + k * 5, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'cast') {
        ctx.globalAlpha = 1 - k; const r = 8 + 12 * k;
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(120,190,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'flag') {
        ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - 16); ctx.stroke();
        ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 16); ctx.lineTo(f.x + 9, f.y - 13); ctx.lineTo(f.x, f.y - 10); ctx.fill();
      } else if (f.kind === 'coin') {
        ctx.globalAlpha = 1 - k * k; ctx.font = '900 11px Martel, serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#3a2414'; ctx.fillStyle = '#ffd66b';
        ctx.strokeText(f.text, f.x, f.y - k * 16); ctx.fillText(f.text, f.x, f.y - k * 16);
      } else if (f.kind === 'coinFly' || f.kind === 'heartFly') {
        // hop up, then swoop to the counter in the HUD
        const to = this.hudAt && (f.kind === 'coinFly' ? this.hudAt.gold : this.hudAt.lives);
        const tt = Math.max(0, f.t - (f.delay || 0)) / (f.life - (f.delay || 0));
        if (!to || tt <= 0) { ctx.restore(); continue; }
        let x, y;
        if (tt < 0.3) { const q = tt / 0.3; x = f.x + (f.dx || 0) * q; y = f.y - Math.sin(q * Math.PI * 0.5) * 22; }
        else { const q = (tt - 0.3) / 0.7, e2 = q * q, sx = f.x + (f.dx || 0), sy = f.y - 22; x = sx + (to.x - sx) * e2; y = sy + (to.y - sy) * e2 - Math.sin(q * Math.PI) * 30; }
        const sc = f.kind === 'coinFly' ? 1 - tt * 0.3 : 1 + Math.sin(tt * Math.PI) * 0.4;
        ctx.translate(x, y); ctx.scale(sc, sc);
        if (f.kind === 'coinFly') {
          const w = Math.abs(Math.cos(f.t * 12)) * 3.4 + 0.6; // spinning
          ctx.fillStyle = '#e0a224'; ctx.strokeStyle = '#6a420c'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, 0, w, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffe38a'; ctx.beginPath(); ctx.ellipse(-w * 0.2, -0.8, w * 0.45, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#e8452a'; ctx.strokeStyle = '#5a1a12'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-8, -1, -5, -7, 0, -3); ctx.bezierCurveTo(5, -7, 8, -1, 0, 5); ctx.fill(); ctx.stroke();
        }
      } else if (f.kind === 'debris' || f.kind === 'crumble') {
        // stone chips and dust: the fort gate takes a hit, or a sold tower is pulled down
        ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 8; i++) {
          const a = f.seed + i * 0.8, vx = Math.cos(a) * (f.kind === 'crumble' ? 22 : 30), vy = -30 - (i % 3) * 14;
          const x = f.x + vx * f.t, y = f.y + vy * f.t + 90 * f.t * f.t;
          ctx.fillStyle = i % 2 ? '#c9a77a' : '#8a6a48'; ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
        }
        ctx.fillStyle = '#efe4c8'; ctx.globalAlpha = (1 - k) * 0.7;
        for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 18 * k, f.y + 6 + Math.sin(a) * 6 * k, 5 + 6 * k, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'cost') {
        ctx.globalAlpha = 1 - k * k; ctx.font = '900 10px Martel, serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#3a2414'; ctx.fillStyle = '#ffb08a';
        ctx.strokeText(f.text, f.x, f.y - k * 12); ctx.fillText(f.text, f.x, f.y - k * 12);
      } else if (f.kind === 'step') {
        ctx.globalAlpha = (1 - k) * 0.55; ctx.fillStyle = '#e6d6b0';
        for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(f.x + side * (3 + 5 * k) * f.r, f.y - 2 * k, (1.6 + 2.4 * k) * f.r, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.kind === 'poof' || f.kind === 'dust' || f.kind === 'smoke') {
        ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = f.kind === 'smoke' ? '#5a4a6a' : '#efe4c8';
        for (let i = 0; i < 5; i++) { const a = i * 1.26; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 10 * k, f.y + Math.sin(a) * 4 * k, 4 + 4 * k, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
  }
}
