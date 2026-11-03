// Full-screen scenes drawn in code: the main menu (the fort at sunrise) and the side-scrolling
// world map, a journey through six regions and seasons of India. Shared with the concept board.
/* global seed:writable, el, g, outlined, anim, rnd, OUT, fortGate, banyan, palm, tuft, marigold, person, SUN, ARCHER, SPEAR, peacock, shrine,
   camel, scorpion, rock, golem, crocodile, boat, yeti, blobCluster, ribbon, icon */
/* eslint-disable no-unused-vars */
function menuScene(svg) {
  seed = 11; // same painting every time
  el('rect', { x: 0, y: 0, width: 844, height: 390, fill: 'url(#skyDawn)' }, svg);
  el('circle', { cx: 470, cy: 168, r: 120, fill: 'url(#sunDisc)' }, svg);
  for (let i = 0; i < 20; i++) { const a = Math.PI + (i / 19) * Math.PI; el('path', { d: `M470 168 L${470 + Math.cos(a - 0.03) * 520} ${168 + Math.sin(a - 0.03) * 520} L${470 + Math.cos(a + 0.03) * 520} ${168 + Math.sin(a + 0.03) * 520} Z`, fill: '#fff3c8', opacity: 0.12 }, svg); }
  // clouds
  [[120, 70, 1], [690, 52, 1.2], [330, 40, 0.8]].forEach(([cx, cy, s]) => { const c = g(svg, { opacity: 0.9 }); [[0, 0, 22], [24, -6, 18], [44, 2, 16], [-20, 4, 14]].forEach(([a, b, r]) => el('circle', { cx: cx + a * s, cy: cy + b * s, r: r * s, fill: '#fff4e4' }, c)); el('rect', { x: cx - 34 * s, y: cy, width: 94 * s, height: 16 * s, fill: '#fff4e4' }, c); });
  // birds
  for (let i = 0; i < 7; i++) el('path', { d: `M${560 + i * 18 + (i % 2) * 6} ${80 + (i % 3) * 9} q3 -3 6 0 q3 -3 6 0`, stroke: '#4a2a3a', 'stroke-width': 1.2, fill: 'none' }, svg);
  // far hills and mid hills
  el('path', { d: 'M0 230 Q90 170 190 210 Q290 150 400 200 Q520 140 640 196 Q740 160 844 200 V390 H0 Z', fill: 'url(#hillFar)', opacity: 0.85 }, svg);
  el('path', { d: 'M0 262 Q120 222 240 252 Q380 216 520 250 Q660 222 844 250 V390 H0 Z', fill: 'url(#hillMid)' }, svg);
  el('path', { d: 'M0 300 Q200 270 422 292 Q640 272 844 296 V390 H0 Z', fill: '#7fb145' }, svg);
  // the fort on the hill
  fortGate(svg, 470, 300, 1.55);
  banyan(svg, 690, 318, 1.5); palm(svg, 760, 300, 1.3); banyan(svg, 300, 312, 1.2);
  for (let i = 0; i < 120; i++) tuft(svg, rnd() * 844, 300 + rnd() * 90);
  [[620, 360], [340, 372], [760, 372]].forEach(([a, b]) => marigold(svg, a, b));
  // the hero in the foreground
  person(svg, 150, 382, { ...SUN, s: 3.4 });
  person(svg, 236, 372, { ...ARCHER, s: 2.2 });
  person(svg, 84, 376, { ...SPEAR, s: 2.4 });
  el('rect', { x: 0, y: 0, width: 844, height: 390, fill: 'url(#vignette)' }, svg);
}

function peak(p, x, y, w, h, snow = true, col = '#8a9ab8') {
  outlined(p, 'path', { d: `M${x - w / 2} ${y} L${x} ${y - h} L${x + w / 2} ${y} Z`, fill: col }, 1.2);
  el('path', { d: `M${x} ${y - h} L${x + w / 2} ${y} L${x + w * 0.1} ${y} Z`, fill: '#000', opacity: 0.16 }, p);
  if (snow) outlined(p, 'path', { d: `M${x - w * 0.18} ${y - h * 0.64} L${x} ${y - h} L${x + w * 0.18} ${y - h * 0.64} L${x + w * 0.08} ${y - h * 0.58} L${x} ${y - h * 0.66} L${x - w * 0.08} ${y - h * 0.58} Z`, fill: '#ffffff' }, 0.8);
}
function seasonBadge(p, x, y, kind) {
  const t = g(p, { filter: 'url(#drop)' });
  outlined(t, 'circle', { cx: x, cy: y, r: 10, fill: 'url(#goldRim)' }, 1.2);
  const col = { spring: '#5fbf4a', summer: '#ff9a2a', monsoon: '#3f7fd0', autumn: '#c8642a', prewinter: '#7aa8a8', winter: '#9ec4ff' }[kind];
  el('circle', { cx: x, cy: y, r: 7.6, fill: col }, t);
  if (kind === 'spring') [0, 1, 2, 3, 4].forEach((i) => { const a = (i / 5) * Math.PI * 2; el('circle', { cx: x + Math.cos(a) * 3, cy: y + Math.sin(a) * 3, r: 2.2, fill: '#ffd0e0' }, t); });
  if (kind === 'summer') { el('circle', { cx: x, cy: y, r: 3, fill: '#fff2b0' }, t); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el('path', { d: `M${x + Math.cos(a) * 4} ${y + Math.sin(a) * 4} L${x + Math.cos(a) * 6} ${y + Math.sin(a) * 6}`, stroke: '#fff2b0', 'stroke-width': 1 }, t); } }
  if (kind === 'monsoon') el('path', { d: `M${x} ${y - 5} Q${x + 4.4} ${y + 1} ${x} ${y + 4.6} Q${x - 4.4} ${y + 1} ${x} ${y - 5} Z`, fill: '#d2ecff' }, t);
  if (kind === 'autumn') { el('circle', { cx: x, cy: y, r: 4.2, fill: '#fff0c0' }, t); el('circle', { cx: x + 2, cy: y - 1.4, r: 3.6, fill: col }, t); }
  if (kind === 'prewinter') [-2.4, 0.6, 3.4].forEach((d) => el('path', { d: `M${x - 4.4} ${y + d} q2.2 -1.6 4.4 0 q2.2 1.6 4.4 0`, stroke: '#eef6f6', 'stroke-width': 1, fill: 'none' }, t));
  if (kind === 'winter') for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; el('path', { d: `M${x + Math.cos(a) * 5} ${y + Math.sin(a) * 5} L${x - Math.cos(a) * 5} ${y - Math.sin(a) * 5}`, stroke: '#ffffff', 'stroke-width': 1.2 }, t); }
}

const MAP_W = 1860;
const BANDS = [
  { name: 'Aravalli Hills', season: 'spring', x0: 130, col: '#a9c862' },
  { name: 'Thar Desert', season: 'summer', x0: 410, col: '#ecc57e' },
  { name: 'Western Ghats', season: 'monsoon', x0: 690, col: '#4f9a4f' },
  { name: 'Deccan Ruins', season: 'autumn', x0: 970, col: '#cfa56c' },
  { name: 'Sundarbans', season: 'prewinter', x0: 1250, col: '#6aa898' },
  { name: 'Himalayas', season: 'winter', x0: 1530, col: '#e2eaf4' },
];
function mapNodes() {
  const N = [[96, 318]]; // level 0: Training Grounds, beside the capital
  BANDS.forEach((b, r) => {
    const ys = r % 2 ? [190, 232, 276, 248, 300] : [300, 262, 222, 250, 196];
    ys.forEach((y, i) => N.push([b.x0 + 40 + i * 50, y]));
  });
  return N;
}
function mapScene(svg) {
  seed = 7; // every chunk paints the identical map, so the chunks line up
  const d = svg.querySelector('defs');
  const lg = el('linearGradient', { id: 'bands', x1: 0, y1: 0, x2: MAP_W, y2: 0, gradientUnits: 'userSpaceOnUse' }, d);
  [[0, '#9cc45a'], ...BANDS.map((b) => [(b.x0 + 140) / MAP_W, b.col]), [1, '#d8e2f0']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, lg));
  el('rect', { x: 0, y: 0, width: MAP_W, height: 390, fill: 'url(#bands)' }, svg);
  for (let i = 0; i < 40; i++) el('ellipse', { cx: rnd() * MAP_W, cy: rnd() * 390, rx: 40 + rnd() * 80, ry: 16 + rnd() * 30, fill: rnd() > 0.5 ? '#ffffff' : '#2a4a1a', opacity: 0.08, filter: 'url(#cloud)' }, svg);
  for (let i = 0; i < 700; i++) { const x = rnd() * 1250, y = 60 + rnd() * 320; if (x > 400 && x < 690) continue; el('path', { d: `M${x} ${y} l1 -3 M${x + 2} ${y} l0 -4`, stroke: '#3f7a24', 'stroke-width': 0.8, opacity: 0.4 }, svg); }

  // --- Aravalli: the capital, hills, banyans, a peacock
  [[60, 230, 70, 30], [190, 200, 60, 24], [300, 214, 70, 26]].forEach(([x, y, w, h]) => outlined(svg, 'path', { d: `M${x - w} ${y} Q${x} ${y - h * 2} ${x + w} ${y} Z`, fill: '#8fb44f' }, 1.4));
  fortGate(svg, 70, 280, 0.75);
  banyan(svg, 230, 150, 0.55); banyan(svg, 360, 340, 0.5); palm(svg, 20, 170, 0.5);
  peacock(svg, 160, 360, 0.6); shrine(svg, 330, 170, 0.6); [[200, 340], [280, 370], [120, 200]].forEach(([a, b]) => marigold(svg, a, b));
  // --- Thar: dunes, an oasis and a camel caravan
  for (let i = 0; i < 16; i++) { const x = 420 + (i % 4) * 70 + rnd() * 20, y = 100 + Math.floor(i / 4) * 70; el('path', { d: `M${x - 30} ${y} Q${x} ${y - 14} ${x + 30} ${y}`, stroke: '#c9954e', 'stroke-width': 1.8, fill: 'none' }, svg); el('path', { d: `M${x - 22} ${y - 2} Q${x} ${y - 12} ${x + 12} ${y - 6}`, stroke: '#fff0c8', 'stroke-width': 1.2, fill: 'none' }, svg); }
  el('ellipse', { cx: 560, cy: 150, rx: 28, ry: 9, fill: 'url(#water)', stroke: OUT, 'stroke-width': 1.2 }, svg);
  palm(svg, 540, 150, 0.6); palm(svg, 584, 152, 0.5);
  const caravan = g(svg);
  [0, 1, 2, 3].forEach((i) => camel(caravan, 440 + i * 30, 360 - (i % 2) * 4, 0.45, false, i === 0));
  el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;60 0;0 0', dur: '20s', repeatCount: 'indefinite' }, caravan);
  scorpion(svg, 640, 110, 0.5);
  // --- Western Ghats: green peaks, a waterfall, monsoon rain
  [[720, 150, 90, 90], [800, 130, 100, 110], [880, 160, 80, 80], [760, 360, 70, 60]].forEach(([x, y, w, h]) => peak(svg, x, y, w, h, false, '#3f7a3a'));
  el('path', { d: 'M800 40 V140', stroke: '#e6f6ff', 'stroke-width': 7 }, svg);
  const fall = el('path', { d: 'M800 40 V140', stroke: '#8fd0ec', 'stroke-width': 3, 'stroke-dasharray': '4 5' }, svg);
  anim(fall, { attributeName: 'stroke-dashoffset', values: '0;-18', dur: '0.6s' });
  el('ellipse', { cx: 800, cy: 144, rx: 16, ry: 5, fill: '#e6f6ff' }, svg);
  const rain = g(svg, { opacity: 0.7 });
  for (let i = 0; i < 70; i++) { const x = 690 + rnd() * 280, y = rnd() * 380; const r = el('path', { d: `M${x} ${y} l-3 8`, stroke: '#d2ecff', 'stroke-width': 1 }, rain); el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;-5 16;0 0', dur: `${0.6 + (i % 3) * 0.2}s`, repeatCount: 'indefinite' }, r); }
  // --- Deccan: giant boulders and ruined pillars
  [[1000, 120, 0.9], [1120, 340, 1.1], [1150, 110, 0.7], [990, 360, 0.6]].forEach(([x, y, s]) => rock(svg, x, y, s));
  for (let i = 0; i < 6; i++) outlined(svg, 'rect', { x: 1040 + i * 14 - 3, y: 150 - (i % 2) * 6, width: 6, height: 24 + (i % 2) * 6, fill: 'url(#sandV)' }, 1);
  outlined(svg, 'rect', { x: 1034, y: 142, width: 84, height: 6, fill: '#e8c08a' }, 1);
  golem(svg, 1180, 220, 0.6);
  // --- Sundarbans: the delta river, mangroves, fog, a crocodile and a boat
  const RIVER = 'M1260 0 C1300 80 1240 140 1300 200 C1360 260 1300 320 1340 390';
  el('path', { d: RIVER, stroke: OUT, 'stroke-width': 30, fill: 'none' }, svg);
  el('path', { d: RIVER, stroke: '#5fb0d0', 'stroke-width': 26, fill: 'none' }, svg);
  const flow = el('path', { d: RIVER, stroke: '#d8f2fa', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '8 12' }, svg);
  anim(flow, { attributeName: 'stroke-dashoffset', values: '0;-40', dur: '2s' });
  for (let i = 0; i < 16; i++) { const x = 1360 + (i % 4) * 34 + rnd() * 10, y = 90 + Math.floor(i / 4) * 80; el('path', { d: `M${x} ${y} l-4 8 M${x} ${y} l4 8`, stroke: '#5a3a22', 'stroke-width': 1.4 }, svg); blobCluster(svg, [[x, y - 6, 9], [x + 7, y - 2, 6]], '#2f6a3a', '#4f8f4a'); }
  crocodile(svg, 1300, 260, 0.6);
  boat(svg, 1290, 90, 0.6);
  const fog = g(svg, { opacity: 0.55 });
  [[1330, 160, 110, 18], [1420, 300, 120, 20]].forEach(([cx, cy, rx, ry], i) => { const f = el('ellipse', { cx, cy, rx, ry, fill: '#f4f8f8', filter: 'url(#cloud)' }, fog); anim(f, { attributeName: 'cx', values: `${cx};${cx + 40};${cx}`, dur: `${10 + i * 4}s` }); });
  // --- Himalayas: snowy range, snowfall, the Shadow Emperor's fortress at the end of the road
  [[1560, 140, 110, 110], [1650, 120, 130, 140], [1760, 140, 120, 120], [1840, 160, 100, 100], [1610, 380, 90, 70], [1720, 380, 110, 80]].forEach(([x, y, w, h]) => peak(svg, x, y, w, h));
  const fort = g(svg);
  el('circle', { cx: 1790, cy: 210, r: 50, fill: 'url(#gemPurple)', opacity: 0.45, filter: 'url(#cloud)' }, fort);
  outlined(fort, 'path', { d: 'M1760 240 V200 L1770 186 L1780 200 V192 L1790 172 L1800 192 V200 L1810 186 L1820 200 V240 Z', fill: '#2a1f3e' }, 1.6);
  [[1774, 214], [1790, 206], [1806, 214]].forEach(([x, y]) => el('rect', { x: x - 2, y, width: 4, height: 6, fill: '#c9a0ff', filter: 'url(#bloom)' }, fort));
  const bolt = el('path', { d: 'M1830 150 l-8 14 l7 0 l-9 16', stroke: '#e0c8ff', 'stroke-width': 1.8, fill: 'none', filter: 'url(#bloom)' }, fort);
  anim(bolt, { attributeName: 'opacity', values: '0;1;0;0;0', dur: '2.4s' });
  yeti(svg, 1600, 330, 0.55);
  for (let i = 0; i < 80; i++) { const x = 1530 + rnd() * 330, y = rnd() * 380; const f = el('circle', { cx: x, cy: y, r: 1 + rnd(), fill: '#ffffff', opacity: 0.9 }, svg); anim(f, { attributeName: 'cy', values: `${y};${y + 20};${y}`, dur: `${3 + (i % 5)}s` }); }

  // clouds drifting across the whole journey
  for (let i = 0; i < 7; i++) {
    const c = g(svg, { opacity: 0.85 }), x = 140 + i * 260, y = 60 + (i % 3) * 40, s = 0.8 + (i % 2) * 0.4;
    [[0, 0, 14], [14, -5, 12], [28, 1, 10], [-12, 2, 9]].forEach(([a, b, r]) => el('circle', { cx: x + a * s, cy: y + b * s, r: r * s, fill: '#ffffff' }, c));
    el('animateTransform', { attributeName: 'transform', type: 'translate', values: `0 0;${50 + i * 6} 0;0 0`, dur: `${30 + i * 5}s`, repeatCount: 'indefinite' }, c);
  }
  // the golden road through every level
  const N = mapNodes();
  el('path', { d: mapRoad(), stroke: OUT, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  el('path', { d: mapRoad(), stroke: '#e8c27a', 'stroke-width': 8.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  el('path', { d: mapRoad(), stroke: '#fff2c8', 'stroke-width': 1.4, fill: 'none', 'stroke-dasharray': '3 6' }, svg);
  BANDS.forEach((b) => { ribbon(svg, b.x0 + 140, 66, 60, b.name, 13); seasonBadge(svg, b.x0 + 140, 58, b.season); });
  ribbon(svg, 70, 334, 60, 'Suryagarh', 10);
  el('rect', { x: 0, y: 0, width: MAP_W, height: 390, fill: 'url(#vignette)', opacity: 0.5 }, svg);
  return N;
}
function mapRoad() {
  const N = mapNodes();
  let road = `M70 280 L${N[0][0]} ${N[0][1]}`;
  for (let i = 1; i < N.length; i++) { const [x0, y0] = N[i - 1], [x1, y1] = N[i]; road += ` Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + (i % 2 ? -18 : 18)} ${x1} ${y1}`; }
  return road + ` Q${N.at(-1)[0] + 30} 240 1790 236`;
}
