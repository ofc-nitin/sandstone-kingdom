// Shared drawing library for Sandstone Kingdom concept boards.
// Every function draws into an SVG parent with the game's outline, lighting and palette.
const NS = 'http://www.w3.org/2000/svg';
const OUT = '#3a2414';
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
const g = (parent, attrs = {}) => el('g', attrs, parent);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const anim = (target, attrs) => el('animate', { repeatCount: 'indefinite', ...attrs }, target);

// ============================================================ defs
function defs(svg) {
  const d = el('defs', {}, svg);
  const lin = (id, stops, x2 = 0, y2 = 1) => {
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, d);
    stops.forEach(([o, c, op = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, lg));
  };
  const rad = (id, stops, cx = '50%', cy = '50%', r = '50%') => {
    const rg = el('radialGradient', { id, cx, cy, r }, d);
    stops.forEach(([o, c, op = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, rg));
  };
  lin('sand', [[0, '#f6d29a'], [0.55, '#e3ad6c'], [1, '#c58847']], 1, 0);
  lin('sandV', [[0, '#f6d6a2'], [1, '#c98c4c']]);
  lin('sandTop', [[0, '#fbe3b8'], [1, '#e8b77c']]);
  lin('marble', [[0, '#ffffff'], [0.6, '#ece6da'], [1, '#c9c1b2']], 1, 0);
  lin('bronze', [[0, '#ffe08a'], [0.4, '#e0a83a'], [1, '#8f5a17']]);
  lin('steel', [[0, '#f7f9fc'], [0.5, '#c3c8d1'], [1, '#7e8592']], 1, 1);
  lin('darksteel', [[0, '#a7abb6'], [1, '#4c505b']], 1, 1);
  lin('grass', [[0, '#93c24c'], [1, '#6c9f38']]);
  lin('road', [[0, '#efdba8'], [1, '#dcc086']]);
  lin('saffron', [[0, '#ffbb55'], [1, '#df6f1b']]);
  lin('red', [[0, '#e8553a'], [1, '#a92614']]);
  lin('green', [[0, '#4a9c58'], [1, '#235e30']]);
  lin('blue', [[0, '#4c7fd0'], [1, '#1d3f86']]);
  lin('gold', [[0, '#ffe591'], [0.5, '#e8b43a'], [1, '#b07b17']]);
  lin('wood', [[0, '#b98652'], [1, '#7a4f2a']], 1, 0);
  lin('water', [[0, '#7fd0e2'], [1, '#2f7fa3']]);
  lin('tent', [[0, '#7a5a8a'], [1, '#3a2a48']], 1, 0);
  lin('tiles', [[0, '#d0603a'], [1, '#8c3018']]);
  lin('ao', [[0, '#1d1208', 0], [1, '#1d1208', 0.35]]);
  lin('beam', [[0, '#fff6d0', 0.32], [1, '#fff6d0', 0]], 0.6, 1);
  rad('glow', [[0, '#ffffff', 1], [0.3, '#8fd8ff', 0.95], [1, '#4f6bff', 0]]);
  rad('glowG', [[0, '#f6ffe0', 1], [0.4, '#9be35a', 0.85], [1, '#3f8f2a', 0]]);
  rad('fire', [[0, '#fffbe0', 1], [0.35, '#ffc04a', 0.95], [0.7, '#f0621d', 0.6], [1, '#c8361d', 0]]);
  rad('holy', [[0, '#fffbe6', 0.9], [0.5, '#ffd76a', 0.45], [1, '#ffb030', 0]]);
  rad('dust', [[0, '#f3e2b8', 0.8], [1, '#e8d3a0', 0]]);
  rad('smoke', [[0, '#f2ece2', 0.95], [0.7, '#d8cfc2', 0.7], [1, '#cfc6b8', 0]]);
  rad('sunlight', [[0, '#fff2c2', 0.42], [0.45, '#fff2c2', 0.1], [1, '#fff2c2', 0]], '18%', '6%', '85%');
  rad('vignette', [[0.62, '#1d1208', 0], [1, '#1d1208', 0.45]], '50%', '50%', '75%');
  const blur = (id, sd) => { const f = el('filter', { id, x: '-50%', y: '-80%', width: '200%', height: '260%' }, d); el('feGaussianBlur', { stdDeviation: sd }, f); };
  blur('blur', 1.8); blur('soft', 1.1); blur('cloud', 14);
  const bloom = el('filter', { id: 'bloom', x: '-60%', y: '-60%', width: '220%', height: '220%' }, d);
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 2.6, result: 'b' }, bloom);
  const m = el('feMerge', {}, bloom); el('feMergeNode', { in: 'b' }, m); el('feMergeNode', { in: 'SourceGraphic' }, m);
}

// ============================================================ primitives
const shadow = (p, x, y, rx, ry, op = 0.32) => el('ellipse', { cx: x, cy: y, rx, ry, fill: '#2a1d08', opacity: op, filter: 'url(#blur)' }, p);
// long shadow cast to the lower right by the top-left sun
const cast = (p, x, y, w, h, op = 0.2) => el('ellipse', { cx: x + w * 0.6, cy: y + h * 0.4, rx: w, ry: h, fill: '#2a1d08', opacity: op, filter: 'url(#blur)' }, p);
const outlined = (p, tag, attrs, sw = 1.6) => el(tag, { ...attrs, stroke: OUT, 'stroke-width': sw, 'stroke-linejoin': 'round' }, p);
function blobCluster(p, circles, fill, hi) {
  const a = g(p), b = g(p), c = g(p);
  circles.forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill, stroke: OUT, 'stroke-width': 2.6 }, a));
  circles.forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r: r - 1.2, fill }, b));
  if (hi) circles.forEach(([x, y, r]) => el('circle', { cx: x - r * 0.25, cy: y - r * 0.3, r: r * 0.55, fill: hi, opacity: 0.8 }, c));
}
function stones(t, x, y, w, h, col = '#a8723e', step = 6) {
  for (let row = 0; row < Math.floor(h / step); row++) {
    const yy = y + step - 2 + row * step;
    el('path', { d: `M${x + 1} ${yy} H${x + w - 1}`, stroke: col, 'stroke-width': 0.7, opacity: 0.8 }, t);
    for (let xx = x + 3 + (row % 2) * 4; xx < x + w - 2; xx += 8) el('path', { d: `M${xx} ${yy} v-${step}`, stroke: col, 'stroke-width': 0.6, opacity: 0.7 }, t);
  }
}
function moss(t, pts) { pts.forEach(([x, y, r]) => { el('circle', { cx: x, cy: y, r, fill: '#5f8f34', opacity: 0.85 }, t); el('circle', { cx: x - r * 0.3, cy: y - r * 0.3, r: r * 0.5, fill: '#86b84a', opacity: 0.85 }, t); }); }
function torch(t, x, y) {
  outlined(t, 'path', { d: `M${x - 1} ${y} L${x - 1.6} ${y - 6} H${x + 1.6} L${x + 1} ${y} Z`, fill: '#5a3a22' }, 0.6);
  const glow = el('circle', { cx: x, cy: y - 9, r: 8, fill: 'url(#fire)', opacity: 0.75 }, t);
  anim(glow, { attributeName: 'opacity', values: '0.75;0.5;0.85;0.6;0.75', dur: '0.9s' });
  const fl = el('path', { d: `M${x} ${y - 5} q-2.4 -3 0 -7.5 q2.4 4.5 0 7.5 Z`, fill: '#ffd25a', stroke: '#e2541d', 'stroke-width': 0.5 }, t);
  anim(fl, { attributeName: 'd', values: `M${x} ${y - 5} q-2.4 -3 0 -7.5 q2.4 4.5 0 7.5 Z;M${x} ${y - 5} q-2 -3.6 0.8 -8.2 q1.8 4.8 -0.8 8.2 Z;M${x} ${y - 5} q-2.4 -3 0 -7.5 q2.4 4.5 0 7.5 Z`, dur: '0.6s' });
}
function banner(t, x, y, w, h, fill, emblem = 'sun') {
  outlined(t, 'path', { d: `M${x} ${y} H${x + w} V${y + h} L${x + w / 2} ${y + h - 4} L${x} ${y + h} Z`, fill }, 1);
  el('path', { d: `M${x + 1.5} ${y + 1} V${y + h - 1.5}`, stroke: '#ffffff', 'stroke-width': 1, opacity: 0.25 }, t);
  el('path', { d: `M${x} ${y + 2.5} H${x + w}`, stroke: '#ffd66b', 'stroke-width': 1 }, t);
  emblemAt(t, x + w / 2, y + h * 0.45, Math.min(w, h) * 0.28, emblem);
}
function emblemAt(t, x, y, r, kind) {
  if (kind === 'sun') {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el('path', { d: `M${x + Math.cos(a) * r * 0.75} ${y + Math.sin(a) * r * 0.75} L${x + Math.cos(a) * r * 1.3} ${y + Math.sin(a) * r * 1.3}`, stroke: '#ffd66b', 'stroke-width': 0.9 }, t); }
    el('circle', { cx: x, cy: y, r: r * 0.6, fill: '#ffd66b' }, t);
  } else if (kind === 'lotus') {
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
      const px = x + Math.sin(a) * r * 0.6, py = y - Math.cos(a) * r * 0.3;
      el('ellipse', { cx: px, cy: py, rx: r * 0.3, ry: r * 0.75, fill: '#ffd66b', transform: `rotate(${a * 57} ${px} ${py})` }, t);
    }
  }
}
function flag(t, x, y, h, fill, w = 12) {
  el('path', { d: `M${x} ${y} V${y - h}`, stroke: OUT, 'stroke-width': 1.6 }, t);
  el('circle', { cx: x, cy: y - h - 1.4, r: 1.6, fill: '#ffd23a', stroke: OUT, 'stroke-width': 0.6 }, t);
  const top = y - h;
  const a = `M${x} ${top} Q${x + w * 0.5} ${top - 2} ${x + w} ${top + 1} Q${x + w * 0.8} ${top + 4} ${x + w} ${top + 8} Q${x + w * 0.5} ${top + 6} ${x} ${top + 8} Z`;
  const b = `M${x} ${top} Q${x + w * 0.5} ${top + 2} ${x + w} ${top - 1} Q${x + w * 1.1} ${top + 3} ${x + w} ${top + 6} Q${x + w * 0.5} ${top + 10} ${x} ${top + 8} Z`;
  const f = outlined(t, 'path', { d: a, fill }, 0.9);
  anim(f, { attributeName: 'd', dur: '1.4s', values: [a, b, a].join(';') });
}
function hpBar(p, x, y, v, w = 16) {
  el('rect', { x: x - w / 2 - 1, y: y - 1, width: w + 2, height: 4, rx: 1.5, fill: OUT }, p);
  el('rect', { x: x - w / 2, y, width: w, height: 2, rx: 1, fill: '#5a1a12' }, p);
  el('rect', { x: x - w / 2, y, width: w * v, height: 2, rx: 1, fill: v > 0.5 ? '#6fd04a' : v > 0.25 ? '#f0c23a' : '#e8452a' }, p);
}
function dust(p, x, y, dir = -1) {
  for (let i = 0; i < 3; i++) el('circle', { cx: x + dir * (6 + i * 5), cy: y - 1 - i * 0.6, r: 3.6 - i * 0.7, fill: 'url(#dust)', opacity: 0.85 - i * 0.2 }, p);
}
function spark(p, x, y, r = 7) {
  const t = g(p, { filter: 'url(#bloom)' });
  el('path', { d: `M${x} ${y - r} L${x + r * 0.22} ${y - r * 0.22} L${x + r} ${y} L${x + r * 0.22} ${y + r * 0.22} L${x} ${y + r} L${x - r * 0.22} ${y + r * 0.22} L${x - r} ${y} L${x - r * 0.22} ${y - r * 0.22} Z`, fill: '#fff6c4' }, t);
  el('circle', { cx: x, cy: y, r: r * 0.3, fill: '#ffffff' }, t);
}

// ============================================================ scenery
function banyan(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  cast(t, 0, 0, 26, 7);
  shadow(t, 2, 2, 26, 7);
  outlined(t, 'path', { d: 'M-6 0 Q-4 -14 -6 -24 L6 -24 Q4 -14 6 0 Q0 2 -6 0 Z', fill: 'url(#wood)' });
  el('path', { d: 'M-2 -3 Q-3 -12 -1 -20 M2 -2 Q3 -10 1 -18', stroke: '#5a3a22', 'stroke-width': 0.9, fill: 'none' }, t);
  [-15, -10, 11, 16].forEach((rx) => el('path', { d: `M${rx} -22 Q${rx + 1} -10 ${rx} 0`, stroke: '#6e4524', 'stroke-width': 1.4, fill: 'none' }, t));
  blobCluster(t, [[-18, -27, 12], [0, -33, 16], [18, -27, 12], [-8, -21, 11], [10, -20, 10]], '#356f26');
  blobCluster(t, [[-15, -32, 11], [0, -41, 14], [15, -33, 11], [-5, -30, 10], [8, -29, 10]], '#4f8f34', '#79b84a');
  [[-14, -38, 5], [2, -48, 6], [14, -40, 5], [-4, -36, 4]].forEach(([a, b, r]) => el('circle', { cx: a, cy: b, r, fill: '#93c95a' }, t));
  for (let i = 0; i < 11; i++) { const a = -18 + rnd() * 34, b = -46 + rnd() * 24; el('path', { d: `M${a} ${b} q2 -2 4 0`, stroke: '#2f6322', 'stroke-width': 0.9, fill: 'none' }, t); }
  [[-10, -44], [6, -50], [16, -38], [-16, -32]].forEach(([a, b]) => el('circle', { cx: a, cy: b, r: 1.7, fill: '#c6ec8c' }, t));
}
function palm(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  cast(t, 0, 0, 14, 4);
  shadow(t, 6, 1, 14, 4);
  outlined(t, 'path', { d: 'M-3 0 Q-2 -22 6 -40 L10 -39 Q3 -22 3 0 Z', fill: 'url(#wood)' });
  for (let i = 0; i < 7; i++) el('path', { d: `M${-2.4 + i * 1.2} ${-5 - i * 5} q2.5 1 5 0`, stroke: '#6a4628', 'stroke-width': 0.9, fill: 'none' }, t);
  const leaves = [[-26, -34], [-20, -50], [8, -58], [28, -48], [30, -32], [2, -30], [-10, -56]];
  leaves.forEach(([lx, ly]) => {
    outlined(t, 'path', { d: `M8 -40 Q${(8 + lx) / 2} ${(-40 + ly) / 2 - 10} ${lx} ${ly} Q${(8 + lx) / 2} ${(-40 + ly) / 2 + 2} 8 -40 Z`, fill: '#4f9635' }, 1.2);
    el('path', { d: `M8 -40 Q${(8 + lx) / 2} ${(-40 + ly) / 2 - 5} ${lx} ${ly}`, stroke: '#8fcb5a', 'stroke-width': 0.8, fill: 'none' }, t);
  });
  [[6, -40], [10, -38], [8, -36]].forEach(([a, b]) => outlined(t, 'circle', { cx: a, cy: b, r: 2.2, fill: '#8a5a1d' }, 0.6));
}
function rock(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  cast(t, 0, 0, 18, 4);
  shadow(t, 3, 2, 22, 6);
  outlined(t, 'path', { d: 'M-20 2 L-16 -12 L-4 -20 L10 -18 L20 -8 L20 2 Z', fill: '#c88a52' }, 1.8);
  el('path', { d: 'M-16 -12 L-4 -20 L10 -18 L4 -10 L-10 -8 Z', fill: '#e8b47a' }, t);
  el('path', { d: 'M10 -18 L20 -8 L20 2 L8 2 L4 -10 Z', fill: '#a96e3e', opacity: 0.7 }, t);
  el('path', { d: 'M2 -6 L6 0 M-8 -4 L-6 2 M-12 -10 L-8 -14', stroke: OUT, 'stroke-width': 1, fill: 'none', opacity: 0.6 }, t);
  el('path', { d: 'M-14 -11 L-5 -17', stroke: '#fbe1b8', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, t);
  moss(t, [[-14, -2, 2.6], [14, 0, 2.2]]);
}
function marigold(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  shadow(t, 2, 1, 9, 2.5);
  blobCluster(t, [[-5, -3, 5], [3, -5, 6], [7, -1, 4]], '#4c8a33');
  [[-5, -6], [2, -9], [7, -4], [-1, -2], [4, -1]].forEach(([a, b]) => { el('circle', { cx: a, cy: b, r: 2, fill: rnd() > 0.5 ? '#ff9b1e' : '#ffc72c', stroke: '#b8560e', 'stroke-width': 0.6 }, t); el('circle', { cx: a - 0.5, cy: b - 0.5, r: 0.7, fill: '#fff0b0' }, t); });
}
function tuft(p, x, y) { el('path', { d: `M${x - 3} ${y} l1 -5 M${x} ${y} l0 -7 M${x + 3} ${y} l-1 -5`, stroke: '#4f8a2c', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, p); }
function haystack(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  cast(t, 0, 0, 12, 4); shadow(t, 2, 1, 15, 4);
  outlined(t, 'path', { d: 'M-14 0 Q-14 -18 0 -22 Q14 -18 14 0 Z', fill: '#e9c45c' });
  el('path', { d: 'M-8 -4 l2 -8 M0 -6 l0 -10 M7 -4 l-2 -8 M-11 -9 l3 -4 M10 -9 l-3 -4', stroke: '#b58a2a', 'stroke-width': 1 }, t);
  el('path', { d: 'M-12 -12 Q-6 -20 0 -21', stroke: '#fff0a8', 'stroke-width': 1.4, fill: 'none' }, t);
}
function shrine(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  cast(t, 0, 0, 16, 5); shadow(t, 2, 2, 22, 6);
  outlined(t, 'rect', { x: -18, y: -6, width: 36, height: 8, fill: 'url(#sand)' });
  outlined(t, 'rect', { x: -11, y: -26, width: 22, height: 20, fill: 'url(#sand)' });
  stones(t, -11, -26, 22, 20);
  outlined(t, 'path', { d: 'M-8 -6 V-16 Q0 -24 8 -16 V-6 Z', fill: '#4a2f1c' });
  outlined(t, 'path', { d: 'M-13 -26 Q0 -50 13 -26 Z', fill: 'url(#saffron)' });
  el('path', { d: 'M-8 -30 Q0 -44 8 -30', stroke: '#ffe0a0', 'stroke-width': 1, fill: 'none' }, t);
  flag(t, 0, -46, 8, '#e2461d', 8);
  el('circle', { cx: 0, cy: -11, r: 5, fill: 'url(#fire)', opacity: 0.8 }, t);
  el('circle', { cx: 0, cy: -10, r: 1.4, fill: '#fff3c4' }, t);
  [[-15, 0], [15, 0]].forEach(([a, b]) => el('circle', { cx: a, cy: b - 4, r: 2, fill: '#ff9b1e', stroke: '#b8560e', 'stroke-width': 0.5 }, t));
}
function pond(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  outlined(t, 'ellipse', { cx: 0, cy: 0, rx: 40, ry: 16, fill: '#b98a55' }, 2);
  el('ellipse', { cx: 0, cy: 1, rx: 35, ry: 12.5, fill: 'url(#water)' }, t);
  el('ellipse', { cx: -6, cy: -2, rx: 22, ry: 5, fill: '#bdeaf3', opacity: 0.35 }, t);
  [[-14, -2], [10, 3], [20, -4]].forEach(([a, b]) => { el('ellipse', { cx: a, cy: b, rx: 5, ry: 2, fill: '#3f8a3a' }, t); el('circle', { cx: a + 1, cy: b - 1.5, r: 1.9, fill: '#ff8fb3', stroke: '#c75a82', 'stroke-width': 0.4 }, t); });
  const r1 = el('ellipse', { cx: 4, cy: 2, rx: 4, ry: 1.5, fill: 'none', stroke: '#e6f8fc', 'stroke-width': 0.7 }, t);
  anim(r1, { attributeName: 'rx', values: '3;10;3', dur: '3s' }); anim(r1, { attributeName: 'opacity', values: '0.9;0;0.9', dur: '3s' });
  el('path', { d: 'M-24 -4 q6 -2 12 0 M6 6 q5 -1.5 10 0', stroke: '#e6f8fc', 'stroke-width': 1, fill: 'none' }, t);
  [[-38, -2], [36, 2], [-30, 8]].forEach(([a, b]) => tuft(t, a, b));
}
function fence(p, x1, y1, x2, y2) {
  const t = g(p);
  const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 10);
  el('path', { d: `M${x1} ${y1 - 6} L${x2} ${y2 - 6} M${x1} ${y1 - 2} L${x2} ${y2 - 2}`, stroke: '#7a5432', 'stroke-width': 1.8 }, t);
  for (let i = 0; i <= n; i++) { const x = x1 + ((x2 - x1) * i) / n, y = y1 + ((y2 - y1) * i) / n; outlined(t, 'rect', { x: x - 1.6, y: y - 10, width: 3.2, height: 11, fill: '#a8794a', rx: 1 }, 1); }
}
function peacock(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  shadow(t, -4, 1, 16, 3.5);
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.58 + i * 0.08);
    const ex = Math.cos(a) * 26 - 4, ey = Math.sin(a) * -20 - 8;
    el('path', { d: `M-4 -6 L${ex} ${ey}`, stroke: '#2e7a4a', 'stroke-width': 2.6 }, t);
    outlined(t, 'ellipse', { cx: ex, cy: ey, rx: 3.4, ry: 3, fill: '#1f8a6e' }, 0.6);
    el('circle', { cx: ex, cy: ey, r: 1.8, fill: '#e0b23a' }, t);
    el('circle', { cx: ex, cy: ey, r: 1, fill: '#1c3e9a' }, t);
  }
  outlined(t, 'path', { d: 'M-6 -2 Q-8 -12 0 -12 Q6 -12 5 -4 Q2 0 -6 -2 Z', fill: 'url(#blue)' }, 1);
  el('path', { d: 'M-4 -6 Q0 -9 3 -6', stroke: '#2e9a6e', 'stroke-width': 1.4, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M2 -10 Q4 -20 6 -22 Q9 -22 8 -19 Q6 -15 5 -9 Z', fill: '#1f5fb8' }, 1);
  el('path', { d: 'M8 -20 l3 1 l-3 1', fill: '#e0a21c' }, t);
  el('circle', { cx: 7, cy: -20.5, r: 0.7, fill: '#ffffff' }, t);
  el('path', { d: 'M6 -22 l-1 -4 M7 -22 l1 -4', stroke: '#1f5fb8', 'stroke-width': 0.8 }, t);
  el('circle', { cx: 5, cy: -26, r: 0.9, fill: '#1f5fb8' }, t); el('circle', { cx: 8, cy: -26, r: 0.9, fill: '#1f5fb8' }, t);
  el('path', { d: 'M-2 -1 V3 M2 -1 V3', stroke: '#8a6a3a', 'stroke-width': 1 }, t);
}
function stepwell(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  shadow(t, 0, 2, 40, 10);
  for (let i = 0; i < 4; i++) {
    const w = 72 - i * 14, h = 26 - i * 5;
    outlined(t, 'path', { d: `M${-w / 2} ${-h / 2 + i * 2} H${w / 2} L${w / 2 - 4} ${h / 2} H${-w / 2 + 4} Z`, fill: i % 2 ? '#d39a58' : '#e8b47a' }, 1.1);
    for (let k = -w / 2 + 6; k < w / 2 - 4; k += 7) el('path', { d: `M${k} ${-h / 2 + i * 2} l-1 3`, stroke: '#a8723e', 'stroke-width': 0.6 }, t);
  }
  el('ellipse', { cx: 0, cy: 8, rx: 12, ry: 4, fill: 'url(#water)', stroke: OUT, 'stroke-width': 1 }, t);
  el('path', { d: 'M-6 7 q3 -1 6 0', stroke: '#e6f8fc', 'stroke-width': 0.8, fill: 'none' }, t);
  for (const cx of [-34, 34]) {
    outlined(t, 'rect', { x: cx - 3, y: -24, width: 6, height: 14, fill: 'url(#sand)' }, 1);
    outlined(t, 'path', { d: `M${cx - 6} -24 Q${cx} -34 ${cx + 6} -24 Z`, fill: '#ffffff' }, 1);
  }
  moss(t, [[-30, -6, 2.2], [26, 8, 2]]);
}
function tent(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  cast(t, 0, 0, 20, 5); shadow(t, 0, 2, 26, 6);
  outlined(t, 'path', { d: 'M-24 0 L0 -30 L24 0 Z', fill: 'url(#tent)' }, 1.6);
  el('path', { d: 'M-12 0 L0 -30 M12 0 L0 -30', stroke: '#2a1e36', 'stroke-width': 0.8 }, t);
  outlined(t, 'path', { d: 'M-6 0 L0 -18 L6 0 Z', fill: '#1d1426' }, 1);
  el('path', { d: 'M-24 0 L-30 4 M24 0 L30 4', stroke: '#7a5432', 'stroke-width': 0.8 }, t);
  flag(t, 0, -30, 8, '#2d2a33', 9);
  el('path', { d: 'M-14 -12 L-9 -18 M14 -12 L9 -18', stroke: '#b9bcc4', 'stroke-width': 1 }, t);
}
function campfire(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  const glow = el('circle', { cx: 0, cy: -6, r: 16, fill: 'url(#fire)', opacity: 0.65 }, t);
  anim(glow, { attributeName: 'r', values: '15;18;14;16;15', dur: '0.8s' });
  [[-6, 0], [6, 0], [0, 2]].forEach(([a, b]) => outlined(t, 'ellipse', { cx: a, cy: b, rx: 5, ry: 2, fill: '#6e4524' }, 0.8));
  [[-9, 1], [9, 1], [-5, 4], [5, 4]].forEach(([a, b]) => outlined(t, 'circle', { cx: a, cy: b, r: 2, fill: '#9a948b' }, 0.6));
  outlined(t, 'path', { d: 'M-5 -1 Q-6 -10 0 -16 Q6 -10 5 -1 Z', fill: '#ff8a1e' }, 0.8);
  el('path', { d: 'M-2 -1 Q-2 -7 0 -10 Q2 -7 2 -1 Z', fill: '#ffe28a' }, t);
  [[0, -22, 5], [3, -32, 6.5], [-1, -43, 8], [4, -55, 9]].forEach(([a, b, r], i) => {
    const c = el('circle', { cx: a, cy: b, r, fill: 'url(#smoke)', opacity: 0.55 - i * 0.1 }, t);
    anim(c, { attributeName: 'cy', values: `${b};${b - 6};${b}`, dur: `${3 + i}s` });
  });
}
function pots(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  [[0, 0, 1], [9, 2, 0.8], [-8, 3, 0.75]].forEach(([a, b, s]) => {
    shadow(t, a, b + 1, 6 * s, 2);
    outlined(t, 'path', { d: `M${a - 6 * s} ${b} Q${a - 8 * s} ${b - 8 * s} ${a - 3 * s} ${b - 11 * s} H${a + 3 * s} Q${a + 8 * s} ${b - 8 * s} ${a + 6 * s} ${b} Z`, fill: '#c0662e' }, 0.9);
    el('path', { d: `M${a - 6 * s} ${b - 5 * s} Q${a} ${b - 3 * s} ${a + 6 * s} ${b - 5 * s}`, stroke: '#f3cf97', 'stroke-width': 1, fill: 'none' }, t);
    el('path', { d: `M${a - 4 * s} ${b - 9 * s} q-1 4 0 7`, stroke: '#ffd2a0', 'stroke-width': 0.8, fill: 'none', opacity: 0.7 }, t);
  });
}
function cart(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  cast(t, 0, 0, 18, 4); shadow(t, 0, 2, 22, 5);
  outlined(t, 'path', { d: 'M-18 -6 H14 L16 -14 H-20 Z', fill: 'url(#wood)' }, 1.2);
  el('path', { d: 'M-10 -6 V-14 M-2 -6 V-14 M6 -6 V-14', stroke: '#5a3a22', 'stroke-width': 0.7 }, t);
  [[-14, -18], [-6, -20], [4, -19], [-10, -23]].forEach(([a, b]) => outlined(t, 'ellipse', { cx: a, cy: b, rx: 6, ry: 4, fill: '#e9c45c' }, 0.8));
  outlined(t, 'circle', { cx: -8, cy: -4, r: 7, fill: 'none' }, 1.8);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; el('path', { d: `M${-8 + Math.cos(a) * 7} ${-4 + Math.sin(a) * 7} L${-8 - Math.cos(a) * 7} ${-4 - Math.sin(a) * 7}`, stroke: '#6e4524', 'stroke-width': 0.9 }, t); }
  el('path', { d: 'M14 -8 L28 -2', stroke: '#6e4524', 'stroke-width': 1.8 }, t);
}
function butterfly(p, x, y, c) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  const a = 'M0 0 Q-4 -5 -5 -1 Q-4 2 0 0 Q4 -5 5 -1 Q4 2 0 0 Z';
  const b = 'M0 0 Q-1.5 -5 -2 -1 Q-1.5 2 0 0 Q1.5 -5 2 -1 Q1.5 2 0 0 Z';
  const w = el('path', { d: a, fill: c, stroke: OUT, 'stroke-width': 0.4 }, t);
  anim(w, { attributeName: 'd', values: [a, b, a].join(';'), dur: '0.35s' });
}

// ============================================================ characters
// An arm with a bent elbow: shoulder -> elbow -> hand, outlined like everything else.
function arm(t, [sx, sy], [ex, ey], [hx, hy], color, w = 3) {
  const d = `M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}`;
  el('path', { d, stroke: OUT, 'stroke-width': w + 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, t);
  el('path', { d, stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, t);
  el('path', { d: `M${sx} ${sy - w * 0.25} L${ex} ${ey - w * 0.25}`, stroke: '#ffffff', 'stroke-width': w * 0.3, opacity: 0.3, 'stroke-linecap': 'round' }, t);
}
// A fist: knuckles toward the viewer, thumb wrapped over the grip.
function hand(t, x, y, skin) {
  outlined(t, 'ellipse', { cx: x, cy: y, rx: 2.1, ry: 1.8, fill: skin }, 0.8);
  el('path', { d: `M${x - 1.2} ${y - 0.9} q1.2 0.7 2.4 0`, stroke: OUT, 'stroke-width': 0.45, fill: 'none', opacity: 0.6 }, t);
}
function shade(hex, f) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
function person(p, x, y, o = {}) {
  const { s = 1, skin = '#d99766', tunic = '#f4efe2', trim = '#d8452a', head = 'turban', headColor = '#f0912a',
    weapon = null, shield = null, flip = false, big = 1 } = o;
  const t = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  cast(t, 0, 0, 7 * big, 2.2, 0.16);
  shadow(t, 0, 1, 7.5 * big, 2.4);
  if (o.aura) { const a = el('circle', { cx: 0, cy: -18, r: 22, fill: 'url(#holy)' }, t); anim(a, { attributeName: 'r', values: '20;24;20', dur: '2s' }); }
  if (o.cape) {
    outlined(t, 'path', { d: `M${-5 * big} -18 Q${-12 * big} -8 ${-10 * big} 1 Q${-6 * big} -1 ${-2 * big} 0 Z`, fill: o.cape }, 1.1);
    el('path', { d: `M${-7 * big} -12 Q${-9 * big} -6 ${-8 * big} -1`, stroke: shade(o.cape, 0.7), 'stroke-width': 0.8, fill: 'none' }, t);
  }
  if (o.quiver) {
    outlined(t, 'path', { d: 'M-7 -22 L-3 -24 L1 -10 L-3 -8 Z', fill: 'url(#wood)' }, 0.9);
    [[-6, -25], [-4.6, -26], [-3.2, -25.4]].forEach(([a, b]) => el('path', { d: `M${a} ${b} l1 -3`, stroke: '#f3ead6', 'stroke-width': 1.2 }, t));
  }
  // far arm (hangs, or holds the shield); the archer's far arm draws the string later
  const sleeve = shade(o.armor ? '#c3c8d1' : tunic, 0.8);
  const front = o.armor ? '#c3c8d1' : tunic;
  if (weapon !== 'bow') {
    arm(t, [-4.6 * big, -16.4], [-6.6 * big, -12.2], [-6.2 * big, -8.6], sleeve, 2.8 * big);
    hand(t, -6.2 * big, -8.4, shade(skin, 0.92));
  }
  outlined(t, 'rect', { x: -4.5 * big, y: -6, width: 3.6 * big, height: 7, rx: 1.4, fill: o.legs || '#5a3a22' }, 1.1);
  outlined(t, 'rect', { x: 0.9 * big, y: -6, width: 3.6 * big, height: 7, rx: 1.4, fill: o.legs || '#5a3a22' }, 1.1);
  el('path', { d: `M${-5 * big} 0.6 h${4.6 * big} M${0.6 * big} 0.6 h${4.6 * big}`, stroke: '#2a1a10', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, t);
  outlined(t, 'path', { d: `M${-7 * big} -4 Q0 -2 ${7 * big} -4 L${5 * big} -17 Q0 -19 ${-5 * big} -17 Z`, fill: tunic }, 1.3);
  el('path', { d: `M${1.5 * big} -18 L${7 * big} -4 Q${4 * big} -2.8 ${2.5 * big} -2.6 Z`, fill: '#000', opacity: 0.12 }, t);
  el('path', { d: `M${-4.6 * big} -16 L${-6 * big} -5`, stroke: '#ffffff', 'stroke-width': 1.2, opacity: 0.4 }, t);
  el('path', { d: `M${-2 * big} -16 L${-3 * big} -5 M${1.5 * big} -16 L${2.2 * big} -5`, stroke: OUT, 'stroke-width': 0.5, opacity: 0.4 }, t);
  if (o.armor) {
    outlined(t, 'path', { d: `M${-4.6 * big} -17 Q0 -19 ${4.6 * big} -17 L${4 * big} -10 Q0 -8.5 ${-4 * big} -10 Z`, fill: o.armor }, 0.9);
    el('path', { d: `M${-3 * big} -16 Q${-2 * big} -13 ${-3 * big} -11`, stroke: '#ffffff', 'stroke-width': 1, opacity: 0.6, fill: 'none' }, t);
    [[-5.4 * big, -16.6], [5.4 * big, -16.6]].forEach(([a, b]) => { outlined(t, 'ellipse', { cx: a, cy: b, rx: 3 * big, ry: 2.2, fill: o.armor }, 0.9); el('path', { d: `M${a - 2} ${b - 0.6} q2 -1.4 4 0`, stroke: '#ffffff', 'stroke-width': 0.7, fill: 'none', opacity: 0.7 }, t); });
  }
  if (o.fur) el('path', { d: `M${-5.5 * big} -16.5 q1.5 -2 3 0 q1.5 -2 3 0 q1.5 -2 3 0 q1.5 -2 2.8 0`, stroke: o.fur, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, t);
  el('path', { d: `M${-6.4 * big} -6 Q0 -4 ${6.4 * big} -6`, stroke: trim, 'stroke-width': 2, fill: 'none' }, t);
  el('path', { d: `M${-6.6 * big} -5 Q0 -3 ${6.6 * big} -5`, stroke: '#ffd66b', 'stroke-width': 0.6, fill: 'none', opacity: 0.8 }, t);
  el('rect', { x: -5 * big, y: -12, width: 10 * big, height: 2, fill: shade(trim, 0.8) }, t);
  el('rect', { x: -1.2, y: -12.4, width: 2.4, height: 2.8, rx: 0.6, fill: '#ffd66b', stroke: OUT, 'stroke-width': 0.4 }, t);
  outlined(t, 'rect', { x: 2.6 * big, y: -11, width: 2.6, height: 3, rx: 0.8, fill: '#8a5a32' }, 0.5);
  // the archer's drawing arm passes behind the head; only the hand shows at the chin
  if (weapon === 'bow') arm(t, [-4.4 * big, -16.8], [-6.6, -20.4], [7.4, -19.4], sleeve, 2.8);
  // head
  outlined(t, 'circle', { cx: -4.6, cy: -22.6, r: 1.7, fill: shade(skin, 0.9) }, 0.7);
  outlined(t, 'circle', { cx: 0, cy: -23, r: 6.5, fill: skin }, 1.3);
  el('path', { d: 'M-3 -28.5 Q-5.5 -26 -5 -21', stroke: '#ffffff', 'stroke-width': 1, opacity: 0.35, fill: 'none' }, t);
  el('path', { d: 'M6.2 -23.6 q1.6 0.8 0.2 2', stroke: OUT, 'stroke-width': 0.8, fill: shade(skin, 0.95) }, t);
  el('circle', { cx: 3.4, cy: -20.6, r: 1.5, fill: '#e8745a', opacity: 0.45 }, t);
  el('ellipse', { cx: 2.6, cy: -23.6, rx: 1, ry: 1.2, fill: OUT }, t);
  el('circle', { cx: 2.9, cy: -24, r: 0.35, fill: '#ffffff' }, t);
  el('path', { d: `M1 -25.8 q1.6 ${o.angry ? 1.2 : -0.9} 3.2 ${o.angry ? 0.4 : -0.2}`, stroke: OUT, 'stroke-width': 0.8, fill: 'none' }, t);
  el('path', { d: 'M2.6 -19 q1.2 0.6 2.4 0', stroke: OUT, 'stroke-width': 0.6, fill: 'none' }, t);
  if (o.moustache) el('path', { d: 'M1.2 -20.4 q1.6 1 3 0 q1 0.9 2.2 -0.4', stroke: OUT, 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round' }, t);
  if (o.beard) outlined(t, 'path', { d: 'M-3 -20 Q-2 -12 3 -13 Q7 -14 6.4 -20 Q2 -18 -3 -20 Z', fill: o.beard }, 0.8);
  // headgear
  if (head === 'turban') {
    outlined(t, 'path', { d: 'M-7 -24 Q-7 -33 0 -33 Q7 -33 7 -24 Q0 -27 -7 -24 Z', fill: headColor }, 1.2);
    el('path', { d: 'M-6 -27 Q0 -31 6 -28 M-6.5 -25.5 Q0 -29 6.5 -26', stroke: OUT, 'stroke-width': 0.5, fill: 'none', opacity: 0.5 }, t);
    el('path', { d: 'M-5 -30 Q-2 -32.5 2 -32', stroke: '#ffffff', 'stroke-width': 0.9, fill: 'none', opacity: 0.5 }, t);
    el('circle', { cx: 0, cy: -30, r: 1.4, fill: '#ffe08a', stroke: OUT, 'stroke-width': 0.4 }, t);
    el('path', { d: 'M-0.5 -31 Q-2 -36 1 -38', stroke: '#ffe08a', 'stroke-width': 1.1, fill: 'none' }, t);
  } else if (head === 'helmet') {
    outlined(t, 'path', { d: 'M-7 -23 Q-7 -32 0 -34 Q7 -32 7 -23 Z', fill: 'url(#steel)' }, 1.2);
    el('path', { d: 'M-4.5 -25 Q-4 -30 -1 -31.5', stroke: '#ffffff', 'stroke-width': 1.2, fill: 'none', opacity: 0.85 }, t);
    outlined(t, 'rect', { x: -7.4, y: -24.4, width: 14.8, height: 2.2, rx: 1, fill: shade(headColor, 0.9) }, 0.6);
    el('path', { d: 'M0 -34 V-37', stroke: OUT, 'stroke-width': 1.4 }, t);
    outlined(t, 'path', { d: 'M0 -37 Q-6 -40 -8 -35 Q-4 -38 0 -36 Z', fill: headColor }, 0.6);
    if (o.visor) el('path', { d: 'M1.5 -24 V-19', stroke: '#9aa0aa', 'stroke-width': 1.6 }, t);
  } else if (head === 'hood') {
    outlined(t, 'path', { d: 'M-8 -20 Q-8 -34 0 -36 Q8 -34 8 -20 Q4 -27 -1 -28 Q-6 -27 -8 -20 Z', fill: headColor }, 1.2);
    el('path', { d: 'M-6 -24 Q-6 -32 0 -34', stroke: '#ffffff', 'stroke-width': 0.9, opacity: 0.35, fill: 'none' }, t);
    el('path', { d: 'M-8 -20 Q-4 -27 0 -28', stroke: '#ffd66b', 'stroke-width': 0.8, fill: 'none' }, t);
  } else if (head === 'horns') {
    outlined(t, 'path', { d: 'M-7 -24 Q-7 -32 0 -32 Q7 -32 7 -24 Z', fill: 'url(#darksteel)' }, 1.2);
    el('path', { d: 'M-4 -26 Q-4 -30 0 -31', stroke: '#ffffff', 'stroke-width': 0.9, opacity: 0.6, fill: 'none' }, t);
    outlined(t, 'path', { d: 'M-6 -29 Q-13 -31 -12 -39 Q-9 -33 -4 -31 Z M6 -29 Q13 -31 12 -39 Q9 -33 4 -31 Z', fill: '#f2e6c8' }, 1);
    el('path', { d: 'M-10 -32 l1.2 -0.6 M-11 -35 l1.2 -0.4 M10 -32 l-1.2 -0.6 M11 -35 l-1.2 -0.4', stroke: '#b8a070', 'stroke-width': 0.6 }, t);
  } else if (head === 'mask') {
    outlined(t, 'path', { d: 'M-7 -24 Q-7 -33 0 -33 Q7 -33 7 -24 Q0 -27 -7 -24 Z', fill: headColor }, 1.2);
    outlined(t, 'path', { d: 'M-6.4 -22.4 H6.6 V-18.6 Q0 -16.6 -6.4 -18.6 Z', fill: '#2d2a33' }, 0.6);
    outlined(t, 'path', { d: 'M-6 -21 Q-12 -20 -14 -16 Q-10 -18 -6 -19 Z', fill: '#2d2a33' }, 0.6);
  }
  // weapon, then the front arm so the hand grips it
  const S = [4.6 * big, -16.4]; // front shoulder
  if (weapon === 'bow') {
    // bow held out at arm's length, string drawn back to the cheek
    const G = [13.6, -19.4], D = [7.4, -19.4];
    el('path', { d: `M12.4 -33 Q23.5 -19.4 12.4 -5.8`, stroke: OUT, 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, t);
    el('path', { d: `M12.4 -33 Q23.5 -19.4 12.4 -5.8`, stroke: '#9a5e2a', 'stroke-width': 2.1, fill: 'none', 'stroke-linecap': 'round' }, t);
    el('path', { d: `M14.6 -27 Q17.4 -19.4 14.6 -12`, stroke: '#e8b878', 'stroke-width': 0.6, fill: 'none' }, t);
    el('path', { d: `M12.4 -33 L${D[0]} ${D[1]} L12.4 -5.8`, stroke: '#f3ead6', 'stroke-width': 0.6, fill: 'none' }, t);
    el('path', { d: `M${D[0]} ${D[1]} L23.6 -19.6`, stroke: '#c9a070', 'stroke-width': 1.1 }, t);
    outlined(t, 'path', { d: 'M24.6 -19.6 l-3 -1.6 v3.2 Z', fill: 'url(#steel)' }, 0.4);
    el('path', { d: `M${D[0] + 0.4} ${D[1]} l-2.2 -1.4 M${D[0] + 0.4} ${D[1]} l-2.2 1.4`, stroke: '#e2461d', 'stroke-width': 1 }, t);
    arm(t, S, [9.4, -18.6], G, front, 2.8);
    hand(t, G[0], G[1], skin);
    hand(t, D[0], D[1], skin);
  } else if (weapon === 'spear') {
    const H = [9.2, -15];
    el('path', { d: 'M9.2 3 L9.2 -44', stroke: OUT, 'stroke-width': 3 }, t);
    el('path', { d: 'M9.2 3 L9.2 -44', stroke: '#8a5a2e', 'stroke-width': 1.6 }, t);
    el('path', { d: 'M8.6 0 L8.6 -42', stroke: '#c08a52', 'stroke-width': 0.5 }, t);
    outlined(t, 'path', { d: 'M9.2 -52 L12.2 -44 L9.2 -42 L6.2 -44 Z', fill: 'url(#steel)' }, 0.9);
    el('path', { d: 'M8.2 -42 q-2 3 -1 6 M10.2 -42 q2 3 1 6', stroke: '#e2342a', 'stroke-width': 1.4, fill: 'none' }, t);
    arm(t, S, [7.4, -11.4], H, front, 2.8);
    hand(t, H[0], H[1], skin);
  } else if (weapon === 'sword') {
    // blade rises up and forward from the fist; guard above the fist, pommel below
    const H = [10.6, -13.2], dx = 0.47, dy = -0.88, nx = 0.88, ny = 0.47;
    const at = (k, m = 0) => `${H[0] + dx * k + nx * m} ${H[1] + dy * k + ny * m}`;
    outlined(t, 'path', { d: `M${at(2.6, -1.1)} L${at(22.6, -0.9)} L${at(24.6)} L${at(22.6, 0.9)} L${at(2.6, 1.1)} Z`, fill: 'url(#steel)' }, 0.8);
    el('path', { d: `M${at(3, 0)} L${at(22.6, 0)}`, stroke: '#ffffff', 'stroke-width': 0.5, opacity: 0.9 }, t);
    el('path', { d: `M${at(2.2, -3.4)} L${at(2.2, 3.4)}`, stroke: OUT, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, t);
    el('path', { d: `M${at(2.2, -3.4)} L${at(2.2, 3.4)}`, stroke: '#e0a21c', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, t);
    el('path', { d: `M${at(-2.4)} L${at(1.6)}`, stroke: '#5a3a22', 'stroke-width': 1.8 }, t);
    outlined(t, 'circle', { cx: H[0] - dx * 3, cy: H[1] - dy * 3, r: 1.2, fill: '#e0a21c' }, 0.5);
    arm(t, S, [8, -10.8], H, front, 2.8);
    hand(t, H[0], H[1], skin);
  } else if (weapon === 'axe') {
    const H = [10.3, -15.4];
    el('path', { d: 'M9.2 2 L11.2 -32', stroke: OUT, 'stroke-width': 3.4 }, t);
    el('path', { d: 'M9.2 2 L11.2 -32', stroke: '#8a5a2e', 'stroke-width': 2 }, t);
    outlined(t, 'path', { d: 'M10.6 -33 Q22.2 -36 21.2 -22 Q16.2 -27 11 -25.6 Z', fill: 'url(#steel)' }, 1);
    el('path', { d: 'M12.2 -31.6 Q19.2 -33 19.8 -25', stroke: '#ffffff', 'stroke-width': 0.8, fill: 'none', opacity: 0.8 }, t);
    outlined(t, 'path', { d: 'M10.8 -33 Q6.2 -34 5.2 -29 Q8.2 -30 10.8 -28 Z', fill: 'url(#steel)' }, 0.8);
    arm(t, S, [8.4 * Math.min(big, 1.15), -11], H, o.fur ? skin : front, 3 * big);
    hand(t, H[0], H[1], skin);
  } else if (weapon === 'staff') {
    const H = [10, -17];
    el('path', { d: 'M10 3 L10 -38', stroke: OUT, 'stroke-width': 3 }, t);
    el('path', { d: 'M10 3 L10 -38', stroke: '#6e4524', 'stroke-width': 1.7 }, t);
    outlined(t, 'path', { d: 'M5 -40 Q10 -50 15 -40 Q12 -44 10 -38 Q8 -44 5 -40 Z', fill: 'url(#gold)' }, 0.7);
    const orb = el('circle', { cx: 10, cy: -45, r: 8, fill: o.orb || 'url(#glow)', filter: 'url(#bloom)' }, t);
    anim(orb, { attributeName: 'r', values: '7;9;7', dur: '1.6s' });
    outlined(t, 'circle', { cx: 10, cy: -45, r: 2.8, fill: '#ffffff' }, 0.5);
    arm(t, S, [8.2, -11.6], H, front, 2.8);
    hand(t, H[0], H[1], skin);
  } else {
    arm(t, S, [6.4 * big, -12], [6 * big, -8.4], front, 2.8 * big);
    hand(t, 6 * big, -8.2, skin);
  }
  if (shield) {
    outlined(t, 'circle', { cx: -6.5, cy: -11, r: 6.6, fill: 'url(#steel)' }, 1.3);
    el('circle', { cx: -6.5, cy: -11, r: 5.2, fill: shield }, t);
    emblemAt(t, -6.5, -11, 2.4, o.emblem || 'sun');
    el('path', { d: 'M-11 -13 Q-10 -16 -7 -16.6', stroke: '#ffffff', 'stroke-width': 0.9, opacity: 0.6, fill: 'none' }, t);
  }
  if (o.crown) {
    outlined(t, 'path', { d: 'M-6.4 -31 L-6.4 -37 L-3.4 -34 L0 -39 L3.4 -34 L6.4 -37 L6.4 -31 Z', fill: 'url(#gold)' }, 0.9);
    [[-6.4, -37.4], [0, -39.4], [6.4, -37.4]].forEach(([a, b]) => outlined(t, 'circle', { cx: a, cy: b, r: 1.1, fill: '#e2342a' }, 0.4));
    el('path', { d: 'M-5.6 -32.6 H5.6', stroke: '#fff2b0', 'stroke-width': 0.6 }, t);
  }
  if (o.glowEyes) el('ellipse', { cx: 2.6, cy: -23.6, rx: 1.4, ry: 1.2, fill: o.glowEyes, filter: 'url(#bloom)' }, t);
  if (o.hp !== undefined) hpBar(t, 0, o.crown ? -48 : -44, o.hp, 14);
  return t;
}
const ARCHER = { tunic: '#f4efe2', trim: '#2f7a3d', headColor: '#2f7a3d', weapon: 'bow', moustache: true, quiver: true, legs: '#6b4a2e' };
const SPEAR = { tunic: '#f4efe2', trim: '#c8361d', head: 'helmet', headColor: '#c8361d', weapon: 'spear', shield: '#c8361d', emblem: 'lotus', moustache: true, armor: 'url(#steel)' };
const KNIGHT = { tunic: '#2f5fb0', trim: '#1f3f86', head: 'helmet', headColor: '#ffd23a', weapon: 'sword', shield: '#1f4f9a', cape: '#1f4f9a', moustache: true, armor: 'url(#steel)', visor: true };
const HOLY = { tunic: '#fff7e0', trim: '#e0a21c', head: 'helmet', headColor: '#ffffff', weapon: 'sword', shield: '#e0a21c', cape: '#e0a21c', aura: true, moustache: true, armor: 'url(#gold)', visor: true };
const SUN = { ...{ tunic: '#fff1c8', trim: '#c8361d', weapon: 'sword', shield: '#c8361d', emblem: 'sun', aura: true, moustache: true, armor: 'url(#gold)' }, head: 'turban', headColor: '#e0a21c', cape: '#c8361d' };
const MAGE = { tunic: '#3f4fa8', trim: '#ffd23a', head: 'hood', headColor: '#3f4fa8', weapon: 'staff', beard: '#f2efe8' };
const BANDIT = { tunic: '#4a3c55', trim: '#2d2a33', head: 'mask', headColor: '#2d2a33', weapon: 'sword', skin: '#c98758', angry: true, legs: '#2d2a33' };
const BARBARIAN = { tunic: '#8a5a32', trim: '#e9dcc0', head: 'horns', weapon: 'axe', skin: '#d99766', big: 1.35, cape: '#6b4a2e', beard: '#c0502a', fur: '#e9dcc0', angry: true };
const SHAMAN = { tunic: '#3d6b3a', trim: '#b8e05a', head: 'hood', headColor: '#2f4f2d', weapon: 'staff', orb: 'url(#glowG)', angry: true, beard: '#d9d4c8' };
const BRUTE = { tunic: '#6b6f7a', trim: '#3a3d45', head: 'helmet', headColor: '#7a1f1f', weapon: 'axe', shield: '#5a3a22', big: 1.5, cape: '#7a1f1f', armor: 'url(#darksteel)', angry: true, visor: true };

function wolfRider(p, x, y, s = 1, flip = false, hp) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  cast(t, 0, 0, 14, 3.5, 0.16); shadow(t, 0, 1, 16, 4);
  outlined(t, 'path', { d: 'M-16 -6 Q-22 -10 -28 -6 Q-24 -12 -18 -12 Z', fill: '#7a7c84' }, 1);
  outlined(t, 'path', { d: 'M-16 -6 Q-14 -16 0 -15 Q10 -15 14 -18 L22 -22 L25 -16 L18 -12 Q16 -4 10 -4 L8 0 L4 0 L4 -5 L-8 -5 L-9 0 L-13 0 L-13 -5 Q-20 -2 -22 -10 Z', fill: '#8d8f96' }, 1.4);
  el('path', { d: 'M-12 -6 Q0 -3 10 -5', stroke: '#c9cbd0', 'stroke-width': 2.2, fill: 'none' }, t);
  el('path', { d: 'M-14 -14 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3', stroke: '#5f6168', 'stroke-width': 1, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M19 -22 L18 -28 L22 -23 Z', fill: '#8d8f96' }, 0.8);
  el('circle', { cx: 20.6, cy: -18.4, r: 1.2, fill: '#ffde3a', filter: 'url(#bloom)' }, t);
  el('path', { d: 'M22 -15 l1 2 l1 -2 l1 2', stroke: '#ffffff', 'stroke-width': 0.8, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M-8 -15 Q0 -12 8 -15 L6 -10 Q0 -8 -6 -10 Z', fill: '#7a1f1f' }, 0.8);
  person(t, -1, -12, { ...BANDIT, s: 0.75, weapon: 'spear' });
  if (hp !== undefined) hpBar(t, 0, -50, hp, 18);
}
function elephant(p, x, y, s = 1, flip = false, enemy = true, hp) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
  cast(t, 0, 0, 30, 6, 0.2); shadow(t, 0, 2, 32, 7);
  const body = enemy ? '#7d7a86' : '#9d99a3';
  el('path', { d: 'M-30 -14 Q-36 -10 -34 -4', stroke: OUT, 'stroke-width': 1.6, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M-30 -8 Q-32 -36 -2 -38 Q24 -38 28 -18 L28 0 L20 0 L20 -6 L6 -6 L6 0 L-2 0 L-2 -6 L-16 -6 L-16 0 L-24 0 L-24 -6 Q-30 -4 -30 -8 Z', fill: body }, 1.8);
  el('path', { d: 'M-28 -10 Q-10 -2 26 -8 L28 0 L20 0 L20 -6 L6 -6 L6 0 L-2 0 L-2 -6 L-16 -6 L-16 0 L-24 0 L-24 -6 Z', fill: '#000', opacity: 0.15 }, t);
  [-22, -14, 0, 8, 22].forEach((a) => el('path', { d: `M${a - 1.6} 0 q1.6 -1.6 3.2 0`, stroke: '#f2ead8', 'stroke-width': 1, fill: 'none' }, t));
  outlined(t, 'path', { d: 'M24 -28 Q40 -30 38 -12 Q37 -2 44 0 Q36 4 32 -6 Q30 -14 26 -16 Z', fill: body }, 1.6);
  [[33, -20], [34, -14], [35, -8]].forEach(([a, b]) => el('path', { d: `M${a - 2} ${b} q2 1 4 0`, stroke: OUT, 'stroke-width': 0.6, fill: 'none', opacity: 0.6 }, t));
  outlined(t, 'path', { d: 'M28 -14 Q38 -10 43 -19 Q36 -12 28 -16 Z', fill: '#fff3dc' }, 1);
  if (enemy) outlined(t, 'path', { d: 'M40 -18 l3 -2 l-1 3 Z', fill: '#c9ccd2' }, 0.5);
  outlined(t, 'path', { d: 'M12 -36 Q4 -20 16 -14 Q22 -22 18 -34 Z', fill: enemy ? '#6c6976' : '#8c8893' }, 1.2);
  el('path', { d: 'M13 -32 Q8 -22 15 -17', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.3, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M22 -34 Q30 -36 34 -28 L26 -24 Z', fill: enemy ? 'url(#darksteel)' : 'url(#gold)' }, 0.9);
  el('circle', { cx: 26, cy: -27, r: 1.7, fill: enemy ? '#ff4a2a' : OUT }, t);
  outlined(t, 'path', { d: 'M-24 -34 H10 V-12 Q-8 -8 -24 -12 Z', fill: enemy ? '#3a2f4a' : 'url(#red)' }, 1.4);
  el('path', { d: 'M-24 -14 Q-8 -10 10 -14', stroke: enemy ? '#b9bcc4' : '#ffd23a', 'stroke-width': 2.4, fill: 'none' }, t);
  for (let i = 0; i < 5; i++) {
    const cx = -20 + i * 7, trimC = enemy ? '#b9bcc4' : '#ffd23a';
    el('circle', { cx, cy: -24, r: 1.7, fill: trimC }, t);
    el('path', { d: `M${cx} -12 v4`, stroke: trimC, 'stroke-width': 1 }, t);
    el('circle', { cx, cy: -7.4, r: 1, fill: enemy ? '#8a1f1f' : '#e2461d' }, t);
  }
  outlined(t, 'path', { d: 'M-20 -34 L-18 -48 H4 L6 -34 Z', fill: enemy ? '#4a3c55' : 'url(#gold)' }, 1.4);
  el('path', { d: 'M-18 -44 H4', stroke: enemy ? '#b9bcc4' : '#e2461d', 'stroke-width': 1 }, t);
  if (enemy) for (let i = 0; i < 4; i++) outlined(t, 'path', { d: `M${-18 + i * 6.5} -48 l2 -7 l2 7 Z`, fill: 'url(#steel)' }, 0.8);
  if (enemy) person(t, 20, -34, { ...BANDIT, s: 0.6, weapon: 'spear' });
  if (hp !== undefined) hpBar(t, 0, -66, hp, 30);
}

// ============================================================ towers
function plot(p, x, y) {
  const t = g(p, { transform: `translate(${x} ${y})` });
  shadow(t, 0, 3, 26, 9);
  outlined(t, 'ellipse', { cx: 0, cy: 0, rx: 24, ry: 10, fill: '#9a6a3e' }, 1.8);
  el('ellipse', { cx: 0, cy: -1.5, rx: 20, ry: 7.5, fill: '#c9955e' }, t);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; el('path', { d: `M${Math.cos(a) * 20} ${Math.sin(a) * 7.5 - 1.5} L${Math.cos(a) * 24} ${Math.sin(a) * 10}`, stroke: '#7a4f2a', 'stroke-width': 0.8 }, t); }
  [[-8, -2], [6, 0], [0, -4]].forEach(([a, b]) => tuft(t, a, b));
  outlined(t, 'path', { d: 'M15 0 V-14', fill: 'none' }, 1.6);
  outlined(t, 'rect', { x: 9, y: -22, width: 13, height: 9, rx: 1.5, fill: 'url(#wood)' }, 1);
  el('path', { d: 'M15.5 -20 v5 M13 -17.5 h5', stroke: '#fff4dc', 'stroke-width': 1.4 }, t);
  return t;
}
function base(t, rx = 24) {
  cast(t, 0, 0, rx + 8, 9);
  shadow(t, 0, 3, rx + 4, 10);
  outlined(t, 'ellipse', { cx: 0, cy: 0, rx, ry: 10, fill: '#9a6a3e' }, 1.8);
  el('ellipse', { cx: 0, cy: -1.6, rx: rx - 2, ry: 8, fill: '#b98552' }, t);
  for (let i = 0; i < 12; i++) { const a = Math.PI * (0.05 + i * 0.08); el('path', { d: `M${Math.cos(a) * rx} ${Math.sin(a) * 10} l0 -3`, stroke: '#7a4f2a', 'stroke-width': 0.7 }, t); }
}
function ao(t, x, y, w) { el('rect', { x, y: y - 6, width: w, height: 6, fill: 'url(#ao)' }, t); }
function jharokha(t, x, y) {
  outlined(t, 'path', { d: `M${x - 7} ${y + 6} H${x + 7} L${x + 5} ${y + 9} H${x - 5} Z`, fill: '#e8b47a' }, 0.9);
  [x - 5, x, x + 5].forEach((bx) => outlined(t, 'path', { d: `M${bx - 1} ${y + 9} l1 3 l1 -3 Z`, fill: '#c98c4c' }, 0.5));
  outlined(t, 'rect', { x: x - 6, y: y - 3, width: 12, height: 9, fill: '#f3cf97' }, 0.9);
  const win = el('path', { d: `M${x - 4} ${y + 5} V${y - 1} Q${x} ${y - 4} ${x + 4} ${y - 1} V${y + 5} Z`, fill: '#ffcf6a' }, t);
  anim(win, { attributeName: 'fill', values: '#ffcf6a;#ffb84a;#ffcf6a', dur: '2.4s' });
  el('path', { d: `M${x - 3} ${y + 1} H${x + 3} M${x - 3} ${y + 3} H${x + 3} M${x} ${y - 2} V${y + 5}`, stroke: '#7a4a22', 'stroke-width': 0.6 }, t);
  outlined(t, 'path', { d: `M${x - 7.5} ${y - 3} Q${x} ${y - 12} ${x + 7.5} ${y - 3} Z`, fill: 'url(#saffron)' }, 0.9);
  el('circle', { cx: x, cy: y - 10.6, r: 1, fill: '#ffd23a', stroke: OUT, 'stroke-width': 0.4 }, t);
}
function door(t, x, w, h) {
  outlined(t, 'path', { d: `M${x - w / 2 - 2} 0 V${-h + 3} Q${x} ${-h - 5} ${x + w / 2 + 2} ${-h + 3} V0`, fill: '#f6dcae' }, 1.1);
  outlined(t, 'path', { d: `M${x - w / 2} 0 V${-h + 4} Q${x} ${-h - 2} ${x + w / 2} ${-h + 4} V0 Z`, fill: 'url(#wood)' }, 1.1);
  el('path', { d: `M${x} 0 V${-h - 1}`, stroke: '#3a2414', 'stroke-width': 0.8 }, t);
  el('path', { d: `M${x - w / 2} ${-h * 0.35} H${x + w / 2} M${x - w / 2} ${-h * 0.7} H${x + w / 2}`, stroke: '#4c505b', 'stroke-width': 1.1 }, t);
  for (let i = 0; i < 4; i++) for (const yy of [-h * 0.35, -h * 0.7]) el('circle', { cx: x - w / 2 + 1.4 + i * ((w - 2.8) / 3), cy: yy, r: 0.6, fill: '#ffd66b' }, t);
}
function archerTower(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  base(t);
  outlined(t, 'path', { d: 'M-18 0 L-16 -38 H16 L18 0 Q0 6 -18 0 Z', fill: 'url(#sand)' }, 1.8);
  stones(t, -16, -38, 32, 38);
  el('path', { d: 'M-16 -37 L-17.6 -1 L-12 -0.4 L-11 -37 Z', fill: '#ffffff', opacity: 0.2 }, t);
  el('path', { d: 'M10 -37 L11.6 -0.6 L18 0 L16 -38 Z', fill: '#7a4a22', opacity: 0.28 }, t);
  ao(t, -17, 0, 35);
  [-10, 10].forEach((a) => outlined(t, 'rect', { x: a - 1.2, y: -30, width: 2.4, height: 7, rx: 1, fill: '#2a1e18' }, 0.6));
  door(t, 0, 10, 14);
  jharokha(t, 0, -24);
  el('path', { d: 'M-14 -10 l2 4 l-1 3 M13 -20 l-2 3', stroke: OUT, 'stroke-width': 0.6, opacity: 0.6, fill: 'none' }, t);
  moss(t, [[-15, -2, 2.4], [14, -1, 2], [-12, -16, 1.5]]);
  torch(t, -10, -8); torch(t, 10, -8);
  outlined(t, 'path', { d: 'M-22 -40 H22 L19 -37 H-19 Z', fill: '#c98c4c' }, 1.2);
  for (let i = -16; i <= 16; i += 8) outlined(t, 'path', { d: `M${i - 1.2} -37 l1.2 3 l1.2 -3 Z`, fill: '#a8723e' }, 0.5);
  outlined(t, 'rect', { x: -21, y: -46, width: 42, height: 6, rx: 1.5, fill: 'url(#sandV)' }, 1.6);
  for (let i = -19; i <= 15; i += 6.8) outlined(t, 'path', { d: `M${i} -46 V-50 Q${i + 2.2} -53 ${i + 4.4} -50 V-46 Z`, fill: 'url(#sandTop)' }, 1.1);
  banner(t, -16.5, -38, 7, 16, 'url(#green)', 'sun');
  person(t, -7, -47, { ...ARCHER, s: 0.62 });
  person(t, 7, -47, { ...ARCHER, s: 0.62 });
  flag(t, 18, -52, 18, 'url(#green)');
  return t;
}
function barracks(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  base(t, 30);
  outlined(t, 'rect', { x: -28, y: -32, width: 56, height: 8, fill: 'url(#sandV)' }, 1.2);
  for (let i = -27; i < 26; i += 6) outlined(t, 'path', { d: `M${i} -32 v-3 q2 -2 4 0 v3 Z`, fill: 'url(#sandTop)' }, 0.8);
  outlined(t, 'path', { d: 'M-24 0 V-26 H24 V0 Q0 6 -24 0 Z', fill: 'url(#sand)' }, 1.8);
  stones(t, -24, -26, 48, 26);
  el('path', { d: 'M-24 -26 V0 L-19 1 V-26 Z', fill: '#ffffff', opacity: 0.18 }, t);
  el('path', { d: 'M18 -26 V1 L24 0 V-26 Z', fill: '#7a4a22', opacity: 0.25 }, t);
  ao(t, -24, 0, 48);
  outlined(t, 'path', { d: 'M-27 -24 L-22 -30 H22 L27 -24 Z', fill: 'url(#tiles)' }, 1.2);
  for (let i = -24; i < 24; i += 3.5) el('path', { d: `M${i} -24 l1.6 -6`, stroke: '#7a2410', 'stroke-width': 0.6 }, t);
  door(t, 0, 14, 16);
  for (const wx of [-16, 16]) {
    outlined(t, 'rect', { x: wx - 3.6, y: -20, width: 7.2, height: 9, rx: 3.6, fill: '#2a1e18' }, 0.9);
    el('path', { d: `M${wx - 3} -16 H${wx + 3} M${wx} -19.4 V-11`, stroke: '#e8b47a', 'stroke-width': 0.7 }, t);
  }
  outlined(t, 'circle', { cx: -16, cy: -5.5, r: 3.6, fill: 'url(#red)' }, 0.8);
  emblemAt(t, -16, -5.5, 1.6, 'lotus');
  torch(t, -10, -4); torch(t, 10, -4);
  moss(t, [[-22, -1, 2.2], [21, -2, 2]]);
  for (const cx of [-15, 15]) {
    outlined(t, 'path', { d: `M${cx - 7} -35 V-39 H${cx + 7} V-35`, fill: '#f1c98d' }, 1.2);
    outlined(t, 'path', { d: `M${cx - 8} -39 Q${cx} -53 ${cx + 8} -39 Z`, fill: 'url(#marble)' }, 1.3);
    el('path', { d: `M${cx - 4} -42 Q${cx} -50 ${cx + 2} -50`, stroke: '#ffffff', 'stroke-width': 0.9, fill: 'none' }, t);
    el('circle', { cx, cy: -53, r: 1.6, fill: '#ffd23a', stroke: OUT, 'stroke-width': 0.6 }, t);
  }
  flag(t, 0, -32, 28, 'url(#red)', 16);
  [27, 30, 33].forEach((sx) => { el('path', { d: `M${sx} 2 L${sx + 1} -20`, stroke: '#7a4a22', 'stroke-width': 1 }, t); outlined(t, 'path', { d: `M${sx + 1} -24 l1.6 4 h-3.2 Z`, fill: 'url(#steel)' }, 0.5); });
  outlined(t, 'path', { d: 'M26 -10 H36', fill: 'none' }, 1.2);
  outlined(t, 'path', { d: 'M-34 2 Q-37 -4 -33 -7 H-27 Q-23 -4 -26 2 Z', fill: '#b5652d' }, 0.9);
  outlined(t, 'path', { d: 'M-30 3 Q-32 -2 -29 -4 H-25 Q-22 -2 -24 3 Z', fill: '#c8763a' }, 0.9);
  return t;
}
function mageTower(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  base(t, 22);
  const mc = el('ellipse', { cx: 0, cy: -1, rx: 20, ry: 7, fill: 'none', stroke: '#8fd8ff', 'stroke-width': 1.2, 'stroke-dasharray': '3 2', filter: 'url(#bloom)', opacity: 0.9 }, t);
  anim(mc, { attributeName: 'stroke-dashoffset', values: '0;20', dur: '3s' });
  outlined(t, 'path', { d: 'M-15 0 L-10 -44 H10 L15 0 Q0 5 -15 0 Z', fill: 'url(#marble)' }, 1.8);
  el('path', { d: 'M-14 -1 L-9.6 -43 L-6 -43 L-9 -1 Z', fill: '#ffffff', opacity: 0.5 }, t);
  el('path', { d: 'M7 -43 L10 -43 L15 0 L10 1 Z', fill: '#7a6f60', opacity: 0.25 }, t);
  ao(t, -15, 0, 30);
  for (const yy of [-14, -30]) {
    el('path', { d: `M-13 ${yy} Q0 ${yy + 3} 13 ${yy}`, stroke: '#3f4fa8', 'stroke-width': 2.4, fill: 'none' }, t);
    el('path', { d: `M-13 ${yy + 2} Q0 ${yy + 5} 13 ${yy + 2}`, stroke: '#e0a21c', 'stroke-width': 0.9, fill: 'none' }, t);
    [-8, 0, 8].forEach((fx) => { el('circle', { cx: fx, cy: yy - 4, r: 1.3, fill: '#c8361d' }, t); [[0, -1.6], [1.6, 0], [0, 1.6], [-1.6, 0]].forEach(([a, b]) => el('circle', { cx: fx + a, cy: yy - 4 + b, r: 0.8, fill: '#2f7a3d' }, t)); });
  }
  const win = outlined(t, 'path', { d: 'M-4 -18 Q0 -26 4 -18 V-8 H-4 Z', fill: '#8fd8ff' }, 1);
  anim(win, { attributeName: 'fill', values: '#8fd8ff;#d2f0ff;#8fd8ff', dur: '1.8s' });
  el('path', { d: 'M0 -23 V-8 M-4 -14 H4', stroke: '#3f4fa8', 'stroke-width': 0.6 }, t);
  outlined(t, 'rect', { x: -12, y: -48, width: 24, height: 4, rx: 1, fill: 'url(#gold)' }, 1);
  for (let layer = 0; layer < 2; layer++) for (let i = -2; i <= 2; i++) outlined(t, 'path', { d: `M${i * 5} -48 Q${i * 5 - 5} ${-58 + layer * 3} ${i * 5} ${-64 + layer * 4} Q${i * 5 + 5} ${-58 + layer * 3} ${i * 5} -48 Z`, fill: layer ? '#ffd0df' : (i % 2 ? '#ff9fc0' : '#ffbcd2') }, 0.9);
  const halo = el('circle', { cx: 0, cy: -74, r: 18, fill: 'url(#glow)' }, t);
  anim(halo, { attributeName: 'r', values: '16;20;16', dur: '1.6s' });
  outlined(t, 'circle', { cx: 0, cy: -74, r: 6.4, fill: '#bfe8ff' }, 1.2);
  el('circle', { cx: -2, cy: -76, r: 2.2, fill: '#ffffff' }, t);
  [[-16, -70], [16, -78], [-12, -86], [12, -64]].forEach(([a, b], i) => {
    const c = outlined(t, 'path', { d: `M${a} ${b - 4} l2.4 4 l-2.4 4 l-2.4 -4 Z`, fill: '#9fdcff' }, 0.6);
    el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;0 -2.4;0 0', dur: `${1.6 + i * 0.3}s`, repeatCount: 'indefinite' }, c);
  });
  person(t, -15, -1, { ...MAGE, s: 0.6 });
  return t;
}
function cannonTower(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  base(t, 27);
  outlined(t, 'path', { d: 'M-22 0 V-14 L-14 -20 H14 L22 -14 V0 Q0 6 -22 0 Z', fill: 'url(#sand)' }, 1.8);
  stones(t, -22, -14, 44, 14);
  el('path', { d: 'M-22 -14 V0 L-17 1 V-15 Z', fill: '#ffffff', opacity: 0.18 }, t);
  outlined(t, 'path', { d: 'M-22 -14 L-14 -20 H14 L22 -14 Q0 -10 -22 -14 Z', fill: 'url(#sandTop)' }, 1.4);
  ao(t, -22, 0, 44);
  [[-18, -18], [-12, -20]].forEach(([a, b]) => { outlined(t, 'rect', { x: a - 3, y: b - 7, width: 6, height: 8, rx: 2, fill: 'url(#wood)' }, 0.8); el('path', { d: `M${a - 3} ${b - 5} h6 M${a - 3} ${b - 1} h6`, stroke: '#4c505b', 'stroke-width': 0.8 }, t); });
  outlined(t, 'path', { d: 'M-8 -18 L12 -24 L14 -18 L-6 -14 Z', fill: 'url(#wood)' }, 1.1);
  outlined(t, 'path', { d: 'M-10 -24 L18 -36 L21.4 -30 L-6.4 -17 Z', fill: 'url(#bronze)' }, 1.6);
  el('path', { d: 'M-8 -22 L18 -34', stroke: '#fff2b8', 'stroke-width': 1, opacity: 0.8 }, t);
  outlined(t, 'ellipse', { cx: 19.8, cy: -33, rx: 2.4, ry: 3.6, fill: '#3a2414', transform: 'rotate(-24 19.8 -33)' }, 1);
  [[-2, -25], [6, -29], [12, -32]].forEach(([a, b]) => outlined(t, 'path', { d: `M${a} ${b} l2 4`, fill: 'none' }, 1.6));
  outlined(t, 'circle', { cx: -4, cy: -15, r: 6, fill: 'none' }, 2);
  el('circle', { cx: -4, cy: -15, r: 6, fill: 'none', stroke: '#8a5a32', 'stroke-width': 1.4 }, t);
  el('path', { d: 'M-4 -21 V-9 M-10 -15 H2', stroke: '#5a3a22', 'stroke-width': 1 }, t);
  outlined(t, 'circle', { cx: -4, cy: -15, r: 1.4, fill: '#e0a21c' }, 0.5);
  for (let i = -18; i <= 14; i += 8) outlined(t, 'path', { d: `M${i} -13 v-4 q2 -2.4 4 0 v4 Z`, fill: 'url(#sandTop)' }, 0.8);
  [[12, -14], [16, -14], [14, -17]].forEach(([a, b]) => { outlined(t, 'circle', { cx: a, cy: b, r: 2.4, fill: '#3a3d45' }, 0.7); el('circle', { cx: a - 0.7, cy: b - 0.8, r: 0.7, fill: '#9aa0aa' }, t); });
  person(t, -22, -14, { tunic: '#f4efe2', trim: '#c8361d', headColor: '#c8361d', s: 0.55, moustache: true });
  el('path', { d: 'M-18 -22 L-10 -30', stroke: '#6e4524', 'stroke-width': 1 }, t);
  spark(t, -10, -30, 3);
  flag(t, 24, -2, 28, 'url(#red)');
  return t;
}
function fortGate(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  cast(t, 0, 0, 70, 12, 0.22);
  shadow(t, 0, 4, 64, 12);
  outlined(t, 'path', { d: 'M-40 -44 L-52 -54 H52 L40 -44 Z', fill: 'url(#sandTop)' }, 1.4);
  outlined(t, 'path', { d: 'M-40 0 V-44 H40 V0 Z', fill: 'url(#sand)' }, 2);
  stones(t, -40, -44, 80, 44, '#a8723e', 7);
  ao(t, -40, 0, 80);
  for (let i = -38; i < 38; i += 9) outlined(t, 'path', { d: `M${i} -44 V-50 Q${i + 3} -54 ${i + 6} -50 V-44 Z`, fill: 'url(#sandTop)' }, 1.2);
  person(t, -26, -47, { ...SPEAR, s: 0.55 });
  person(t, 26, -47, { ...ARCHER, s: 0.55 });
  door(t, 0, 28, 30);
  jharokha(t, 0, -40);
  torch(t, -20, -10); torch(t, 20, -10);
  banner(t, -36, -42, 9, 22, 'url(#saffron)', 'sun');
  banner(t, 27, -42, 9, 22, 'url(#saffron)', 'sun');
  moss(t, [[-36, -2, 2.6], [34, -1, 2.4]]);
  for (const cx of [-48, 48]) {
    outlined(t, 'path', { d: `M${cx - 14} 0 L${cx - 12} -64 H${cx + 12} L${cx + 14} 0 Z`, fill: 'url(#sand)' }, 2);
    stones(t, cx - 12, -64, 24, 64, '#a8723e', 7);
    el('path', { d: `M${cx - 12} -63 L${cx - 13.6} -1 L${cx - 8} 0 L${cx - 7} -63 Z`, fill: '#ffffff', opacity: 0.18 }, t);
    outlined(t, 'rect', { x: cx - 3, y: -46, width: 6, height: 12, rx: 3, fill: '#2a1e18' }, 1);
    outlined(t, 'rect', { x: cx - 2, y: -24, width: 4, height: 8, rx: 2, fill: '#2a1e18' }, 0.8);
    outlined(t, 'path', { d: `M${cx - 16} -64 H${cx + 16} L${cx + 13} -61 H${cx - 13} Z`, fill: '#c98c4c' }, 1);
    [-9, -3, 3, 9].forEach((dx) => outlined(t, 'rect', { x: cx + dx - 1, y: -74, width: 2, height: 10, fill: 'url(#marble)' }, 0.8));
    outlined(t, 'rect', { x: cx - 13, y: -66, width: 26, height: 3, fill: 'url(#red)' }, 1.1);
    outlined(t, 'path', { d: `M${cx - 13} -74 Q${cx} -94 ${cx + 13} -74 Z`, fill: 'url(#saffron)' }, 1.4);
    el('path', { d: `M${cx - 7} -78 Q${cx - 2} -88 ${cx + 2} -88`, stroke: '#ffe0a0', 'stroke-width': 1.1, fill: 'none' }, t);
    el('circle', { cx, cy: -93, r: 1.8, fill: '#ffd23a', stroke: OUT, 'stroke-width': 0.6 }, t);
    moss(t, [[cx - 10, -2, 2.4]]);
  }
  flag(t, 48, -95, 20, 'url(#saffron)', 18);
}

// ============================================================ currency icons
function coinIcon(p, x, y, r = 8) {
  const t = g(p);
  outlined(t, 'ellipse', { cx: x, cy: y + r * 0.16, rx: r, ry: r * 0.98, fill: '#8a5a0c' }, 1.1);
  for (let i = 0; i < 12; i++) { const a = Math.PI * (0.1 + i * 0.07); el('path', { d: `M${x + Math.cos(a) * r * 0.98} ${y + r * 0.16 + Math.sin(a) * r * 0.96} v${-r * 0.16}`, stroke: '#5a3a08', 'stroke-width': 0.5 }, t); }
  outlined(t, 'circle', { cx: x, cy: y, r, fill: 'url(#gold)' }, 1.1);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; el('path', { d: `M${x + Math.cos(a) * r * 0.78} ${y + Math.sin(a) * r * 0.78} L${x + Math.cos(a) * r * 0.92} ${y + Math.sin(a) * r * 0.92}`, stroke: '#a46b1d', 'stroke-width': Math.max(0.4, r * 0.05) }, t); }
  el('circle', { cx: x, cy: y, r: r * 0.7, fill: 'none', stroke: '#a46b1d', 'stroke-width': Math.max(0.5, r * 0.07) }, t);
  // embossed sun: dark copy offset down-right, light copy on top
  for (const [off, col] of [[r * 0.06, '#9a6410'], [0, '#ffe9a0']]) {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el('path', { d: `M${x + off + Math.cos(a) * r * 0.3} ${y + off + Math.sin(a) * r * 0.3} L${x + off + Math.cos(a) * r * 0.55} ${y + off + Math.sin(a) * r * 0.55}`, stroke: col, 'stroke-width': Math.max(0.5, r * 0.09), 'stroke-linecap': 'round' }, t); }
    el('circle', { cx: x + off, cy: y + off, r: r * 0.22, fill: col }, t);
  }
  el('path', { d: `M${x - r * 0.62} ${y - r * 0.2} A${r * 0.66} ${r * 0.66} 0 0 1 ${x + r * 0.1} ${y - r * 0.64}`, stroke: '#fffbe6', 'stroke-width': Math.max(0.7, r * 0.12), fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, t);
  sparkle(t, x + r * 0.62, y - r * 0.62, r * 0.38);
  return t;
}
function rubyIcon(p, x, y, r = 8) {
  const t = g(p);
  el('circle', { cx: x, cy: y, r: r * 1.15, fill: 'url(#holy)', opacity: 0.35 }, t);
  const P = (dx, dy) => `${x + dx * r} ${y + dy * r}`;
  // outline of a cushion-cut gem: crown above the girdle, pavilion below
  outlined(t, 'path', { d: `M${P(-1, -0.25)} L${P(-0.58, -0.82)} L${P(0.58, -0.82)} L${P(1, -0.25)} L${P(0, 1)} Z`, fill: '#a8101a' }, Math.max(0.8, r * 0.12));
  const face = (pts, fill, op = 1) => el('path', { d: 'M' + pts.map(([a, b]) => P(a, b)).join(' L') + ' Z', fill, opacity: op }, t);
  face([[-0.58, -0.82], [0.58, -0.82], [0.34, -0.42], [-0.34, -0.42]], '#ff6a58');
  face([[-1, -0.25], [-0.58, -0.82], [-0.34, -0.42]], '#ff8a78');
  face([[1, -0.25], [0.58, -0.82], [0.34, -0.42]], '#d82a2a');
  face([[-1, -0.25], [-0.34, -0.42], [0.34, -0.42], [1, -0.25]], '#e83a36');
  face([[-1, -0.25], [-0.34, -0.25], [0, 1]], '#c41a22');
  face([[-0.34, -0.25], [0.34, -0.25], [0, 1]], '#8a0a14');
  face([[0.34, -0.25], [1, -0.25], [0, 1]], '#6a0610');
  el('path', { d: `M${P(-1, -0.25)} L${P(1, -0.25)}`, stroke: '#ffb0a0', 'stroke-width': Math.max(0.4, r * 0.06) }, t);
  face([[-0.46, -0.72], [-0.12, -0.72], [-0.3, -0.5]], '#ffffff', 0.85);
  face([[-0.7, -0.16], [-0.44, -0.16], [-0.16, 0.36]], '#ffffff', 0.35);
  sparkle(t, x + r * 0.62, y - r * 0.7, r * 0.42);
  return t;
}
function sparkle(p, x, y, r) {
  el('path', { d: `M${x} ${y - r} Q${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} Q${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} Q${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} Q${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r} Z`, fill: '#ffffff' }, p);
}

// ============================================================ region enemies
function bumpy(cx, cy, rx, ry, n = 14, amp = 0.12, a0 = 0, a1 = Math.PI * 2) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, rr = 1 + (i % 2 ? amp : -amp * 0.3);
    d += `${i ? 'L' : 'M'}${cx + Math.cos(a) * rx * rr} ${cy + Math.sin(a) * ry * rr} `;
  }
  return d + (a1 - a0 >= Math.PI * 2 - 0.01 ? 'Z' : '');
}
const facing = (p, x, y, s, flip) => g(p, { transform: `translate(${x} ${y}) scale(${flip ? -s : s} ${s})` });
const BANDIT_KING = { tunic: '#3a2f4a', trim: '#e0a21c', head: 'mask', headColor: '#2d2a33', weapon: 'axe', skin: '#c98758', angry: true, big: 1.4, cape: '#7a1f1f', crown: true, armor: 'url(#darksteel)', legs: '#2d2a33' };
const CAMEL_RIDER = { tunic: '#c9a06a', trim: '#7a1f1f', head: 'mask', headColor: '#e8d2a6', weapon: 'spear', skin: '#c98758', angry: true };
const RIVER_RAIDER = { tunic: '#3d5a6b', trim: '#c8361d', head: 'mask', headColor: '#2a4a5a', weapon: 'sword', skin: '#b87848', angry: true };
const MUD_BRUTE = { tunic: '#6b4a2e', trim: '#3a2414', head: 'horns', weapon: 'axe', skin: '#9a6a4a', big: 1.5, beard: '#4a3020', fur: '#8a6a4a', angry: true };
const NIGHT_STALKER = { tunic: '#1f1a2e', trim: '#6a3fc0', head: 'hood', headColor: '#16121f', weapon: 'sword', skin: '#6a5a78', cape: '#2a1f3e', angry: true, glowEyes: '#c9a0ff' };
const RIVER_PIRATE = { tunic: '#e9dcc0', trim: '#c8361d', head: 'turban', headColor: '#c8361d', weapon: 'sword', skin: '#b87848', angry: true, moustache: true, legs: '#2a4a5a' };
const SWAMP_WITCH = { tunic: '#2f4a2a', trim: '#9be35a', head: 'hood', headColor: '#203a1c', weapon: 'staff', orb: 'url(#glowG)', skin: '#9aae7a', angry: true, glowEyes: '#c6ff8a' };
const FROST_MAGE = { tunic: '#9ec4e8', trim: '#ffffff', head: 'hood', headColor: '#5f8fc8', weapon: 'staff', beard: '#ffffff', skin: '#c8b8b0', angry: true, glowEyes: '#bfe8ff' };
const SHADOW_EMPEROR = { tunic: '#1f1630', trim: '#a070ff', head: 'helmet', headColor: '#6a3fc0', weapon: 'staff', orb: 'url(#gemPurple)', skin: '#5a4a6a', big: 1.6, cape: '#3a1f5a', crown: true, armor: 'url(#darksteel)', angry: true, glowEyes: '#e0c0ff', visor: true, legs: '#1f1630' };

function warBoar(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 22, 5, 0.2); shadow(t, 0, 2, 24, 5.5);
  outlined(t, 'path', { d: 'M-24 -10 Q-26 -28 -4 -30 Q16 -32 22 -20 L30 -16 L28 -8 L20 -6 Q16 0 10 0 L8 4 L4 4 L4 -2 L-12 -2 L-13 4 L-17 4 L-18 -3 Q-24 -4 -24 -10 Z', fill: '#5a3a28' }, 1.6);
  el('path', { d: 'M-22 -8 Q0 -2 22 -8 L20 -6 Q16 0 10 0 L4 -2 L-12 -2 L-18 -3 Z', fill: '#000', opacity: 0.18 }, t);
  el('path', { d: bumpy(-4, -28, 16, 4, 16, 0.5, Math.PI, Math.PI * 2), stroke: '#2a1a10', 'stroke-width': 1.6, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M24 -12 Q34 -14 34 -22 Q30 -16 24 -16 Z', fill: '#fff3dc' }, 0.9);
  el('circle', { cx: 22, cy: -22, r: 1.6, fill: '#ff4a2a', filter: 'url(#bloom)' }, t);
  outlined(t, 'path', { d: 'M-16 -30 H8 V-14 Q-4 -10 -16 -14 Z', fill: 'url(#darksteel)' }, 1.2);
  [[-12, -26], [-4, -27], [4, -26]].forEach(([a, b]) => outlined(t, 'path', { d: `M${a - 2} ${b} l2 -6 l2 6 Z`, fill: 'url(#steel)' }, 0.6));
  if (hp !== undefined) hpBar(t, 0, -40, hp, 26);
  return t;
}
function banditKing(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  warBoar(t, 0, 0, 1);
  person(t, -2, -24, { ...BANDIT_KING, s: 0.85 });
  if (hp !== undefined) hpBar(t, 0, -70, hp, 30);
  return t;
}
function scorpion(p, x, y, s = 1, flip = false) {
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 14, 3, 0.18); shadow(t, 0, 1, 15, 3.5);
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) el('path', { d: `M${-4 + i * 4} -4 l${-3 + i} 5`, stroke: OUT, 'stroke-width': 1.2 }, t);
  [[-10, -6, 5], [-3, -7, 6], [5, -6, 5]].forEach(([a, b, r]) => { outlined(t, 'ellipse', { cx: a, cy: b, rx: r, ry: r * 0.65, fill: '#c07a2a' }, 1); el('ellipse', { cx: a - 1, cy: b - 1.4, rx: r * 0.5, ry: r * 0.22, fill: '#f0b860', opacity: 0.8 }, t); });
  let d = 'M-14 -6';
  [[-18, -10], [-20, -16], [-18, -22], [-12, -25]].forEach(([a, b]) => { d += ` L${a} ${b}`; });
  el('path', { d, stroke: OUT, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, t);
  el('path', { d, stroke: '#a8621e', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, t);
  outlined(t, 'path', { d: 'M-12 -25 Q-6 -26 -7 -21 Q-9 -23 -12 -22 Z', fill: '#3a2414' }, 0.6);
  el('circle', { cx: -7.4, cy: -21.8, r: 1.6, fill: '#c6ff8a', filter: 'url(#bloom)' }, t);
  for (const yy of [-9, -3]) { el('path', { d: `M9 -6 Q13 ${yy - 2} 16 ${yy}`, stroke: OUT, 'stroke-width': 2.6, fill: 'none' }, t); outlined(t, 'path', { d: `M15 ${yy - 2} Q20 ${yy - 3} 20 ${yy} Q18 ${yy - 1} 16 ${yy + 1} Z`, fill: '#c07a2a' }, 0.7); }
  el('circle', { cx: 9.4, cy: -8, r: 0.9, fill: '#1d1208' }, t);
  return t;
}
function camel(p, x, y, s = 1, flip = false, rider = true, hp) {
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 20, 4, 0.18); shadow(t, 0, 2, 20, 4.5);
  for (const [a, b] of [[-12, -14], [-8, -14], [8, -14], [12, -14]]) { el('path', { d: `M${a} ${b} L${a - 1} 1`, stroke: OUT, 'stroke-width': 3.6, 'stroke-linecap': 'round' }, t); el('path', { d: `M${a} ${b} L${a - 1} 1`, stroke: '#c9955e', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, t); }
  outlined(t, 'path', { d: 'M-18 -14 Q-18 -24 -10 -24 Q-6 -36 2 -26 Q8 -28 14 -20 L22 -34 L28 -34 L28 -30 L24 -28 L18 -14 Q0 -8 -18 -14 Z', fill: '#d9a86a' }, 1.4);
  el('path', { d: 'M-16 -14 Q0 -9 16 -14', stroke: '#a8783e', 'stroke-width': 1.4, fill: 'none' }, t);
  el('circle', { cx: 25.6, cy: -32, r: 0.8, fill: OUT }, t);
  outlined(t, 'path', { d: 'M-10 -24 H8 L6 -16 H-8 Z', fill: 'url(#red)' }, 1);
  for (let i = 0; i < 5; i++) el('circle', { cx: -8 + i * 3.6, cy: -15.4, r: 0.9, fill: '#ffd66b' }, t);
  if (rider) person(t, -1, -24, { ...CAMEL_RIDER, s: 0.75 });
  if (hp !== undefined) hpBar(t, 0, -60, hp, 20);
  return t;
}
function burrower(p, x, y, s = 1, flip = false) {
  const t = facing(p, x, y, s, flip);
  shadow(t, 0, 1, 18, 4);
  outlined(t, 'path', { d: 'M-18 0 Q-14 -10 0 -10 Q14 -10 18 0 Z', fill: '#e0b070' }, 1.2);
  for (let i = 0; i < 6; i++) el('circle', { cx: -14 + i * 6, cy: -2 - (i % 2) * 2, r: 1.2, fill: '#c9955e' }, t);
  outlined(t, 'path', { d: 'M-8 -8 Q-10 -22 0 -24 Q10 -22 8 -8 Z', fill: '#4a2e1e' }, 1.3);
  el('path', { d: 'M-6 -16 Q0 -19 6 -16 M-6 -12 Q0 -15 6 -12', stroke: '#7a5a3a', 'stroke-width': 0.9, fill: 'none' }, t);
  el('path', { d: 'M-4 -22 Q-2 -26 0 -24', stroke: '#ffffff', 'stroke-width': 0.8, opacity: 0.5, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M4 -20 Q12 -24 13 -16 Q10 -19 6 -17 Z M4 -14 Q12 -14 12 -8 Q9 -11 5 -11 Z', fill: '#2a1a10' }, 0.6);
  [[2, -20], [-2, -20]].forEach(([a, b]) => el('circle', { cx: a, cy: b, r: 1.2, fill: '#ffb03a', filter: 'url(#bloom)' }, t));
  for (let i = 0; i < 4; i++) el('circle', { cx: -12 + i * 8, cy: -10 - (i % 2) * 4, r: 2.4, fill: 'url(#dust)' }, t);
  return t;
}
function golem(p, x, y, s = 1, flip = false, o = {}) {
  const { body = '#c9a07a', dark = '#8a6a4a', eyes = '#8fd8ff', moss: mossy = true, hp } = o;
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 16, 4, 0.2); shadow(t, 0, 2, 18, 4.5);
  outlined(t, 'path', { d: 'M-10 0 L-9 -10 H-3 L-3 0 Z M3 0 L3 -10 H9 L10 0 Z', fill: dark }, 1.2);
  outlined(t, 'path', { d: 'M-14 -10 L-12 -30 L-4 -34 L8 -33 L14 -26 L13 -10 Z', fill: body }, 1.6);
  el('path', { d: 'M8 -33 L14 -26 L13 -10 L6 -10 Z', fill: '#000', opacity: 0.18 }, t);
  el('path', { d: 'M-12 -30 L-4 -34 L2 -33 L-4 -28 Z', fill: '#fff', opacity: 0.22 }, t);
  el('path', { d: 'M-6 -24 L-2 -18 L-6 -14 M4 -28 L6 -20', stroke: OUT, 'stroke-width': 0.9, fill: 'none', opacity: 0.7 }, t);
  el('path', { d: 'M-2 -22 l2 -3 l2 3 l-2 3 Z', fill: eyes, filter: 'url(#bloom)' }, t);
  outlined(t, 'path', { d: 'M-8 -34 L-6 -42 L4 -43 L8 -36 Z', fill: body }, 1.3);
  [[-3, -38.6], [3, -38.6]].forEach(([a, b]) => el('rect', { x: a - 1.4, y: b - 0.8, width: 2.8, height: 1.6, fill: eyes, filter: 'url(#bloom)' }, t));
  outlined(t, 'path', { d: 'M-14 -28 L-20 -20 L-19 -10 L-14 -11 L-15 -18 Z', fill: dark }, 1.2);
  outlined(t, 'path', { d: 'M14 -26 L21 -18 L20 -8 L15 -9 L15 -18 Z', fill: dark }, 1.2);
  if (mossy) moss(t, [[-10, -30, 2.4], [6, -34, 2], [12, -14, 1.8]]);
  if (hp !== undefined) hpBar(t, 0, -50, hp, 20);
  return t;
}
function stoneTitan(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  golem(t, 0, 0, 1.6, false, { body: '#b89070', dark: '#7a5a42', eyes: '#ffb03a' });
  // carved temple-style crown and a boulder overhead
  [[-10, -72], [-4, -76], [2, -76], [8, -72]].forEach(([a, b]) => outlined(t, 'rect', { x: a - 1.8, y: b, width: 3.6, height: 8, fill: '#d9b48a' }, 0.8));
  outlined(t, 'circle', { cx: 18, cy: -78, r: 12, fill: '#a8804e' }, 1.6);
  el('path', { d: 'M10 -82 L16 -76 M20 -86 L24 -80', stroke: OUT, 'stroke-width': 0.8 }, t);
  moss(t, [[12, -86, 2.6]]);
  if (hp !== undefined) hpBar(t, 0, -96, hp, 34);
  return t;
}
function colossus(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  golem(t, 0, 0, 1.7, false, { body: '#e8b870', dark: '#b8803e', eyes: '#ff7a2a', moss: false });
  for (let i = 0; i < 9; i++) { const c = el('circle', { cx: -26 + rnd() * 52, cy: -60 + rnd() * 60, r: 1 + rnd() * 1.6, fill: '#f0c888', opacity: 0.8 }, t); anim(c, { attributeName: 'cy', values: `${-60 + i * 6};${-54 + i * 6};${-60 + i * 6}`, dur: `${1.2 + i * 0.2}s` }); }
  el('path', { d: 'M-30 0 Q-18 -10 0 -6 Q18 -10 30 0 Z', fill: '#e0b070', stroke: OUT, 'stroke-width': 1.2 }, t);
  if (hp !== undefined) hpBar(t, 0, -86, hp, 34);
  return t;
}
function boat(p, x, y, s = 1, flip = false, crew = RIVER_RAIDER, hp) {
  const t = facing(p, x, y, s, flip);
  el('ellipse', { cx: 0, cy: 2, rx: 24, ry: 4, fill: '#4f8faa', opacity: 0.8 }, t);
  el('path', { d: 'M-22 2 q3 -2 6 0 M10 3 q3 -2 6 0', stroke: '#d8f2fa', 'stroke-width': 0.9, fill: 'none' }, t);
  person(t, -4, -3, { ...crew, s: 0.8 });
  outlined(t, 'path', { d: 'M-22 -6 Q-20 2 0 2 Q20 2 22 -8 L18 -5 H-18 Z', fill: 'url(#wood)' }, 1.4);
  el('path', { d: 'M-18 -4 H18', stroke: '#5a3a22', 'stroke-width': 0.8 }, t);
  el('path', { d: 'M10 -16 L20 6', stroke: '#7a4a22', 'stroke-width': 1.6 }, t);
  outlined(t, 'path', { d: 'M18 2 l4 6 l3 -2 Z', fill: '#a8794a' }, 0.6);
  if (hp !== undefined) hpBar(t, 0, -48, hp, 18);
  return t;
}
function bat(p, x, y, s = 1, flip = false, col = '#3a3560') {
  const t = facing(p, x, y, s, flip);
  shadow(t, 0, 18, 10, 2.4, 0.18);
  const a = 'M0 -4 Q-8 -16 -20 -10 Q-16 -6 -18 -1 Q-12 -4 -10 0 Q-6 -4 0 -1 Q6 -4 10 0 Q12 -4 18 -1 Q16 -6 20 -10 Q8 -16 0 -4 Z';
  const b = 'M0 -4 Q-8 -8 -18 -2 Q-14 0 -15 4 Q-10 1 -9 4 Q-5 0 0 -1 Q5 0 9 4 Q10 1 15 4 Q14 0 18 -2 Q8 -8 0 -4 Z';
  const w = outlined(t, 'path', { d: a, fill: col }, 1.2);
  anim(w, { attributeName: 'd', values: [a, b, a].join(';'), dur: '0.5s' });
  outlined(t, 'ellipse', { cx: 0, cy: -3, rx: 4, ry: 5, fill: shade(col, 0.8) }, 1);
  outlined(t, 'path', { d: 'M-3 -7 L-2.4 -11 L-1 -7.4 Z M3 -7 L2.4 -11 L1 -7.4 Z', fill: col }, 0.6);
  [[-1.4, -4], [1.4, -4]].forEach(([a, b]) => el('circle', { cx: a, cy: b, r: 0.9, fill: '#ffe066', filter: 'url(#bloom)' }, t));
  el('path', { d: 'M14 -14 l2 3 l-2 1 l3 4', stroke: '#bfe8ff', 'stroke-width': 0.9, fill: 'none', filter: 'url(#bloom)' }, t);
  return t;
}
function serpent(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  shadow(t, 0, 10, 40, 6, 0.2);
  const path = 'M-44 -6 C-30 -30 -14 6 0 -16 C12 -34 24 -10 34 -26';
  el('path', { d: path, stroke: OUT, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, t);
  el('path', { d: path, stroke: '#2f7a8a', 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round' }, t);
  el('path', { d: path, stroke: '#9fe0d8', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '2 4', transform: 'translate(0 3)' }, t);
  el('path', { d: path, stroke: '#1f4f5a', 'stroke-width': 1, fill: 'none', 'stroke-dasharray': '3 3', transform: 'translate(0 -3)' }, t);
  for (const k of [-1, 1]) outlined(t, 'path', { d: `M-4 -18 Q${-14 + k * 4} -46 ${-30 + k * 6} -40 Q-22 -34 ${-24 + k * 4} -28 Q-14 -28 -8 -20 Z`, fill: '#3f5f9a', opacity: 0.95 }, 1.1);
  outlined(t, 'path', { d: 'M30 -24 Q36 -36 46 -32 Q50 -28 44 -24 L50 -20 Q40 -18 34 -20 Z', fill: '#2f7a8a' }, 1.4);
  outlined(t, 'path', { d: 'M38 -34 L36 -42 L41 -35 Z M42 -33 L44 -41 L45 -32 Z', fill: '#f2e6c8' }, 0.6);
  el('circle', { cx: 42, cy: -29, r: 1.6, fill: '#ffe066', filter: 'url(#bloom)' }, t);
  const bolt = el('path', { d: 'M50 -22 l8 2 l-4 3 l9 3', stroke: '#e6f8ff', 'stroke-width': 1.6, fill: 'none', filter: 'url(#bloom)' }, t);
  anim(bolt, { attributeName: 'opacity', values: '1;0.2;1', dur: '0.4s' });
  if (hp !== undefined) hpBar(t, 0, -58, hp, 36);
  return t;
}
function crocodile(p, x, y, s = 1, flip = false, o = {}) {
  const t = facing(p, x, y, s, flip);
  const col = o.color || '#4f7a3a';
  cast(t, 0, 0, 24, 3, 0.18); shadow(t, 0, 1, 26, 3.6);
  outlined(t, 'path', { d: 'M-34 -2 Q-24 -8 -12 -9 L14 -10 Q20 -12 30 -10 L36 -8 L30 -5 L36 -4 L28 -1 Q10 0 -12 -2 Q-24 0 -34 -2 Z', fill: col }, 1.4);
  el('path', { d: 'M-30 -3 Q0 1 28 -2', stroke: '#c9d48a', 'stroke-width': 1.6, fill: 'none' }, t);
  for (let i = 0; i < 9; i++) outlined(t, 'path', { d: `M${-24 + i * 4.4} -8.6 l1.8 -2.6 l1.8 2.6 Z`, fill: shade(col, 0.75) }, 0.4);
  for (const a of [-16, -4, 8]) el('path', { d: `M${a} -2 l-2 4 M${a + 3} -2 l1 4`, stroke: OUT, 'stroke-width': 1.4 }, t);
  el('path', { d: 'M28 -7 l1 1.4 l1 -1.4 l1 1.4 l1 -1.4', stroke: '#ffffff', 'stroke-width': 0.7, fill: 'none' }, t);
  el('circle', { cx: 20, cy: -11, r: 1.4, fill: o.eyes || '#ffd23a', filter: o.eyes ? 'url(#bloom)' : '' }, t);
  if (o.armor) { outlined(t, 'path', { d: 'M-14 -9 Q0 -14 12 -10 L10 -4 Q0 -6 -12 -4 Z', fill: 'url(#darksteel)' }, 0.9); [-8, 0, 8].forEach((a) => outlined(t, 'path', { d: `M${a - 1.6} -11.6 l1.6 -4 l1.6 4 Z`, fill: 'url(#steel)' }, 0.4)); }
  if (o.crown) { outlined(t, 'path', { d: 'M16 -12 L16 -17 L18 -15 L20 -18 L22 -15 L24 -17 L24 -11 Z', fill: 'url(#gold)' }, 0.6); }
  if (o.hp !== undefined) hpBar(t, 0, -24, o.hp, 28);
  return t;
}
function iceWolf(p, x, y, s = 1, flip = false) {
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 14, 3.5, 0.16); shadow(t, 0, 1, 16, 4);
  el('circle', { cx: 0, cy: -10, r: 18, fill: 'url(#glow)', opacity: 0.35 }, t);
  outlined(t, 'path', { d: 'M-16 -6 Q-22 -12 -30 -8 Q-24 -14 -17 -13 Z', fill: '#cfe2f2' }, 1);
  outlined(t, 'path', { d: 'M-16 -6 Q-14 -16 0 -15 Q10 -15 14 -18 L22 -22 L25 -16 L18 -12 Q16 -4 10 -4 L8 0 L4 0 L4 -5 L-8 -5 L-9 0 L-13 0 L-13 -5 Q-20 -2 -22 -10 Z', fill: '#e8f2fc' }, 1.4);
  el('path', { d: 'M-12 -6 Q0 -3 10 -5', stroke: '#a8c8e8', 'stroke-width': 2.2, fill: 'none' }, t);
  el('path', { d: 'M-14 -14 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3', stroke: '#8fb8e0', 'stroke-width': 1, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M19 -22 L18 -28 L22 -23 Z', fill: '#e8f2fc' }, 0.8);
  el('circle', { cx: 20.6, cy: -18.4, r: 1.2, fill: '#7fd0ff', filter: 'url(#bloom)' }, t);
  el('path', { d: 'M22 -15 l1 2 l1 -2 l1 2', stroke: '#ffffff', 'stroke-width': 0.8, fill: 'none' }, t);
  return t;
}
function yeti(p, x, y, s = 1, flip = false) {
  const t = facing(p, x, y, s, flip);
  cast(t, 0, 0, 16, 4, 0.2); shadow(t, 0, 2, 18, 4.5);
  outlined(t, 'path', { d: 'M-9 0 L-8 -8 H-2 L-2 0 Z M2 0 L2 -8 H8 L9 0 Z', fill: '#dfe8f2' }, 1.1);
  outlined(t, 'path', { d: bumpy(0, -22, 15, 17, 22, 0.1), fill: '#f2f6fa' }, 1.6);
  el('path', { d: bumpy(4, -18, 9, 11, 14, 0.12, -1.2, 1.4), stroke: '#c8d8e8', 'stroke-width': 1, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M-14 -26 Q-24 -18 -20 -4 L-15 -6 Q-16 -16 -10 -20 Z', fill: '#e8eef6' }, 1.2);
  outlined(t, 'path', { d: 'M12 -26 Q24 -20 20 -6 L15 -8 Q16 -16 9 -20 Z', fill: '#e8eef6' }, 1.2);
  outlined(t, 'ellipse', { cx: 3, cy: -30, rx: 6.4, ry: 5.6, fill: '#7a9ac8' }, 1.1);
  [[1, -31.4], [5.6, -31.4]].forEach(([a, b]) => el('circle', { cx: a, cy: b, r: 1, fill: '#ffe066', filter: 'url(#bloom)' }, t));
  el('path', { d: 'M0 -27 h6', stroke: OUT, 'stroke-width': 0.9 }, t);
  el('path', { d: 'M1 -27 l1 1.6 l1 -1.6 M4 -27 l1 1.6 l1 -1.6', stroke: '#ffffff', 'stroke-width': 0.6, fill: 'none' }, t);
  outlined(t, 'path', { d: 'M-4 -36 Q-10 -40 -8 -46 Q-6 -40 -2 -38 Z M8 -36 Q14 -40 12 -46 Q10 -40 6 -38 Z', fill: '#c9b8a0' }, 0.8);
  return t;
}
function shadowEmperor(p, x, y, s = 1, flip = false, hp) {
  const t = facing(p, x, y, s, flip);
  const aura = el('circle', { cx: 0, cy: -30, r: 40, fill: 'url(#gemPurple)', opacity: 0.3, filter: 'url(#cloud)' }, t);
  anim(aura, { attributeName: 'r', values: '36;44;36', dur: '2.4s' });
  person(t, 0, 0, { ...SHADOW_EMPEROR, s: 1.4 });
  for (let i = 0; i < 6; i++) { const c = el('circle', { cx: -20 + i * 8, cy: -10 - (i % 3) * 14, r: 1.6, fill: '#c9a0ff', filter: 'url(#bloom)' }, t); anim(c, { attributeName: 'opacity', values: '0.2;1;0.2', dur: `${1 + i * 0.3}s` }); }
  if (hp !== undefined) hpBar(t, 0, -78, hp, 34);
  return t;
}
