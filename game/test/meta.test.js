import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/meta/profile.js';
import { Game } from '../src/engine/game.js';
import { LEVELS } from '../src/engine/levels.js';
import { playLevel } from './bot.js';

const D = (s) => Date.parse(s + 'T12:00:00Z');
const summary = (o = {}) => ({ level: 1, won: true, diyas: 3, livesLost: 0, kills: { bandit: 30 }, built: { archer: 4 }, towerTypes: ['archer'], spells: 2, earlyCalls: 1, tier3: 0, tier3Types: [], heroSkills: 1, powerups: 0, wave: 6, score: 0, endless: false, boss: false, revived: false, ...o });

test('old saves migrate without losing progress', () => {
  const p = M.migrate({ diyas: { 1: 3, 2: 1 }, seen: { bandit: true } });
  assert.equal(p.v, M.SAVE_VERSION);
  assert.equal(M.totalDiyas(p), 4);
  assert.ok(p.settings && p.quests && p.stats);
});

test('daily login: 7-day calendar, streak resets after a missed day, clock moved back gives nothing', () => {
  const p = M.newProfile();
  const c1 = M.claimDaily(p, D('2026-11-01'), { tz: 0 });
  assert.equal(c1.day, 0);
  assert.equal(M.claimDaily(p, D('2026-11-01')), null, 'once a day');
  assert.equal(M.claimDaily(p, D('2026-11-02')).day, 1);
  assert.equal(M.claimDaily(p, D('2026-11-04')).day, 0, 'missed a day: back to day 1');
  assert.equal(M.dailyStatus(p, D('2026-11-01')).canClaim, false);
  const q = M.newProfile();
  for (let i = 0; i < 7; i++) M.claimDaily(q, D('2026-11-01') + i * 86400000);
  assert.ok(q.rubies > 30 && q.coins > 0 && q.powerups.lives >= 2, 'day 7 chest pays out');
});

test('signed-in players get 20% more from the daily reward', () => {
  const a = M.newProfile(), b = M.newProfile();
  M.claimDaily(a, D('2026-11-01'));
  M.claimDaily(b, D('2026-11-01'), { signedIn: true });
  assert.equal(b.coins, Math.round(a.coins * 1.2));
});

test('daily quests pay rubies only and complete from battle summaries', () => {
  const p = M.newProfile();
  p.quests = { key: M.dayKey(), bonus: false, list: [
    { id: 'a', kind: 'kill', enemy: 'bandit', n: 50, rubies: 5, progress: 0, claimed: false },
    { id: 'b', kind: 'only', tower: 'archer', n: 1, rubies: 10, progress: 0, claimed: false },
    { id: 'c', kind: 'win', n: 2, rubies: 6, progress: 0, claimed: false },
  ] };
  M.recordBattle(p, summary());
  M.recordBattle(p, summary());
  const coins = p.coins, rubies = p.rubies;
  for (const id of ['a', 'b', 'c']) assert.ok(M.claimQuest(p, id) > 0);
  assert.equal(p.coins, coins, 'no coins from quests');
  assert.equal(p.rubies, rubies + 21);
  assert.equal(M.claimQuestBonus(p), M.QUEST_BONUS);
  assert.equal(M.claimQuestBonus(p), 0);
});

test('a new day brings three new quests', () => {
  const p = M.newProfile();
  M.refreshQuests(p, D('2026-11-01'));
  const first = p.quests.list.map((q) => q.text).join();
  assert.equal(p.quests.list.length, 3);
  M.refreshQuests(p, D('2026-11-01'));
  assert.equal(p.quests.list.map((q) => q.text).join(), first);
  M.refreshQuests(p, D('2026-11-05'));
  assert.equal(p.quests.list.length, 3);
});

test('wins pay coins and diyas; map challenges pay rubies only, once', () => {
  const p = M.newProfile();
  const r = M.recordBattle(p, summary());
  assert.ok(r.coins > 0);
  assert.equal(p.diyas[1], 3);
  const ch = M.CHALLENGES[1][0];
  const coins = p.coins;
  const c = M.recordBattle(p, summary(), { challenge: ch });
  assert.equal(c.challenge, ch);
  assert.ok(p.challenges[M.challengeKey(1, ch.id)]);
  assert.ok(p.coins - coins < r.coins, 'challenge replays pay only the small replay coins');
  const again = M.recordBattle(p, summary(), { challenge: ch });
  assert.equal(again.challenge, null);
});

test('achievements unlock once and pay rubies', () => {
  const p = M.newProfile();
  M.recordBattle(p, summary());
  assert.ok(p.achievements.first_win);
  const n = Object.keys(p.achievements).length;
  M.recordBattle(p, summary());
  assert.equal(Object.keys(p.achievements).length >= n, true);
  assert.equal(M.ACHIEVEMENTS.length, 32);
});

test('royal towers cost rubies and are owned forever', () => {
  const p = M.newProfile();
  assert.equal(M.buyRoyalTower(p, 'falconer'), false);
  p.rubies = 1000;
  assert.equal(M.buyRoyalTower(p, 'falconer'), true);
  assert.equal(p.rubies, 600 + 10, 'Royal Patron achievement pays 10');
  assert.deepEqual(M.ownedRoyal(p), ['falconer']);
  assert.equal(M.buyRoyalTower(p, 'falconer'), false);
});

test('purchases are granted once per token; Remove Ads restores', () => {
  const p = M.newProfile();
  assert.equal(M.grantProduct(p, 'rubies_80', 'tok1'), true);
  assert.equal(M.grantProduct(p, 'rubies_80', 'tok1'), false);
  assert.equal(p.rubies, 110);
  M.grantProduct(p, 'remove_ads', 'tok2');
  assert.equal(p.removeAds, true);
  const q = M.newProfile();
  assert.equal(M.restoreOwned(q, ['remove_ads']), 1);
  assert.equal(q.removeAds, true);
});

test('interstitials: never before level 4, never after a loss, at most every 3 minutes, never with Remove Ads', () => {
  const p = M.newProfile();
  assert.equal(M.shouldShowInterstitial(p, { level: 3, now: 1e9 }), false);
  assert.equal(M.shouldShowInterstitial(p, { level: 4, now: 1e9, lost: true }), false);
  assert.equal(M.shouldShowInterstitial(p, { level: 4, now: 1e9 }), true);
  M.noteInterstitial(p, 1e9);
  assert.equal(M.shouldShowInterstitial(p, { level: 5, now: 1e9 + 60000 }), false);
  assert.equal(M.shouldShowInterstitial(p, { level: 5, now: 1e9 + 200000 }), true);
  p.removeAds = true;
  assert.equal(M.shouldShowInterstitial(p, { level: 5, now: 2e9 }), false);
});

test('Royal Forge: ranks cost coins, need diyas, take real time, one at a time', () => {
  const p = M.newProfile();
  p.coins = 10000;
  const t0 = 1e12;
  assert.equal(M.forgeStart(p, 'archer', t0), true);
  assert.equal(p.coins, 9800);
  assert.equal(M.forgeStart(p, 'mage', t0), false, 'one job at a time');
  assert.equal(M.forgeTick(p, t0 + 60000), null, 'not ready yet');
  assert.equal(M.forgeTick(p, t0 + 3 * 60000).id, 'archer');
  assert.equal(p.workshop.archer, 1);
  assert.equal(M.forgeStart(p, 'archer', t0), false, 'rank 2 needs 4 diyas');
  p.diyas = { 1: 3, 2: 1 };
  assert.equal(M.forgeStart(p, 'archer', t0), true);
  const cost = M.forgeRushCost(p, t0);
  assert.equal(cost, 5, '20 minutes left: 5 rubies');
  const rubies = p.rubies;
  assert.equal(M.forgeRush(p, t0).rank, 2);
  assert.equal(p.rubies, rubies - 5);
  assert.ok(Math.abs(M.workshopBonus(p).archer - 0.14) < 1e-9);
});

test('a rewarded ad takes 15 minutes off a forge job', () => {
  const p = M.newProfile(); p.coins = 1000; p.diyas = { 1: 3, 2: 1 }; p.workshop = { mage: 1 };
  M.forgeStart(p, 'mage', 0);
  M.forgeAdCut(p, 0);
  assert.equal(M.forgeLeft(p, 0), 5 * 60000);
});

test('special towers unlock with rubies or a big pile of coins', () => {
  const p = M.newProfile();
  p.coins = 6000;
  assert.equal(M.buyRoyalTower(p, 'falconer', 'coins'), true);
  assert.equal(p.coins, 0);
  assert.equal(M.buyRoyalTower(p, 'fountain', 'coins'), false);
});

test('workshop bonus makes towers stronger in battle', () => {
  const lvl = LEVELS[1];
  const a = new Game(lvl, { seed: 2 }), b = new Game(lvl, { seed: 2, bonus: { archer: 0.5 } });
  for (const g of [a, b]) { g.gold = 999; g.build(0, 'archer'); g.callWave(); for (let i = 0; i < 60 * 12; i++) g.update(1 / 60); }
  const killsA = a.stats.kills.bandit || 0, killsB = b.stats.kills.bandit || 0;
  assert.ok(killsB >= killsA);
});

test('cloud merge keeps the furthest progress from both phones', () => {
  const phone = M.newProfile(1), cloud = M.newProfile(2);
  phone.diyas = { 1: 3, 2: 2 }; phone.rubies = 99; phone.removeAds = true;
  cloud.diyas = { 1: 2, 2: 3, 3: 3 }; cloud.rubies = 40; cloud.challenges = { '1:iron': true };
  const m = M.mergeProfiles(phone, cloud);
  assert.deepEqual(m.diyas, { 1: 3, 2: 3, 3: 3 });
  assert.equal(m.rubies, 40, 'currencies come from the save with more progress');
  assert.equal(m.removeAds, true);
  assert.ok(m.challenges['1:iron']);
});

test('every map challenge can be won by the test bot', () => {
  for (const [lvl, list] of Object.entries(M.CHALLENGES)) {
    for (const ch of list) {
      let wins = 0;
      for (let seed = 1; seed <= 6; seed++) {
        const g = new Game(LEVELS[lvl], { seed, rules: ch.rules, specials: ['falconer', 'alchemist', 'elephant'], bonus: Number(lvl) >= 4 ? { archer: 0.25, barracks: 0.25, mage: 0.25, cannon: 0.25, royal: 0.25, hero: 0.25, spells: 0.1 } : {} });
        if (playLevel(g, { useAbilities: true }) === 'won') wins++;
      }
      assert.ok(wins >= 1, `level ${lvl} challenge ${ch.id} won ${wins}/6`);
    }
  }
});
