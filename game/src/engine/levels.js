// Level definitions. World size is 844 x 390; roads may start/end off-screen.
// plots: build spots. Three kinds: standard; locked { type: 'gold', cost } (pay battle gold to
// clear the rubble); and special (royal: true), which host only special towers and open one by
// one: lock { type: 'special', wave, cost } opens by itself at that wave or earlier for gold.
// paths: one per entrance. Roads may cross or merge. portals: [{ from, to }] as fractions of the
// road: enemies step into a portal and come out further down.
// waves: list of groups { type, count, every (s between spawns), delay (s), lane }.

const W = (groups) => groups;
const g = (type, count, every = 1.2, delay = 0, lane = 0) => ({ type, count, every, delay, lane });

export const LEVELS = [
  {
    id: 0, name: 'Training Grounds', story: 'New recruit? No stress. The Royal Sage will show you the basics: build towers, stop the bandits, keep the fort safe. Easy W.', region: 'aravalli', gold: 170, lives: 15, hpScale: 0.8, hero: false, spells: [],
    paths: [{ start: [-30, 110], curves: [[120, 110, 170, 50, 260, 80], [350, 110, 290, 310, 420, 310], [540, 310, 520, 150, 640, 160], [720, 166, 760, 240, 800, 250]] }],
    gate: { x: 806, y: 282, s: 0.82 },
    plots: [
      { x: 78, y: 60 },
      { x: 234, y: 114 },
      { x: 270, y: 156 },
      { x: 414, y: 252, lock: { type: 'gold', cost: 40 } },
      { x: 594, y: 210 },
      { x: 714, y: 234 },
    ],
    waves: [W([g('bandit', 4, 1.6)]), W([g('bandit', 6, 1.3)]), W([g('bandit', 8, 1.0)])],
    tutorial: [
      { id: 'build', text: 'Tap a build spot and choose the Archer Tower.', point: 0, until: 'built' },
      { id: 'start', text: 'Ready! Tap the swords to call the first wave of bandits.', until: 'waveStart' },
      { id: 'upgrade', text: 'Tap your tower and upgrade it to Marksmen.', until: 'upgraded' },
      { id: 'clear', text: 'Rubble blocks the spot by the fort. Tap it and pay gold to clear it.', point: 3, until: 'plotOpened' },
      { id: 'barracks', text: 'Build Barracks there: soldiers block the road.', point: 3, until: 'built' },
      { id: 'early', text: 'Call waves early with the swords to earn bonus gold.', until: 'won' },
    ],
    scenery: [
      ['banyan', 90, 300, 1], ['banyan', 520, 60, 1.1], ['palm', 40, 200, 1], ['rock', 230, 210, 1], ['marigold', 360, 220],
      ['marigold', 160, 260], ['haystack', 600, 360], ['pots', 690, 330], ['shrine', 420, 40], ['fence', 120, 350, 260, 356], ['tuftField'],
    ],
  },
  {
    id: 1, name: 'Village at the Pass', story: 'Bandits just raided the village market and ran off with the festival lamps. The whole village is counting on you. Time to lock in.', region: 'aravalli', gold: 230, lives: 20, hpScale: 1, spells: ['arrowRain'],
    paths: [{ start: [-20, 70], curves: [[150, 70, 210, 140, 200, 230], [190, 330, 360, 350, 420, 280], [470, 220, 380, 140, 470, 110], [580, 70, 640, 260, 800, 270]] }],
    gate: { x: 806, y: 302, s: 0.88 },
    plots: [
      { x: 72, y: 120 },
      { x: 126, y: 138 },
      { x: 258, y: 246 },
      { x: 366, y: 258 },
      { x: 396, y: 204, lock: { type: 'gold', cost: 40 } },
      { x: 486, y: 174 },
      { x: 648, y: 150, lock: { type: 'gold', cost: 55 } },
      { x: 738, y: 210 },
    ],
    waves: [
      W([g('bandit', 6, 1.4)]), W([g('bandit', 9, 1.1)]), W([g('wolfRider', 3, 2.2)]),
      W([g('bandit', 10, 0.8), g('wolfRider', 3, 1.8, 8)]), W([g('wolfRider', 6, 1.3), g('bandit', 8, 0.8, 4)]), W([g('bandit', 16, 0.6), g('wolfRider', 6, 1.1, 6)]),
    ],
    scenery: [
      ['banyan', 300, 210, 1.2], ['banyan', 560, 30, 0.9], ['palm', 395, 30, 0.9], ['rock', 40, 160, 1.1], ['fence', 30, 300, 120, 296],
      ['palm', 720, 60, 0.9], ['banyan', 812, 160, 0.9], ['marigold', 330, 260], ['marigold', 610, 160], ['pond', 600, 350],
      ['peacock', 100, 340, 1.1], ['tent', 36, 22, 0.8], ['campfire', 80, 30], ['cart', 700, 360], ['stepwell', 300, 40], ['shrine', 520, 200], ['tuftField'],
    ],
  },
  {
    id: 2, name: 'The Stepwell Road', story: "Now they want the stepwell, the only water for miles. No water, no village. Hold the road and don't let them through.", region: 'aravalli', gold: 280, lives: 20, hpScale: 1.32, spells: ['arrowRain', 'reinforcements'],
    // the road loops round the stepwell and crosses itself
    paths: [{ start: [-20, 250], curves: [[150, 250, 300, 250, 400, 230], [520, 200, 520, 60, 420, 60], [330, 60, 310, 200, 340, 320], [380, 380, 600, 350, 800, 320]] }],
    gate: { x: 806, y: 352, s: 0.82 },
    plots: [
      { x: 120, y: 210 },
      { x: 288, y: 282 },
      { x: 384, y: 270 },
      { x: 432, y: 120 },
      { x: 390, y: 156, lock: { type: 'gold', cost: 40 } },
      { x: 288, y: 198 },
      { x: 426, y: 306, lock: { type: 'gold', cost: 55 } },
      { x: 582, y: 306 },
      { x: 720, y: 294 },
    ],
    waves: [
      W([g('bandit', 8, 1.2)]), W([g('banditArcher', 3, 2.4)]), W([g('bandit', 10, 1.0), g('wolfRider', 3, 2.0, 6)]),
      W([g('saboteur', 4, 1.6)]), W([g('bandit', 12, 0.8), g('banditArcher', 4, 1.6, 5)]), W([g('wolfRider', 7, 1.2), g('saboteur', 4, 1.4, 4)]),
      W([g('bandit', 14, 0.7), g('banditArcher', 6, 1.2, 3), g('saboteur', 5, 1.2, 8)]),
    ],
    scenery: [
      ['stepwell', 420, 150], ['banyan', 80, 90, 1.1], ['banyan', 660, 130, 0.95], ['palm', 200, 40, 0.9], ['rock', 760, 200, 1.2],
      ['rock', 40, 360, 0.9], ['marigold', 470, 260], ['marigold', 230, 360], ['haystack', 690, 60], ['pots', 560, 260],
      ['tent', 40, 170, 0.9], ['campfire', 80, 190], ['palm', 600, 30, 1], ['peacock', 200, 330, 1], ['tuftField'],
    ],
  },
  {
    id: 3, name: 'Banyan Crossing', story: 'The hill Barbarians teamed up with the bandits. Bigger, tougher, hits harder. Do not let them cross the old banyan tree.', region: 'aravalli', gold: 340, lives: 20, hpScale: 1.18, spells: ['arrowRain', 'reinforcements'],
    // two entrances meet at the crossroads by the old banyan
    paths: [
      { start: [-20, 80], curves: [[120, 80, 250, 120, 330, 190], [380, 230, 420, 200, 470, 200], [560, 200, 560, 70, 660, 80], [760, 90, 740, 280, 800, 290]] },
      { start: [210, 410], curves: [[220, 320, 300, 220, 400, 205], [430, 200, 450, 200, 470, 200], [560, 200, 560, 70, 660, 80], [760, 90, 740, 280, 800, 290]] },
    ],
    gate: { x: 806, y: 322, s: 0.82 },
    plots: [
      { x: 276, y: 336 },
      { x: 120, y: 132 },
      { x: 294, y: 210 },
      { x: 402, y: 246 },
      { x: 390, y: 168, royal: true, lock: { type: 'special', wave: 2, cost: 70 } },
      { x: 456, y: 162, lock: { type: 'gold', cost: 40 } },
      { x: 510, y: 138 },
      { x: 636, y: 138, lock: { type: 'gold', cost: 55 } },
      { x: 690, y: 144 },
      { x: 792, y: 204, lock: { type: 'gold', cost: 70 } },
    ],
    waves: [
      W([g('bandit', 10, 1.0)]), W([g('wolfRider', 5, 1.4, 0, 1)]), W([g('barbarian', 2, 4)]), W([g('bandit', 10, 0.8), g('barbarian', 2, 5, 4, 1)]),
      W([g('drummer', 1, 1), g('bandit', 10, 0.7, 1)]), W([g('barbarian', 3, 3, 0, 1), g('saboteur', 5, 1.2, 2)]),
      W([g('drummer', 2, 6), g('wolfRider', 10, 0.8, 1, 1), g('banditArcher', 5, 1.2, 4)]),
      W([g('bandit', 16, 0.5), g('barbarian', 4, 2.5, 3, 1), g('drummer', 2, 5, 5, 1), g('wolfRider', 6, 1, 8)]),
    ],
    scenery: [
      ['banyan', 420, 270, 1.4], ['banyan', 140, 330, 1.1], ['banyan', 620, 20, 1], ['palm', 40, 220, 1], ['rock', 560, 330, 1],
      ['marigold', 200, 190], ['marigold', 500, 130], ['pond', 660, 360], ['haystack', 740, 30], ['peacock', 330, 320, 1], ['shrine', 680, 180], ['tuftField'],
    ],
  },
  {
    id: 4, name: 'The Old Watchtower', story: 'Two roads, one watchtower, zero chill. Bandit Archers are sniping your soldiers from the trees. Guard both paths.', region: 'aravalli', gold: 400, lives: 20, hpScale: 1.02, spells: ['arrowRain', 'reinforcements', 'holyFire'],
    // two roads cross in an X below the watchtower, then join before the fort
    paths: [
      { start: [-20, 60], curves: [[140, 60, 260, 330, 420, 320], [560, 310, 600, 220, 650, 210], [720, 200, 760, 240, 800, 240]] },
      { start: [-20, 340], curves: [[140, 340, 260, 60, 420, 80], [560, 90, 600, 200, 650, 210], [720, 200, 760, 240, 800, 240]] },
    ],
    gate: { x: 806, y: 272, s: 0.82 },
    plots: [
      { x: 66, y: 270 },
      { x: 132, y: 198 },
      { x: 264, y: 198 },
      { x: 450, y: 276 },
      { x: 456, y: 126, lock: { type: 'gold', cost: 40 } },
      { x: 576, y: 204 },
      { x: 648, y: 168, lock: { type: 'gold', cost: 55 } },
      { x: 654, y: 252, royal: true, lock: { type: 'special', wave: 4, cost: 100 } },
      { x: 708, y: 252 },
      { x: 738, y: 180, royal: true, lock: { type: 'special', wave: 2, cost: 70 } },
      { x: 792, y: 192, lock: { type: 'gold', cost: 70 } },
    ],
    waves: [
      W([g('bandit', 8, 1.0), g('bandit', 8, 1.0, 2, 1)]), W([g('banditArcher', 4, 2), g('saboteur', 3, 1.5, 3, 1)]), W([g('wolfRider', 6, 1.2), g('banditArcher', 3, 2, 3, 1)]),
      W([g('brute', 1, 1), g('drummer', 1, 1, 2)]), W([g('barbarian', 3, 3), g('bandit', 10, 0.7, 2, 1)]), W([g('shieldBearer', 1, 1), g('barbarian', 3, 2.5, 2), g('brute', 1, 1, 6, 1)]),
      W([g('wolfRider', 10, 0.8, 0, 1), g('barbarian', 4, 2.5), g('drummer', 1, 1, 3)]), W([g('brute', 2, 5), g('shieldBearer', 1, 1, 2), g('banditArcher', 6, 1.2, 2, 1), g('bandit', 14, 0.5, 4)]),
      W([g('brute', 3, 4, 0, 1), g('shieldBearer', 2, 4, 1, 1), g('barbarian', 5, 2), g('drummer', 2, 4, 3), g('saboteur', 6, 1, 6)]),
    ],
    scenery: [
      ['rock', 200, 200, 1.2], ['banyan', 220, 20, 1.1], ['banyan', 560, 370, 1.2], ['palm', 760, 60, 1], ['palm', 780, 340, 1],
      ['marigold', 330, 200], ['marigold', 520, 200], ['tent', 30, 200, 0.9], ['campfire', 60, 220], ['stepwell', 640, 110], ['shrine', 120, 370], ['tuftField'],
    ],
  },
  {
    id: 5, name: "The Bandit King's Camp", story: 'Boss fight. The Bandit King stole the Sun Crown, and without it spring never comes back. Go get it back. No pressure.', region: 'aravalli', gold: 440, lives: 20, hpScale: 0.98, spells: ['arrowRain', 'reinforcements', 'holyFire'], boss: 'banditKing',
    // three entrances into the camp; the bandits' portal skips part of the west road
    paths: [
      { start: [-20, 200], curves: [[100, 200, 160, 120, 260, 130], [360, 140, 380, 260, 480, 250], [520, 245, 540, 215, 560, 210], [640, 190, 700, 140, 760, 170], [790, 185, 795, 200, 800, 205]], portals: [{ from: 0.2, to: 0.48 }] },
      { start: [380, -20], curves: [[380, 80, 470, 90, 520, 150], [540, 180, 550, 205, 560, 210], [640, 190, 700, 140, 760, 170], [790, 185, 795, 200, 800, 205]] },
      { start: [300, 410], curves: [[310, 320, 420, 330, 480, 300], [530, 270, 545, 220, 560, 210], [640, 190, 700, 140, 760, 170], [790, 185, 795, 200, 800, 205]] },
    ],
    gate: { x: 806, y: 237, s: 0.82 },
    plots: [
      { x: 66, y: 144 },
      { x: 216, y: 168 },
      { x: 390, y: 114 },
      { x: 390, y: 372 },
      { x: 408, y: 276, lock: { type: 'gold', cost: 40 } },
      { x: 498, y: 204, royal: true, lock: { type: 'special', wave: 4, cost: 100 } },
      { x: 576, y: 252 },
      { x: 588, y: 162, lock: { type: 'gold', cost: 55 } },
      { x: 630, y: 228, royal: true, lock: { type: 'special', wave: 6, cost: 130 } },
      { x: 714, y: 198 },
      { x: 708, y: 120, lock: { type: 'gold', cost: 70 } },
      { x: 762, y: 126, royal: true, lock: { type: 'special', wave: 2, cost: 70 } },
    ],
    waves: [
      W([g('bandit', 10, 0.8), g('bandit', 6, 1, 3, 1)]), W([g('wolfRider', 8, 1.0, 0, 2)]), W([g('banditArcher', 5, 1.5, 0, 1), g('saboteur', 5, 1, 3)]), W([g('barbarian', 4, 2.5), g('drummer', 1, 1, 3)]),
      W([g('brute', 2, 4, 0, 2), g('shieldBearer', 1, 1, 2, 2), g('wolfRider', 6, 1, 3, 1)]), W([g('banditArcher', 8, 1.1), g('barbarian', 3, 2.5, 4, 1), g('drummer', 1, 1, 5, 1)]),
      W([g('bandit', 20, 0.45), g('brute', 2, 4, 5, 2), g('saboteur', 6, 0.9, 3, 1)]), W([g('wolfRider', 14, 0.6, 0, 1), g('banditArcher', 6, 1.2, 4, 2), g('shieldBearer', 2, 4, 2)]),
      W([g('barbarian', 6, 2), g('brute', 3, 3, 4, 1), g('drummer', 2, 4, 2, 2), g('shieldBearer', 2, 4, 6)]),
      W([g('bandit', 10, 0.6), g('banditKing', 1, 1, 8), g('shieldBearer', 2, 3, 10), g('barbarian', 4, 3, 12, 1), g('wolfRider', 8, 1, 18, 2), g('drummer', 2, 5, 14)]),
    ],
    scenery: [
      ['tent', 60, 300, 1.1], ['tent', 120, 330, 0.9], ['tent', 200, 360, 1], ['campfire', 150, 300], ['campfire', 90, 60],
      ['rock', 680, 60, 1.3], ['rock', 640, 340, 1], ['banyan', 220, 40, 1.1], ['palm', 780, 340, 1], ['pots', 400, 200], ['cart', 700, 290], ['tent', 30, 80, 0.9], ['tuftField'],
    ],
  },
];
