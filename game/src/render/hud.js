// Screen-space UI: drawn in CSS pixels, anchored to the real screen edges and safe area,
// scaled by view.u so it is the same physical size on every phone.
import { blit } from './raster.js';
import { UNIT_SCALE } from './assets.js';
import { TOWERS, TOWER_ORDER, ENEMIES, SELL_REFUND } from '../engine/data.js';

const OUT = '#3a2414';
const FONT = 'Martel, Georgia, serif';
const TITLE = '"Rozha One", Georgia, serif';
const GEM = {
  red: ['#ff7a50', '#d83a1e', '#86190c'], green: ['#7ed36a', '#2f8f3c', '#14501e'], blue: ['#7fb2ff', '#2f5fc8', '#162f72'],
  gold: ['#ffe38a', '#e0a224', '#8a5a0c'], purple: ['#c19aff', '#6a3fc0', '#341a6e'], grey: ['#c9c4bc', '#8d877e', '#4f4a44'],
};

export function text(ctx, str, x, y, size, o = {}) {
  ctx.font = `${o.weight || 900} ${size}px ${o.font || FONT}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'alphabetic';
  let s = size;
  if (o.max) { const w = ctx.measureText(str).width; if (w > o.max) { s = size * o.max / w; ctx.font = `${o.weight || 900} ${s}px ${o.font || FONT}`; } }
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw ?? Math.max(2, s * 0.22); ctx.strokeStyle = o.stroke || OUT; ctx.strokeText(str, x, y); }
  ctx.fillStyle = o.fill || '#fff8e6';
  ctx.fillText(str, x, y);
}

function wrap(ctx, str, size, maxW, font = FONT, weight = 700) {
  ctx.font = `${weight} ${size}px ${font}`;
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

function gemButton(ctx, x, y, w, h, label, color = 'red', u = 1, enabled = true) {
  const c = GEM[enabled ? color : 'grey'], r = h * 0.32;
  ctx.save();
  ctx.shadowColor = 'rgba(18,8,4,0.5)'; ctx.shadowBlur = 4 * u; ctx.shadowOffsetY = 2 * u;
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();
  const rim = ctx.createLinearGradient(0, y, 0, y + h);
  rim.addColorStop(0, '#fff4c0'); rim.addColorStop(0.3, '#f4c64e'); rim.addColorStop(0.6, '#a8700f'); rim.addColorStop(1, '#f2c04a');
  ctx.fillStyle = rim; ctx.beginPath(); ctx.roundRect(x + 1.6 * u, y + 1.6 * u, w - 3.2 * u, h - 3.2 * u, r - u); ctx.fill();
  const face = ctx.createLinearGradient(0, y, 0, y + h);
  face.addColorStop(0, c[0]); face.addColorStop(0.5, c[1]); face.addColorStop(1, c[2]);
  ctx.fillStyle = face; ctx.beginPath(); ctx.roundRect(x + 4 * u, y + 4 * u, w - 8 * u, h - 8 * u, r - 3 * u); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.roundRect(x + 6 * u, y + 5 * u, w - 12 * u, h * 0.34, h * 0.17); ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 + h * 0.16, h * 0.4, { max: w - 16 * u });
}

function woodPanel(ctx, x, y, w, h, title, u) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10 * u; ctx.shadowOffsetY = 4 * u;
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14 * u); ctx.fill();
  ctx.restore();
  const wood = ctx.createLinearGradient(0, y, 0, y + h); wood.addColorStop(0, '#8a5a30'); wood.addColorStop(1, '#3f2614');
  ctx.fillStyle = wood; ctx.beginPath(); ctx.roundRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, 12 * u); ctx.fill();
  const rim = ctx.createLinearGradient(0, y, 0, y + h); rim.addColorStop(0, '#fff4c0'); rim.addColorStop(0.4, '#c8921c'); rim.addColorStop(1, '#f2c04a');
  ctx.fillStyle = rim; ctx.beginPath(); ctx.roundRect(x + 7 * u, y + 7 * u, w - 14 * u, h - 14 * u, 9 * u); ctx.fill();
  const par = ctx.createLinearGradient(0, y, 0, y + h); par.addColorStop(0, '#fdf2d8'); par.addColorStop(1, '#ead0a0');
  ctx.fillStyle = par; ctx.beginPath(); ctx.roundRect(x + 9.5 * u, y + 9.5 * u, w - 19 * u, h - 19 * u, 7 * u); ctx.fill();
  if (title) {
    ctx.font = `400 ${17 * u}px ${TITLE}`;
    const tw = ctx.measureText(title).width + 36 * u, cx = x + w / 2, ty = y - 10 * u;
    ctx.fillStyle = '#7a160a'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.4 * u;
    for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sgn * (tw / 2 - 4 * u), ty + 6 * u); ctx.lineTo(cx + sgn * (tw / 2 + 16 * u), ty + 6 * u); ctx.lineTo(cx + sgn * (tw / 2 + 6 * u), ty + 15 * u); ctx.lineTo(cx + sgn * (tw / 2 + 16 * u), ty + 25 * u); ctx.lineTo(cx + sgn * (tw / 2 - 4 * u), ty + 25 * u); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    const rib = ctx.createLinearGradient(0, ty, 0, ty + 22 * u); rib.addColorStop(0, '#e8553a'); rib.addColorStop(1, '#7a160a');
    ctx.fillStyle = rib; ctx.beginPath(); ctx.roundRect(cx - tw / 2, ty, tw, 22 * u, 3 * u); ctx.fill(); ctx.lineWidth = 1.6 * u; ctx.stroke();
    ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(cx - tw / 2 + 3 * u, ty + 3 * u); ctx.lineTo(cx + tw / 2 - 3 * u, ty + 3 * u); ctx.moveTo(cx - tw / 2 + 3 * u, ty + 19 * u); ctx.lineTo(cx + tw / 2 - 3 * u, ty + 19 * u); ctx.stroke();
    text(ctx, title, cx, ty + 16.5 * u, 17 * u, { font: TITLE, weight: 400, max: tw - 14 * u, sw: 3 * u });
  }
}

export class Hud {
  constructor(actions) {
    this.actions = actions;
    this.menu = null; // { type: 'build'|'tower'|'locked', plotId, towerId }
    this.modal = null; // { type: 'newEnemy'|'pause'|'won'|'lost', ... }
    this.banner = null;
    this.targets = [];
    this.pointAt = null;
    this.time = 0;
  }

  get pointAtPlot() { return this.pointAt; }

  // Each drawn control registers a tap target; taps are tested topmost first.
  tap(x, y, w, h, fn, round = false) { this.targets.push({ x, y, w, h, fn, round }); }

  hit(px, py) {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const inside = t.round ? Math.hypot(px - t.x, py - t.y) <= t.w : px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h;
      if (inside) { t.fn(); return true; }
    }
    return false;
  }

  update(dt) { this.time += dt; if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.life) this.banner = null; } }

  draw(ctx, view, game, assets, info) {
    const { dpr, u, cssW, cssH, safe } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.targets = [];
    const L = safe.l + 10 * u, R = cssW - safe.r - 10 * u, T = safe.t + 8 * u, B = cssH - safe.b - 8 * u;

    // ---- top-left: lives, gold, wave
    const pw = 250 * u, ph = 36 * u;
    const wood = ctx.createLinearGradient(0, T, 0, T + ph); wood.addColorStop(0, '#9a6a42'); wood.addColorStop(1, '#5a3a22');
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.roundRect(L, T, pw, ph, 9 * u); ctx.fill();
    ctx.fillStyle = wood; ctx.beginPath(); ctx.roundRect(L + 2.5 * u, T + 2.5 * u, pw - 5 * u, ph - 5 * u, 7 * u); ctx.fill();
    const cy = T + ph / 2;
    blit(ctx, assets.get('ui:heart'), L + 20 * u, cy, u);
    text(ctx, String(game.lives), L + 36 * u, cy + 6 * u, 16 * u, { align: 'left', fill: info.livesFlash > 0 ? '#ff8a7a' : '#fff4dc' });
    blit(ctx, assets.get('ui:coin'), L + 92 * u, cy, u);
    text(ctx, String(game.gold), L + 108 * u, cy + 6 * u, 16 * u, { align: 'left' });
    blit(ctx, assets.get('ui:wave'), L + 176 * u, cy, u);
    text(ctx, `${Math.max(0, game.waveIndex + 1)}/${game.waveCount}`, L + 192 * u, cy + 6 * u, 16 * u, { align: 'left', max: 52 * u });

    // ---- top-right: pause and speed
    const br = 22 * u;
    blit(ctx, assets.get('btn:pause'), R - br, T + br, u);
    this.tap(R - br, T + br, br * 1.15, 0, () => this.actions.pause(), true);
    blit(ctx, assets.get(info.speed === 2 ? 'btn:speed2' : 'btn:speed1'), R - br * 3.4, T + br, u);
    this.tap(R - br * 3.4, T + br, br * 1.15, 0, () => this.actions.speed(), true);
    text(ctx, info.speed === 2 ? '×2' : '×1', R - br * 3.4, T + br * 2.5, 11 * u, { sw: 2.4 * u });

    // ---- call the next wave, placed where enemies enter
    if (game.canCallWave && !this.modal) {
      const ent = game.paths[0].at(36);
      let p = view.toScreen(ent.x, ent.y);
      p = { x: Math.max(L + br * 1.6, Math.min(R - br * 1.6, p.x)), y: Math.max(T + ph + br * 1.6, Math.min(B - br * 1.6, p.y)) };
      const pulse = 1 + Math.sin(this.time * 5) * 0.06;
      if (game.nextWaveTimer !== null) {
        ctx.beginPath(); ctx.arc(p.x, p.y, br * 1.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - game.nextWaveTimer / 16));
        ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = 4 * u; ctx.stroke();
      }
      blit(ctx, assets.get('btn:swords'), p.x, p.y, u * pulse);
      this.tap(p.x, p.y, br * 1.3, 0, () => this.actions.callWave(), true);
      const label = game.state === 'ready' ? 'START' : `+${Math.ceil(game.nextWaveTimer || 0)}`;
      text(ctx, label, p.x, p.y + br + 14 * u, 12 * u, { sw: 3 * u });
    }

    // ---- menus around a build spot or tower
    if (this.menu && !this.modal) this.drawMenu(ctx, view, game, assets);

    // ---- tutorial guide
    if (info.tutorial && !this.modal) this.drawTutorial(ctx, view, game, info.tutorial);

    // ---- banner (boss arrives, wave start)
    if (this.banner) {
      const k = this.banner.t / this.banner.life, a = Math.min(1, k * 6, (1 - k) * 4);
      ctx.globalAlpha = a;
      text(ctx, this.banner.text, cssW / 2, cssH * 0.3, (this.banner.big ? 30 : 22) * u, { font: TITLE, weight: 400, fill: this.banner.big ? '#ffd25a' : '#fff4dc', sw: 5 * u, max: cssW - 40 * u });
      if (this.banner.sub) text(ctx, this.banner.sub, cssW / 2, cssH * 0.3 + 24 * u, 13 * u, { max: cssW - 40 * u });
      ctx.globalAlpha = 1;
    }

    if (this.modal) this.drawModal(ctx, view, game, assets, info);
  }

  drawMenu(ctx, view, game, assets) {
    const { u } = view, m = this.menu, plot = game.plots[m.plotId];
    const c = view.toScreen(plot.x, plot.y - 10);
    const rad = 52 * u, br = 22 * u;
    const bubble = (dx, dy, sprite, onTap, price, enabled = true, iconSprite = null) => {
      const x = c.x + dx, y = c.y + dy;
      ctx.globalAlpha = enabled ? 1 : 0.55;
      blit(ctx, assets.get(iconSprite ? 'btn:grey' : sprite), x, y, u);
      if (iconSprite) blit(ctx, assets.get(iconSprite), x, y + 13 * u, u * 0.36);
      ctx.globalAlpha = 1;
      if (price !== undefined) {
        const tw = 46 * u, th = 16 * u;
        ctx.fillStyle = OUT; ctx.beginPath(); ctx.roundRect(x - tw / 2, y + br - 4 * u, tw, th, 8 * u); ctx.fill();
        blit(ctx, assets.get('ui:coin'), x - tw / 2 + 9 * u, y + br + 4 * u, u * 0.6);
        text(ctx, String(price), x + 5 * u, y + br + 8.5 * u, 11 * u, { fill: enabled ? '#ffd66b' : '#c9a080', stroke: false, max: tw - 20 * u });
      }
      if (enabled) this.tap(x, y, br * 1.1, 0, onTap, true);
    };
    this.tap(0, 0, view.cssW, view.cssH, () => { this.menu = null; }); // tap anywhere else closes
    if (m.type === 'build') {
      const angles = [-135, -45, 135, 45];
      TOWER_ORDER.forEach((type, i) => {
        const a = (angles[i] * Math.PI) / 180, cost = TOWERS[type].tiers[0].cost;
        bubble(Math.cos(a) * rad, Math.sin(a) * rad * 0.8, null, () => { this.actions.build(plot.id, type); this.menu = null; }, cost, game.gold >= cost, 'icon:' + TOWERS[type].art);
      });
    } else if (m.type === 'tower') {
      const t = game.towers.find((x) => x.id === m.towerId);
      if (!t) { this.menu = null; return; }
      const st = t.def.tiers[t.tier];
      text(ctx, st.label, c.x, c.y - rad - 18 * u, 14 * u, { font: TITLE, weight: 400, sw: 3.4 * u, max: 160 * u });
      if (t.tier < t.def.tiers.length - 1) {
        const cost = t.def.tiers[t.tier + 1].cost;
        bubble(0, -rad * 0.95, 'btn:up', () => { this.actions.upgrade(t.id); this.menu = null; }, cost, game.gold >= cost);
        text(ctx, t.def.tiers[t.tier + 1].label, c.x + br * 1.5, c.y - rad * 0.95 + 4 * u, 10 * u, { align: 'left', sw: 2.6 * u, max: 110 * u });
      } else text(ctx, 'MAX', c.x, c.y - rad * 0.95 + 4 * u, 13 * u, { fill: '#ffd66b', sw: 3 * u });
      bubble(0, rad * 0.95, 'btn:sell', () => { this.actions.sell(t.id); this.menu = null; }, Math.floor(t.spent * SELL_REFUND), true);
    } else if (m.type === 'locked') {
      if (plot.lock && plot.lock.type === 'gold') {
        bubble(0, -rad * 0.95, 'btn:clear', () => { this.actions.clear(plot.id); this.menu = null; }, plot.lock.cost, game.gold >= plot.lock.cost);
        text(ctx, 'Clear rubble', c.x, c.y + 6 * u, 11 * u, { sw: 3 * u });
      } else if (plot.lock) {
        text(ctx, `Opens at wave ${plot.lock.wave}`, c.x, c.y - rad * 0.6, 13 * u, { sw: 3.4 * u, max: 180 * u });
      } else this.menu = null;
    }
  }

  drawTutorial(ctx, view, game, step) {
    const { u, cssW, cssH, safe } = view;
    const w = Math.min(cssW - 40 * u, 440 * u), h = 62 * u;
    const x = (cssW - w) / 2, y = cssH - safe.b - h - 12 * u;
    woodPanel(ctx, x, y, w, h, null, u);
    text(ctx, 'Royal Sage', x + 22 * u, y + 24 * u, 12 * u, { align: 'left', font: TITLE, weight: 400, fill: '#7a160a', stroke: false });
    const lines = wrap(ctx, step.text, 12 * u, w - 40 * u);
    lines.slice(0, 2).forEach((ln, i) => text(ctx, ln, x + 22 * u, y + 40 * u + i * 14 * u, 12 * u, { align: 'left', weight: 700, fill: '#3a2414', stroke: false }));
    if (step.point !== undefined) {
      const p = game.plots[step.point];
      const s = view.toScreen(p.x, p.y - 40);
      const bob = Math.sin(this.time * 6) * 5 * u;
      ctx.fillStyle = '#ffd25a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(s.x, s.y + bob); ctx.lineTo(s.x - 10 * u, s.y - 14 * u + bob); ctx.lineTo(s.x - 4 * u, s.y - 14 * u + bob); ctx.lineTo(s.x - 4 * u, s.y - 28 * u + bob); ctx.lineTo(s.x + 4 * u, s.y - 28 * u + bob); ctx.lineTo(s.x + 4 * u, s.y - 14 * u + bob); ctx.lineTo(s.x + 10 * u, s.y - 14 * u + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  drawModal(ctx, view, game, assets, info) {
    const { u, cssW, cssH } = view, m = this.modal;
    ctx.fillStyle = 'rgba(12,6,2,0.55)'; ctx.fillRect(0, 0, cssW, cssH);
    this.tap(0, 0, cssW, cssH, () => {}); // swallow taps behind the panel
    const w = Math.min(cssW - 40 * u, 380 * u), h = Math.min(cssH - 50 * u, 250 * u);
    const x = (cssW - w) / 2, y = (cssH - h) / 2 + 8 * u;
    const btn = (label, color, bx, fn, bw = 110 * u) => { const by = y + h - 52 * u; gemButton(ctx, bx, by, bw, 36 * u, label, color, u); this.tap(bx, by, bw, 36 * u, fn); };
    if (m.type === 'newEnemy') {
      const def = ENEMIES[m.enemy];
      woodPanel(ctx, x, y, w, h, 'New enemy!', u);
      const spr = assets.get('enemy:' + def.art);
      const big = def.boss ? 1.1 : 2;
      // a lit stage behind the enemy portrait
      const gx = x + 76 * u, gy = y + h * 0.7;
      const glow = ctx.createRadialGradient(gx, gy - 30 * u, 4 * u, gx, gy - 30 * u, 70 * u);
      glow.addColorStop(0, 'rgba(255,214,107,0.55)'); glow.addColorStop(1, 'rgba(255,214,107,0)');
      ctx.fillStyle = glow; ctx.fillRect(x + 10 * u, y + 20 * u, 140 * u, h - 40 * u);
      ctx.fillStyle = 'rgba(90,58,34,0.25)'; ctx.beginPath(); ctx.ellipse(gx, gy + 2 * u, 46 * u, 9 * u, 0, 0, Math.PI * 2); ctx.fill();
      if (spr) blit(ctx, spr, gx, gy, u * big);
      text(ctx, def.name, x + 150 * u, y + 56 * u, 21 * u, { align: 'left', font: TITLE, weight: 400, fill: '#7a160a', stroke: false, max: w - 170 * u });
      const lines = wrap(ctx, def.tip, 13 * u, w - 176 * u);
      lines.slice(0, 4).forEach((ln, i) => text(ctx, ln, x + 150 * u, y + 82 * u + i * 17 * u, 13 * u, { align: 'left', weight: 700, fill: '#3a2414', stroke: false }));
      btn('GOT IT', 'green', x + w - 140 * u, () => this.actions.dismiss());
    } else if (m.type === 'pause') {
      woodPanel(ctx, x, y, w, h, 'Paused', u);
      text(ctx, game.level.name, x + w / 2, y + 60 * u, 16 * u, { font: TITLE, weight: 400, fill: '#5a2a10', stroke: false, max: w - 40 * u });
      const bw = (w - 60 * u) / 3;
      btn('RESUME', 'green', x + 18 * u, () => this.actions.resume(), bw);
      btn('RESTART', 'gold', x + 30 * u + bw, () => this.actions.restart(), bw);
      btn('QUIT', 'red', x + 42 * u + bw * 2, () => this.actions.quit(), bw);
    } else if (m.type === 'won' || m.type === 'lost') {
      const won = m.type === 'won';
      woodPanel(ctx, x, y, w, h, won ? 'Victory!' : 'The fort has fallen', u);
      if (won) {
        for (let i = 0; i < 3; i++) blit(ctx, assets.get(i < m.diyas ? 'ui:diya' : 'ui:diyaOff'), x + w / 2 + (i - 1) * 44 * u, y + 78 * u, u * 1.5);
        text(ctx, `${game.lives} of ${game.maxLives} lives left`, x + w / 2, y + 116 * u, 13 * u, { fill: '#3a2414', stroke: false, weight: 700 });
      } else text(ctx, 'Try different towers or build spots.', x + w / 2, y + 90 * u, 13 * u, { fill: '#3a2414', stroke: false, weight: 700, max: w - 40 * u });
      const bw = (w - 60 * u) / 3;
      btn('LEVELS', 'blue', x + 18 * u, () => this.actions.quit(), bw);
      btn(won ? 'REPLAY' : 'RETRY', 'gold', x + 30 * u + bw, () => this.actions.restart(), bw);
      if (won && info.hasNext) btn('NEXT', 'green', x + 42 * u + bw * 2, () => this.actions.next(), bw);
    }
  }
}

export { gemButton, woodPanel };
