// Draws the battlefield: background, build spots, towers, soldiers, enemies, shots and effects.
import { blit } from './raster.js';
import { UNIT_SCALE } from './assets.js';

export class WorldRenderer {
  constructor() { this.effects = []; this.shake = 0; }

  // Turn game events into short-lived visual effects.
  onEvent(e) {
    const fx = (o) => this.effects.push({ t: 0, ...o });
    if (e.type === 'hit') fx({ kind: e.kind === 'magic' ? 'magicHit' : 'spark', x: e.x, y: e.y, life: 0.25 });
    if (e.type === 'kill') { fx({ kind: 'coin', x: e.x, y: e.y - 30, text: `+${e.gold}`, life: 0.9 }); fx({ kind: 'poof', x: e.x, y: e.y - 8, life: 0.45 }); }
    if (e.type === 'explosion') { fx({ kind: 'boom', x: e.x, y: e.y, r: e.r, life: 0.5 }); this.shake = Math.max(this.shake, 0.12); }
    if (e.type === 'plotOpened') fx({ kind: 'dust', x: e.plot.x, y: e.plot.y, life: 0.7 });
    if (e.type === 'soldierDown') fx({ kind: 'poof', x: e.x, y: e.y - 8, life: 0.45 });
    if (e.type === 'summon') fx({ kind: 'smoke', x: e.x, y: e.y - 10, life: 0.8 });
    if (e.type === 'built' || e.type === 'upgraded') fx({ kind: 'dust', x: e.tower.x, y: e.tower.y, life: 0.6 });
    if (e.type === 'bossArrives') this.shake = 0.5;
    if (e.type === 'volley') fx({ kind: 'volley', x: e.x, y: e.y, r: e.r, life: 0.45, seed: Math.random() * 100 });
    if (e.type === 'spell' && e.spell === 'holyFire') { fx({ kind: 'holy', x: e.x, y: e.y, r: e.r, life: 0.9 }); this.shake = Math.max(this.shake, 0.15); }
    if (e.type === 'spell' && e.spell === 'reinforcements') fx({ kind: 'dust', x: e.x, y: e.y, life: 0.7 });
    if (e.type === 'heroSkill') { fx({ kind: 'shock', x: e.x, y: e.y - 6, r: e.r, life: 0.6 }); this.shake = Math.max(this.shake, 0.2); }
    if (e.type === 'enemyShot') fx({ kind: 'shot', x: e.x, y: e.y, tx: e.tx, ty: e.ty, life: 0.25 });
    if (e.type === 'heroMove') fx({ kind: 'flag', x: e.x, y: e.y, life: 1.2 });
    if (e.type === 'heroDown') fx({ kind: 'poof', x: e.x, y: e.y - 10, life: 0.7 });
  }

  draw(ctx, view, game, assets, ui) {
    const { dpr, s, ox, oy } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (assets.bg) ctx.drawImage(assets.bg.canvas, 0, 0, view.cssW, view.cssH);
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * 6 * this.shake; sy = (Math.random() - 0.5) * 6 * this.shake; }
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + sx), dpr * (oy + sy));

    // build spots
    for (const p of game.plots) {
      if (p.tower) continue;
      const sel = ui.menu && ui.menu.plotId === p.id;
      if (p.royal) { ctx.beginPath(); ctx.ellipse(p.x, p.y, 27, 11.5, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 3; ctx.stroke(); }
      const sprite = assets.get(!p.lock ? 'plot:open' : p.lock.type === 'gold' ? 'plot:rubble' : 'plot:timed');
      if (sprite) blit(ctx, sprite, p.x, p.y, 1);
      if (sel || ui.pointAt === p.id) {
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 1, 26, 11, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,244,220,0.95)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // range of the selected tower (or the tower being previewed)
    const selTower = ui.menu && ui.menu.towerId ? game.towers.find((t) => t.id === ui.menu.towerId) : null;
    if (selTower && selTower.def.kind !== 'soldiers') this.range(ctx, selTower.x, selTower.y - 6, selTower.def.tiers[selTower.tier].range * selTower.rangeBonus);
    if (selTower && selTower.rally) this.range(ctx, selTower.rally.x, selTower.rally.y, 40, true);

    // depth-sorted actors
    const actors = [];
    for (const t of game.towers) actors.push({ y: t.y, draw: () => blit(ctx, assets.get(`tower:${t.def.art}:${t.tier}`), t.x, t.y, 1) });
    for (const so of game.soldiers) {
      if (so.dead) continue;
      const sprite = so.hero ? assets.get('hero:' + so.hero) : assets.get('soldier:' + (so.temp ? so.stats.art : so.tower.def.tiers[so.tower.tier].art));
      const alpha = so.temp && so.life < 2 ? Math.max(0.2, so.life / 2) : 1;
      actors.push({ y: so.y, draw: () => {
        if (so.hero && ui.heroSelected) { ctx.beginPath(); ctx.ellipse(so.x, so.y + 1, 15, 6, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2.2; ctx.stroke(); }
        blit(ctx, sprite, so.x, so.y, UNIT_SCALE, so.facing < 0, alpha);
        if (so.hp < so.maxHp) this.bar(ctx, so.x, so.y - (so.hero ? 52 : 40), so.hp / so.maxHp, so.hero ? 18 : 12, so.hero ? '#ffd25a' : '#7ad0ff');
      } });
    }
    for (const e of game.enemies) {
      const sprite = assets.get('enemy:' + e.def.art);
      const bob = e.blocker ? 0 : Math.abs(Math.sin(e.walk * 9)) * 1.6;
      const flip = Math.cos(e.angle) < -0.2;
      const big = e.def.boss ? 1 : 0.6;
      actors.push({ y: e.y, draw: () => {
        if (e.burn) { ctx.fillStyle = 'rgba(255,140,40,0.55)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(e.x + (i - 1) * 5, e.y - 10 - ((this.clock * 30 + i * 7) % 14), 2.4, 4, 0, 0, Math.PI * 2); ctx.fill(); } }
        if (sprite) blit(ctx, sprite, e.x, e.y - bob, UNIT_SCALE, flip);
        if (e.stun > 0) { ctx.fillStyle = '#ffe28a'; for (let i = 0; i < 3; i++) { const a = this.clock * 5 + i * 2.1; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 8, e.y - (e.def.boss ? 70 : 44) + Math.sin(a) * 3, 1.8, 0, Math.PI * 2); ctx.fill(); } }
        if (e.hp < e.maxHp) this.bar(ctx, e.x, e.y - (e.def.boss ? 96 : 50) * big - 6, e.hp / e.maxHp, e.def.boss ? 34 : 16);
      } });
    }
    const gate = assets.get('gate');
    if (gate) actors.push({ y: game.level.gate.y, draw: () => blit(ctx, gate, game.level.gate.x, game.level.gate.y, game.level.gate.s) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

    // projectiles
    for (const p of game.projectiles) {
      if (p.kind === 'arrow') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle || 0);
        ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(4, 0); ctx.stroke();
        ctx.fillStyle = '#e8ecf2'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(3, -2.4); ctx.lineTo(3, 2.4); ctx.fill();
        ctx.restore();
      } else if (p.kind === 'magic') {
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, 'rgba(127,208,255,0.9)'); gr.addColorStop(1, 'rgba(79,107,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'shell') {
        ctx.fillStyle = 'rgba(30,20,8,0.25)'; ctx.beginPath(); ctx.ellipse(p.sx + (p.tx - p.sx) * Math.min(1, p.t), p.sy + (p.ty - p.sy) * Math.min(1, p.t) + 26, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2e2f36'; ctx.strokeStyle = '#120c08'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    this.drawEffects(ctx);
  }

  range(ctx, x, y, r, rally = false) {
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = rally ? 'rgba(122,208,255,0.12)' : 'rgba(255,214,107,0.12)'; ctx.fill();
    ctx.strokeStyle = rally ? 'rgba(122,208,255,0.9)' : 'rgba(255,214,107,0.95)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
  }

  bar(ctx, x, y, v, w, col) {
    ctx.fillStyle = '#3a2414'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 4);
    ctx.fillStyle = '#5a1a12'; ctx.fillRect(x - w / 2, y, w, 2);
    ctx.fillStyle = col || (v > 0.5 ? '#6fd04a' : v > 0.25 ? '#f0c23a' : '#e8452a'); ctx.fillRect(x - w / 2, y, w * Math.max(0, v), 2);
  }

  update(dt) {
    this.clock = (this.clock || 0) + dt;
    this.shake = Math.max(0, this.shake - dt);
    for (const f of this.effects) f.t += dt;
    this.effects = this.effects.filter((f) => f.t < f.life);
  }

  drawEffects(ctx) {
    for (const f of this.effects) {
      const k = f.t / f.life;
      ctx.save();
      if (f.kind === 'spark') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff6c4';
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
      } else if (f.kind === 'volley') {
        ctx.strokeStyle = `rgba(255,244,220,${1 - k})`; ctx.lineWidth = 1.3;
        for (let i = 0; i < 9; i++) { const a = (f.seed + i * 2.4) % (Math.PI * 2), r = ((f.seed * 7 + i * 13) % f.r); const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.6; ctx.beginPath(); ctx.moveTo(x - 4, y - 26 * (1 - k)); ctx.lineTo(x, y - 18 * (1 - k) + 4); ctx.stroke(); }
      } else if (f.kind === 'holy') {
        ctx.globalAlpha = 1 - k; const r = f.r * (0.6 + 0.5 * k);
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, 'rgba(255,250,220,0.9)'); gr.addColorStop(0.5, 'rgba(255,190,70,0.7)'); gr.addColorStop(1, 'rgba(230,80,30,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'shock') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * k * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.kind === 'shot') {
        ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 1.4; ctx.beginPath(); const px = f.x + (f.tx - f.x) * k, py = f.y + (f.ty - f.y) * k; ctx.moveTo(px - (f.tx - f.x) * 0.15, py - (f.ty - f.y) * 0.15); ctx.lineTo(px, py); ctx.stroke();
      } else if (f.kind === 'flag') {
        ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - 16); ctx.stroke();
        ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.moveTo(f.x, f.y - 16); ctx.lineTo(f.x + 9, f.y - 13); ctx.lineTo(f.x, f.y - 10); ctx.fill();
      } else if (f.kind === 'coin') {
        ctx.globalAlpha = 1 - k * k; ctx.font = '900 11px Martel, serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#3a2414'; ctx.fillStyle = '#ffd66b';
        ctx.strokeText(f.text, f.x, f.y - k * 16); ctx.fillText(f.text, f.x, f.y - k * 16);
      } else if (f.kind === 'poof' || f.kind === 'dust' || f.kind === 'smoke') {
        ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = f.kind === 'smoke' ? '#5a4a6a' : '#efe4c8';
        for (let i = 0; i < 5; i++) { const a = i * 1.26; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 10 * k, f.y + Math.sin(a) * 4 * k, 4 + 4 * k, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
  }
}
