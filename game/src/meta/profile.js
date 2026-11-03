// The player's profile and the whole meta game: currencies, level progress, daily login,
// daily quests, map challenges, achievements, the Royal Workshop, shop grants, ad rules and
// cloud-save merging. Pure functions over a plain object, so it is easy to test and to save.
import { LEVELS } from '../engine/levels.js';
import { ROYAL_TOWERS, POWERUPS, ENEMIES } from '../engine/data.js';

export const SAVE_VERSION = 2;
const DAY = 86400000;

// Local calendar day, e.g. "2026-11-03". The daily calendar and quests turn over at local midnight.
export function dayKey(now = Date.now(), tzOffsetMin = new Date(now).getTimezoneOffset()) {
  return new Date(now - tzOffsetMin * 60000).toISOString().slice(0, 10);
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export function newProfile(now = Date.now()) {
  return {
    v: SAVE_VERSION, created: now, updated: now,
    coins: 0, rubies: 30,
    diyas: {}, seen: {}, challenges: {}, owned: {}, purchases: {}, removeAds: false,
    powerups: { freeze: 1, gold: 1, lives: 1 },
    workshop: {},
    daily: { day: 0, lastKey: null },
    quests: { key: null, list: [], bonus: false },
    achievements: {},
    stats: { wins: 0, kills: 0, played: 0, bossWins: 0, endlessBest: {}, endlessScore: {}, adsWatched: 0, peacock: 0, spells: 0, flawless: 0 },
    ads: { lastInterstitial: 0, rewardKey: null, rewardCount: 0 },
    settings: { music: 0.6, sfx: 0.9, haptics: true, textSize: 1, battery: false, quality: 'high', colorblind: false, notifications: false, lang: 'en' },
    introSeen: false, starterOffered: false, consent: null,
  };
}

// Older saves (v1 kept only diyas and seen enemies) are carried forward.
export function migrate(raw, now = Date.now()) {
  const p = newProfile(now);
  if (!raw || typeof raw !== 'object') return p;
  const out = { ...p, ...raw };
  for (const k of ['stats', 'ads', 'settings', 'daily', 'quests', 'powerups']) out[k] = { ...p[k], ...(raw[k] || {}) };
  for (const k of ['diyas', 'seen', 'challenges', 'owned', 'purchases', 'workshop', 'achievements']) out[k] = { ...(raw[k] || {}) };
  out.v = SAVE_VERSION;
  return out;
}

export const totalDiyas = (p) => Object.values(p.diyas).reduce((a, b) => a + b, 0);
export const levelUnlocked = (p, id) => id <= 1 || (p.diyas[id - 1] || 0) > 0;
export const levelsWon = (p) => Object.values(p.diyas).filter((d) => d > 0).length;
export const bossBeaten = (p, region = 1) => (p.diyas[region * 5] || 0) > 0;
export const endlessUnlocked = (p) => bossBeaten(p, 1);

function give(p, r, mult = 1) {
  if (r.coins) p.coins += Math.round(r.coins * mult);
  if (r.rubies) p.rubies += Math.round(r.rubies * mult);
  if (r.powerups) for (const [k, n] of Object.entries(r.powerups)) p.powerups[k] = (p.powerups[k] || 0) + n;
}

// ---------------------------------------------------------------- level rewards (coins)
export function levelReward(p, summary) {
  if (!summary.won) return { coins: 0 };
  const first = !(p.diyas[summary.level] > 0);
  let coins = (40 + 15 * summary.level) * (1 + 0.25 * (summary.diyas - 1));
  if (summary.boss) coins += 100;
  if (!first) coins *= 0.4;
  return { coins: Math.round(coins), first };
}

// ---------------------------------------------------------------- daily login (works offline, no sign-in needed)
export const DAILY_REWARDS = [
  { coins: 100 }, { rubies: 5 }, { coins: 200, powerups: { gold: 1 } }, { rubies: 10 },
  { coins: 300, powerups: { freeze: 1 } }, { rubies: 15 }, { chest: true, coins: 600, rubies: 30, powerups: { freeze: 1, gold: 1, lives: 1 } },
];
export const SIGNED_IN_BONUS = 1.2;

export function dailyStatus(p, now = Date.now()) {
  const key = dayKey(now), last = p.daily.lastKey;
  if (last === key) return { canClaim: false, day: (p.daily.day - 1 + 7) % 7, next: p.daily.day % 7 };
  const gap = last ? daysBetween(last, key) : 1;
  if (gap < 0) return { canClaim: false, day: (p.daily.day - 1 + 7) % 7, next: p.daily.day % 7, clockBack: true };
  const day = gap === 1 ? p.daily.day % 7 : 0; // a missed day restarts the calendar
  return { canClaim: true, day, next: day, missed: gap > 1 };
}

export function claimDaily(p, now = Date.now(), { signedIn = false } = {}) {
  const st = dailyStatus(p, now);
  if (!st.canClaim) return null;
  const reward = DAILY_REWARDS[st.day];
  give(p, reward, signedIn ? SIGNED_IN_BONUS : 1);
  p.daily = { day: st.day + 1, lastKey: dayKey(now) };
  return { day: st.day, reward, bonus: signedIn };
}

// ---------------------------------------------------------------- daily quests (rubies only)
const QUEST_POOL = [
  { kind: 'kill', enemy: 'bandit', n: 60, rubies: 5, text: 'Defeat 60 Bandits' },
  { kind: 'kill', enemy: 'wolfRider', n: 20, rubies: 6, text: 'Defeat 20 Wolf Riders', needs: 'wolfRider' },
  { kind: 'kill', enemy: 'barbarian', n: 12, rubies: 6, text: 'Defeat 12 Barbarians', needs: 'barbarian' },
  { kind: 'killAny', n: 150, rubies: 6, text: 'Defeat 150 enemies' },
  { kind: 'win', n: 2, rubies: 6, text: 'Win 2 levels' },
  { kind: 'three', n: 1, rubies: 8, text: 'Earn 3 diyas on any level' },
  { kind: 'only', tower: 'archer', n: 1, rubies: 10, text: 'Win a level using only Archer Towers' },
  { kind: 'only', tower: 'mage', n: 1, rubies: 10, text: 'Win a level using only Mage Towers', needs: 'level2' },
  { kind: 'spells', n: 8, rubies: 5, text: 'Cast 8 spells' },
  { kind: 'early', n: 5, rubies: 5, text: 'Call 5 waves early' },
  { kind: 'tier3', n: 2, rubies: 6, text: 'Upgrade 2 towers to the top tier' },
  { kind: 'build', n: 15, rubies: 5, text: 'Build 15 towers' },
];
export const QUEST_BONUS = 15;

function seededPick(key, n, pool) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const items = pool.slice(), out = [];
  while (out.length < n && items.length) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; out.push(items.splice(h % items.length, 1)[0]); }
  return out;
}

export function refreshQuests(p, now = Date.now()) {
  const key = dayKey(now);
  if (p.quests.key === key) return p.quests;
  const pool = QUEST_POOL.filter((q) => !q.needs || (q.needs === 'level2' ? (p.diyas[1] || 0) > 0 : p.seen[q.needs]));
  p.quests = { key, bonus: false, list: seededPick(key, 3, pool).map((q, i) => ({ ...q, id: `${key}:${i}`, progress: 0, claimed: false })) };
  return p.quests;
}

function questGain(q, s) {
  switch (q.kind) {
    case 'kill': return s.kills[q.enemy] || 0;
    case 'killAny': return Object.values(s.kills).reduce((a, b) => a + b, 0);
    case 'win': return s.won ? 1 : 0;
    case 'three': return s.won && s.diyas === 3 ? 1 : 0;
    case 'only': return s.won && s.towerTypes.length > 0 && s.towerTypes.every((t) => t === q.tower) ? 1 : 0;
    case 'spells': return s.spells;
    case 'early': return s.earlyCalls;
    case 'tier3': return s.tier3;
    case 'build': return Object.values(s.built).reduce((a, b) => a + b, 0);
    default: return 0;
  }
}

export function claimQuest(p, id) {
  const q = p.quests.list.find((x) => x.id === id);
  if (!q || q.claimed || q.progress < q.n) return 0;
  q.claimed = true;
  p.rubies += q.rubies;
  return q.rubies;
}
export function claimQuestBonus(p) {
  if (p.quests.bonus || !p.quests.list.length || !p.quests.list.every((q) => q.claimed)) return 0;
  p.quests.bonus = true;
  p.rubies += QUEST_BONUS;
  return QUEST_BONUS;
}
export const questsReady = (p) => p.quests.list.filter((q) => !q.claimed && q.progress >= q.n).length + (!p.quests.bonus && p.quests.list.length && p.quests.list.every((q) => q.claimed) ? 1 : 0);

// ---------------------------------------------------------------- map challenges (rubies only)
export const CHALLENGES = {
  1: [
    { id: 'archers', name: 'Bowmen Only', desc: 'Win using only Archer Towers', rules: { towers: ['archer'] }, rubies: 15 },
    { id: 'nospell', name: 'No Magic Words', desc: 'Win without casting spells', rules: { noSpells: true }, rubies: 15 },
    { id: 'iron', name: 'Iron Fort', desc: 'Win with a single life', rules: { lives: 1 }, rubies: 20 },
  ],
  2: [
    { id: 'nohero', name: 'Without the Knight', desc: 'Win without the Sun Knight', rules: { noHero: true }, rubies: 20 },
    { id: 'archers', name: 'Bowmen Only', desc: 'Win using only Archer Towers', rules: { towers: ['archer'] }, rubies: 20 },
    { id: 'iron', name: 'Iron Fort', desc: 'Win with three lives', rules: { lives: 3 }, rubies: 25 },
  ],
  3: [
    { id: 'heavy', name: 'Heavy Guns', desc: 'Only Mage and Cannon Towers', rules: { towers: ['mage', 'cannon'] }, rubies: 20 },
    { id: 'wall', name: 'Shield Wall', desc: 'Only Barracks and Archer Towers', rules: { towers: ['barracks', 'archer'] }, rubies: 20 },
    { id: 'iron', name: 'Iron Fort', desc: 'Win with five lives', rules: { lives: 5 }, rubies: 25 },
  ],
  4: [
    { id: 'wall', name: 'Shield Wall', desc: 'Only Barracks and Archer Towers', rules: { towers: ['barracks', 'archer'] }, rubies: 25 },
    { id: 'siege', name: 'Siege Crew', desc: 'Only Barracks, Mage and Cannon Towers', rules: { towers: ['barracks', 'mage', 'cannon'] }, rubies: 25 },
    { id: 'iron', name: 'Iron Fort', desc: 'Win with three lives', rules: { lives: 3 }, rubies: 30 },
  ],
  5: [
    { id: 'nocannon', name: 'No Gunpowder', desc: 'Beat the Bandit King without Cannon Towers', rules: { towers: ['archer', 'barracks', 'mage', 'falconer', 'fountain'] }, rubies: 30 },
    { id: 'arcane', name: 'Arcane Guard', desc: 'Only Mage Towers and Barracks', rules: { towers: ['mage', 'barracks', 'falconer', 'fountain'] }, rubies: 30 },
    { id: 'iron', name: 'Untouchable King', desc: 'Beat him with ten lives', rules: { lives: 10 }, rubies: 40 },
  ],
};
export const challengeKey = (level, id) => `${level}:${id}`;
export const challengeUnlocked = (p, level) => (p.diyas[level] || 0) > 0;

// ---------------------------------------------------------------- achievements (Google Play Games + rubies)
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
const r1Levels = [1, 2, 3, 4, 5];
export const ACHIEVEMENTS = [
  { id: 'first_win', name: 'First Victory', desc: 'Win your first level', rubies: 5, check: (p) => levelsWon(p) >= 1 },
  { id: 'trained', name: 'Ready for War', desc: 'Finish the Training Grounds', rubies: 5, check: (p) => (p.diyas[0] || 0) > 0 },
  { id: 'spring_returns', name: 'Spring Returns', desc: 'Defeat the Bandit King', rubies: 20, check: (p) => bossBeaten(p, 1) },
  { id: 'lamplighter', name: 'Lamplighter', desc: '3 diyas on every Aravalli level', rubies: 25, check: (p) => r1Levels.every((l) => p.diyas[l] === 3) },
  { id: 'diyas_15', name: 'Festival of Lamps', desc: 'Earn 15 diyas', rubies: 10, check: (p) => totalDiyas(p) >= 15 },
  { id: 'diyas_45', name: 'A Thousand Lamps', desc: 'Earn 45 diyas', rubies: 20, check: (p) => totalDiyas(p) >= 45 },
  { id: 'perfect_year', name: 'Perfect Year', desc: '3 diyas on all 30 levels', rubies: 100, check: (p) => sum(p.diyas) >= 93 },
  { id: 'iron_will', name: 'Iron Will', desc: 'Beat any Iron challenge', rubies: 10, check: (p) => Object.keys(p.challenges).some((k) => k.endsWith(':iron')) },
  { id: 'challenger', name: 'Challenger', desc: 'Complete 5 map challenges', rubies: 15, check: (p) => Object.keys(p.challenges).length >= 5 },
  { id: 'all_challenges_r1', name: 'Master of the Pass', desc: 'Complete every Aravalli challenge', rubies: 30, check: (p) => r1Levels.every((l) => CHALLENGES[l].every((c) => p.challenges[challengeKey(l, c.id)])) },
  { id: 'untouchable', name: 'Untouchable', desc: 'Win a boss level losing no lives', rubies: 20, check: (p, s) => s && s.boss && s.won && s.livesLost === 0 },
  { id: 'flawless_5', name: 'Not a Scratch', desc: 'Win 5 levels without losing a life', rubies: 10, check: (p) => p.stats.flawless >= 5 },
  { id: 'kills_1000', name: 'Defender', desc: 'Defeat 1,000 enemies', rubies: 10, check: (p) => p.stats.kills >= 1000 },
  { id: 'kills_10000', name: 'Wall of the Kingdom', desc: 'Defeat 10,000 enemies', rubies: 30, check: (p) => p.stats.kills >= 10000 },
  { id: 'thunder_lord', name: 'Thunder Lord', desc: 'Build a Thunder Cannon', rubies: 5, check: (p, s) => s && s.tier3Types && s.tier3Types.includes('cannon') },
  { id: 'holy_order', name: 'Holy Order', desc: 'Train Holy Knights', rubies: 5, check: (p, s) => s && s.tier3Types && s.tier3Types.includes('barracks') },
  { id: 'royal_patron', name: 'Royal Patron', desc: 'Unlock a royal tower', rubies: 10, check: (p) => Object.keys(ROYAL_TOWERS).some((t) => p.owned[t]) },
  { id: 'spell_100', name: 'Spellbinder', desc: 'Cast 100 spells', rubies: 10, check: (p) => p.stats.spells >= 100 },
  { id: 'workshop_first', name: 'Apprentice', desc: 'Buy a Royal Workshop upgrade', rubies: 5, check: (p) => sum(p.workshop) >= 1 },
  { id: 'workshop_max', name: 'Master Builder', desc: 'Max every Royal Workshop track', rubies: 40, check: (p) => sum(p.workshop) >= 18 },
  { id: 'survivor', name: 'Survivor', desc: 'Reach wave 25 in Endless', rubies: 15, check: (p) => Math.max(0, ...Object.values(p.stats.endlessBest)) >= 25 },
  { id: 'endless_50', name: 'Tireless', desc: 'Reach wave 50 in Endless', rubies: 30, check: (p) => Math.max(0, ...Object.values(p.stats.endlessBest)) >= 50 },
  { id: 'seasons_legend', name: 'Legend of the Seasons', desc: 'Reach wave 100 in Endless', rubies: 60, check: (p) => Math.max(0, ...Object.values(p.stats.endlessBest)) >= 100 },
  { id: 'loyal_7', name: 'Loyal Subject', desc: 'Claim all 7 daily rewards', rubies: 10, check: (p) => p.daily.day >= 7 },
  { id: 'scholar', name: 'Scholar', desc: 'Meet 6 kinds of enemy', rubies: 5, check: (p) => Object.keys(p.seen).filter((k) => ENEMIES[k]).length >= 6 },
  { id: 'early_bird', name: 'Eager for Battle', desc: 'Call 10 waves early in one level', rubies: 5, check: (p, s) => s && s.earlyCalls >= 10 },
  { id: 'power_player', name: 'Prepared', desc: 'Use 3 power-ups in one level', rubies: 5, check: (p, s) => s && s.powerups >= 3 },
  { id: 'back_from_brink', name: 'Back from the Brink', desc: 'Win after being revived', rubies: 5, check: (p, s) => s && s.won && s.revived },
  { id: 'peacock', name: 'Peacock Whisperer', desc: 'Tap the peacock 10 times', rubies: 5, secret: true, check: (p) => p.stats.peacock >= 10 },
  { id: 'quests_all', name: 'Dutiful', desc: 'Finish all three daily quests', rubies: 5, check: (p) => p.quests.bonus },
  { id: 'hero_skill_20', name: 'Light of the Sun', desc: 'Use Sun Strike 20 times in one level', rubies: 10, check: (p, s) => s && s.heroSkills >= 20 },
  { id: 'veteran', name: 'Veteran', desc: 'Play 50 battles', rubies: 10, check: (p) => p.stats.played >= 50 },
];

export function checkAchievements(p, summary = null) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    let ok = false;
    try { ok = !!a.check(p, summary); } catch { ok = false; }
    if (ok) { p.achievements[a.id] = Date.now(); p.rubies += a.rubies; fresh.push(a); }
  }
  return fresh;
}

// ---------------------------------------------------------------- after every battle
export function recordBattle(p, summary, { challenge = null } = {}) {
  const out = { coins: 0, rubies: 0, first: false, newDiyas: 0, challenge: null, achievements: [] };
  p.stats.played++;
  const kills = sum(summary.kills);
  p.stats.kills += kills;
  p.stats.spells += summary.spells;
  refreshQuests(p);
  for (const q of p.quests.list) if (!q.claimed) q.progress = Math.min(q.n, q.progress + questGain(q, summary));
  if (summary.endless) {
    const lv = summary.level;
    p.stats.endlessBest[lv] = Math.max(p.stats.endlessBest[lv] || 0, summary.wave);
    p.stats.endlessScore[lv] = Math.max(p.stats.endlessScore[lv] || 0, summary.score);
    out.coins = Math.round(summary.wave * 12);
    p.coins += out.coins;
  } else if (summary.won) {
    const r = levelReward(p, summary);
    out.coins = r.coins; out.first = r.first;
    p.coins += r.coins;
    p.stats.wins++;
    if (summary.boss) p.stats.bossWins++;
    if (summary.livesLost === 0) p.stats.flawless++;
    if (challenge) {
      const key = challengeKey(summary.level, challenge.id);
      if (!p.challenges[key]) { p.challenges[key] = true; p.rubies += challenge.rubies; out.rubies += challenge.rubies; out.challenge = challenge; }
    } else {
      const before = p.diyas[summary.level] || 0;
      if (summary.diyas > before) { out.newDiyas = summary.diyas - before; p.diyas[summary.level] = summary.diyas; }
    }
  }
  const before = p.rubies;
  out.achievements = checkAchievements(p, summary);
  out.rubies += p.rubies - before;
  p.updated = Date.now();
  return out;
}

// Rewarded ad on the victory screen doubles the coins of that win.
export function doubleReward(p, coins) { p.coins += coins; return coins; }

// ---------------------------------------------------------------- Royal Workshop (diyas unlock ranks, coins pay for them)
export const WORKSHOP = [
  { id: 'archer', name: 'Archer Training', desc: '+8% Archer damage per rank' },
  { id: 'barracks', name: 'Barracks Drill', desc: '+12% soldier health per rank' },
  { id: 'mage', name: 'Arcane Study', desc: '+8% Mage damage per rank' },
  { id: 'cannon', name: 'Gunpowder', desc: '+8% Cannon damage per rank' },
  { id: 'spells', name: 'Sacred Scrolls', desc: '-8% spell cooldown per rank' },
  { id: 'hero', name: 'Royal Armoury', desc: '+10% hero health and damage per rank' },
];
export const WORKSHOP_RANKS = [{ diyas: 3, coins: 150 }, { diyas: 9, coins: 400 }, { diyas: 15, coins: 900 }];
const PER_RANK = { archer: 0.08, barracks: 0.12, mage: 0.08, cannon: 0.08, spells: 0.08, hero: 0.1 };

export function workshopNext(p, id) {
  const rank = p.workshop[id] || 0;
  if (rank >= WORKSHOP_RANKS.length) return null;
  const r = WORKSHOP_RANKS[rank];
  return { rank, ...r, locked: totalDiyas(p) < r.diyas, affordable: p.coins >= r.coins };
}
export function buyWorkshop(p, id) {
  const n = workshopNext(p, id);
  if (!n || n.locked || !n.affordable) return false;
  p.coins -= n.coins;
  p.workshop[id] = n.rank + 1;
  return true;
}
export function resetWorkshop(p) {
  let refund = 0;
  for (const [id, rank] of Object.entries(p.workshop)) for (let i = 0; i < rank; i++) refund += WORKSHOP_RANKS[i].coins;
  p.workshop = {};
  p.coins += refund;
  return refund;
}
export function workshopBonus(p) {
  const b = {};
  for (const [id, per] of Object.entries(PER_RANK)) b[id] = (p.workshop[id] || 0) * per;
  return b;
}

// ---------------------------------------------------------------- spending rubies and coins
export function buyRoyalTower(p, id) {
  const t = ROYAL_TOWERS[id];
  if (!t || p.owned[id] || p.rubies < t.rubies) return false;
  p.rubies -= t.rubies;
  p.owned[id] = true;
  checkAchievements(p);
  return true;
}
export function buyPowerup(p, id, currency) {
  const d = POWERUPS[id];
  if (!d || !['coins', 'rubies'].includes(currency) || p[currency] < d[currency]) return false;
  p[currency] -= d[currency];
  p.powerups[id] = (p.powerups[id] || 0) + 1;
  return true;
}
export const ownedRoyal = (p) => Object.keys(ROYAL_TOWERS).filter((t) => p.owned[t]);

// After a battle the used power-ups are taken from the stock.
export function spendPowerup(p, id) { if (p.powerups[id] > 0) p.powerups[id]--; }

// ---------------------------------------------------------------- real-money products (Google Play Billing)
// Prices are set per country in Play Console; these are the reference prices from the design doc.
export const PRODUCTS = [
  { id: 'starter_pack', type: 'once', name: 'Starter Pack', grant: { rubies: 150, powerups: { freeze: 1, gold: 1, lives: 1 }, coins: 500 }, inr: 49, usd: 1.99, tag: 'Best value' },
  { id: 'rubies_80', type: 'consumable', name: 'Ruby Handful', grant: { rubies: 80 }, inr: 29, usd: 0.99 },
  { id: 'rubies_330', type: 'consumable', name: 'Ruby Pouch', grant: { rubies: 330 }, inr: 99, usd: 2.99, bonus: 30 },
  { id: 'rubies_800', type: 'consumable', name: 'Ruby Chest', grant: { rubies: 800 }, inr: 199, usd: 5.99, bonus: 100, tag: 'Popular' },
  { id: 'rubies_1900', type: 'consumable', name: 'Ruby Vault', grant: { rubies: 1900 }, inr: 449, usd: 11.99, bonus: 300 },
  { id: 'rubies_5000', type: 'consumable', name: 'Ruby Treasury', grant: { rubies: 5000 }, inr: 999, usd: 24.99, bonus: 1000 },
  { id: 'remove_ads', type: 'once', name: 'Remove Ads', grant: { removeAds: true }, inr: 99, usd: 2.99 },
];
export const product = (id) => PRODUCTS.find((x) => x.id === id);

// Called once per verified purchase token, so a purchase is never granted twice.
export function grantProduct(p, id, token = id) {
  const pr = product(id);
  if (!pr) return false;
  p.purchases = p.purchases || {};
  p.purchaseTokens = p.purchaseTokens || {};
  if (p.purchaseTokens[token]) return false;
  if (pr.type === 'once' && p.purchases[id]) { p.purchaseTokens[token] = true; return false; }
  p.purchaseTokens[token] = true;
  p.purchases[id] = (p.purchases[id] || 0) + 1;
  if (pr.grant.removeAds) p.removeAds = true;
  give(p, pr.grant);
  p.updated = Date.now();
  return true;
}
// Restoring non-consumables after a reinstall (Remove Ads, Starter Pack flag).
export function restoreOwned(p, ids) {
  let n = 0;
  for (const id of ids) {
    const pr = product(id);
    if (!pr || pr.type !== 'once') continue;
    if (p.purchases[id] && (id !== 'remove_ads' || p.removeAds)) continue;
    p.purchases[id] = 1;
    if (id === 'remove_ads') p.removeAds = true; else give(p, pr.grant);
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- ads policy (from the design doc)
export const INTERSTITIAL_GAP = 180000;
export const REWARDED_PER_DAY = 12;
export function shouldShowInterstitial(p, { now = Date.now(), level = 0, lost = false } = {}) {
  if (p.removeAds || lost || level < 4) return false;
  return now - (p.ads.lastInterstitial || 0) >= INTERSTITIAL_GAP;
}
export function noteInterstitial(p, now = Date.now()) { p.ads.lastInterstitial = now; }
export function rewardedLeft(p, now = Date.now()) {
  const key = dayKey(now);
  if (p.ads.rewardKey !== key) return REWARDED_PER_DAY;
  return Math.max(0, REWARDED_PER_DAY - p.ads.rewardCount);
}
export function noteRewarded(p, now = Date.now()) {
  const key = dayKey(now);
  if (p.ads.rewardKey !== key) { p.ads.rewardKey = key; p.ads.rewardCount = 0; }
  p.ads.rewardCount++;
  p.stats.adsWatched++;
}
// The free ruby chest in the shop: one rewarded ad, 5 rubies, three times a day.
export const AD_CHEST_RUBIES = 5;
export function adChestLeft(p, now = Date.now()) {
  const key = dayKey(now);
  return p.ads.chestKey === key ? Math.max(0, 3 - (p.ads.chestCount || 0)) : 3;
}
export function claimAdChest(p, now = Date.now()) {
  if (adChestLeft(p, now) <= 0) return 0;
  const key = dayKey(now);
  if (p.ads.chestKey !== key) { p.ads.chestKey = key; p.ads.chestCount = 0; }
  p.ads.chestCount++;
  p.rubies += AD_CHEST_RUBIES;
  return AD_CHEST_RUBIES;
}

// ---------------------------------------------------------------- cloud save: keep the furthest progress
const progressScore = (p) => totalDiyas(p) * 1000 + Object.keys(p.challenges || {}).length * 50 + (p.stats?.played || 0);
export function mergeProfiles(local, cloud) {
  if (!cloud) return local;
  if (!local) return migrate(cloud);
  const a = migrate(local), b = migrate(cloud);
  const sa = progressScore(a), sb = progressScore(b);
  const base = sb > sa || (sb === sa && (b.updated || 0) > (a.updated || 0)) ? b : a;
  const other = base === a ? b : a;
  const out = migrate(JSON.parse(JSON.stringify(base)));
  for (const [k, v] of Object.entries(other.diyas)) out.diyas[k] = Math.max(out.diyas[k] || 0, v);
  for (const key of ['seen', 'challenges', 'owned', 'achievements', 'purchaseTokens']) out[key] = { ...(other[key] || {}), ...(out[key] || {}) };
  for (const [k, v] of Object.entries(other.purchases || {})) out.purchases[k] = Math.max(out.purchases[k] || 0, v);
  for (const [k, v] of Object.entries(other.workshop || {})) out.workshop[k] = Math.max(out.workshop[k] || 0, v);
  out.removeAds = a.removeAds || b.removeAds;
  out.settings = { ...a.settings }; // settings stay per device
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}

export const LEVEL_IDS = LEVELS.map((l) => l.id);
