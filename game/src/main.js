import { parseLevel, tilt, isWon, starsFor } from './engine.js';
import { solve } from './solver.js';
import { LEVELS } from './levels.js';

// Ball colours, each paired with a symbol so the game works for colour-blind players.
const PALETTE = {
  A: { fill: '#ff6b6b', symbol: 'circle' },
  B: { fill: '#4ecdc4', symbol: 'triangle' },
  C: { fill: '#ffcf4a', symbol: 'square' },
  D: { fill: '#a78bfa', symbol: 'diamond' },
  E: { fill: '#5fd068', symbol: 'star' },
  F: { fill: '#ff9f43', symbol: 'cross' },
};
const COLORS = { floor: '#262938', floorAlt: '#2b2f40', wall: '#3d4258', wallTop: '#4a5069', hole: '#11121a' };
const ARROWS = { up: '↑', down: '↓', left: '←', right: '→' };
const HELP = [
  'Swipe to tilt the board. Every ball rolls until it hits something.',
  'Roll each ball into the hole of its own colour.',
  'Holes block balls of other colours, until they are filled.',
];
const STORAGE_KEY = 'gravity-flip-sort:v1';
const SWIPE_MIN = 24;

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d');

// ---------- Progress (browser storage may be unavailable; game still works) ----------

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.unlocked === 'number' && saved.stars) return saved;
  } catch { /* ignore */ }
  return { unlocked: 0, stars: {} };
}

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* ignore */ }
}

const progress = loadProgress();

// ---------- Game state ----------

let levelIndex = 0;
let board = null;
let state = null;
let history = [];
let moves = 0;
let anim = null; // { moves, start, duration } while balls are rolling
let queuedDir = null;
let hintTimer = null;
let cell = 48;

function startLevel(index) {
  levelIndex = index;
  ({ board, state } = parseLevel(LEVELS[index].map));
  history = [];
  moves = 0;
  anim = null;
  queuedDir = null;
  hideHint();
  $('win').hidden = true;
  $('level-label').textContent = `Level ${index + 1}`;
  $('help').textContent = HELP[index] ?? '';
  $('toast').textContent = '';
  updateHud();
  showScreen('game');
  resize();
}

function updateHud() {
  $('moves').textContent = `Moves ${moves} · Best ${LEVELS[levelIndex].par}`;
  $('undo-btn').disabled = history.length === 0;
}

function move(dir) {
  if ($('win').hidden === false) return;
  if (anim) {
    queuedDir = dir;
    return;
  }
  const result = tilt(board, state, dir);
  if (!result.changed) {
    bump(dir);
    return;
  }
  hideHint();
  $('toast').textContent = '';
  history.push(state);
  const before = state;
  state = result.state;
  moves++;
  updateHud();
  const distance = Math.max(...result.moves.map((m) => Math.abs(m.to.x - m.from.x) + Math.abs(m.to.y - m.from.y)));
  anim = {
    before,
    moves: result.moves,
    start: performance.now(),
    duration: Math.min(320, Math.max(140, distance * 55)),
  };
  if (result.moves.some((m) => m.sunk)) buzz(15);
  requestAnimationFrame(frame);
}

function finishMove() {
  anim = null;
  if (isWon(state)) {
    onWin();
    return;
  }
  if (queuedDir) {
    const dir = queuedDir;
    queuedDir = null;
    move(dir);
  }
}

function undo() {
  if (anim || history.length === 0) return;
  state = history.pop();
  moves--;
  hideHint();
  $('toast').textContent = '';
  updateHud();
  draw();
}

function restart() {
  startLevel(levelIndex);
}

function hint() {
  if (anim) return;
  const solution = solve(board, state, 60000);
  if (!solution || solution.length === 0) {
    $('toast').textContent = 'Stuck! Undo or restart.';
    return;
  }
  const arrow = $('hint-arrow');
  arrow.textContent = ARROWS[solution[0]];
  arrow.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(hideHint, 2500);
}

function hideHint() {
  clearTimeout(hintTimer);
  $('hint-arrow').hidden = true;
}

function onWin() {
  const par = LEVELS[levelIndex].par;
  const stars = starsFor(moves, par);
  const previous = progress.stars[levelIndex] ?? 0;
  progress.stars[levelIndex] = Math.max(previous, stars);
  progress.unlocked = Math.min(LEVELS.length - 1, Math.max(progress.unlocked, levelIndex + 1));
  saveProgress();
  buzz([20, 40, 20]);

  $('win-stars').innerHTML = [1, 2, 3].map((n) => `<span class="${n <= stars ? '' : 'off'}">★</span>`).join('');
  $('win-stars').setAttribute('aria-label', `${stars} of 3 stars`);
  const last = levelIndex === LEVELS.length - 1;
  $('win-text').textContent = last
    ? `You finished every level in ${moves} moves. More levels coming soon!`
    : moves <= par
      ? `Perfect! ${moves} moves, the best possible.`
      : `${moves} moves. Can you do it in ${par}?`;
  $('next-btn').hidden = last;
  setTimeout(() => { $('win').hidden = false; }, 250);
}

// ---------- Feedback ----------

function buzz(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

// A small nudge of the board when a tilt does nothing.
function bump(dir) {
  const d = { up: [0, -6], down: [0, 6], left: [-6, 0], right: [6, 0] }[dir];
  canvas.animate(
    [{ transform: 'translate(0,0)' }, { transform: `translate(${d[0]}px,${d[1]}px)` }, { transform: 'translate(0,0)' }],
    { duration: 160, easing: 'ease-out' },
  );
}

// ---------- Rendering ----------

function resize() {
  const wrap = $('board-wrap');
  // Collapse the canvas first so the old size doesn't inflate the space we measure.
  canvas.style.width = '0px';
  canvas.style.height = '0px';
  const availW = wrap.clientWidth;
  const availH = Math.max(200, wrap.clientHeight);
  cell = Math.floor(Math.min(availW / board.w, availH / board.h, 76));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cell * board.w}px`;
  canvas.style.height = `${cell * board.h}px`;
  canvas.width = Math.round(cell * board.w * dpr);
  canvas.height = Math.round(cell * board.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawSymbol(kind, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.28);
  ctx.beginPath();
  if (kind === 'circle') {
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'triangle') {
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.4);
    ctx.lineTo(cx - r * 0.55, cy + r * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'square') {
    ctx.rect(cx - r * 0.42, cy - r * 0.42, r * 0.84, r * 0.84);
    ctx.fill();
  } else if (kind === 'diamond') {
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.5, cy);
    ctx.lineTo(cx, cy + r * 0.6);
    ctx.lineTo(cx - r * 0.5, cy);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r * 0.62 : r * 0.26;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'cross') {
    ctx.moveTo(cx - r * 0.45, cy);
    ctx.lineTo(cx + r * 0.45, cy);
    ctx.moveTo(cx, cy - r * 0.45);
    ctx.lineTo(cx, cy + r * 0.45);
    ctx.stroke();
  }
}

function drawBall(color, x, y, scale = 1) {
  const r = cell * 0.36 * scale;
  if (r <= 0.5) return;
  const cx = (x + 0.5) * cell;
  const cy = (y + 0.5) * cell;
  const { fill, symbol } = PALETTE[color];
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, fill);
  g.addColorStop(1, fill);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  drawSymbol(symbol, cx, cy + r * 0.05, r * 0.55, 'rgba(255,255,255,0.9)');
}

function drawBoard(filled) {
  const pad = Math.max(1, cell * 0.04);
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const kind = board.cells[y * board.w + x];
      const px = x * cell;
      const py = y * cell;
      if (kind === 'wall') {
        ctx.fillStyle = COLORS.wall;
        roundRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2, cell * 0.18);
        ctx.fill();
        ctx.fillStyle = COLORS.wallTop;
        roundRect(px + pad, py + pad, cell - pad * 2, (cell - pad * 2) * 0.8, cell * 0.18);
        ctx.fill();
        continue;
      }
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      roundRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2, cell * 0.14);
      ctx.fill();
    }
  }
  board.holes.forEach((hole, i) => {
    const cx = (hole.x + 0.5) * cell;
    const cy = (hole.y + 0.5) * cell;
    const { fill, symbol } = PALETTE[hole.color];
    if (filled[i]) {
      // A filled hole: the sunk ball shows as a flat coloured disc.
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawSymbol(symbol, cx, cy, cell * 0.18, 'rgba(255,255,255,0.5)');
      return;
    }
    ctx.fillStyle = COLORS.hole;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fill;
    ctx.lineWidth = Math.max(2, cell * 0.07);
    ctx.stroke();
    drawSymbol(symbol, cx, cy, cell * 0.22, fill);
  });
}

function draw() {
  if (!board) return;
  ctx.clearRect(0, 0, board.w * cell, board.h * cell);
  if (!anim) {
    drawBoard(state.filled);
    state.balls.forEach((b) => drawBall(b.color, b.x, b.y));
    return;
  }
  const t = Math.min(1, (performance.now() - anim.start) / anim.duration);
  const ease = 1 - (1 - t) ** 3;
  // Holes fill only once the ball has arrived.
  drawBoard(t < 1 ? anim.before.filled : state.filled);
  const moving = new Map(anim.moves.map((m) => [m.id, m]));
  anim.before.balls.forEach((b) => {
    const m = moving.get(b.id);
    if (!m) return drawBall(b.color, b.x, b.y);
    const x = m.from.x + (m.to.x - m.from.x) * ease;
    const y = m.from.y + (m.to.y - m.from.y) * ease;
    const scale = m.sunk ? 1 - Math.max(0, (t - 0.7) / 0.3) : 1;
    drawBall(b.color, x, y, scale);
  });
}

function frame() {
  draw();
  if (!anim) return;
  if (performance.now() - anim.start >= anim.duration) {
    finishMove();
    draw();
    return;
  }
  requestAnimationFrame(frame);
}

// ---------- Screens ----------

function showScreen(name) {
  $('home').hidden = name !== 'home';
  $('game').hidden = name !== 'game';
}

function renderHome() {
  const grid = $('level-grid');
  grid.innerHTML = '';
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
  $('home-progress').textContent = `${totalStars} / ${LEVELS.length * 3} stars`;
  LEVELS.forEach((_, i) => {
    const btn = document.createElement('button');
    const locked = i > progress.unlocked;
    const stars = progress.stars[i] ?? 0;
    btn.className = `level-tile${locked ? ' locked' : ''}${i === progress.unlocked ? ' current' : ''}`;
    btn.disabled = locked;
    btn.setAttribute('aria-label', locked ? `Level ${i + 1}, locked` : `Level ${i + 1}, ${stars} stars`);
    btn.innerHTML = `<span>${i + 1}</span><span class="tile-stars">${'★'.repeat(stars)}</span>`;
    btn.addEventListener('click', () => startLevel(i));
    grid.appendChild(btn);
  });
  showScreen('home');
}

// ---------- Input ----------

let swipeStart = null;
const wrap = $('board-wrap');
wrap.addEventListener('pointerdown', (e) => {
  swipeStart = { x: e.clientX, y: e.clientY };
});
wrap.addEventListener('pointerup', (e) => {
  if (!swipeStart) return;
  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});
wrap.addEventListener('pointercancel', () => { swipeStart = null; });

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};
document.addEventListener('keydown', (e) => {
  if ($('game').hidden) return;
  if (KEYS[e.key]) {
    e.preventDefault();
    move(KEYS[e.key]);
  } else if (e.key === 'z' || e.key === 'Backspace') undo();
  else if (e.key === 'r') restart();
});

$('play-btn').addEventListener('click', () => startLevel(progress.unlocked));
$('back-btn').addEventListener('click', renderHome);
$('restart-btn').addEventListener('click', restart);
$('undo-btn').addEventListener('click', undo);
$('hint-btn').addEventListener('click', hint);
$('replay-btn').addEventListener('click', restart);
$('next-btn').addEventListener('click', () => startLevel(levelIndex + 1));
window.addEventListener('resize', () => { if (board && !$('game').hidden) resize(); });

renderHome();

// Exposed for automated browser tests only.
window.__game = {
  get levelIndex() { return levelIndex; },
  get moves() { return moves; },
  get state() { return state; },
  get animating() { return Boolean(anim); },
  solution: () => solve(board, state, 100000),
};
