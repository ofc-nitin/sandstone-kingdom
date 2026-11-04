// Stats for every enemy and tower. Speeds are world units per second, damage is per hit,
// rates are seconds between attacks. Armor and magic resistance reduce damage (0..1).

export const ENEMIES = {
  bandit: { rank: 1, name: 'Bandit', hp: 32, speed: 24, armor: 0, mres: 0, gold: 6, lives: 1, dmg: 2, atk: 1.0, art: 'bandit',
    tip: 'Fast on foot and comes in groups. Archers handle them well.' },
  wolfRider: { rank: 2, name: 'Wolf Rider', hp: 42, speed: 44, armor: 0, mres: 0, gold: 9, lives: 1, dmg: 3, atk: 0.9, art: 'wolfRider',
    tip: 'Very fast. Block the road with Barracks soldiers so towers can catch them.' },
  barbarian: { rank: 4, name: 'Barbarian', hp: 140, speed: 17, armor: 0.15, mres: 0, gold: 15, lives: 2, dmg: 7, atk: 1.2, art: 'barbarian',
    tip: 'Tough and hits soldiers hard. Mages and Cannons wear him down.' },
  banditArcher: { rank: 3, name: 'Bandit Archer', hp: 48, speed: 21, armor: 0, mres: 0, gold: 10, lives: 1, dmg: 4, atk: 1.4, art: 'banditArcher', ranged: { range: 64, dmg: 5, rate: 1.5 },
    tip: 'Shoots your soldiers from range. Kill it before it reaches them.' },
  brute: { rank: 6, name: 'Armored Brute', hp: 280, speed: 13, armor: 0.5, mres: 0, gold: 24, lives: 2, dmg: 10, atk: 1.4, art: 'brute',
    tip: 'Heavy armour shrugs off arrows. Magic goes straight through it.' },
  // support enemies: they make the others harder to stop
  drummer: { rank: 3, name: 'War Drummer', hp: 70, speed: 18, armor: 0.1, mres: 0, gold: 14, lives: 1, dmg: 3, atk: 1.2, art: 'drummer',
    aura: { range: 62, speed: 0.3, dmg: 0.3 },
    tip: 'His war drum makes every enemy around him faster and fiercer. Take him out first.' },
  shieldBearer: { rank: 5, name: 'Shield Bearer', hp: 150, speed: 15, armor: 0.3, mres: 0, gold: 18, lives: 2, dmg: 5, atk: 1.3, art: 'shieldBearer',
    shield: { every: 6, range: 72, amount: 45, count: 3 },
    tip: 'Raises magic shields on his strongest comrades first. Shields soak up damage until they break.' },
  saboteur: { rank: 2, name: 'Saboteur', hp: 46, speed: 36, armor: 0, mres: 0.2, gold: 12, lives: 1, dmg: 2, atk: 1, art: 'saboteur',
    sabotage: { range: 64, time: 2.5 }, dodge: 0.5,
    tip: 'Sneaks past soldiers and throws smoke bombs that jam towers for a few seconds.' },
  banditKing: { rank: 10, name: 'The Bandit King', hp: 2600, speed: 11, armor: 0.3, mres: 0.1, gold: 250, lives: 10, dmg: 18, atk: 1.6, art: 'banditKing', boss: true,
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
// Royal towers: bought once with rubies (or earned by mastering a region), then
// available in every level. Side-grades with new tactics, never must-haves.
// Special (royal) towers: unlocked once with rubies or a big pile of coins, then up to 3 are
// taken into each battle. They stand only on special spots and upgrade through 8 levels.
const LV = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const eight = (name, base, step, f) => Array.from({ length: 8 }, (_, i) => tier(Math.round(base + step * i + 6 * i * i), { label: `${name} ${LV[i]}`, ...f(i) }));
TOWERS.falconer = {
  name: 'Royal Falconer', kind: 'falcon', air: true, art: 'falconer', royal: true,
  tiers: eight('Falconer', 120, 40, (i) => ({ range: 94 + i * 4, dmg: [6 + i * 2.6, 9 + i * 3.4], rate: 0.6 - i * 0.025, mark: { mul: 1.2 + i * 0.03, t: 3 + i * 0.3 } })),
  tip: 'Falcons strike fast and mark their prey: marked enemies take extra damage from everything.',
};
TOWERS.fountain = {
  name: 'Stepwell Fountain', kind: 'aura', air: false, art: 'fountain', royal: true,
  tiers: eight('Stepwell', 110, 35, (i) => ({ range: 56 + i * 3, slow: 0.3 + i * 0.04, heal: 4 + i * 2, rate: 0.25 })),
  tip: 'Holy water slows every enemy nearby and heals your soldiers standing in it.',
};
TOWERS.alchemist = {
  name: "Alchemist's Workshop", kind: 'flask', air: false, art: 'alchemist', royal: true,
  tiers: eight('Alchemist', 130, 45, (i) => ({ range: 80 + i * 3, dmg: [8 + i * 3, 12 + i * 4], rate: 2.2 - i * 0.08, splash: 26 + i * 1.5, shred: 0.25 + i * 0.03, poison: 4 + i * 2, poisonTime: 3 })),
  tip: 'Throws bubbling flasks: a poison cloud that eats away enemy armour and keeps hurting.',
};
TOWERS.elephant = {
  name: 'War Elephant Stable', kind: 'elephant', air: false, art: 'elephantStable', royal: true,
  tiers: eight('War Elephant', 150, 50, (i) => ({ range: 90 + i * 6, dmg: 22 + i * 9, rate: 7.5 - i * 0.35, knock: 10 + i, stun: 0.5 + i * 0.05 })),
  tip: 'A war elephant charges down the road, trampling everything in its way and knocking enemies back.',
};
// how each special tower is unlocked: rubies, or a big pile of coins for players who never pay
export const ROYAL_TOWERS = {
  falconer: { rubies: 400, coins: 6000 },
  fountain: { rubies: 500, coins: 7500 },
  alchemist: { rubies: 650, coins: 9500 },
  elephant: { rubies: 800, coins: 12000 },
};
export const SPECIAL_LOADOUT = 3; // special towers the player can take into one battle
export const TOWER_ORDER = ['archer', 'barracks', 'mage', 'cannon'];
export const SELL_REFUND = 0.6;

// The hero fights on the road like a strong soldier; the player can move him anywhere
// along the road, and his skill hits everything around him.
// Heroes join from Level 2. Melee heroes hold the road; ranged heroes shoot from where they stand.
// unlock: 'story' (free when the story reaches them), coins/rubies in the Bazaar, or 'iap' only.
export const HEROES = {
  sunKnight: {
    name: 'The Sun Knight', title: 'Defender of Suryagarh', art: 'sunKnight', hp: 300, dmg: [11, 17], rate: 0.85, armor: 0.3, speed: 62, respawn: 14, regen: 5, leash: 62,
    skill: { type: 'strike', name: 'Sun Strike', cooldown: 18, radius: 48, dmg: 70, stun: 1.4 },
    unlock: { story: 1 }, bio: 'The fort\'s champion. Tough, holds the road, and his Sun Strike stuns everyone around him.',
  },
  archerQueen: {
    name: 'Rani Meera', title: 'Archer Queen of the Hills', art: 'archerQueen', hp: 210, dmg: [10, 15], rate: 0.7, armor: 0.1, speed: 70, respawn: 12, regen: 6, leash: 0,
    ranged: { range: 92, kind: 'arrow' },
    skill: { type: 'volley', name: 'Hail of Arrows', cooldown: 16, radius: 80, dmg: 48, targets: 7, slow: 0.4, slowTime: 3 },
    unlock: { coins: 3500, rubies: 300 }, bio: 'Shoots from range and never blocks the road. Hail of Arrows hits up to 7 enemies and slows them.',
  },
  sage: {
    name: 'Guru Agastya', title: 'Sage of the Stepwell', art: 'sage', hp: 230, dmg: [12, 18], rate: 1.1, armor: 0.05, speed: 56, respawn: 13, regen: 8, leash: 0,
    ranged: { range: 78, kind: 'magic' },
    skill: { type: 'bless', name: 'Blessing of Waters', cooldown: 20, radius: 74, dmg: 55, heal: 1 },
    unlock: { rubies: 450 }, bio: 'Magic goes through armour. His Blessing fully heals your soldiers nearby and burns the enemies around him.',
  },
  vikram: {
    name: 'Maharaja Vikram', title: 'The Iron King', art: 'vikram', hp: 480, dmg: [16, 24], rate: 0.95, armor: 0.45, speed: 58, respawn: 12, regen: 7, leash: 70,
    skill: { type: 'warcry', name: 'Royal War Cry', cooldown: 20, radius: 64, dmg: 40, stun: 2.2, shield: 80 },
    unlock: { iap: 'hero_vikram' }, bio: 'The heaviest hero. His War Cry stuns every enemy nearby and puts a shield on your soldiers.',
  },
};
export const HERO_ORDER = ['sunKnight', 'archerQueen', 'sage', 'vikram'];

// Spells: tap the button, then tap the battlefield.
export const SPELLS = {
  arrowRain: { name: 'Arrow Rain', cooldown: 32, radius: 40, ticks: 4, interval: 0.3, dmg: 10, kind: 'physical' },
  reinforcements: { name: 'Reinforcements', cooldown: 24, count: 2, life: 18, stats: { hp: 80, dmg: [3, 5], rate: 1, armor: 0.1, art: 'spearman' } },
  holyFire: { name: 'Holy Fire', cooldown: 42, radius: 46, dmg: 30, burn: 10, burnTime: 4, stun: 1 },
};
// Power-ups: bought with coins or rubies, one of each per level.
export const POWERUPS = {
  freeze: { name: 'Freeze Bomb', desc: 'Freezes every enemy for 5 seconds', time: 5, coins: 150, rubies: 10 },
  gold: { name: 'Gold Boost', desc: '+120 battle gold right now', amount: 120, coins: 120, rubies: 8 },
  lives: { name: 'Extra Lives', desc: '+5 lives for the fort', amount: 5, coins: 180, rubies: 12 },
};
export const POWERUP_ORDER = ['freeze', 'gold', 'lives'];
export const SPELL_ORDER = ['arrowRain', 'reinforcements', 'holyFire'];
