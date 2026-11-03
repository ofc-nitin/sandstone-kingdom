// Level definitions. World size is 844 x 390; roads may start/end off-screen.
// plots: build spots. lock: { type: 'gold', cost } (clear with battle gold) or
// { type: 'wave', wave } (opens when that wave starts). royal: +15% tower range.
// waves: list of groups { type, count, every (s between spawns), delay (s), lane }.

const W = (groups) => groups;
const g = (type, count, every = 1.2, delay = 0, lane = 0) => ({ type, count, every, delay, lane });

export const LEVELS = [
  {
    id: 0, name: 'Training Grounds', region: 'aravalli', gold: 160, lives: 12, hpScale: 0.8,
    paths: [{ start: [-30, 200], curves: [[160, 200, 220, 120, 380, 130], [540, 140, 560, 260, 700, 250], [760, 246, 780, 238, 800, 236]] }],
    gate: { x: 800, y: 268, s: 0.82 },
    plots: [{ x: 300, y: 188 }, { x: 476, y: 104 }, { x: 598, y: 280 }, { x: 650, y: 196, lock: { type: 'gold', cost: 40 } }],
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
      ['banyan', 120, 120, 1], ['banyan', 520, 370, 1.1], ['palm', 40, 300, 1], ['rock', 230, 300, 1], ['marigold', 360, 320],
      ['marigold', 160, 280], ['haystack', 420, 310], ['pots', 690, 320], ['shrine', 260, 70], ['fence', 120, 330, 220, 334], ['tuftField'],
    ],
  },
  {
    id: 1, name: 'Village at the Pass', region: 'aravalli', gold: 230, lives: 20, hpScale: 1,
    paths: [{ start: [-20, 120], curves: [[120, 120, 120, 60, 250, 70], [360, 80, 330, 230, 450, 230], [560, 230, 540, 90, 640, 90], [730, 90, 720, 250, 790, 268]] }],
    gate: { x: 800, y: 300, s: 0.88 },
    plots: [
      { x: 130, y: 136 }, { x: 280, y: 134 }, { x: 399, y: 154 }, { x: 533, y: 250 },
      { x: 679, y: 188, lock: { type: 'gold', cost: 50 } }, { x: 754, y: 130, lock: { type: 'wave', wave: 3 } },
    ],
    waves: [
      W([g('bandit', 6, 1.4)]), W([g('bandit', 9, 1.1)]), W([g('bandit', 12, 0.9)]),
      W([g('bandit', 10, 0.8), g('bandit', 6, 0.6, 9)]), W([g('bandit', 16, 0.7)]), W([g('bandit', 22, 0.55)]),
    ],
    scenery: [
      ['banyan', 470, 40, 1.05], ['banyan', 560, 34, 0.85], ['palm', 395, 30, 0.9], ['rock', 40, 44, 1.1], ['fence', 110, 30, 200, 26],
      ['palm', 720, 60, 0.9], ['banyan', 812, 92, 0.9], ['marigold', 190, 26], ['marigold', 610, 160], ['marigold', 300, 270],
      ['pond', 130, 320], ['peacock', 232, 300, 1.1], ['tent', 36, 182, 1], ['tent', 74, 196, 0.8], ['campfire', 58, 214],
      ['cart', 312, 300], ['stepwell', 470, 350], ['banyan', 360, 372, 1.1], ['shrine', 252, 372], ['tuftField'],
    ],
  },
  {
    id: 2, name: 'The Stepwell Road', region: 'aravalli', gold: 300, lives: 20, hpScale: 1.06,
    paths: [{ start: [-20, 300], curves: [[150, 300, 160, 120, 300, 130], [440, 140, 420, 300, 560, 290], [680, 280, 640, 120, 760, 110], [780, 108, 790, 106, 800, 104]] }],
    gate: { x: 806, y: 140, s: 0.8 },
    plots: [
      { x: 169, y: 259 }, { x: 250, y: 196 }, { x: 300, y: 74 }, { x: 391, y: 243 }, { x: 500, y: 228 },
      { x: 620, y: 200, lock: { type: 'gold', cost: 40 } }, { x: 707, y: 76, lock: { type: 'wave', wave: 4 } }, { x: 560, y: 350, lock: { type: 'gold', cost: 80 }, royal: true },
    ],
    waves: [
      W([g('bandit', 8, 1.2)]), W([g('wolfRider', 3, 2.4)]), W([g('bandit', 10, 1.0), g('wolfRider', 3, 2.0, 6)]),
      W([g('wolfRider', 6, 1.5)]), W([g('bandit', 12, 0.8), g('wolfRider', 4, 1.6, 5)]), W([g('wolfRider', 7, 1.2), g('bandit', 10, 0.8, 4)]),
      W([g('bandit', 14, 0.7), g('wolfRider', 8, 1.0, 6)]),
    ],
    scenery: [
      ['stepwell', 330, 330], ['banyan', 80, 90, 1.1], ['banyan', 470, 60, 0.95], ['palm', 200, 40, 0.9], ['rock', 760, 300, 1.2],
      ['rock', 40, 360, 0.9], ['marigold', 420, 150], ['marigold', 230, 360], ['haystack', 690, 340], ['pots', 610, 380],
      ['tent', 40, 250, 0.9], ['campfire', 70, 270], ['palm', 840, 260, 1], ['peacock', 470, 370, 1], ['tuftField'],
    ],
  },
];
