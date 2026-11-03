// Sandstone Kingdom: boots the game, fits it to the screen, runs the loop and handles input.
import { Game } from './engine/game.js';
import { LEVELS } from './engine/levels.js';
import { makePath } from './engine/path.js';
import { computeView, readSafeArea } from './render/view.js';
import { Assets } from './render/assets.js';
import { WorldRenderer } from './render/world.js';
import { Hud, text, gemButton, woodPanel } from './render/hud.js';
import { blit } from './render/raster.js';

const SAVE_KEY = 'sandstone-kingdom:v1';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const assets = new Assets();
const world = new WorldRenderer();

function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.diyas && s.seen) return s; } catch { /* storage unavailable */ }
  return { diyas: {}, seen: {} };
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage unavailable */ } }
const save = loadSave();

let view = null, game = null, screen = 'loading', speed = 1, tutorialStep = 0, livesFlash = 0, currentLevel = LEVELS[1];
let modalQueue = [], titleTargets = [];

const hud = new Hud({
  build: (plotId, type) => game.build(plotId, type),
  upgrade: (id) => game.upgrade(id),
  sell: (id) => game.sell(id),
  clear: (id) => game.clearPlot(id),
  callWave: () => { const bonus = game.callWave(); if (bonus) hud.banner = { text: `+${bonus} gold for calling early`, t: 0, life: 1.4 }; },
  pause: () => { hud.modal = { type: 'pause' }; },
  resume: () => { hud.modal = null; },
  restart: () => startLevel(game.level.id),
  quit: () => goTitle(),
  next: () => startLevel(game.level.id + 1),
  speed: () => { speed = speed === 1 ? 2 : 1; },
  heroSkill: () => game.heroSkill(),
  dismiss: () => { hud.modal = modalQueue.shift() || null; },
});

// ---------------------------------------------------------------- sizing
let buildToken = 0;
async function layout() {
  const cssW = window.innerWidth, cssH = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  view = computeView(cssW, cssH, dpr, readSafeArea());
  const token = ++buildToken;
  const paths = currentLevel.paths.map((p) => makePath(p));
  await assets.build(view, currentLevel, paths);
  await assets.buildBackground(view, currentLevel, paths);
  return token === buildToken;
}
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });

// ---------------------------------------------------------------- screens
async function startLevel(id) {
  if (!LEVELS[id]) return goTitle();
  screen = 'loading';
  currentLevel = LEVELS[id];
  await layout();
  game = new Game(currentLevel, { seed: (Date.now() % 100000) + 1, seen: save.seen });
  world.effects = [];
  hud.menu = null; hud.modal = null; hud.targeting = null; hud.heroSelected = false; hud.banner = { text: currentLevel.name, sub: id === 0 ? 'Tutorial' : `Level ${id}`, t: 0, life: 2.2, big: true };
  modalQueue = [];
  tutorialStep = 0;
  speed = 1;
  screen = 'battle';
}
async function goTitle() {
  screen = 'loading';
  currentLevel = LEVELS[1];
  game = null;
  await layout();
  screen = 'title';
}
const unlocked = (id) => id <= 1 || (save.diyas[id - 1] || 0) > 0;

function processEvents() {
  for (const e of game.drainEvents()) {
    world.onEvent(e);
    const step = currentLevel.tutorial && currentLevel.tutorial[tutorialStep];
    if (step && e.type === step.until) tutorialStep++;
    if (e.type === 'newEnemy') { save.seen[e.enemy] = true; persist(); const m = { type: 'newEnemy', enemy: e.enemy }; if (hud.modal) modalQueue.push(m); else hud.modal = m; }
    if (e.type === 'bossArrives') hud.banner = { text: `${e.enemy.def.name} approaches!`, sub: 'Defeat him to unlock Endless mode', t: 0, life: 3, big: true };
    if (e.type === 'waveStart' && e.wave > 0) hud.banner = { text: `Wave ${e.wave + 1}`, t: 0, life: 1.2 };
    if (e.type === 'leak') livesFlash = 0.6;
    if (e.type === 'won') { save.diyas[currentLevel.id] = Math.max(save.diyas[currentLevel.id] || 0, e.diyas); persist(); hud.menu = null; hud.modal = { type: 'won', diyas: e.diyas }; }
    if (e.type === 'lost') { hud.menu = null; hud.modal = { type: 'lost' }; }
  }
}

// ---------------------------------------------------------------- input
function worldTap(wx, wy) {
  if (hud.targeting) { game.castSpell(hud.targeting, wx, wy); hud.targeting = null; return; }
  if (hud.heroSelected) { game.moveHero(wx, wy); hud.heroSelected = false; return; }
  const h = game.hero;
  if (h && !h.dead && Math.hypot(h.x - wx, h.y - 14 - wy) < 20) { hud.heroSelected = true; hud.menu = null; return; }
  const tower = game.towers.find((t) => Math.abs(t.x - wx) < 26 && wy < t.y + 12 && wy > t.y - 70);
  if (tower) { hud.menu = { type: 'tower', plotId: tower.plot.id, towerId: tower.id }; return; }
  const plot = game.plots.find((p) => Math.hypot(p.x - wx, (p.y - wy) * 1.6) < 30);
  if (plot) { hud.menu = { type: plot.lock ? 'locked' : 'build', plotId: plot.id }; return; }
  hud.menu = null;
}
canvas.addEventListener('pointerdown', (e) => {
  if (!view) return;
  const x = e.clientX, y = e.clientY;
  if (screen === 'title') { for (const t of titleTargets) if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { t.fn(); return; } return; }
  if (screen !== 'battle') return;
  if (hud.hit(x, y)) return;
  if (hud.modal) return;
  const w = view.toWorld(x, y);
  worldTap(w.x, w.y);
});

// ---------------------------------------------------------------- drawing
function drawTitle() {
  const { dpr, u, cssW, cssH } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (assets.bg) ctx.drawImage(assets.bg.canvas, 0, 0, cssW, cssH);
  const sh = ctx.createLinearGradient(0, 0, 0, cssH); sh.addColorStop(0, 'rgba(20,10,4,0.35)'); sh.addColorStop(1, 'rgba(20,10,4,0.75)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, cssW, cssH);
  text(ctx, 'SANDSTONE', cssW / 2, cssH * 0.2, 40 * u, { font: '"Rozha One", Georgia, serif', weight: 400, fill: '#ffd25a', sw: 7 * u, max: cssW - 40 * u });
  text(ctx, 'KINGDOM', cssW / 2, cssH * 0.2 + 30 * u, 22 * u, { font: '"Rozha One", Georgia, serif', weight: 400, sw: 5 * u });
  titleTargets = [];
  const n = LEVELS.length, cw = Math.min(170 * u, (cssW - 60 * u) / n - 12 * u), ch = 150 * u, gap = 16 * u;
  const total = n * cw + (n - 1) * gap, x0 = (cssW - total) / 2, y0 = cssH * 0.42;
  LEVELS.forEach((lv, i) => {
    const x = x0 + i * (cw + gap), open = unlocked(lv.id), d = save.diyas[lv.id] || 0;
    woodPanel(ctx, x, y0, cw, ch, lv.id === 0 ? 'Tutorial' : `Level ${lv.id}`, u * 0.8);
    text(ctx, lv.name, x + cw / 2, y0 + 44 * u, 14 * u, { font: '"Rozha One", Georgia, serif', weight: 400, fill: '#5a2a10', stroke: false, max: cw - 26 * u });
    for (let k = 0; k < 3; k++) blit(ctx, assets.get(k < d ? 'ui:diya' : 'ui:diyaOff'), x + cw / 2 + (k - 1) * 26 * u, y0 + 74 * u, u);
    if (open) { gemButton(ctx, x + 18 * u, y0 + ch - 50 * u, cw - 36 * u, 32 * u, 'PLAY', 'red', u); titleTargets.push({ x: x + 18 * u, y: y0 + ch - 50 * u, w: cw - 36 * u, h: 32 * u, fn: () => startLevel(lv.id) }); }
    else { blit(ctx, assets.get('ui:lock'), x + cw / 2, y0 + ch - 34 * u, u * 1.3); text(ctx, 'Win the last level', x + cw / 2, y0 + ch - 14 * u, 9 * u, { fill: '#5a2a10', stroke: false, weight: 700, max: cw - 20 * u }); }
  });
}

function drawRotate() {
  const { dpr, cssW, cssH } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#24170f'; ctx.fillRect(0, 0, cssW, cssH);
  text(ctx, 'Turn your phone sideways', cssW / 2, cssH / 2, 20, { max: cssW - 30 });
  text(ctx, 'Sandstone Kingdom plays in landscape', cssW / 2, cssH / 2 + 28, 13, { weight: 700, max: cssW - 30 });
}

let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (view) {
    if (view.cssH > view.cssW) drawRotate();
    else if (screen === 'title') drawTitle();
    else if (screen === 'battle') {
      if (!hud.modal) {
        acc += dt * speed;
        while (acc >= 1 / 60) { game.update(1 / 60); acc -= 1 / 60; processEvents(); }
      } else acc = 0;
      world.update(dt); hud.update(dt); livesFlash -= dt;
      world.draw(ctx, view, game, assets, hud);
      const step = currentLevel.tutorial && currentLevel.tutorial[tutorialStep];
      hud.draw(ctx, view, game, assets, { speed, livesFlash, tutorial: step, hasNext: !!LEVELS[game.level.id + 1] });
    }
  }
  requestAnimationFrame(frame);
}

// testing hooks used by the automated device checks
window.__sk = {
  get game() { return game; }, get screen() { return screen; }, get view() { return view; }, hud, assets,
  startLevel, goTitle, worldTap: (x, y) => worldTap(x, y),
  tapScreen: (x, y) => canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })),
};

(async () => {
  try { await Promise.all(['400 20px "Rozha One"', '900 20px Martel', '700 20px Martel'].map((f) => document.fonts.load(f))); } catch { /* fonts fall back */ }
  await goTitle();
  requestAnimationFrame(frame);
})();
