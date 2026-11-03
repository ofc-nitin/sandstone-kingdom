// Every screen outside a battle: main menu, world map (story and challenge modes), the
// battle briefing, shop, daily reward, quests, Royal Workshop, achievements, rankings and
// settings. Drawn on the canvas in CSS pixels, anchored to the safe area and scaled by view.u.
/* global mapNodes, BANDS, MAP_W */
import { blit } from '../render/raster.js';
import { text, wrap, gemButton, woodPanel } from '../render/hud.js';
import { LEVELS } from '../engine/levels.js';
import { ENEMIES, TOWERS, ROYAL_TOWERS, POWERUPS, POWERUP_ORDER } from '../engine/data.js';
import * as M from '../meta/profile.js';
import { LINKS, APP_VERSION } from '../platform/config.js';

const TITLE = '"Rozha One", Georgia, serif';
const INK = '#3a2414', RED_INK = '#7a160a';
const fmt = (n) => Math.floor(n).toLocaleString('en-IN');
const REGION_NAMES = ['Aravalli Hills', 'Thar Desert', 'Western Ghats', 'Deccan Ruins', 'Sundarbans', 'Himalayas'];

function card(ctx, x, y, w, h, u, { glow = false, dim = false, dark = false } = {}) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 6 * u; ctx.shadowOffsetY = 2 * u;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(x, y, w, h, 9 * u); ctx.fill();
  ctx.restore();
  const rim = ctx.createLinearGradient(0, y, 0, y + h); rim.addColorStop(0, glow ? '#fff4c0' : '#e8c46a'); rim.addColorStop(1, glow ? '#f2b31a' : '#a8700f');
  ctx.fillStyle = rim; ctx.beginPath(); ctx.roundRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, 7.5 * u); ctx.fill();
  const par = ctx.createLinearGradient(0, y, 0, y + h);
  if (dark) { par.addColorStop(0, '#6a4428'); par.addColorStop(1, '#3f2614'); } else { par.addColorStop(0, '#fdf2d8'); par.addColorStop(1, '#ecd3a4'); }
  ctx.fillStyle = par; ctx.beginPath(); ctx.roundRect(x + 4 * u, y + 4 * u, w - 8 * u, h - 8 * u, 6 * u); ctx.fill();
  if (glow) { ctx.strokeStyle = 'rgba(255,214,107,0.9)'; ctx.lineWidth = 2.4 * u; ctx.beginPath(); ctx.roundRect(x - 2 * u, y - 2 * u, w + 4 * u, h + 4 * u, 11 * u); ctx.stroke(); }
  if (dim) { ctx.fillStyle = 'rgba(40,26,14,0.42)'; ctx.beginPath(); ctx.roundRect(x + 4 * u, y + 4 * u, w - 8 * u, h - 8 * u, 6 * u); ctx.fill(); }
}

function progressBar(ctx, x, y, w, h, v, u, col = '#5fbf4a') {
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.roundRect(x + 1.5 * u, y + 1.5 * u, w - 3 * u, h - 3 * u, h / 2); ctx.fill();
  if (v > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x + 1.5 * u, y + 1.5 * u, Math.max(h - 3 * u, (w - 3 * u) * Math.min(1, v)), h - 3 * u, h / 2); ctx.fill(); }
}

function ribbon(ctx, cx, y, label, u, size = 18) {
  ctx.font = `400 ${size * u}px ${TITLE}`;
  const tw = Math.min(ctx.measureText(label).width + 44 * u, 560 * u), h = 28 * u * (size / 18);
  ctx.fillStyle = '#7a160a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * u;
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sg * (tw / 2 - 6 * u), y + 6 * u); ctx.lineTo(cx + sg * (tw / 2 + 18 * u), y + 6 * u); ctx.lineTo(cx + sg * (tw / 2 + 8 * u), y + h / 2 + 4 * u); ctx.lineTo(cx + sg * (tw / 2 + 18 * u), y + h + 2 * u); ctx.lineTo(cx + sg * (tw / 2 - 6 * u), y + h + 2 * u); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const rib = ctx.createLinearGradient(0, y, 0, y + h); rib.addColorStop(0, '#e8553a'); rib.addColorStop(1, '#7a160a');
  ctx.fillStyle = rib; ctx.beginPath(); ctx.roundRect(cx - tw / 2, y, tw, h, 3 * u); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(cx - tw / 2 + 4 * u, y + 3.5 * u); ctx.lineTo(cx + tw / 2 - 4 * u, y + 3.5 * u); ctx.moveTo(cx - tw / 2 + 4 * u, y + h - 3.5 * u); ctx.lineTo(cx + tw / 2 - 4 * u, y + h - 3.5 * u); ctx.stroke();
  text(ctx, label, cx, y + h * 0.68, size * u, { font: TITLE, weight: 400, max: tw - 18 * u, sw: 3.4 * u });
}

export class Screens {
  constructor(app) {
    this.app = app;
    this.targets = [];
    this.time = 0;
    this.mapScroll = null;
    this.mapMode = 'story';
    this.modal = null; // overlay inside a screen: challenges list, confirm, info
    this.shopTab = 'offers';
    this.achPage = 0;
    this.brief = null;
    this.ranks = null;
  }

  get p() { return this.app.store.profile; }
  tap(x, y, w, h, fn, round = false) { this.targets.push({ x, y, w, h, fn, round }); }
  hit(px, py) {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const inside = t.round ? Math.hypot(px - t.x, py - t.y) <= t.w : px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h;
      if (inside) { if (t.fn) { this.app.sound.play('click'); t.fn(); } return true; }
    }
    return false;
  }

  // ---------------------------------------------------------------- shared pieces
  frame(view) {
    const { u, cssW, cssH, safe } = view;
    return { u, W: cssW, H: cssH, L: safe.l + 12 * u, R: cssW - safe.r - 12 * u, T: safe.t + 10 * u, B: cssH - safe.b - 10 * u };
  }
  btn(ctx, x, y, w, h, label, color, fn, u, enabled = true) {
    gemButton(ctx, x, y, w, h, label, color, u, enabled);
    if (enabled && fn) this.tap(x, y, w, h, fn);
  }
  round(ctx, name, x, y, k, fn, u, badge = 0, label = null) {
    blit(ctx, this.app.assets.get('btn:' + name), x, y, u * k);
    if (badge) {
      ctx.fillStyle = '#d83a1e'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * u;
      ctx.beginPath(); ctx.arc(x + 16 * u * k, y - 16 * u * k, 8 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      text(ctx, String(badge), x + 16 * u * k, y - 12.4 * u * k, 10 * u, { sw: 2 * u });
    }
    if (label) text(ctx, label, x, y + 28 * u * k, 10 * u, { sw: 2.6 * u, max: 70 * u });
    if (fn) this.tap(x, y, Math.max(22 * k, 24) * u, 0, fn, true);
  }
  pill(ctx, x, y, kind, value, u, w = 92) {
    w *= u;
    const h = 24 * u;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.roundRect(x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, h / 2); ctx.fill();
    blit(ctx, this.app.assets.get('ui:' + kind), x + 12 * u, y + h / 2, u);
    text(ctx, fmt(value), x + w / 2 + 9 * u, y + h * 0.7, 13 * u, { max: w - 34 * u });
    return w;
  }
  wallet(ctx, f, { onShop = true } = {}) {
    const { u, R, T } = f;
    const w2 = 92 * u, w1 = 104 * u;
    this.pill(ctx, R - w2, T, 'ruby', this.p.rubies, u, 92);
    this.pill(ctx, R - w2 - w1 - 8 * u, T, 'coin', this.p.coins, u, 104);
    if (onShop) this.tap(R - w2 - w1 - 8 * u, T, w1 + w2 + 8 * u, 24 * u, () => this.app.go('shop'));
  }
  backButton(ctx, f, fn) { this.round(ctx, 'back', f.L + 20 * f.u, f.T + 20 * f.u, 0.9, fn || (() => this.app.back()), f.u); }
  backdrop(ctx, view, dark = 0.55) {
    const bg = this.app.assets.menuBg;
    if (bg) ctx.drawImage(bg.canvas, 0, 0, view.cssW, view.cssH); else { ctx.fillStyle = '#3a2414'; ctx.fillRect(0, 0, view.cssW, view.cssH); }
    ctx.fillStyle = `rgba(18,9,4,${dark})`; ctx.fillRect(0, 0, view.cssW, view.cssH);
  }
  panel(ctx, f, title, top = 52) {
    const { u, L, R, T, B } = f;
    const x = L, y = T + top * u, w = R - L, h = B - y;
    woodPanel(ctx, x, y, w, h, null, u);
    if (title) ribbon(ctx, (L + R) / 2, T + top * u - 16 * u, title, u);
    return { x: x + 16 * u, y: y + 16 * u, w: w - 32 * u, h: h - 30 * u };
  }

  draw(ctx, view, name, dt) {
    this.time += dt;
    this.targets = [];
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const f = this.frame(view);
    const fn = this['draw_' + name];
    if (fn) fn.call(this, ctx, view, f);
    if (this.modal) this.drawModal(ctx, view, f);
  }

  // ---------------------------------------------------------------- main menu
  draw_menu(ctx, view, f) {
    const { u, W, H, L, R, T, B } = f, p = this.p, a = this.app;
    const bg = a.assets.menuBg;
    if (bg) ctx.drawImage(bg.canvas, 0, 0, W, H);
    const vig = ctx.createLinearGradient(W * 0.5, 0, W, 0); vig.addColorStop(0, 'rgba(20,10,4,0)'); vig.addColorStop(1, 'rgba(20,10,4,0.45)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    // logo, gently breathing
    const lk = Math.min(1.25, (W * 0.42) / 224 / u) * (1 + Math.sin(this.time * 1.6) * 0.012);
    blit(ctx, a.assets.get('ui:logo'), L + 112 * u * lk, T + 82 * u * lk, u * lk);
    this.wallet(ctx, f);
    // the three ways to play
    const bw = Math.min(210 * u, W * 0.3), bh = 44 * u, bx = R - bw, gap = 10 * u;
    let by = T + 40 * u;
    const story = M.levelsWon(p) === 0 && !(p.diyas[0] > 0) ? 'PLAY' : 'STORY';
    this.btn(ctx, bx, by, bw, bh + 6 * u, story, 'red', () => a.go('map', { mode: 'story' }), u);
    by += bh + 6 * u + gap;
    this.btn(ctx, bx, by, bw, bh, 'CHALLENGES', 'gold', () => (M.levelsWon(p) ? a.go('map', { mode: 'challenge' }) : a.toast('Win a story level to unlock its challenges')), u, true);
    if (!M.levelsWon(p)) this.lockOn(ctx, bx + bw - 20 * u, by + bh / 2, u);
    by += bh + gap;
    const endless = M.endlessUnlocked(p);
    this.btn(ctx, bx, by, bw, bh, 'ENDLESS', 'purple', () => (endless ? a.go('briefing', { mode: 'endless', level: 5 }) : a.toast('Defeat the Bandit King to unlock Endless mode')), u, true);
    if (!endless) this.lockOn(ctx, bx + bw - 20 * u, by + bh / 2, u);
    by += bh + gap;
    this.btn(ctx, bx, by, bw, bh, 'SHOP', 'blue', () => a.go('shop'), u);
    // the corner buttons
    const daily = M.dailyStatus(p).canClaim ? 1 : 0;
    M.refreshQuests(p);
    const quests = M.questsReady(p);
    const row = [['settings', 'Settings', () => a.go('settings')], ['trophy', 'Awards', () => a.go('achievements')], ['ranks', 'Ranks', () => a.go('ranks')],
      ['daily', 'Daily', () => a.go('daily'), daily], ['quests', 'Quests', () => a.go('quests'), quests], ['workshop', 'Workshop', () => a.go('workshop')]];
    const k = 0.82, step = 50 * u;
    row.forEach(([name, label, fn, badge], i) => this.round(ctx, name, L + 22 * u + i * step, B - 30 * u, k, fn, u, badge || 0, label));
    // Google Play Games sign-in, the reason to sign in shown right there
    const g = a.platform.games;
    if (g.available) {
      const gy = B - 30 * u - 46 * u;
      if (!g.signedIn) {
        this.btn(ctx, L, gy - 12 * u, 168 * u, 28 * u, 'SIGN IN · +20% DAILY', 'green', () => a.signIn(), u);
      } else text(ctx, `Signed in as ${g.player ? g.player.name : 'player'}`, L, gy + 6 * u, 11 * u, { align: 'left', sw: 2.6 * u, max: 200 * u });
    }
  }
  lockOn(ctx, x, y, u) { blit(ctx, this.app.assets.get('ui:lock'), x, y, u * 0.9); }

  // ---------------------------------------------------------------- world map
  draw_map(ctx, view, f) {
    const { u, W, H } = f, a = this.app, map = a.assets.map, p = this.p, challenge = this.mapMode === 'challenge';
    if (!map) return;
    const nodes = mapNodes(), ms = map.scale;
    const maxScroll = Math.max(0, map.width - W);
    if (this.mapScroll === null) {
      const cur = Math.min(LEVELS.length - 1, LEVELS.findIndex((l) => !(p.diyas[l.id] > 0)) < 0 ? LEVELS.length - 1 : LEVELS.findIndex((l) => !(p.diyas[l.id] > 0)));
      this.mapScroll = nodes[Math.max(0, cur)][0] * ms - W * 0.4;
    }
    this.mapScroll = Math.max(0, Math.min(maxScroll, this.mapScroll));
    const sx = this.mapScroll;
    for (const c of map.chunks) if (c.x + c.w > sx && c.x < sx + W) ctx.drawImage(c.canvas, c.x - sx, 0, c.w + 0.5, H);
    // regions after the first: coming in free updates
    for (let r = 1; r < 6; r++) {
      const bx = (BANDS[r].x0 + 140) * ms - sx;
      if (bx < -200 * u || bx > W + 200 * u) continue;
      ctx.fillStyle = 'rgba(20,12,6,0.35)'; ctx.fillRect(BANDS[r].x0 * ms - sx, 0, 280 * ms, H);
      text(ctx, 'Coming in a free update', bx, (66 + 46) * ms, 14 * u, { font: TITLE, weight: 400, sw: 4 * u, max: 260 * ms });
    }
    // level nodes
    const curIdx = LEVELS.findIndex((l) => !(p.diyas[l.id] > 0));
    nodes.forEach(([nx, ny], i) => {
      const x = nx * ms - sx, y = ny * ms;
      if (x < -30 * u || x > W + 30 * u) return;
      const lv = LEVELS[i], exists = !!lv, boss = i > 0 && i % 5 === 0;
      const done = exists && p.diyas[i] > 0, open = exists && M.levelUnlocked(p, i);
      const chOpen = challenge && exists && done && M.CHALLENGES[i];
      const active = challenge ? !!chOpen : open;
      const now = !challenge && i === curIdx;
      const r = (boss ? 15 : 12) * u;
      if (now) { const pr = r + 6 * u + Math.sin(this.time * 4) * 3 * u; const gl = ctx.createRadialGradient(x, y, r * 0.5, x, y, pr + 6 * u); gl.addColorStop(0, 'rgba(255,230,140,0.8)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, pr + 6 * u, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = INK; ctx.beginPath();
      if (boss) { ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y + r * 0.2); ctx.quadraticCurveTo(x, y + r * 1.3, x - r, y + r * 0.2); ctx.closePath(); } else ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      const col = !active ? ['#a89a8a', '#6a5a4e'] : now ? ['#ff7a50', '#b0260e'] : challenge ? ['#c19aff', '#5a2fa8'] : ['#ffe38a', '#c08a12'];
      const gr = ctx.createLinearGradient(0, y - r, 0, y + r); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
      ctx.fillStyle = gr; ctx.beginPath();
      if (boss) { const q = r - 2.4 * u; ctx.moveTo(x - q, y - q); ctx.lineTo(x + q, y - q); ctx.lineTo(x + q, y + q * 0.2); ctx.quadraticCurveTo(x, y + q * 1.3, x - q, y + q * 0.2); ctx.closePath(); } else ctx.arc(x, y, r - 2.4 * u, 0, Math.PI * 2);
      ctx.fill();
      if (boss) { ctx.fillStyle = active ? '#fff4c0' : '#cbbfae'; ctx.beginPath(); ctx.moveTo(x - 7 * u, y + 2 * u); ctx.lineTo(x - 5 * u, y - 6 * u); ctx.lineTo(x - 1.5 * u, y - 2 * u); ctx.lineTo(x, y - 8 * u); ctx.lineTo(x + 1.5 * u, y - 2 * u); ctx.lineTo(x + 5 * u, y - 6 * u); ctx.lineTo(x + 7 * u, y + 2 * u); ctx.closePath(); ctx.fill(); }
      else text(ctx, i === 0 ? 'T' : String(i), x, y + 4.4 * u, 12 * u, { sw: 2.6 * u });
      if (!active && exists && !challenge) blit(ctx, a.assets.get('ui:lock'), x + r * 0.8, y + r * 0.7, u * 0.6);
      if (!challenge && done && i > 0) for (let k = 0; k < 3; k++) blit(ctx, a.assets.get(k < p.diyas[i] ? 'ui:diya' : 'ui:diyaOff'), x + (k - 1) * 11 * u, y - r - 9 * u, u * 0.5);
      if (challenge && exists && M.CHALLENGES[i]) {
        const n = M.CHALLENGES[i].filter((c) => p.challenges[M.challengeKey(i, c.id)]).length;
        text(ctx, done ? `${n}/3` : 'locked', x, y - r - 5 * u, 10 * u, { sw: 2.6 * u, fill: n === 3 ? '#ffd66b' : '#fff4dc' });
      }
      if (now) blit(ctx, a.assets.get('hero:sunKnight'), x + r + 4 * u, y + 6 * u, ms * 0.55);
      if (exists && (challenge ? (i > 0) : true)) this.tap(x - r - 6 * u, y - r - 12 * u, 2 * r + 12 * u, 2 * r + 24 * u, () => this.openNode(i));
    });
    // fixed UI
    const { L, R, T, B } = f;
    this.backButton(ctx, f, () => a.go('menu'));
    if (!a.platform.ads.bannerShown) ribbon(ctx, W / 2, T, challenge ? 'Challenge Mode' : 'The Journey of Six Seasons', u, 15);
    this.wallet(ctx, f);
    if (challenge) text(ctx, 'Each level you complete unlocks 3 challenges · rewards are rubies', W / 2, B - 4 * u, 11 * u, { sw: 3 * u, max: R - L - 40 * u });
    else {
      // a little arrow hint to drag
      const k = (Math.sin(this.time * 2) + 1) / 2;
      ctx.globalAlpha = 0.7; text(ctx, 'Drag to explore the kingdom  ›', R - 6 * u - k * 4 * u, B - 4 * u, 11 * u, { align: 'right', sw: 3 * u }); ctx.globalAlpha = 1;
    }
  }
  dragMap(dx) { if (this.mapScroll !== null) this.mapScroll -= dx; }

  openNode(i) {
    const p = this.p, lv = LEVELS[i], a = this.app;
    if (!lv) { a.toast(`${REGION_NAMES[Math.floor((i - 1) / 5)] || 'This region'} arrives in a free update`); return; }
    if (this.mapMode === 'challenge') {
      if (!(p.diyas[i] > 0)) { a.toast('Complete this level in Story mode to unlock its challenges'); return; }
      this.modal = { type: 'challenges', level: i };
      return;
    }
    if (!M.levelUnlocked(p, i)) { a.toast('Win the previous level first'); return; }
    a.go('briefing', { mode: 'story', level: i });
  }

  // ---------------------------------------------------------------- battle briefing (shown before every battle)
  openBriefing(params) {
    const p = this.p, lv = LEVELS[params.level];
    const allowed = (t) => !params.challenge || !params.challenge.rules.towers || params.challenge.rules.towers.includes(t);
    const owned = M.ownedRoyal(p).filter(allowed);
    let special = p.lastSpecial && owned.includes(p.lastSpecial) ? p.lastSpecial : (owned[0] || null);
    if (!lv.plots.some((pl) => pl.royal)) special = null;
    this.brief = { ...params, special, trial: null };
  }

  draw_briefing(ctx, view, f) {
    const { u, W, L, R } = f, a = this.app, p = this.p, b = this.brief, lv = LEVELS[b.level];
    this.backdrop(ctx, view, 0.5);
    const c = this.panel(ctx, f, lv.name, 40);
    const mode = b.mode === 'endless' ? 'Endless mode' : b.mode === 'challenge' ? `Challenge · ${b.challenge.name}` : lv.id === 0 ? 'Tutorial' : `Story · Level ${lv.id}${lv.boss ? ' · Boss fight' : ''}`;
    text(ctx, mode, W / 2, c.y + 14 * u, 13 * u, { fill: RED_INK, stroke: false, weight: 900, max: c.w - 40 * u });
    const colW = c.w * 0.52, x1 = c.x + 4 * u, x2 = c.x + colW + 18 * u, w2 = c.w - colW - 18 * u;
    let y = c.y + 38 * u;
    // ---- why we fight (the story, short and casual)
    const head = (label, x, yy) => text(ctx, label, x, yy, 12 * u, { align: 'left', font: TITLE, weight: 400, fill: RED_INK, stroke: false });
    if (b.mode === 'challenge') {
      head('The challenge', x1, y);
      const lines = wrap(ctx, `${b.challenge.desc}. Beat it to earn ${b.challenge.rubies} rubies.`, 12 * u, colW - 10 * u);
      lines.slice(0, 3).forEach((ln, i) => text(ctx, ln, x1, y + 17 * u + i * 15 * u, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false }));
      y += 17 * u + Math.min(3, lines.length) * 15 * u + 6 * u;
    } else if (b.mode === 'endless') {
      head('Endless', x1, y);
      const best = p.stats.endlessBest[lv.id] || 0, score = p.stats.endlessScore[lv.id] || 0;
      const lines = wrap(ctx, 'The bandits never stop coming, and every wave hits harder. How long can you hold the camp? Your score goes on the leaderboard.', 12 * u, colW - 10 * u);
      lines.slice(0, 3).forEach((ln, i) => text(ctx, ln, x1, y + 17 * u + i * 15 * u, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false }));
      y += 17 * u + Math.min(3, lines.length) * 15 * u + 4 * u;
      text(ctx, `Best: wave ${best} · ${fmt(score)} points`, x1, y + 4 * u, 12 * u, { align: 'left', fill: RED_INK, stroke: false, max: colW });
      y += 14 * u;
    } else {
      head('Why we fight', x1, y);
      const lines = wrap(ctx, lv.story || '', 12 * u, colW - 10 * u);
      lines.slice(0, 4).forEach((ln, i) => text(ctx, ln, x1, y + 17 * u + i * 15 * u, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false }));
      y += 17 * u + Math.min(4, lines.length) * 15 * u + 6 * u;
    }
    // ---- enemies on this map
    head('Enemies', x1, y + 4 * u);
    const types = [...new Set(lv.waves.flat().map((gr) => gr.type))];
    const ex = x1, ey = y + 62 * u;
    types.slice(0, 6).forEach((t, i) => {
      const def = ENEMIES[t], spr = a.assets.get('enemy:' + def.art), cx = ex + 24 * u + i * 52 * u;
      if (cx > x1 + colW) return;
      ctx.fillStyle = 'rgba(90,58,34,0.18)'; ctx.beginPath(); ctx.ellipse(cx, ey, 20 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill();
      if (spr) blit(ctx, spr, cx, ey, u * (def.boss ? 0.45 : 0.85));
      if (!p.seen[t]) { ctx.fillStyle = '#d83a1e'; ctx.beginPath(); ctx.roundRect(cx - 14 * u, ey + 2 * u, 28 * u, 12 * u, 6 * u); ctx.fill(); text(ctx, 'NEW', cx, ey + 11.4 * u, 9 * u, { sw: 2 * u }); }
    });
    // ---- the battlefield: build spots
    let ry = c.y + 38 * u;
    head('Battlefield', x2, ry);
    const free = lv.plots.filter((pl) => !pl.lock).length, locked = lv.plots.filter((pl) => pl.lock).length, sp = lv.plots.filter((pl) => pl.royal).length;
    const row = (sprite, label, yy) => { blit(ctx, a.assets.get(sprite), x2 + 16 * u, yy + 6 * u, u * 0.5); text(ctx, label, x2 + 36 * u, yy + 8 * u, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false, max: w2 - 40 * u }); };
    row('plot:open', `${free} open build spots`, ry + 12 * u);
    row('plot:rubble', `${locked} locked (gold or time)`, ry + 32 * u);
    row('plot:special', `${sp} special spots (max 3)`, ry + 52 * u);
    ry += 78 * u;
    // ---- special tower picker
    head('Special tower', x2, ry);
    if (!sp) text(ctx, 'No special spots on this map.', x2, ry + 18 * u, 11 * u, { align: 'left', weight: 700, fill: INK, stroke: false, max: w2 });
    else {
      text(ctx, 'Builds only on special spots. +15% range there.', x2, ry + 15 * u, 10 * u, { align: 'left', weight: 700, fill: '#6a4a2a', stroke: false, max: w2 });
      const ids = Object.keys(ROYAL_TOWERS), cw = Math.min(120 * u, (w2 - 8 * u) / ids.length), ch = Math.max(80 * u, Math.min(104 * u, c.y + c.h - 50 * u - (ry + 22 * u)));
      ids.forEach((id, i) => {
        const cx = x2 + i * (cw + 8 * u), cy = ry + 22 * u, def = TOWERS[id], own = !!p.owned[id] || b.trial === id;
        const allowed = !b.challenge || !b.challenge.rules.towers || b.challenge.rules.towers.includes(id);
        const sel = b.special === id;
        card(ctx, cx, cy, cw, ch, u, { glow: sel, dim: !allowed });
        blit(ctx, a.assets.get('card:' + def.art), cx + cw / 2, cy + ch - 34 * u, u * 0.5);
        text(ctx, def.name, cx + cw / 2, cy + ch - 20 * u, 9.5 * u, { weight: 900, fill: INK, stroke: false, max: cw - 10 * u });
        if (!allowed) text(ctx, 'Not allowed', cx + cw / 2, cy + ch - 8 * u, 9 * u, { fill: '#8a1a0a', stroke: false, weight: 900, max: cw - 8 * u });
        else if (own) text(ctx, sel ? 'SELECTED' : 'Tap to choose', cx + cw / 2, cy + ch - 8 * u, 9 * u, { fill: sel ? '#2f8f3c' : '#6a4a2a', stroke: false, weight: 900, max: cw - 8 * u });
        else {
          blit(ctx, a.assets.get('ui:ruby'), cx + cw / 2 - 24 * u, cy + ch - 11 * u, u * 0.55);
          text(ctx, `${ROYAL_TOWERS[id].rubies} · or try`, cx + cw / 2 + 4 * u, cy + ch - 7.5 * u, 9 * u, { fill: INK, stroke: false, weight: 900, max: cw - 30 * u });
        }
        if (allowed) this.tap(cx, cy, cw, ch, () => {
          if (own) { b.special = sel ? null : id; return; }
          this.modal = { type: 'royal', id };
        });
      });
    }
    // ---- bottom bar: back, power-ups, start
    const by = c.y + c.h - 36 * u;
    this.btn(ctx, c.x, by, 100 * u, 36 * u, 'BACK', 'red', () => a.back(), u);
    let px = c.x + 120 * u;
    text(ctx, 'Power-ups', px, by + 13 * u, 10 * u, { align: 'left', fill: RED_INK, stroke: false });
    for (const k of POWERUP_ORDER) { blit(ctx, a.assets.get('btn:' + (k === 'gold' ? 'gold' : k)), px + 12 * u, by + 26 * u, u * 0.45); text(ctx, `×${p.powerups[k] || 0}`, px + 24 * u, by + 31 * u, 11 * u, { align: 'left', fill: INK, stroke: false }); px += 50 * u; }
    const sw = 150 * u;
    this.btn(ctx, c.x + c.w - sw, by - 4 * u, sw, 42 * u, b.mode === 'endless' ? 'DEFEND' : 'START', 'green', () => a.startBattle({ ...b }), u);
    void L; void R;
  }

  // ---------------------------------------------------------------- shop
  draw_shop(ctx, view, f) {
    const { u, W } = f, a = this.app, p = this.p, bill = a.platform.billing;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f, { onShop: false });
    const c = this.panel(ctx, f, 'Royal Bazaar', 56);
    const tabs = [['offers', 'Offers'], ['rubies', 'Rubies'], ['royal', 'Royal Towers'], ['power', 'Power-ups']];
    const tw = Math.min(130 * u, (c.w - 30 * u) / tabs.length);
    tabs.forEach(([id, label], i) => {
      const x = c.x + i * (tw + 8 * u), on = this.shopTab === id;
      this.btn(ctx, x, c.y - 2 * u, tw, 30 * u, label, on ? 'red' : 'grey', () => { this.shopTab = id; }, u);
    });
    const top = c.y + 38 * u, h = c.h - 40 * u - 26 * u;
    const items = [];
    const priceOf = (id) => bill.price(id) || `₹${M.product(id).inr}`;
    if (this.shopTab === 'offers') {
      if (!p.purchases.starter_pack) items.push({ title: 'Starter Pack', lines: ['150 rubies + 500 coins', '+ one of each power-up'], tag: 'Best value', icon: 'big:chest', btn: priceOf('starter_pack'), color: 'green', fn: () => a.buy('starter_pack') });
      if (!p.removeAds) items.push({ title: 'Remove Ads', lines: ['No more ads between levels', 'Bonus ads stay optional'], icon: 'btn:ad', btn: priceOf('remove_ads'), color: 'green', fn: () => a.buy('remove_ads') });
      const left = M.adChestLeft(p);
      items.push({ title: 'Free Ruby Chest', lines: [`Watch an ad: +${M.AD_CHEST_RUBIES} rubies`, `${left} left today`], icon: 'ui:chestSmall', btn: left ? 'WATCH' : 'TOMORROW', color: 'purple', enabled: left > 0, fn: () => a.adChest() });
    } else if (this.shopTab === 'rubies') {
      for (const pr of M.PRODUCTS.filter((x) => x.type === 'consumable')) items.push({ title: pr.name, lines: [`${fmt(pr.grant.rubies)} rubies`, pr.bonus ? `includes ${pr.bonus} bonus` : ' '], tag: pr.tag, icon: 'ui:ruby', btn: priceOf(pr.id), color: 'green', fn: () => a.buy(pr.id) });
    } else if (this.shopTab === 'royal') {
      for (const [id, rt] of Object.entries(ROYAL_TOWERS)) {
        const own = p.owned[id];
        items.push({ title: TOWERS[id].name, lines: [TOWERS[id].tip.split(':')[0], 'Yours forever, every level'], icon: 'icon:' + TOWERS[id].art, iconK: 0.9, btn: own ? 'OWNED' : `${rt.rubies} RUBIES`, color: 'red', enabled: !own, fn: () => { this.modal = { type: 'royal', id }; } });
      }
    } else {
      for (const k of POWERUP_ORDER) {
        const d = POWERUPS[k];
        items.push({ title: d.name, lines: [d.desc, `You have ${p.powerups[k] || 0}`], icon: 'btn:' + k, btn: `${d.coins} COINS`, color: 'gold', enabled: p.coins >= d.coins, fn: () => { if (M.buyPowerup(p, k, 'coins')) { a.save(); a.sound.play('coin'); } }, btn2: `${d.rubies} RUBIES`, fn2: () => { if (M.buyPowerup(p, k, 'rubies')) { a.save(); a.sound.play('coin'); } else a.toast('Not enough rubies'); } });
      }
    }
    const n = Math.max(1, items.length), cols = Math.min(n, this.shopTab === 'rubies' ? 5 : 3), gap = 10 * u;
    const cw = (c.w - gap * (cols - 1)) / cols, chh = h;
    items.forEach((it, i) => {
      const x = c.x + i * (cw + gap), y = top;
      card(ctx, x, y, cw, chh, u, { glow: !!it.tag });
      if (it.tag) { ctx.fillStyle = '#d83a1e'; ctx.beginPath(); ctx.roundRect(x + cw / 2 - 36 * u, y - 6 * u, 72 * u, 16 * u, 8 * u); ctx.fill(); text(ctx, it.tag, x + cw / 2, y + 6 * u, 9.5 * u, { sw: 2 * u, max: 66 * u }); }
      text(ctx, it.title, x + cw / 2, y + 26 * u, 13 * u, { font: TITLE, weight: 400, fill: RED_INK, stroke: false, max: cw - 12 * u });
      const big = it.icon === 'big:chest', spr = a.assets.get(big ? 'chest' : it.icon.includes(':') ? it.icon : 'ui:' + it.icon) || a.assets.get('ui:chestSmall');
      const ik = it.iconK || (big ? Math.min(1, (chh - 120 * u) / (90 * u)) : it.icon === 'ui:ruby' ? 2 + Math.min(1.4, i * 0.35) : it.icon === 'ui:chestSmall' ? 2 : 1.6);
      if (spr) blit(ctx, spr, x + cw / 2, y + chh * 0.42 + (it.icon.startsWith('icon:') ? 22 * u : big ? chh * 0.16 : 0), u * ik);
      it.lines.forEach((ln, k) => text(ctx, ln, x + cw / 2, y + chh - 62 * u + k * 13 * u, 10 * u, { weight: 700, fill: INK, stroke: false, max: cw - 12 * u }));
      if (it.btn2) {
        const bw = (cw - 22 * u) / 2;
        this.btn(ctx, x + 8 * u, y + chh - 38 * u, bw, 28 * u, it.btn, it.color, it.fn, u, it.enabled !== false);
        this.btn(ctx, x + 14 * u + bw, y + chh - 38 * u, bw, 28 * u, it.btn2, 'red', it.fn2, u, p.rubies >= POWERUPS[POWERUP_ORDER[i]].rubies);
      } else this.btn(ctx, x + 10 * u, y + chh - 38 * u, cw - 20 * u, 30 * u, it.btn, it.color, it.fn, u, it.enabled !== false);
    });
    // restore + the fair-play promise
    text(ctx, 'No loot boxes. Everything shows what you get. The whole story is free to beat.', c.x, c.y + c.h - 2 * u, 9.5 * u, { align: 'left', weight: 700, sw: 2.4 * u, max: c.w - 150 * u });
    text(ctx, 'Restore purchases', c.x + c.w, c.y + c.h - 2 * u, 10 * u, { align: 'right', fill: '#ffd66b', sw: 2.4 * u });
    this.tap(c.x + c.w - 120 * u, c.y + c.h - 18 * u, 120 * u, 24 * u, () => a.restore());
    void W;
  }

  // ---------------------------------------------------------------- daily reward calendar
  draw_daily(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f);
    const c = this.panel(ctx, f, 'Daily Royal Reward', 56);
    const st = M.dailyStatus(p), signed = a.platform.games.signedIn;
    text(ctx, st.missed ? 'You missed a day, so the calendar starts again. Come back tomorrow to keep the streak!' : 'Come back every day. Day 7 is the big royal chest.', c.x + c.w / 2, c.y + 10 * u, 12 * u, { weight: 700, fill: INK, stroke: false, max: c.w });
    const gap = 6 * u, cw = (c.w - gap * 6) / 7, ch = Math.min(150 * u, c.h - 90 * u), y = c.y + 24 * u;
    M.DAILY_REWARDS.forEach((r, i) => {
      const x = c.x + i * (cw + gap);
      const claimed = st.canClaim ? i < st.day : i <= st.day;
      const today = st.canClaim && i === st.day;
      card(ctx, x, y, cw, ch, u, { glow: today, dim: claimed, dark: r.chest });
      text(ctx, `Day ${i + 1}`, x + cw / 2, y + 20 * u, 11 * u, { font: TITLE, weight: 400, fill: r.chest ? '#ffd66b' : RED_INK, stroke: r.chest ? undefined : false, max: cw - 8 * u });
      const spr = a.assets.get(r.chest ? 'chest' : r.rubies ? 'ui:ruby' : 'ui:coin');
      blit(ctx, spr, x + cw / 2, y + ch * (r.chest ? 0.62 : 0.48), u * (r.chest ? Math.min(0.62, cw / (90 * u)) : 1.5));
      const parts = []; if (r.coins) parts.push(`${r.coins} coins`); if (r.rubies) parts.push(`${r.rubies} rubies`); if (r.powerups && !r.chest) parts.push('+ power-up');
      parts.slice(0, 2).forEach((ln, k) => text(ctx, ln, x + cw / 2, y + ch - 24 * u + k * 12 * u, 9.5 * u, { weight: 900, fill: r.chest ? '#fff4dc' : INK, stroke: r.chest ? undefined : false, max: cw - 6 * u }));
      if (claimed) this.check(ctx, x + cw / 2, y + ch * 0.45, u);
    });
    const by = c.y + c.h - 40 * u;
    if (st.canClaim) this.btn(ctx, c.x + c.w / 2 - 90 * u, by, 180 * u, 40 * u, signed ? 'CLAIM +20%' : 'CLAIM', 'green', () => a.claimDaily(), u);
    else text(ctx, 'Claimed today. See you tomorrow!', c.x + c.w / 2, by + 24 * u, 14 * u, { font: TITLE, weight: 400, fill: RED_INK, stroke: false });
    if (!signed && a.platform.games.available) text(ctx, 'Sign in with Google Play for +20% and a streak that follows you to any phone.', c.x + c.w / 2, by - 6 * u, 10 * u, { weight: 700, fill: INK, stroke: false, max: c.w });
  }
  check(ctx, x, y, u) {
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 7 * u;
    ctx.beginPath(); ctx.moveTo(x - 9 * u, y); ctx.lineTo(x - 3 * u, y + 6 * u); ctx.lineTo(x + 10 * u, y - 8 * u); ctx.stroke();
    ctx.strokeStyle = '#7ef06a'; ctx.lineWidth = 4 * u; ctx.stroke(); ctx.lineCap = 'butt';
  }

  // ---------------------------------------------------------------- daily quests (rubies only)
  draw_quests(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f);
    const c = this.panel(ctx, f, 'Daily Quests', 56);
    M.refreshQuests(p);
    text(ctx, 'New quests every day. Quests pay rubies only.', c.x + c.w / 2, c.y + 10 * u, 12 * u, { weight: 700, fill: INK, stroke: false, max: c.w });
    const rh = Math.min(58 * u, (c.h - 90 * u) / 3), gap = 8 * u;
    p.quests.list.forEach((q, i) => {
      const y = c.y + 22 * u + i * (rh + gap), done = q.progress >= q.n;
      card(ctx, c.x, y, c.w, rh, u, { glow: done && !q.claimed, dim: q.claimed });
      text(ctx, q.text, c.x + 16 * u, y + rh * 0.42, 13 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: c.w * 0.5 });
      progressBar(ctx, c.x + 16 * u, y + rh * 0.58, c.w * 0.45, 12 * u, q.progress / q.n, u);
      text(ctx, `${q.progress}/${q.n}`, c.x + 22 * u + c.w * 0.45, y + rh * 0.58 + 10 * u, 11 * u, { align: 'left', fill: INK, stroke: false });
      blit(ctx, a.assets.get('ui:ruby'), c.x + c.w * 0.66, y + rh / 2, u * 1.1);
      text(ctx, `${q.rubies}`, c.x + c.w * 0.66 + 14 * u, y + rh / 2 + 5 * u, 14 * u, { align: 'left', fill: RED_INK, stroke: false });
      const bx = c.x + c.w - 126 * u;
      if (q.claimed) this.check(ctx, bx + 55 * u, y + rh / 2, u);
      else this.btn(ctx, bx, y + rh / 2 - 16 * u, 110 * u, 32 * u, done ? 'CLAIM' : 'IN PROGRESS', done ? 'green' : 'grey', () => { const r = M.claimQuest(p, q.id); if (r) { a.reward(`+${r} rubies`); a.afterReward(); } }, u, done);
    });
    const allClaimed = p.quests.list.every((q) => q.claimed);
    const by = c.y + c.h - 40 * u;
    blit(ctx, a.assets.get('ui:chestSmall'), c.x + 30 * u, by + 16 * u, u);
    text(ctx, `Finish all three for a bonus chest: ${M.QUEST_BONUS} rubies`, c.x + 60 * u, by + 22 * u, 12 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: c.w - 200 * u });
    if (p.quests.bonus) this.check(ctx, c.x + c.w - 60 * u, by + 18 * u, u);
    else this.btn(ctx, c.x + c.w - 126 * u, by, 110 * u, 34 * u, 'OPEN', 'gold', () => { const r = M.claimQuestBonus(p); if (r) { a.reward(`+${r} rubies`); a.afterReward(); } }, u, allClaimed);
  }

  // ---------------------------------------------------------------- Royal Workshop
  draw_workshop(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f);
    const c = this.panel(ctx, f, 'Royal Workshop', 56);
    const total = M.totalDiyas(p);
    blit(ctx, a.assets.get('ui:diya'), c.x + 10 * u, c.y + 8 * u, u * 0.8);
    text(ctx, `${total} diyas earned · ranks unlock at 3, 9 and 15 diyas`, c.x + 26 * u, c.y + 14 * u, 12 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: c.w - 160 * u });
    this.btn(ctx, c.x + c.w - 120 * u, c.y, 120 * u, 26 * u, 'RESET (FREE)', 'grey', () => { const r = M.resetWorkshop(p); if (r) { a.toast(`Refunded ${fmt(r)} coins`); a.save(); } }, u, Object.keys(p.workshop).length > 0);
    const cols = 3, gap = 10 * u, cw = (c.w - gap * 2) / cols, ch = (c.h - 44 * u - gap) / 2;
    M.WORKSHOP.forEach((t, i) => {
      const x = c.x + (i % cols) * (cw + gap), y = c.y + 38 * u + Math.floor(i / cols) * (ch + gap);
      const rank = p.workshop[t.id] || 0, nx = M.workshopNext(p, t.id);
      card(ctx, x, y, cw, ch, u);
      text(ctx, t.name, x + cw / 2, y + 22 * u, 13 * u, { font: TITLE, weight: 400, fill: RED_INK, stroke: false, max: cw - 12 * u });
      text(ctx, t.desc, x + cw / 2, y + 38 * u, 10 * u, { weight: 700, fill: INK, stroke: false, max: cw - 12 * u });
      for (let k = 0; k < 3; k++) blit(ctx, a.assets.get(k < rank ? 'ui:diya' : 'ui:diyaOff'), x + cw / 2 + (k - 1) * 24 * u, y + 66 * u, u * 0.9);
      if (!nx) text(ctx, 'MASTERED', x + cw / 2, y + ch - 14 * u, 12 * u, { fill: '#2f8f3c', stroke: false });
      else if (nx.locked) text(ctx, `Needs ${nx.diyas} diyas`, x + cw / 2, y + ch - 14 * u, 11 * u, { fill: '#8a1a0a', stroke: false });
      else this.btn(ctx, x + 12 * u, y + ch - 36 * u, cw - 24 * u, 28 * u, `${fmt(nx.coins)} COINS`, 'gold', () => { if (M.buyWorkshop(p, t.id)) { a.sound.play('upgrade'); M.checkAchievements(p); a.afterReward(); } }, u, nx.affordable);
    });
  }

  // ---------------------------------------------------------------- achievements
  draw_achievements(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f);
    const c = this.panel(ctx, f, 'Achievements', 56);
    const got = M.ACHIEVEMENTS.filter((x) => p.achievements[x.id]).length;
    text(ctx, `${got} of ${M.ACHIEVEMENTS.length} unlocked · each one pays rubies`, c.x, c.y + 12 * u, 12 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: c.w - 190 * u });
    if (a.platform.games.available) this.btn(ctx, c.x + c.w - 170 * u, c.y - 2 * u, 170 * u, 26 * u, 'GOOGLE PLAY', 'green', () => a.platform.games.showAchievements(), u);
    const per = 8, pages = Math.ceil(M.ACHIEVEMENTS.length / per);
    this.achPage = Math.max(0, Math.min(pages - 1, this.achPage));
    const list = M.ACHIEVEMENTS.slice(this.achPage * per, this.achPage * per + per);
    const gap = 8 * u, cw = (c.w - gap) / 2, rh = (c.h - 70 * u - gap * 3) / 4;
    list.forEach((ach, i) => {
      const x = c.x + (i % 2) * (cw + gap), y = c.y + 30 * u + Math.floor(i / 2) * (rh + gap), done = !!p.achievements[ach.id];
      const hidden = ach.secret && !done;
      card(ctx, x, y, cw, rh, u, { dim: !done });
      blit(ctx, a.assets.get(done ? 'ui:trophy' : 'ui:lock'), x + 22 * u, y + rh / 2, u);
      text(ctx, hidden ? 'Secret' : ach.name, x + 42 * u, y + rh * 0.44, 12 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: cw - 110 * u });
      text(ctx, hidden ? 'Keep exploring...' : ach.desc, x + 42 * u, y + rh * 0.44 + 14 * u, 10 * u, { align: 'left', weight: 700, fill: '#5a3a22', stroke: false, max: cw - 110 * u });
      blit(ctx, a.assets.get('ui:ruby'), x + cw - 44 * u, y + rh / 2, u * 0.8);
      text(ctx, String(ach.rubies), x + cw - 32 * u, y + rh / 2 + 5 * u, 12 * u, { align: 'left', fill: RED_INK, stroke: false });
    });
    const by = c.y + c.h - 18 * u;
    if (this.achPage > 0) this.round(ctx, 'left', c.x + c.w / 2 - 60 * u, by, 0.7, () => { this.achPage--; }, u);
    text(ctx, `${this.achPage + 1} / ${pages}`, c.x + c.w / 2, by + 5 * u, 13 * u, { fill: INK, stroke: false });
    if (this.achPage < pages - 1) this.round(ctx, 'right', c.x + c.w / 2 + 60 * u, by, 0.7, () => { this.achPage++; }, u);
  }

  // ---------------------------------------------------------------- rankings
  draw_ranks(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p, g = a.platform.games;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    this.wallet(ctx, f);
    const c = this.panel(ctx, f, 'Rankings', 56);
    const lw = c.w * 0.42;
    card(ctx, c.x, c.y, lw, c.h, u);
    text(ctx, 'Your records', c.x + lw / 2, c.y + 26 * u, 15 * u, { font: TITLE, weight: 400, fill: RED_INK, stroke: false });
    const rows = [['Total diyas', `${M.totalDiyas(p)} / 93`], ['Levels won', `${M.levelsWon(p)}`], ['Challenges', `${Object.keys(p.challenges).length}`], ['Endless best wave', `${p.stats.endlessBest[5] || 0}`], ['Endless best score', fmt(p.stats.endlessScore[5] || 0)], ['Enemies defeated', fmt(p.stats.kills)]];
    rows.forEach(([k, v], i) => { const y = c.y + 52 * u + i * 20 * u; text(ctx, k, c.x + 16 * u, y, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false }); text(ctx, v, c.x + lw - 16 * u, y, 12 * u, { align: 'right', weight: 900, fill: RED_INK, stroke: false }); });
    if (g.available) this.btn(ctx, c.x + 14 * u, c.y + c.h - 44 * u, lw - 28 * u, 32 * u, g.signedIn ? 'GOOGLE PLAY RANKS' : 'SIGN IN TO GET RANKED', 'green', () => (g.signedIn ? g.showLeaderboard('endless1') : a.signIn()), u);
    // public top list (guests can see it too)
    const rx = c.x + lw + 12 * u, rw = c.w - lw - 12 * u;
    card(ctx, rx, c.y, rw, c.h, u);
    text(ctx, 'Endless · Aravalli Hills', rx + rw / 2, c.y + 26 * u, 15 * u, { font: TITLE, weight: 400, fill: RED_INK, stroke: false, max: rw - 20 * u });
    if (!a.platform.board.enabled) {
      const msg = wrap(ctx, 'Worldwide rankings show here once the game is live. Signed-in players can already compare scores on Google Play.', 12 * u, rw - 40 * u);
      msg.forEach((ln, i) => text(ctx, ln, rx + rw / 2, c.y + 70 * u + i * 16 * u, 12 * u, { weight: 700, fill: INK, stroke: false }));
    } else if (!this.ranks) text(ctx, 'Loading…', rx + rw / 2, c.y + 80 * u, 13 * u, { fill: INK, stroke: false });
    else if (!this.ranks.length) text(ctx, 'No scores yet. Be the first!', rx + rw / 2, c.y + 80 * u, 13 * u, { fill: INK, stroke: false });
    else this.ranks.slice(0, Math.floor((c.h - 60 * u) / (18 * u))).forEach((r, i) => {
      const y = c.y + 50 * u + i * 18 * u;
      text(ctx, `${i + 1}.`, rx + 20 * u, y, 12 * u, { align: 'left', fill: i < 3 ? '#c8921c' : INK, stroke: false });
      text(ctx, r.name, rx + 48 * u, y, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false, max: rw - 150 * u });
      text(ctx, `${fmt(r.score)} · w${r.wave}`, rx + rw - 16 * u, y, 12 * u, { align: 'right', fill: RED_INK, stroke: false });
    });
  }
  async loadRanks() { this.ranks = null; this.ranks = (await this.app.platform.board.top('endless1')) || []; }

  // ---------------------------------------------------------------- settings
  draw_settings(ctx, view, f) {
    const { u } = f, a = this.app, p = this.p, s = p.settings, g = a.platform.games;
    this.backdrop(ctx, view);
    this.backButton(ctx, f);
    const c = this.panel(ctx, f, 'Settings', 56);
    const lw = c.w * 0.5 - 6 * u;
    card(ctx, c.x, c.y, lw, c.h, u);
    let y = c.y + 26 * u;
    const label = (t, yy) => text(ctx, t, c.x + 16 * u, yy, 13 * u, { align: 'left', weight: 900, fill: INK, stroke: false, max: lw * 0.42 });
    const slider = (key, yy) => {
      const sx = c.x + lw * 0.45, sw = lw * 0.5;
      progressBar(ctx, sx, yy - 10 * u, sw, 14 * u, s[key], u, '#e0a224');
      ctx.fillStyle = '#fff4dc'; ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(sx + sw * s[key], yy - 3 * u, 9 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      this.tap(sx - 10 * u, yy - 22 * u, sw + 20 * u, 36 * u, null);
      this.targets[this.targets.length - 1].slider = { x: sx, w: sw, key };
    };
    const toggle = (key, yy, fn) => {
      const tx = c.x + lw - 70 * u, on = !!s[key];
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(tx, yy - 16 * u, 54 * u, 24 * u, 12 * u); ctx.fill();
      ctx.fillStyle = on ? '#3faf4a' : '#8d877e'; ctx.beginPath(); ctx.roundRect(tx + 2 * u, yy - 14 * u, 50 * u, 20 * u, 10 * u); ctx.fill();
      ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.arc(on ? tx + 42 * u : tx + 12 * u, yy - 4 * u, 8 * u, 0, Math.PI * 2); ctx.fill();
      this.tap(tx - 10 * u, yy - 22 * u, 74 * u, 36 * u, () => { s[key] = !s[key]; if (fn) fn(s[key]); a.applySettings(); a.save(); });
    };
    label('Music', y); slider('music', y); y += 32 * u;
    label('Sound effects', y); slider('sfx', y); y += 32 * u;
    label('Vibration', y); toggle('haptics', y); y += 32 * u;
    label('Battery saver (30 fps)', y); toggle('battery', y); y += 32 * u;
    label('Large text', y); toggle('largeText', y, () => a.relayout());
    // account, privacy, about
    const rx = c.x + lw + 12 * u, rw = c.w - lw - 12 * u;
    card(ctx, rx, c.y, rw, c.h, u);
    const bw = rw - 28 * u, bh = 30 * u;
    let by = c.y + 14 * u;
    const row = (label2, color, fn, enabled = true) => { this.btn(ctx, rx + 14 * u, by, bw, bh, label2, color, fn, u, enabled); by += bh + 7 * u; };
    if (g.available) row(g.signedIn ? `GOOGLE PLAY: ${(g.player && g.player.name) || 'SIGNED IN'}` : 'SIGN IN WITH GOOGLE PLAY', 'green', () => (g.signedIn ? null : a.signIn()), !g.signedIn);
    else text(ctx, 'Google Play Games is available in the Android app', rx + rw / 2, by + 18 * u, 10 * u, { weight: 700, fill: INK, stroke: false, max: bw }), (by += bh + 7 * u);
    if (a.platform.ads.privacyOptions) row('AD PRIVACY CHOICES', 'blue', () => a.platform.ads.showPrivacyOptions());
    row('PRIVACY POLICY', 'blue', () => a.platform.device.open(LINKS.privacy));
    row('HELP & SUPPORT', 'blue', () => a.platform.device.open(LINKS.support));
    row('CREDITS', 'gold', () => { this.modal = { type: 'credits' }; });
    row('DELETE MY DATA', 'red', () => { this.modal = { type: 'confirm', text: 'Delete all progress on this phone? Purchases can be restored from the shop.', yes: () => { a.store.reset(); a.toast('Your data was deleted'); a.go('menu'); } }; });
    text(ctx, `Sandstone Kingdom v${APP_VERSION} · Samvardhan Studios`, rx + rw / 2, c.y + c.h - 10 * u, 9.5 * u, { weight: 700, fill: '#6a4a2a', stroke: false, max: bw });
  }
  // sliders are dragged; called by the app on pointer down/move
  slide(px, py) {
    for (const t of this.targets) if (t.slider && px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h) {
      const v = Math.max(0, Math.min(1, (px - t.slider.x) / t.slider.w));
      this.p.settings[t.slider.key] = Math.round(v * 20) / 20;
      this.app.applySettings();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- overlays
  drawModal(ctx, view, f) {
    const { u, W, H } = f, a = this.app, p = this.p, m = this.modal;
    ctx.fillStyle = 'rgba(12,6,2,0.6)'; ctx.fillRect(0, 0, W, H);
    this.tap(0, 0, W, H, () => {}); // swallow taps behind the panel
    const close = () => { this.modal = null; };
    if (m.type === 'challenges') {
      const lv = LEVELS[m.level], list = M.CHALLENGES[m.level] || [];
      const w = Math.min(W - 40 * u, 560 * u), h = Math.min(H - 40 * u, 300 * u), x = (W - w) / 2, y = (H - h) / 2 + 10 * u;
      woodPanel(ctx, x, y, w, h, `${lv.name}`, u);
      this.round(ctx, 'close', x + w - 6 * u, y + 6 * u, 0.7, close, u);
      text(ctx, 'Challenges · rubies only · each pays once', x + w / 2, y + 36 * u, 11 * u, { weight: 900, fill: RED_INK, stroke: false });
      const rh = (h - 70 * u) / 3;
      list.forEach((ch, i) => {
        const ry = y + 46 * u + i * rh, done = !!p.challenges[M.challengeKey(m.level, ch.id)];
        card(ctx, x + 18 * u, ry, w - 36 * u, rh - 6 * u, u, { dim: done });
        text(ctx, ch.name, x + 34 * u, ry + rh * 0.4, 14 * u, { align: 'left', font: TITLE, weight: 400, fill: RED_INK, stroke: false, max: w * 0.45 });
        text(ctx, ch.desc, x + 34 * u, ry + rh * 0.4 + 15 * u, 10.5 * u, { align: 'left', weight: 700, fill: INK, stroke: false, max: w * 0.5 });
        blit(ctx, a.assets.get('ui:ruby'), x + w * 0.64, ry + rh / 2 - 3 * u, u);
        text(ctx, String(ch.rubies), x + w * 0.64 + 13 * u, ry + rh / 2 + 2 * u, 14 * u, { align: 'left', fill: RED_INK, stroke: false });
        if (done) this.check(ctx, x + w - 110 * u, ry + rh / 2 - 3 * u, u);
        this.btn(ctx, x + w - 128 * u + (done ? 30 * u : 0), ry + rh / 2 - 18 * u, 96 * u - (done ? 30 * u : 0), 30 * u, done ? 'REPLAY' : 'PLAY', done ? 'grey' : 'red', () => { this.modal = null; a.go('briefing', { mode: 'challenge', level: m.level, challenge: ch }); }, u);
      });
    } else if (m.type === 'royal') {
      const def = TOWERS[m.id], rt = ROYAL_TOWERS[m.id];
      const w = Math.min(W - 40 * u, 440 * u), h = Math.min(H - 40 * u, 250 * u), x = (W - w) / 2, y = (H - h) / 2 + 10 * u;
      woodPanel(ctx, x, y, w, h, def.name, u);
      this.round(ctx, 'close', x + w - 6 * u, y + 6 * u, 0.7, close, u);
      blit(ctx, a.assets.get('icon:' + def.art), x + 80 * u, y + h * 0.62, u * 1.6);
      const lines = wrap(ctx, def.tip, 12 * u, w - 190 * u);
      lines.slice(0, 4).forEach((ln, i) => text(ctx, ln, x + 160 * u, y + 52 * u + i * 16 * u, 12 * u, { align: 'left', weight: 700, fill: INK, stroke: false }));
      text(ctx, 'Unlock forever, for every level.', x + 160 * u, y + 52 * u + Math.min(4, lines.length) * 16 * u + 4 * u, 11 * u, { align: 'left', weight: 900, fill: RED_INK, stroke: false, max: w - 180 * u });
      const by = y + h - 56 * u, bw = (w - 190 * u) / 2;
      this.btn(ctx, x + 160 * u, by, bw + 20 * u, 34 * u, `${rt.rubies} RUBIES`, 'red', () => { if (M.buyRoyalTower(p, m.id)) { a.reward(`${def.name} unlocked!`); if (this.brief) this.brief.special = m.id; this.modal = null; a.afterReward(); } else a.toast('Not enough rubies: try the shop'); }, u);
      if (this.brief && a.rewardedLeft() > 0) this.btn(ctx, x + 170 * u + bw + 20 * u, by, bw - 10 * u, 34 * u, 'TRY (AD)', 'purple', async () => { if (await a.rewarded()) { this.brief.trial = m.id; this.brief.special = m.id; this.modal = null; a.toast('Yours for this battle!'); } }, u);
    } else if (m.type === 'confirm') {
      const w = Math.min(W - 40 * u, 400 * u), h = 170 * u, x = (W - w) / 2, y = (H - h) / 2;
      woodPanel(ctx, x, y, w, h, 'Are you sure?', u);
      wrap(ctx, m.text, 13 * u, w - 50 * u).slice(0, 3).forEach((ln, i) => text(ctx, ln, x + w / 2, y + 50 * u + i * 17 * u, 13 * u, { weight: 700, fill: INK, stroke: false }));
      const bw = (w - 60 * u) / 2;
      this.btn(ctx, x + 20 * u, y + h - 50 * u, bw, 34 * u, 'CANCEL', 'grey', close, u);
      this.btn(ctx, x + 40 * u + bw, y + h - 50 * u, bw, 34 * u, 'YES', 'red', () => { this.modal = null; m.yes(); }, u);
    } else if (m.type === 'offer') {
      const w = Math.min(W - 40 * u, 430 * u), h = Math.min(H - 40 * u, 240 * u), x = (W - w) / 2, y = (H - h) / 2 + 10 * u;
      woodPanel(ctx, x, y, w, h, 'Royal Starter Pack', u);
      this.round(ctx, 'close', x + w - 6 * u, y + 6 * u, 0.7, close, u);
      blit(ctx, a.assets.get('chest'), x + 90 * u, y + h * 0.78, u * 0.9);
      ['You beat the Bandit King!', 'A one-time thank-you pack:', '150 rubies + 500 coins', '+ one of each power-up'].forEach((ln, i) => text(ctx, ln, x + 175 * u, y + 56 * u + i * 18 * u, i ? 12 * u : 14 * u, { align: 'left', weight: 900, fill: i ? INK : RED_INK, stroke: false, max: w - 190 * u }));
      this.btn(ctx, x + 175 * u, y + h - 54 * u, w - 200 * u, 36 * u, a.platform.billing.price('starter_pack') || `₹${M.product('starter_pack').inr}`, 'green', () => { this.modal = null; a.buy('starter_pack'); }, u);
    } else if (m.type === 'credits') {
      const w = Math.min(W - 40 * u, 480 * u), h = Math.min(H - 40 * u, 280 * u), x = (W - w) / 2, y = (H - h) / 2 + 10 * u;
      woodPanel(ctx, x, y, w, h, 'Credits', u);
      this.round(ctx, 'close', x + w - 6 * u, y + 6 * u, 0.7, close, u);
      ['Sandstone Kingdom: Tower Defense', 'Made by Samvardhan Studios', 'All art is drawn in code. All music and sound', 'are synthesised in code: no samples, no licences.', 'Fonts: Rozha One and Martel (SIL Open Font Licence)', 'Thank you for playing!'].forEach((ln, i) => text(ctx, ln, x + w / 2, y + 52 * u + i * 20 * u, i ? 12 * u : 15 * u, { font: i ? undefined : TITLE, weight: i ? 700 : 400, fill: i ? INK : RED_INK, stroke: false, max: w - 40 * u }));
    } else if (m.type === 'info') {
      const w = Math.min(W - 40 * u, 400 * u), h = 170 * u, x = (W - w) / 2, y = (H - h) / 2;
      woodPanel(ctx, x, y, w, h, m.title || 'Notice', u);
      wrap(ctx, m.text, 13 * u, w - 50 * u).slice(0, 3).forEach((ln, i) => text(ctx, ln, x + w / 2, y + 50 * u + i * 17 * u, 13 * u, { weight: 700, fill: INK, stroke: false }));
      this.btn(ctx, x + w / 2 - 60 * u, y + h - 50 * u, 120 * u, 34 * u, 'OK', 'green', close, u);
    }
  }
}
