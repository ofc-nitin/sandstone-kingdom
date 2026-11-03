// One small interface for everything the phone provides: ads, purchases, Google Play Games,
// haptics, app pause/resume and the back button. On Android it talks to the Capacitor and
// Cordova plugins; in a desktop browser it falls back to harmless mocks so the game is
// fully playable and testable without a phone.
import { ADMOB, PLAY_GAMES, PUBLIC_LEADERBOARD_URL } from './config.js';
import { PRODUCTS } from '../meta/profile.js';

const Cap = () => window.Capacitor;
export const isNative = () => !!(Cap() && Cap().isNativePlatform && Cap().isNativePlatform());
function plugin(name) {
  const c = Cap();
  if (!c || !isNative()) return null;
  try { return c.registerPlugin ? c.registerPlugin(name) : (c.Plugins && c.Plugins[name]) || null; } catch { return null; }
}
const withTimeout = (p, ms, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
const log = (...a) => { try { console.info('[platform]', ...a); } catch { /* no console */ } };

// ---------------------------------------------------------------- ads (AdMob + Google UMP consent)
// The banner is small (320x50), top centre, and only on the world map, where it covers nothing you tap.
class Ads {
  constructor() { this.ready = false; this.canRequest = false; this.rewardedLoaded = false; this.interLoaded = false; this.bannerShown = false; this.mock = !isNative(); this.privacyOptions = false; }

  async init() {
    this.admob = plugin('AdMob');
    if (!this.admob) { this.ready = true; this.canRequest = true; log('ads: browser mock'); return; }
    try {
      // consent first (GDPR / UK / US states): Google's UMP form shows only where the law needs it
      const info = await this.admob.requestConsentInfo({});
      let st = info;
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') st = await this.admob.showConsentForm();
      this.canRequest = st.canRequestAds !== false;
      this.privacyOptions = st.privacyOptionsRequirementStatus === 'REQUIRED';
    } catch (e) { log('consent failed', e); this.canRequest = true; }
    try {
      await this.admob.initialize({ initializeForTesting: ADMOB.testing, maxAdContentRating: ADMOB.maxAdContentRating });
      this.ready = true;
      this.preload();
    } catch (e) { log('admob init failed', e); }
  }

  async preload() {
    if (!this.admob || !this.canRequest) return;
    if (!this.rewardedLoaded) this.admob.prepareRewardVideoAd({ adId: ADMOB.rewarded, isTesting: ADMOB.testing, immersiveMode: true }).then(() => { this.rewardedLoaded = true; }).catch((e) => log('rewarded load', e));
    if (!this.interLoaded) this.admob.prepareInterstitial({ adId: ADMOB.interstitial, isTesting: ADMOB.testing, immersiveMode: true }).then(() => { this.interLoaded = true; }).catch((e) => log('interstitial load', e));
  }

  // Resolves true only if the player watched to the end and earned the reward.
  async rewarded() {
    if (this.mock) return new Promise((r) => setTimeout(() => r(true), 600));
    if (!this.admob || !this.canRequest) return false;
    if (!this.rewardedLoaded) {
      try { await withTimeout(this.admob.prepareRewardVideoAd({ adId: ADMOB.rewarded, isTesting: ADMOB.testing, immersiveMode: true }), 8000, null); this.rewardedLoaded = true; } catch { return false; }
    }
    this.rewardedLoaded = false;
    try {
      const item = await this.admob.showRewardVideoAd();
      return !!item;
    } catch (e) { log('rewarded show', e); return false; } finally { setTimeout(() => this.preload(), 500); }
  }
  get rewardedAvailable() { return this.mock || (this.ready && this.canRequest); }

  async interstitial() {
    if (this.mock || !this.admob || !this.interLoaded) return false;
    this.interLoaded = false;
    try { await this.admob.showInterstitial(); return true; } catch (e) { log('interstitial show', e); return false; } finally { setTimeout(() => this.preload(), 500); }
  }

  async banner(show) {
    if (!this.admob || !this.canRequest) return;
    try {
      if (show && !this.bannerShown) { await this.admob.showBanner({ adId: ADMOB.banner, isTesting: ADMOB.testing, adSize: 'BANNER', position: 'TOP_CENTER', margin: 0 }); this.bannerShown = true; }
      if (!show && this.bannerShown) { await this.admob.removeBanner(); this.bannerShown = false; }
    } catch (e) { log('banner', e); }
  }

  async showPrivacyOptions() { if (this.admob) try { await this.admob.showPrivacyOptionsForm(); } catch (e) { log('privacy form', e); } }
  async setMuted(m) { if (this.admob) try { await this.admob.setApplicationMuted({ muted: m }); } catch { /* not important */ } }
}

// ---------------------------------------------------------------- purchases (Google Play Billing via cordova-plugin-purchase)
class Billing {
  constructor() { this.ready = false; this.prices = {}; this.onGrant = null; this.onRestore = null; this.mock = !isNative(); this.pending = {}; }

  async init({ onGrant, onRestore }) {
    this.onGrant = onGrant; this.onRestore = onRestore;
    if (this.mock) { this.ready = true; for (const p of PRODUCTS) this.prices[p.id] = `₹${p.inr}`; return; }
    await withTimeout(new Promise((r) => (window.CdvPurchase ? r() : document.addEventListener('deviceready', r, { once: true }))), 8000);
    const C = window.CdvPurchase;
    if (!C) { log('billing plugin missing'); return; }
    const { store, ProductType, Platform } = C;
    this.store = store; this.Platform = Platform;
    store.verbosity = C.LogLevel ? C.LogLevel.WARNING : 1;
    store.register(PRODUCTS.map((p) => ({ id: p.id, type: p.type === 'consumable' ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY })));
    store.when()
      .productUpdated(() => this.readPrices())
      .approved((tx) => {
        // grant first, then finish (acknowledge / consume) so nothing is lost if the app closes
        for (const pr of tx.products || []) this.onGrant && this.onGrant(pr.id, tx.transactionId || tx.purchaseId || pr.id + ':' + Date.now());
        tx.finish();
      })
      .finished((tx) => { for (const pr of tx.products || []) { const cb = this.pending[pr.id]; if (cb) { delete this.pending[pr.id]; cb(true); } } });
    store.error((e) => log('billing error', e && e.message));
    try { await store.initialize([Platform.GOOGLE_PLAY]); } catch (e) { log('billing init', e); }
    this.ready = true;
    this.readPrices();
    store.ready(() => this.restoreOwned());
  }

  readPrices() {
    if (!this.store) return;
    for (const p of PRODUCTS) { const sp = this.store.get(p.id, this.Platform.GOOGLE_PLAY); if (sp && sp.pricing && sp.pricing.price) this.prices[p.id] = sp.pricing.price; }
  }
  price(id) { return this.prices[id] || null; }

  restoreOwned() {
    if (!this.store) return;
    const owned = PRODUCTS.filter((p) => p.type === 'once' && this.store.owned(p.id, this.Platform.GOOGLE_PLAY)).map((p) => p.id);
    if (owned.length && this.onRestore) this.onRestore(owned);
  }

  // Resolves true when the purchase went through (and was granted), false if cancelled or failed.
  async buy(id) {
    if (this.mock) { await new Promise((r) => setTimeout(r, 400)); if (this.onGrant) this.onGrant(id, `mock:${id}:${Date.now()}`); return true; }
    if (!this.store) return false;
    const sp = this.store.get(id, this.Platform.GOOGLE_PLAY);
    const offer = sp && sp.getOffer();
    if (!offer) return false;
    return new Promise((resolve) => {
      this.pending[id] = resolve;
      offer.order().then((err) => { if (err) { delete this.pending[id]; resolve(false); } });
      setTimeout(() => { if (this.pending[id]) { delete this.pending[id]; resolve(false); } }, 180000);
    });
  }

  async restore() {
    if (this.mock) return 0;
    if (!this.store) return 0;
    try { await this.store.restorePurchases(); } catch (e) { log('restore', e); }
    this.restoreOwned();
    return 1;
  }
}

// ---------------------------------------------------------------- Google Play Games Services (our native plugin: PlayGamesPlugin.java)
class Games {
  constructor() { this.available = false; this.signedIn = false; this.player = null; this.mock = !isNative(); this.onChange = null; }

  async init({ onChange }) {
    this.onChange = onChange;
    this.pg = plugin('PlayGames');
    if (!this.pg) { this.available = false; return; }
    try {
      const r = await withTimeout(this.pg.isAvailable(), 5000, { available: false });
      this.available = !!r.available;
      if (!this.available) return;
      // Play Games v2 signs players in automatically when they allowed it before
      const s = await withTimeout(this.pg.isSignedIn(), 8000, { signedIn: false });
      this.setSigned(!!s.signedIn, s);
    } catch (e) { log('games init', e); }
  }
  setSigned(v, info = {}) { this.signedIn = v; this.player = v ? { name: info.displayName || 'Player', id: info.playerId || '' } : null; if (this.onChange) this.onChange(this.signedIn); }

  async signIn() {
    if (!this.pg || !this.available) return false;
    try { const r = await this.pg.signIn(); this.setSigned(!!r.signedIn, r); return this.signedIn; } catch (e) { log('signIn', e); return false; }
  }
  unlock(achId) { const id = PLAY_GAMES.achievements[achId]; if (this.signedIn && id) this.pg.unlockAchievement({ id }).catch(() => {}); }
  submit(board, score) { const id = PLAY_GAMES.leaderboards[board]; if (this.signedIn && id) this.pg.submitScore({ id, score: Math.floor(score) }).catch(() => {}); }
  async showAchievements() { if (!(await this.ensure())) return false; try { await this.pg.showAchievements(); return true; } catch { return false; } }
  async showLeaderboard(board) {
    if (!(await this.ensure())) return false;
    const id = board && PLAY_GAMES.leaderboards[board];
    try { if (id) await this.pg.showLeaderboard({ id }); else await this.pg.showAllLeaderboards(); return true; } catch { return false; }
  }
  async ensure() { if (!this.available) return false; if (!this.signedIn) await this.signIn(); return this.signedIn; }

  // Saved Games (cloud save). Data is the whole profile as JSON.
  async save(json) { if (!this.signedIn) return false; try { await this.pg.saveGame({ name: 'profile', data: json, description: 'Sandstone Kingdom progress' }); return true; } catch (e) { log('cloud save', e); return false; } }
  async load() { if (!this.signedIn) return null; try { const r = await this.pg.loadGame({ name: 'profile' }); return r && r.data ? r.data : null; } catch (e) { log('cloud load', e); return null; } }
  async review() { if (this.pg) try { await this.pg.requestReview(); } catch { /* optional */ } }
}

// ---------------------------------------------------------------- public endless rankings for guests (Firebase, optional)
class PublicBoard {
  get enabled() { return !!PUBLIC_LEADERBOARD_URL; }
  async top(board) {
    if (!this.enabled) return null;
    try {
      const r = await withTimeout(fetch(`${PUBLIC_LEADERBOARD_URL}/boards/${board}.json?orderBy="score"&limitToLast=100`), 6000, null);
      if (!r || !r.ok) return null;
      const data = await r.json();
      return Object.values(data || {}).sort((a, b) => b.score - a.score).slice(0, 100);
    } catch { return null; }
  }
  // Only signed-in players submit; the score must be possible for the wave reached.
  async submit(board, { name, playerId, score, wave }) {
    if (!this.enabled || !playerId || score > maxEndlessScore(wave)) return false;
    try { const r = await fetch(`${PUBLIC_LEADERBOARD_URL}/boards/${board}/${encodeURIComponent(playerId)}.json`, { method: 'PUT', body: JSON.stringify({ name: String(name).slice(0, 24), score: Math.floor(score), wave, t: Date.now() }) }); return r.ok; } catch { return false; }
  }
}
export const maxEndlessScore = (wave) => 100 * wave * (wave + 1) / 2 + wave * 6000 + 20000;

// ---------------------------------------------------------------- device bits
class Device {
  async init({ onPause, onResume, onBack }) {
    this.haptics = plugin('Haptics');
    const app = plugin('App');
    if (app) {
      app.addListener('appStateChange', (s) => (s.isActive ? onResume() : onPause()));
      app.addListener('backButton', () => onBack());
      this.app = app;
    } else {
      document.addEventListener('visibilitychange', () => (document.hidden ? onPause() : onResume()));
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape') onBack(); });
    }
    const orient = plugin('ScreenOrientation');
    if (orient) orient.lock({ orientation: 'landscape' }).catch(() => {});
    const bar = plugin('StatusBar');
    if (bar) bar.hide().catch(() => {});
  }
  buzz(kind = 'light', enabled = true) {
    if (!enabled) return;
    if (this.haptics) { this.haptics.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(() => {}); return; }
    if (navigator.vibrate) try { navigator.vibrate(kind === 'heavy' ? 40 : 12); } catch { /* not supported */ }
  }
  exit() { if (this.app) this.app.exitApp(); }
  open(url) { try { window.open(url, '_system'); } catch { /* ignore */ } }
}

export const platform = { ads: new Ads(), billing: new Billing(), games: new Games(), board: new PublicBoard(), device: new Device(), isNative };
