// Sandstone Kingdom: boots the game, fits it to the screen, routes between screens, runs the
// battle loop and connects the meta game (rewards, quests, achievements) to the platform
// (ads, purchases, Google Play Games) and sound.
import { Game } from './engine/game.js';
import { LEVELS } from './engine/levels.js';
import { makePath } from './engine/path.js';
import * as M from './meta/profile.js';
import { Store } from './meta/store.js';
import { computeView, readSafeArea } from './render/view.js';
import { Assets } from './render/assets.js';
import { WorldRenderer } from './render/world.js';
import { Hud, text } from './render/hud.js';
import { Screens } from './ui/screens.js';
import { loadSpriteFonts } from './render/raster.js';
import { sound } from './audio/sound.js';
import { platform } from './platform/index.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const assets = new Assets();
const world = new WorldRenderer();
const store = new Store();

let view = null, game = null, screen = 'loading', speed = 1, tutorialStep = 0, livesFlash = 0, currentLevel = LEVELS[1];
let modalQueue = [], battle = null, toasts = [], history = [], loadingTip = 0;

const TIPS = [
  'Barracks soldiers block the road so your towers can hit enemies longer.',
  'Magic goes straight through armour. Arrows do not.',
  'Call waves early with the swords button for bonus gold.',
  'Special spots give +15% range, and your royal tower can stand there.',
  'Each level you complete unlocks three challenges that pay rubies.',
  'Daily quests reset every day and pay rubies only.',
];

// ---------------------------------------------------------------- the app object the screens talk to
const app = {
  store, assets, sound, platform,
  get profile() { return store.profile; },
  save: (now) => store.save(now),
  go: (name, params) => go(name, params),
  back: () => back(),
  toast(msg) { toasts.push({ text: msg, t: 0 }); if (toasts.length > 3) toasts.shift(); },
  reward(msg) { sound.play('reward'); this.toast(msg); },
  afterReward() { syncAchievements(M.checkAchievements(store.profile)); store.save(); },
  startBattle: (b) => startBattle(b),
  rewardedLeft: () => (platform.ads.rewardedAvailable ? M.rewardedLeft(store.profile) : 0),
  rewarded: () => rewarded(),
  async buy(id) {
    const ok = await platform.billing.buy(id);
    if (!ok) this.toast('Purchase cancelled');
  },
  async restore() { await platform.billing.restore(); this.toast('Purchases restored'); },
  async adChest() {
    if (M.adChestLeft(store.profile) <= 0) return;
    if (await rewarded()) { const r = M.claimAdChest(store.profile); this.reward(`+${r} rubies`); store.save(); }
  },
  claimDaily() {
    const r = M.claimDaily(store.profile, Date.now(), { signedIn: platform.games.signedIn });
    if (!r) return;
    const parts = []; if (r.reward.coins) parts.push(`${Math.round(r.reward.coins * (r.bonus ? 1.2 : 1))} coins`); if (r.reward.rubies) parts.push(`${Math.round(r.reward.rubies * (r.bonus ? 1.2 : 1))} rubies`);
    this.reward(`Day ${r.day + 1}: ${parts.join(' + ')}`);
    this.afterReward();
  },
  async signIn() {
    const ok = await platform.games.signIn();
    if (ok) { this.toast('Signed in with Google Play'); await cloudSync(); } else this.toast('Could not sign in right now');
  },
  applySettings() {
    const s = store.profile.settings;
    sound.setVolumes(s.music, s.sfx);
    platform.ads.setMuted(s.sfx <= 0 && s.music <= 0);
  },
  relayout: () => layout(),
};
const screens = new Screens(app);

const hud = new Hud({
  build: (plotId, type) => { if (game.build(plotId, type)) sound.play('build'); },
  upgrade: (id) => { if (game.upgrade(id)) sound.play('upgrade'); },
  sell: (id) => { if (game.sell(id)) sound.play('sell'); },
  clear: (id) => { if (game.clearPlot(id)) sound.play('build'); },
  callWave: () => { const bonus = game.callWave(); if (bonus) hud.banner = { text: `+${bonus} gold for calling early`, t: 0, life: 1.4 }; },
  pause: () => { hud.modal = { type: 'pause' }; },
  resume: () => { hud.modal = null; },
  restart: () => { leaveBattle(); startBattle({ ...battle.brief }); },
  quit: () => { const b = battle; leaveBattle(); afterLevelAds(b).then(() => go(b.brief.mode === 'endless' ? 'menu' : 'map', { mode: b.brief.mode === 'challenge' ? 'challenge' : 'story' })); },
  next: () => { const b = battle; leaveBattle(); afterLevelAds(b).then(() => go('briefing', { mode: 'story', level: b.brief.level + 1 })); },
  ranks: () => { leaveBattle(); go('ranks'); },
  speed: () => { speed = speed === 1 ? 2 : 1; },
  heroSkill: () => { if (game.heroSkill()) sound.play('sunStrike'); },
  powerup: (k) => game.usePowerup(k),
  dismiss: () => { hud.modal = modalQueue.shift() || null; },
  double: async () => {
    const m = hud.modal;
    if (!m || m.doubled || !(await rewarded())) return;
    M.doubleReward(store.profile, m.reward.coins);
    m.doubled = true;
    sound.play('reward');
    store.save();
  },
  revive: async () => {
    if (!game.canRevive || !(await rewarded())) return;
    game.revive();
    hud.modal = null;
    sound.play('powerup');
  },
});

async function rewarded() {
  if (M.rewardedLeft(store.profile) <= 0) { app.toast('No more bonus ads today'); return false; }
  sound.pause();
  const ok = await platform.ads.rewarded();
  sound.resume();
  if (ok) { M.noteRewarded(store.profile); store.save(); } else app.toast('The ad could not play. Try again soon.');
  return ok;
}

// Interstitial ads follow the design rules: between levels only, never before level 4,
// never right after a loss, at most every 3 minutes, never with Remove Ads.
async function afterLevelAds(b) {
  const p = store.profile;
  if (!b || !M.shouldShowInterstitial(p, { level: b.brief.level, lost: b.lost })) return;
  sound.pause();
  const shown = await platform.ads.interstitial();
  sound.resume();
  if (shown) { M.noteInterstitial(p); store.save(); }
}

// ---------------------------------------------------------------- sizing
let buildToken = 0;
async function layout() {
  const cssW = window.innerWidth, cssH = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  view = computeView(cssW, cssH, dpr, readSafeArea());
  if (store.profile.settings.largeText) view.u = Math.min(view.u * 1.12, 1.7);
  const token = ++buildToken;
  const paths = currentLevel.paths.map((p) => makePath(p));
  await assets.build(view, currentLevel, paths);
  if (screen === 'battle' || screen === 'loading-battle') await assets.buildBackground(view, currentLevel, paths);
  else { await assets.buildMenu(view); if (screen === 'map') await assets.buildMap(view); }
  return token === buildToken;
}
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });

// ---------------------------------------------------------------- screens
const MENU_MUSIC = new Set(['menu', 'map', 'shop', 'daily', 'quests', 'workshop', 'achievements', 'ranks', 'settings', 'briefing']);
async function go(name, params = {}) {
  if (screen !== 'loading' && screen !== name && screen !== 'battle') history.push(screen);
  if (history.length > 12) history.shift();
  screens.modal = null;
  if (name === 'map') { if (screens.mapMode !== params.mode) screens.mapScroll = null; screens.mapMode = params.mode || 'story'; }
  if (name === 'briefing') screens.openBriefing(params);
  if (name === 'ranks') screens.loadRanks();
  if (name === 'menu') history = [];
  const prev = screen;
  screen = 'loading';
  if (prev === 'battle' || !assets.menuBg) { currentLevel = LEVELS[1]; }
  await layout();
  if (name === 'map') await assets.buildMap(view);
  screen = name;
  if (MENU_MUSIC.has(name)) sound.playMusic('menu');
  platform.ads.banner(name === 'map' && !store.profile.removeAds && M.levelsWon(store.profile) >= 3);
  // the daily reward greets the player on the menu once per day, until it is claimed
  if (name === 'menu' && M.dailyStatus(store.profile).canClaim && dailyShown !== M.dayKey()) { dailyShown = M.dayKey(); screens.modal = { type: 'daily' }; }
  if (name === 'map' && pendingOffer) { pendingOffer = false; screens.modal = { type: 'offer' }; store.profile.starterOffered = true; store.save(); }
}
function back() {
  if (screens.modal) { screens.modal = null; return; }
  const prev = history.pop();
  if (screen === 'briefing') return go(screens.brief && screens.brief.mode === 'endless' ? 'menu' : 'map', { mode: screens.brief && screens.brief.mode === 'challenge' ? 'challenge' : 'story' });
  if (screen === 'map') return go('menu');
  go(prev && prev !== 'loading' && prev !== 'briefing' ? prev : 'menu', { mode: screens.mapMode });
}

let pendingOffer = false, dailyShown = null, slowmo = null, pendingResult = null;
async function startBattle(b) {
  const p = store.profile, lv = LEVELS[b.level];
  if (!lv) return go('map', { mode: 'story' });
  const specials = b.specials || (b.special ? [b.special] : []);
  if (specials.length) { p.lastSpecials = specials.filter((t) => p.owned[t]); store.save(); }
  screen = 'loading-battle';
  currentLevel = lv;
  platform.ads.banner(false);
  await layout();
  const endless = b.mode === 'endless';
  game = new Game(lv, {
    seed: (Date.now() % 100000) + 1, seen: p.seen, rules: b.challenge ? b.challenge.rules : null, specials,
    endless, powerups: p.powerups, bonus: M.workshopBonus(p),
  });
  battle = { brief: { ...b }, finished: false, lost: false, result: null };
  world.reset();
  hud.menu = null; hud.modal = null; hud.targeting = null; hud.heroSelected = false;
  hud.banner = { text: lv.name, sub: endless ? 'Endless mode' : b.challenge ? b.challenge.name : lv.id === 0 ? 'Tutorial' : `Level ${lv.id}`, t: 0, life: 2.2, big: true };
  modalQueue = [];
  tutorialStep = 0;
  speed = 1;
  slowmo = null; pendingResult = null;
  screen = 'battle';
  sound.playMusic(lv.boss ? 'boss' : 'battle');
}

// Records the battle once: rewards, quests, achievements, leaderboards, cloud save.
function finishBattle() {
  if (!battle || battle.finished) return battle && battle.result;
  battle.finished = true;
  const p = store.profile, s = game.summary();
  const res = M.recordBattle(p, s, { challenge: battle.brief.challenge || null });
  battle.result = res;
  syncAchievements(res.achievements);
  platform.games.submit('totalDiyas', M.totalDiyas(p));
  if (s.endless) {
    platform.games.submit('endless1', s.score);
    const g = platform.games;
    if (g.signedIn && g.player) platform.board.submit('endless1', { name: g.player.name, playerId: g.player.id, score: s.score, wave: s.wave });
  }
  if (s.won && s.boss && res.first) { if (!p.purchases.starter_pack && !p.starterOffered) pendingOffer = true; platform.games.review(); }
  store.save();
  return res;
}
function leaveBattle() {
  if (battle && !battle.finished && game && game.state === 'lost') { battle.lost = true; finishBattle(); }
  hud.modal = null;
}
function syncAchievements(fresh = []) {
  for (const a of fresh) { platform.games.unlock(a.id); if (screen !== 'battle') app.toast(`Achievement: ${a.name} (+${a.rubies} rubies)`); }
}
async function cloudSync() {
  store.cloud = platform.games.signedIn ? platform.games : null;
  if (!store.cloud) return;
  await store.syncFromCloud();
  for (const id of Object.keys(store.profile.achievements)) platform.games.unlock(id);
  platform.games.submit('totalDiyas', M.totalDiyas(store.profile));
}

const SFX = { built: 'build', kill: 'kill', leak: 'leak', explosion: 'explosion', volley: 'volley', summon: 'boss', soldierDown: 'soldierDown', heroDown: 'soldierDown', powerup: 'powerup', revived: 'powerup', shieldUp: 'shieldUp', shieldBreak: 'shieldBreak', jam: 'jam', portalIn: 'portal', charge: 'trumpet', poisonCloud: 'bubble', plotOpened: 'reward', upgraded: 'upgrade' };
function processEvents() {
  const p = store.profile;
  for (const e of game.drainEvents()) {
    world.onEvent(e);
    if (SFX[e.type]) sound.play(SFX[e.type]);
    if (e.type === 'fire') sound.play({ arrow: 'arrow', magic: 'magic', shell: 'cannon', falcon: 'falcon' }[e.tower.def.kind] || 'arrow');
    if (e.type === 'hit') sound.play(e.kind === 'magic' ? 'hit' : 'sword');
    if (e.type === 'kill' && e.gold) sound.play('coin');
    if (e.type === 'spell') sound.play(e.spell === 'holyFire' ? 'holy' : e.spell === 'arrowRain' ? 'volley' : 'wave');
    if (e.type === 'powerup') { M.spendPowerup(p, e.powerup); store.save(); if (e.powerup === 'freeze') sound.play('freeze'); }
    const step = currentLevel.tutorial && battle.brief.mode === 'story' && currentLevel.tutorial[tutorialStep];
    if (step && e.type === step.until) tutorialStep++;
    if (e.type === 'newEnemy') { p.seen[e.enemy] = true; store.save(); sound.play('newEnemy'); const m = { type: 'newEnemy', enemy: e.enemy }; if (hud.modal) modalQueue.push(m); else hud.modal = m; }
    if (e.type === 'bossArrives') { slowmo = { t: 1.6, k: 0.3 }; sound.play('boss'); hud.banner = { text: `${e.enemy.def.name} approaches!`, sub: game.endless ? 'Boss wave' : 'Defeat him to unlock Endless mode', t: 0, life: 3, big: true }; }
    if (e.type === 'waveStart') {
      sound.play('wave'); sound.play('horn'); if (e.wave > 0) sound.play('cry');
      const final = !game.endless && e.wave === game.waveCount - 1;
      if (final) { hud.banner = { text: 'FINAL WAVE!', sub: 'Hold the line', t: 0, life: 2, big: true }; sound.play('finalWave'); }
      else if (e.wave > 0) hud.banner = { text: `Wave ${e.wave + 1}`, t: 0, life: 1.2 };
    }
    if (e.type === 'leak') livesFlash = 0.6;
    // victory: a golden moment on the battlefield first, then the results
    if (e.type === 'won') { const res = finishBattle(); hud.menu = null; hud.targeting = null; pendingResult = { t: 1.3, modal: { type: 'won', diyas: e.diyas, reward: res, challenge: battle.brief.challenge } }; hud.banner = { text: 'VICTORY!', t: 0, life: 1.3, big: true }; sound.play('win'); sound.stopMusic(); slowmo = { t: 1.2, k: 0.35 }; }
    if (e.type === 'lost') {
      hud.menu = null; sound.play('lose');
      if (game.endless) {
        const prevBest = p.stats.endlessBest[currentLevel.id] || 0;
        const res = finishBattle(), s = game.summary();
        hud.modal = { type: 'lost', endless: true, wave: s.wave, score: s.score, best: s.wave > prevBest, bestWave: Math.max(prevBest, s.wave), reward: res };
      } else hud.modal = { type: 'lost', reward: {} };
    }
  }
}

// ---------------------------------------------------------------- input
function worldTap(wx, wy) {
  if (hud.targeting) { if (game.castSpell(hud.targeting, wx, wy)) hud.targeting = null; return; }
  if (hud.heroSelected) { game.moveHero(wx, wy); hud.heroSelected = false; return; }
  const h = game.hero;
  if (h && !h.dead && Math.hypot(h.x - wx, h.y - 14 - wy) < 20) { hud.heroSelected = true; hud.menu = null; return; }
  const tower = game.towers.find((t) => Math.abs(t.x - wx) < 26 && wy < t.y + 12 && wy > t.y - 70);
  if (tower) { hud.menu = { type: 'tower', plotId: tower.plot.id, towerId: tower.id }; return; }
  const plot = game.plots.find((p) => Math.hypot(p.x - wx, (p.y - wy) * 1.6) < 30);
  if (plot) { hud.menu = { type: plot.lock ? 'locked' : 'build', plotId: plot.id }; return; }
  // the secret peacock
  const pea = (currentLevel.scenery || []).find((s) => s[0] === 'peacock' && Math.hypot(s[1] - wx, s[2] - 10 - wy) < 22);
  if (pea) { store.profile.stats.peacock++; sound.play('coin'); syncAchievements(M.checkAchievements(store.profile)); store.save(); }
  hud.menu = null;
}

let press = null;
canvas.addEventListener('pointerdown', (e) => {
  sound.unlock();
  if (!view) return;
  const x = e.clientX, y = e.clientY;
  press = { x, y, lx: x, moved: false };
  if (screen === 'battle') {
    if (hud.hit(x, y)) return;
    if (hud.modal) return;
    const w = view.toWorld(x, y);
    worldTap(w.x, w.y);
    return;
  }
  if (screen === 'settings' && !screens.modal && screens.slide(x, y)) press.slider = true;
});
canvas.addEventListener('pointermove', (e) => {
  if (!press) return;
  const x = e.clientX, y = e.clientY;
  if (Math.hypot(x - press.x, y - press.y) > 8) press.moved = true;
  if (screen === 'map' && !screens.modal) screens.dragMap(x - press.lx);
  if (press.slider) screens.slide(x, y);
  press.lx = x;
});
canvas.addEventListener('pointerup', (e) => {
  const pr = press;
  press = null;
  if (!pr || screen === 'battle' || screen.startsWith('loading')) return;
  if (pr.slider) { store.save(); return; }
  if (!pr.moved) screens.hit(e.clientX, e.clientY);
});
canvas.addEventListener('pointercancel', () => { press = null; });

function onBack() {
  if (screen === 'battle') { if (hud.modal && hud.modal.type === 'pause') hud.modal = null; else if (!hud.modal) hud.modal = { type: 'pause' }; return; }
  if (screen === 'menu') { if (screens.modal) screens.modal = null; else screens.modal = { type: 'confirm', text: 'Leave Sandstone Kingdom?', yes: () => platform.device.exit() }; return; }
  if (!screen.startsWith('loading')) back();
}

// ---------------------------------------------------------------- drawing
function drawLoading() {
  const { dpr, cssW, cssH, u } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (assets.menuBg) { ctx.drawImage(assets.menuBg.canvas, 0, 0, cssW, cssH); ctx.fillStyle = 'rgba(18,9,4,0.6)'; ctx.fillRect(0, 0, cssW, cssH); } else { ctx.fillStyle = '#24170f'; ctx.fillRect(0, 0, cssW, cssH); }
  const t = performance.now() / 1000;
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(t * 4 - i)); ctx.fillStyle = '#ffd25a'; ctx.beginPath(); ctx.arc(cssW / 2 + (i - 1) * 18 * u, cssH * 0.5, 5 * u, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  text(ctx, TIPS[loadingTip % TIPS.length], cssW / 2, cssH * 0.5 + 40 * u, 13 * u, { weight: 700, sw: 3 * u, max: cssW - 60 * u });
}
function drawRotate() {
  const { dpr, cssW, cssH } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#24170f'; ctx.fillRect(0, 0, cssW, cssH);
  text(ctx, 'Turn your phone sideways', cssW / 2, cssH / 2, 20, { max: cssW - 30 });
  text(ctx, 'Sandstone Kingdom plays in landscape', cssW / 2, cssH / 2 + 28, 13, { weight: 700, max: cssW - 30 });
}
function drawToasts(dt) {
  const { dpr, cssW, u, safe } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  toasts.forEach((t, i) => {
    t.t += dt;
    const a = Math.min(1, t.t * 6, (2.8 - t.t) * 3);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.font = `900 ${13 * u}px Martel, Georgia, serif`;
    const w = Math.min(cssW - 40 * u, ctx.measureText(t.text).width + 40 * u), x = (cssW - w) / 2, y = view.cssH - safe.b - 80 * u - (toasts.length - 1 - i) * 36 * u;
    ctx.fillStyle = 'rgba(40,22,10,0.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, 30 * u, 15 * u); ctx.fill();
    ctx.strokeStyle = '#e0a224'; ctx.lineWidth = 2 * u; ctx.stroke();
    text(ctx, t.text, cssW / 2, y + 20 * u, 13 * u, { max: w - 24 * u, sw: 2.4 * u });
    ctx.globalAlpha = 1;
  });
  toasts = toasts.filter((t) => t.t < 2.8);
}

let last = performance.now(), acc = 0, skip = false;
let forgeCheck = 0;
function frame(now) {
  requestAnimationFrame(frame);
  // a forge job finishing while you play or browse is announced wherever you are
  if (now - forgeCheck > 1000) {
    forgeCheck = now;
    const done = M.forgeTick(store.profile, Date.now());
    if (done) { const t = M.FORGE.find((x) => x.id === done.id); app.toast(`Royal Forge: ${t.name} rank ${done.rank} is ready`); syncAchievements(M.checkAchievements(store.profile)); store.save(); }
  }
  if (store.profile.settings.battery) { skip = !skip; if (skip) return; } // battery saver: 30 fps
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!view) return;
  if (view.cssH > view.cssW) { drawRotate(); return; }
  if (screen.startsWith('loading')) { drawLoading(); drawToasts(dt); return; }
  if (screen === 'battle') {
    // slow motion for big moments: the boss walking in, the last enemy falling
    let k = 1;
    if (slowmo) { slowmo.t -= dt; k = slowmo.t > 0 ? slowmo.k : 1; if (slowmo.t <= 0) slowmo = null; }
    if (!hud.modal) {
      acc += dt * speed * k;
      while (acc >= 1 / 60) { game.update(1 / 60); acc -= 1 / 60; processEvents(); }
    } else acc = 0;
    if (pendingResult) { pendingResult.t -= dt; if (pendingResult.t <= 0) { hud.modal = pendingResult.modal; pendingResult = null; } }
    // the music follows the battle: calm before the first wave, tense when the fort is in danger,
    // on the final wave or when a boss is out; a heartbeat when only a few lives are left
    const danger = game.lives <= Math.max(3, game.maxLives * 0.25);
    const boss = game.enemies.some((en) => en.def.boss);
    const final = !game.endless && game.waveIndex === game.waveCount - 1;
    sound.setIntensity(game.state === 'ready' ? 0 : boss ? 3 : danger || final || game.enemies.length > 24 ? 2 : 1, danger && game.state === 'playing');
    world.update(dt * k); hud.update(dt); livesFlash -= dt;
    world.draw(ctx, view, game, assets, hud);
    if (danger && game.state === 'playing') {
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      const a = 0.22 + 0.16 * Math.sin(performance.now() / 260);
      const vg = ctx.createRadialGradient(view.cssW / 2, view.cssH / 2, Math.min(view.cssW, view.cssH) * 0.35, view.cssW / 2, view.cssH / 2, Math.max(view.cssW, view.cssH) * 0.7);
      vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, `rgba(160,10,0,${a})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, view.cssW, view.cssH);
    }
    const step = currentLevel.tutorial && battle.brief.mode === 'story' && currentLevel.tutorial[tutorialStep];
    if (!window.__sk.hideHud) hud.draw(ctx, view, game, assets, { speed, livesFlash, tutorial: step, hasNext: !!LEVELS[game.level.id + 1], challenge: battle.brief.challenge, canAd: app.rewardedLeft() > 0 });
  } else screens.draw(ctx, view, screen, dt);
  drawToasts(dt);
}

// testing hooks used by the automated device checks
window.__sk = {
  get game() { return game; }, get screen() { return screen; }, get view() { return view; }, hud, assets, screens, store, app,
  startLevel: (id, extra = {}) => startBattle({ mode: 'story', level: id, ...extra }), go, worldTap: (x, y) => worldTap(x, y),
  tapScreen: (x, y) => { canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })); canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true })); },
  goTitle: () => go('menu'),
};

(async () => {
  loadingTip = Math.floor(Math.random() * TIPS.length);
  try { await Promise.all(['400 20px "Rozha One"', '900 20px Martel', '700 20px Martel'].map((f) => document.fonts.load(f))); } catch { /* fonts fall back */ }
  await loadSpriteFonts();
  await layout();
  requestAnimationFrame(frame);
  app.applySettings();
  sound.setAmbience('spring'); // birdsong of the Aravalli hills
  // platform services start in the background; the game never waits on the network
  platform.device.init({ onPause: () => { sound.pause(); store.save(true); if (screen === 'battle' && !hud.modal) hud.modal = { type: 'pause' }; }, onResume: () => sound.resume(), onBack });
  platform.billing.init({
    onGrant: (id, token) => { if (M.grantProduct(store.profile, id, token)) { app.reward(`${M.product(id).name} received. Thank you!`); if (id === 'remove_ads') platform.ads.banner(false); store.save(true); } },
    onRestore: (ids) => { if (M.restoreOwned(store.profile, ids)) store.save(true); },
  }).catch(() => {});
  platform.games.init({ onChange: (signed) => { if (signed) cloudSync(); } }).catch(() => {});
  platform.ads.init().catch(() => {}); // runs with Remove Ads too: optional rewarded ads stay available
  M.refreshQuests(store.profile);
  // first launch goes straight into the training level; afterwards, the main menu
  if (!store.profile.introSeen) { store.profile.introSeen = true; store.save(); await go('menu'); screens.modal = null; dailyShown = null; startBattle({ mode: 'story', level: 0 }); }
  else await go('menu');
})();
