// Store and service IDs. Everything here is safe to ship in the app (none of it is secret).
// FOUNDER: replace the test IDs with your real ones before the production release.
// See docs/release-setup.md for where each value comes from.

export const ADMOB = {
  // Google's official test IDs: they always show test ads and never risk your AdMob account.
  // Real IDs come from AdMob > Apps > Sandstone Kingdom > Ad units.
  appId: 'ca-app-pub-3940256099942544~3347511713', // also set in android/app/src/main/res/values/strings.xml
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  testing: true, // set false with real IDs for production
  maxAdContentRating: 'Teen', // game rated for 12+: no mature ads
};

// Google Play Billing product IDs: create these exact IDs in Play Console > Monetize > In-app products.
export { PRODUCTS } from '../meta/profile.js';

// Google Play Games Services: IDs from Play Console > Play Games Services > Achievements / Leaderboards.
// Placeholders ('') mean "not set up yet": the game still works, it just skips that call.
export const PLAY_GAMES = {
  achievements: {
    first_win: '', trained: '', spring_returns: '', lamplighter: '', diyas_15: '', diyas_45: '', perfect_year: '',
    iron_will: '', challenger: '', all_challenges_r1: '', untouchable: '', flawless_5: '', kills_1000: '', kills_10000: '',
    thunder_lord: '', holy_order: '', royal_patron: '', spell_100: '', workshop_first: '', workshop_max: '', survivor: '',
    endless_50: '', seasons_legend: '', loyal_7: '', scholar: '', early_bird: '', power_player: '', back_from_brink: '',
    peacock: '', quests_all: '', hero_skill_20: '', veteran: '',
  },
  leaderboards: { endless1: '', endless2: '', endless3: '', endless4: '', endless5: '', endless6: '', totalDiyas: '', weekly: '' },
};

// Public top-100 copy of the endless rankings, so guests (not signed in) can see them too.
// A Firebase Realtime Database URL, e.g. https://sandstone-kingdom-default-rtdb.firebaseio.com
// Empty means the guest list is hidden and only Google Play leaderboards are used.
export const PUBLIC_LEADERBOARD_URL = '';

export const LINKS = {
  privacy: 'https://samvardhanstudios.com/sandstone-kingdom/privacy',
  terms: 'https://samvardhanstudios.com/sandstone-kingdom/terms',
  support: 'mailto:support@samvardhanstudios.com',
  site: 'https://samvardhanstudios.com/sandstone-kingdom/',
};
export const APP_VERSION = '1.0.0';
