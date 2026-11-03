// Stats for every enemy and tower. Speeds are world units per second, damage is per hit,
// rates are seconds between attacks. Armor and magic resistance reduce damage (0..1).

export const ENEMIES = {
  bandit: { name: 'Bandit', hp: 32, speed: 24, armor: 0, mres: 0, gold: 6, lives: 1, dmg: 2, atk: 1.0, art: 'bandit',
    tip: 'Fast on foot and comes in groups. Archers handle them well.' },
  wolfRider: { name: 'Wolf Rider', hp: 42, speed: 44, armor: 0, mres: 0, gold: 9, lives: 1, dmg: 3, atk: 0.9, art: 'wolfRider',
    tip: 'Very fast. Block the road with Barracks soldiers so towers can catch them.' },
  barbarian: { name: 'Barbarian', hp: 140, speed: 17, armor: 0.15, mres: 0, gold: 15, lives: 2, dmg: 7, atk: 1.2, art: 'barbarian',
    tip: 'Tough and hits soldiers hard. Mages and Cannons wear him down.' },
  banditArcher: { name: 'Bandit Archer', hp: 48, speed: 21, armor: 0, mres: 0, gold: 10, lives: 1, dmg: 4, atk: 1.4, art: 'banditArcher',
    tip: 'Shoots your soldiers from range. Kill it before it reaches them.' },
  brute: { name: 'Armored Brute', hp: 280, speed: 13, armor: 0.5, mres: 0, gold: 24, lives: 2, dmg: 10, atk: 1.4, art: 'brute',
    tip: 'Heavy armour shrugs off arrows. Magic goes straight through it.' },
  banditKing: { name: 'The Bandit King', hp: 2600, speed: 11, armor: 0.3, mres: 0.1, gold: 250, lives: 10, dmg: 18, atk: 1.6, art: 'banditKing', boss: true,
    summon: { every: 9, type: 'bandit', count: 2 },
    tip: 'Rides a war boar and keeps calling bandits. Focus everything on him.' },
};

const tier = (cost, extra) => ({ cost, ...extra });
export const TOWERS = {
  archer: {
    name: 'Archer Tower', kind: 'arrow', air: true, art: 'archerTower',
    tiers: [
      tier(70, { label: 'Archers', range: 78, dmg: [4, 7], rate: 0.75 }),
      tier(110, { label: 'Marksmen', range: 86, dmg: [7, 11], rate: 0.65 }),
      tier(160, { label: 'Royal Longbows', range: 94, dmg: [11, 17], rate: 0.55 }),
    ],
  },
  barracks: {
    name: 'Barracks', kind: 'soldiers', air: false, art: 'barracks',
    tiers: [
      tier(70, { label: 'Spearmen', soldiers: 3, hp: 50, dmg: [2, 4], rate: 1.0, armor: 0, respawn: 9, art: 'spearman' }),
      tier(110, { label: 'Knights', soldiers: 3, hp: 90, dmg: [4, 6], rate: 1.0, armor: 0.2, respawn: 9, art: 'knight' }),
      tier(150, { label: 'Holy Knights', soldiers: 3, hp: 150, dmg: [6, 10], rate: 0.9, armor: 0.35, respawn: 8, art: 'holyKnight' }),
    ],
  },
  mage: {
    name: 'Mage Tower', kind: 'magic', air: true, art: 'mageTower',
    tiers: [
      tier(100, { label: 'Magic Caster', range: 66, dmg: [10, 18], rate: 1.5 }),
      tier(160, { label: 'Arcane Sage', range: 72, dmg: [20, 32], rate: 1.4 }),
      tier(240, { label: 'Sun Mage', range: 78, dmg: [34, 52], rate: 1.3 }),
    ],
  },
  cannon: {
    name: 'Cannon Tower', kind: 'shell', air: false, art: 'cannonTower',
    tiers: [
      tier(125, { label: 'Cannon', range: 82, dmg: [9, 16], rate: 2.8, splash: 26 }),
      tier(190, { label: 'Bombard', range: 88, dmg: [18, 30], rate: 2.6, splash: 30 }),
      tier(280, { label: 'Thunder Cannon', range: 94, dmg: [30, 48], rate: 2.4, splash: 34 }),
    ],
  },
};
export const TOWER_ORDER = ['archer', 'barracks', 'mage', 'cannon'];
export const SELL_REFUND = 0.6;
