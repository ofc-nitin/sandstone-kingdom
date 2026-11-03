// Shared UI drawing helpers (buttons, panels, ribbons, icons) for Sandstone Kingdom.
// Depends on art.js. Edit here; docs/style-boards/build.py copies it into the concept boards.
// ============================================================ UI defs
function uiDefs(svg) {
  defs(svg);
  const d = svg.querySelector('defs');
  const lin = (id, stops, x2 = 0, y2 = 1) => {
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, d);
    stops.forEach(([o, c, op = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, lg));
  };
  const rad = (id, stops, cx = '50%', cy = '50%', r = '50%') => {
    const rg = el('radialGradient', { id, cx, cy, r }, d);
    stops.forEach(([o, c, op = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, rg));
  };
  lin('btnRed', [[0, '#ff7a50'], [0.48, '#d83a1e'], [1, '#86190c']]);
  lin('btnGreen', [[0, '#7ed36a'], [0.48, '#2f8f3c'], [1, '#14501e']]);
  lin('btnBlue', [[0, '#7fb2ff'], [0.48, '#2f5fc8'], [1, '#162f72']]);
  lin('btnGold', [[0, '#ffe38a'], [0.48, '#e0a224'], [1, '#8a5a0c']]);
  lin('btnPurple', [[0, '#c19aff'], [0.48, '#6a3fc0'], [1, '#341a6e']]);
  lin('btnGrey', [[0, '#c9c4bc'], [0.48, '#8d877e'], [1, '#4f4a44']]);
  lin('goldRim', [[0, '#fff4c0'], [0.25, '#f4c64e'], [0.55, '#a8700f'], [0.8, '#f2c04a'], [1, '#7a4c08']]);
  lin('woodDark', [[0, '#8a5a30'], [1, '#3f2614']]);
  lin('parch', [[0, '#fdf2d8'], [1, '#ead0a0']]);
  lin('ribbon', [[0, '#e8553a'], [0.6, '#b52a16'], [1, '#7a160a']]);
  lin('logoGold', [[0, '#fff6c8'], [0.35, '#ffd25a'], [0.7, '#e08a1a'], [1, '#a8520c']]);
  lin('skySunset', [[0, '#2f2560'], [0.38, '#b0507a'], [0.66, '#f39a58'], [1, '#ffd98a']]);
  lin('skyDawn', [[0, '#5a7fc8'], [0.5, '#f3b07a'], [1, '#ffe2a4']]);
  lin('hillFar', [[0, '#8a5f9a'], [1, '#b8789a']]);
  lin('hillMid', [[0, '#5f7a4a'], [1, '#3f5a32']]);
  lin('shade', [[0, '#000', 0], [1, '#000', 0.55]]);
  rad('gemRed', [[0, '#ffd8c8'], [0.3, '#ff5a40'], [1, '#6a0808']], '38%', '32%', '70%');
  rad('gemGreen', [[0, '#e0ffd0'], [0.3, '#4fd060'], [1, '#0c4a14']], '38%', '32%', '70%');
  rad('gemBlue', [[0, '#e0f0ff'], [0.3, '#4a8cff'], [1, '#0c2a6e']], '38%', '32%', '70%');
  rad('gemGold', [[0, '#fffbe0'], [0.3, '#ffcc3a'], [1, '#7a4c08']], '38%', '32%', '70%');
  rad('gemPurple', [[0, '#f0e0ff'], [0.3, '#a070ff'], [1, '#2a0c5a']], '38%', '32%', '70%');
  rad('sunDisc', [[0, '#fffbe6'], [0.4, '#ffe08a'], [0.75, '#ffa040'], [1, '#ff7a2a', 0]]);
  const ds = el('filter', { id: 'drop', x: '-20%', y: '-20%', width: '140%', height: '160%' }, d);
  el('feDropShadow', { dx: 0, dy: 2.4, stdDeviation: 1.6, 'flood-color': '#120804', 'flood-opacity': 0.55 }, ds);
}
const T = (p, x, y, s, size, o = {}) => {
  const e = el('text', { x, y, 'font-family': o.font || 'Martel', 'font-weight': o.weight || 900, 'font-size': size, fill: o.fill || '#fff8e6', stroke: o.stroke || OUT, 'stroke-width': o.sw ?? Math.min(3.2, size * 0.2), 'paint-order': 'stroke', 'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls || 0 }, p);
  e.textContent = s;
  // o.max: never let the text grow wider than this; shrink the font to fit instead
  if (o.max) {
    const w = e.getComputedTextLength();
    if (w > o.max) e.setAttribute('font-size', size * o.max / w);
  }
  return e;
};
// width of a piece of text once fonts are loaded, used to size ribbons and buttons
function measure(p, s, size, font = 'Martel', weight = 900) {
  const e = T(p, 0, 0, s, size, { font, weight });
  const w = e.getComputedTextLength();
  e.remove();
  return w;
}

// ============================================================ icons
const icon = {
  coin(p, x, y, r = 7) { coinIcon(p, x, y, r); },
  ruby(p, x, y, r = 7) { rubyIcon(p, x, y, r); },
  diya(p, x, y, r = 7, lit = true) {
    if (lit) el('circle', { cx: x, cy: y - r * 0.9, r: r * 1.3, fill: 'url(#fire)', opacity: 0.8 }, p);
    outlined(p, 'path', { d: `M${x - r} ${y} Q${x} ${y + r} ${x + r} ${y} Z`, fill: lit ? '#c0662e' : '#6b5a4a' }, 1);
    if (lit) el('path', { d: `M${x} ${y - 0.5} q${-r * 0.4} ${-r * 0.5} 0 ${-r * 1.2} q${r * 0.4} ${r * 0.7} 0 ${r * 1.2} Z`, fill: '#ffd25a', stroke: '#e2541d', 'stroke-width': 0.5 }, p);
  },
  lock(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); el('path', { d: 'M-5 -2 V-6 Q-5 -11 0 -11 Q5 -11 5 -6 V-2', stroke: OUT, 'stroke-width': 4, fill: 'none' }, t); el('path', { d: 'M-5 -2 V-6 Q-5 -11 0 -11 Q5 -11 5 -6 V-2', stroke: '#c3c8d1', 'stroke-width': 2, fill: 'none' }, t); outlined(t, 'rect', { x: -7, y: -3, width: 14, height: 11, rx: 2, fill: 'url(#gold)' }, 1.2); el('circle', { cx: 0, cy: 2, r: 1.6, fill: OUT }, t); },
  chest(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); outlined(t, 'path', { d: 'M-12 0 V-10 H12 V0 Z', fill: 'url(#wood)' }, 1.3); outlined(t, 'path', { d: 'M-12 -10 Q0 -20 12 -10 Z', fill: '#a86a34' }, 1.3); el('path', { d: 'M-12 -10 H12 M-6 -15 V0 M6 -15 V0', stroke: 'url(#goldRim)', 'stroke-width': 2 }, t); outlined(t, 'rect', { x: -2.4, y: -8, width: 4.8, height: 5, rx: 1, fill: 'url(#gold)' }, 0.6); },
  trophy(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); outlined(t, 'path', { d: 'M-6 -10 H6 V-6 Q6 0 0 1 Q-6 0 -6 -6 Z', fill: '#fff4dc' }, 1); el('path', { d: 'M-6 -8 Q-10 -8 -9 -4 Q-8 -2 -5 -2 M6 -8 Q10 -8 9 -4 Q8 -2 5 -2', stroke: '#fff4dc', 'stroke-width': 1.4, fill: 'none' }, t); el('path', { d: 'M0 1 V4 M-4 6 H4', stroke: '#fff4dc', 'stroke-width': 2 }, t); },
  bars(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); [[-7, 6], [-1.5, 10], [4, 4]].forEach(([a, h]) => outlined(t, 'rect', { x: a, y: 5 - h, width: 4.5, height: h, rx: 0.8, fill: '#fff4dc' }, 0.8)); },
  gear(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); for (let i = 0; i < 8; i++) el('rect', { x: -1.8, y: -9, width: 3.6, height: 5, rx: 1, fill: '#fff4dc', transform: `rotate(${i * 45})` }, t); el('circle', { cx: 0, cy: 0, r: 6, fill: '#fff4dc' }, t); el('circle', { cx: 0, cy: 0, r: 2.4, fill: '#2f5fc8' }, t); },
  play(p, x, y, s = 1) { el('path', { d: `M${x - 4 * s} ${y - 6 * s} L${x + 6 * s} ${y} L${x - 4 * s} ${y + 6 * s} Z`, fill: '#fff4dc', stroke: OUT, 'stroke-width': 0.8 }, p); },
  close(p, x, y, s = 1) { el('path', { d: `M${x - 4 * s} ${y - 4 * s} L${x + 4 * s} ${y + 4 * s} M${x + 4 * s} ${y - 4 * s} L${x - 4 * s} ${y + 4 * s}`, stroke: '#fff4dc', 'stroke-width': 2.6 * s, 'stroke-linecap': 'round' }, p); },
  plus(p, x, y, s = 1) { el('path', { d: `M${x - 4 * s} ${y} H${x + 4 * s} M${x} ${y - 4 * s} V${y + 4 * s}`, stroke: '#fff4dc', 'stroke-width': 2.4 * s, 'stroke-linecap': 'round' }, p); },
  check(p, x, y, s = 1) { el('path', { d: `M${x - 6 * s} ${y} L${x - 2 * s} ${y + 4 * s} L${x + 6 * s} ${y - 5 * s}`, stroke: OUT, 'stroke-width': 5 * s, fill: 'none', 'stroke-linecap': 'round' }, p); el('path', { d: `M${x - 6 * s} ${y} L${x - 2 * s} ${y + 4 * s} L${x + 6 * s} ${y - 5 * s}`, stroke: '#7ef06a', 'stroke-width': 3 * s, fill: 'none', 'stroke-linecap': 'round' }, p); },
  swords(p, x, y, s = 1) {
    // two crossed swords: blade, gold crossguard and a round pommel each
    for (const k of [-1, 1]) {
      el('path', { d: `M${x - 6 * s * k} ${y + 6 * s} L${x + 7 * s * k} ${y - 7 * s}`, stroke: OUT, 'stroke-width': 4 * s, 'stroke-linecap': 'round' }, p);
      el('path', { d: `M${x - 6 * s * k} ${y + 6 * s} L${x + 7 * s * k} ${y - 7 * s}`, stroke: '#f2f4f8', 'stroke-width': 2.2 * s, 'stroke-linecap': 'round' }, p);
      el('path', { d: `M${x - 7 * s * k} ${y + 2 * s} L${x - 2 * s * k} ${y + 7 * s}`, stroke: OUT, 'stroke-width': 3.2 * s, 'stroke-linecap': 'round' }, p);
      el('path', { d: `M${x - 7 * s * k} ${y + 2 * s} L${x - 2 * s * k} ${y + 7 * s}`, stroke: '#ffd25a', 'stroke-width': 1.8 * s, 'stroke-linecap': 'round' }, p);
      el('path', { d: `M${x - 6 * s * k} ${y + 6 * s} L${x - 8.5 * s * k} ${y + 8.5 * s}`, stroke: '#8a5a2e', 'stroke-width': 2.4 * s, 'stroke-linecap': 'round' }, p);
      outlined(p, 'circle', { cx: x - 9.4 * s * k, cy: y + 9.4 * s, r: 1.5 * s, fill: '#ffd25a' }, 0.6 * s);
    }
  },
  infinity(p, x, y, s = 1) { el('path', { d: `M${x} ${y} C${x - 3 * s} ${y - 6 * s} ${x - 10 * s} ${y - 6 * s} ${x - 10 * s} ${y} C${x - 10 * s} ${y + 6 * s} ${x - 3 * s} ${y + 6 * s} ${x} ${y} C${x + 3 * s} ${y - 6 * s} ${x + 10 * s} ${y - 6 * s} ${x + 10 * s} ${y} C${x + 10 * s} ${y + 6 * s} ${x + 3 * s} ${y + 6 * s} ${x} ${y} Z`, stroke: '#fff4dc', 'stroke-width': 2.4 * s, fill: 'none' }, p); },
  helmet(p, x, y, s = 1) { const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` }); outlined(t, 'path', { d: 'M-7 4 Q-8 -8 0 -9 Q8 -8 7 4 Z', fill: '#fff4dc' }, 1); el('path', { d: 'M0 -9 V-13', stroke: '#fff4dc', 'stroke-width': 1.6 }, t); el('path', { d: 'M1.5 -2 V4', stroke: '#2f5fc8', 'stroke-width': 1.6 }, t); },
};

// ============================================================ controls
const COLORS = { red: ['url(#btnRed)', 'url(#gemRed)'], green: ['url(#btnGreen)', 'url(#gemGreen)'], blue: ['url(#btnBlue)', 'url(#gemBlue)'], gold: ['url(#btnGold)', 'url(#gemGold)'], purple: ['url(#btnPurple)', 'url(#gemPurple)'], grey: ['url(#btnGrey)', 'url(#btnGrey)'] };
function button(p, x, y, w, h, label, color = 'red', o = {}) {
  const t = g(p, { transform: `translate(${x} ${y})`, filter: 'url(#drop)' });
  const r = h * 0.3;
  if (o.pressed) t.setAttribute('transform', `translate(${x} ${y + 1.5})`);
  el('rect', { x: 0, y: 0, width: w, height: h, rx: r, fill: OUT }, t);
  el('rect', { x: 1.6, y: 1.6, width: w - 3.2, height: h - 3.2, rx: r - 1, fill: 'url(#goldRim)' }, t);
  el('rect', { x: 4, y: 4, width: w - 8, height: h - 8, rx: r - 2.4, fill: '#4a1e0c' }, t);
  el('rect', { x: 5, y: 5, width: w - 10, height: h - 10, rx: r - 3, fill: COLORS[color][0] }, t);
  // carved inner pattern: a faint jali (lattice) band
  for (let i = 12; i < w - 12; i += 7) el('path', { d: `M${i} ${h - 9} l3 -3 l3 3`, stroke: '#000', 'stroke-width': 0.7, fill: 'none', opacity: 0.18 }, t);
  el('rect', { x: 7, y: 6, width: w - 14, height: h * 0.36, rx: (h * 0.36) / 2, fill: '#ffffff', opacity: o.pressed ? 0.12 : 0.3 }, t);
  el('rect', { x: 6, y: h - 10, width: w - 12, height: 4, rx: 2, fill: '#000', opacity: 0.18 }, t);
  // gold end caps with jewels (lotus finials)
  for (const cx of o.icon ? [w - h * 0.42] : [h * 0.42, w - h * 0.42]) {
    outlined(t, 'circle', { cx, cy: h / 2, r: h * 0.17, fill: 'url(#goldRim)' }, 0.9);
    el('circle', { cx, cy: h / 2, r: h * 0.1, fill: COLORS[color][1] }, t);
    el('circle', { cx: cx - h * 0.04, cy: h / 2 - h * 0.04, r: h * 0.035, fill: '#fff', opacity: 0.9 }, t);
  }
  if (o.icon) icon[o.icon](t, h * 0.62, h / 2 + (o.icon === 'helmet' ? 2 : 0), ['coin', 'ruby'].includes(o.icon) ? h * 0.2 : o.icon === 'infinity' ? h / 56 : o.icon === 'helmet' ? h / 30 : h / 40);
  const fs = o.size || h * 0.42;
  const lab = T(t, w / 2 + (o.icon ? h * 0.18 : 0), h / 2 + h * 0.17, label, fs, { sw: Math.min(3.4, fs * 0.2) });
  const maxW = w - h * (o.icon ? 1.55 : 1.15), tw = lab.getComputedTextLength();
  if (tw > maxW) { lab.setAttribute('font-size', fs * maxW / tw); lab.setAttribute('y', h / 2 + (fs * maxW / tw) * 0.36); }
  if (o.badge) { outlined(t, 'circle', { cx: w - 4, cy: 3, r: 7, fill: 'url(#gemRed)' }, 1.2); T(t, w - 4, 6.5, o.badge, 9, { sw: 2 }); }
  if (o.locked) { el('rect', { x: 5, y: 5, width: w - 10, height: h - 10, rx: r - 3, fill: '#1d1208', opacity: 0.45 }, t); icon.lock(t, w - h * 0.42, h / 2 + 3, h / 34); }
  return t;
}
function roundBtn(p, cx, cy, r, color, draw, o = {}) {
  const t = g(p, { filter: 'url(#drop)' });
  el('circle', { cx, cy, r, fill: OUT }, t);
  el('circle', { cx, cy, r: r - 1.6, fill: 'url(#goldRim)' }, t);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; el('circle', { cx: cx + Math.cos(a) * (r - 3.2), cy: cy + Math.sin(a) * (r - 3.2), r: 0.8, fill: '#7a4c08' }, t); }
  el('circle', { cx, cy, r: r - 5, fill: '#4a1e0c' }, t);
  el('circle', { cx, cy, r: r - 6, fill: COLORS[color][1] }, t);
  el('path', { d: `M${cx - (r - 9)} ${cy - 2} A${r - 9} ${r - 9} 0 0 1 ${cx + (r - 9)} ${cy - 2} A${r - 7} ${r - 5} 0 0 0 ${cx - (r - 9)} ${cy - 2} Z`, fill: '#fff', opacity: 0.32 }, t);
  draw(t, cx, cy);
  if (o.badge) { outlined(t, 'circle', { cx: cx + r * 0.7, cy: cy - r * 0.7, r: 6.5, fill: 'url(#gemRed)' }, 1.1); T(t, cx + r * 0.7, cy - r * 0.7 + 3.4, o.badge, 9, { sw: 2 }); }
  if (o.label) T(p, cx, cy + r + 11, o.label, 10, { sw: 2.6 });
  return t;
}
function pill(p, x, y, w, kind, value) {
  const t = g(p, { filter: 'url(#drop)' });
  el('rect', { x, y, width: w, height: 22, rx: 11, fill: OUT }, t);
  el('rect', { x: x + 1.4, y: y + 1.4, width: w - 2.8, height: 19.2, rx: 9.6, fill: 'url(#goldRim)' }, t);
  el('rect', { x: x + 3.4, y: y + 3.4, width: w - 6.8, height: 15.2, rx: 7.6, fill: 'url(#woodDark)' }, t);
  icon[kind](t, x + 11, y + 11, 8);
  T(t, x + w / 2 + 3, y + 15.5, value, 11.5, { sw: 2.6, max: w - 44 });
  roundBtn(t, x + w - 9, y + 11, 9, 'green', (q, a, b) => icon.plus(q, a, b, 0.7));
}
function ribbon(p, cx, y, w, label, size = 16) {
  w = Math.max(w, measure(p, label, size, 'Rozha One', 400) + 30);
  const t = g(p, { filter: 'url(#drop)' });
  outlined(t, 'path', { d: `M${cx - w / 2 - 18} ${y + 6} L${cx - w / 2 - 6} ${y + 14} L${cx - w / 2 - 18} ${y + 24} H${cx - w / 2 + 4} V${y + 6} Z`, fill: '#7a160a' }, 1.4);
  outlined(t, 'path', { d: `M${cx + w / 2 + 18} ${y + 6} L${cx + w / 2 + 6} ${y + 14} L${cx + w / 2 + 18} ${y + 24} H${cx + w / 2 - 4} V${y + 6} Z`, fill: '#7a160a' }, 1.4);
  outlined(t, 'path', { d: `M${cx - w / 2} ${y} Q${cx} ${y - 3} ${cx + w / 2} ${y} V${y + 20} Q${cx} ${y + 17} ${cx - w / 2} ${y + 20} Z`, fill: 'url(#ribbon)' }, 1.6);
  el('path', { d: `M${cx - w / 2 + 3} ${y + 3} Q${cx} ${y + 0.4} ${cx + w / 2 - 3} ${y + 3}`, stroke: '#ffd66b', 'stroke-width': 1, fill: 'none' }, t);
  el('path', { d: `M${cx - w / 2 + 3} ${y + 17} Q${cx} ${y + 14.4} ${cx + w / 2 - 3} ${y + 17}`, stroke: '#ffd66b', 'stroke-width': 1, fill: 'none' }, t);
  T(t, cx, y + 10 + size * 0.34, label, size, { font: 'Rozha One', weight: 400, sw: Math.min(2.6, size * 0.16), max: w - 14 });
}
function filigree(t, x, y, sx, sy) {
  const q = g(t, { transform: `translate(${x} ${y}) scale(${sx} ${sy})` });
  el('path', { d: 'M0 22 Q0 0 22 0 M4 26 Q6 6 26 4 M10 2 Q14 10 8 14 Q2 12 6 8', stroke: OUT, 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }, q);
  el('path', { d: 'M0 22 Q0 0 22 0 M4 26 Q6 6 26 4 M10 2 Q14 10 8 14 Q2 12 6 8', stroke: 'url(#goldRim)', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, q);
  outlined(q, 'circle', { cx: 6, cy: 6, r: 3.4, fill: 'url(#gemRed)' }, 0.8);
}
function panel(p, x, y, w, h, title, o = {}) {
  const t = g(p);
  el('rect', { x: x + 3, y: y + 6, width: w, height: h, rx: 16, fill: '#000', opacity: 0.45, filter: 'url(#soft)' }, t);
  el('rect', { x, y, width: w, height: h, rx: 16, fill: OUT }, t);
  el('rect', { x: x + 2, y: y + 2, width: w - 4, height: h - 4, rx: 14, fill: 'url(#woodDark)' }, t);
  for (let i = 0; i < 5; i++) el('path', { d: `M${x + 6} ${y + 14 + i * (h / 5)} Q${x + w / 2} ${y + 10 + i * (h / 5)} ${x + w - 6} ${y + 16 + i * (h / 5)}`, stroke: '#2a1608', 'stroke-width': 0.7, fill: 'none', opacity: 0.5 }, t);
  el('rect', { x: x + 7, y: y + 7, width: w - 14, height: h - 14, rx: 10, fill: 'url(#goldRim)' }, t);
  el('rect', { x: x + 9.5, y: y + 9.5, width: w - 19, height: h - 19, rx: 8, fill: 'url(#parch)' }, t);
  for (let i = 0; i < 60; i++) el('circle', { cx: x + 12 + rnd() * (w - 24), cy: y + 12 + rnd() * (h - 24), r: 0.6 + rnd() * 1.6, fill: '#c9a46a', opacity: 0.18 }, t);
  el('rect', { x: x + 9.5, y: y + 9.5, width: w - 19, height: h - 19, rx: 8, fill: 'none', stroke: '#b8884a', 'stroke-width': 1, 'stroke-dasharray': '1 3', opacity: 0.6 }, t);
  filigree(t, x + 11, y + 11, 1, 1); filigree(t, x + w - 11, y + 11, -1, 1); filigree(t, x + 11, y + h - 11, 1, -1); filigree(t, x + w - 11, y + h - 11, -1, -1);
  if (title) ribbon(t, x + w / 2, y - 8, 60, title);
  if (o.close) roundBtn(t, x + w - 8, y + 8, 13, 'red', (q, a, b) => icon.close(q, a, b, 0.9));
  return t;
}
function toggle(p, x, y, on) {
  const t = g(p, { filter: 'url(#drop)' });
  el('rect', { x, y, width: 52, height: 22, rx: 11, fill: OUT }, t);
  el('rect', { x: x + 1.4, y: y + 1.4, width: 49.2, height: 19.2, rx: 9.6, fill: 'url(#goldRim)' }, t);
  el('rect', { x: x + 3.6, y: y + 3.6, width: 44.8, height: 14.8, rx: 7.4, fill: on ? 'url(#btnGreen)' : 'url(#woodDark)' }, t);
  const kx = on ? x + 41 : x + 11;
  outlined(t, 'circle', { cx: kx, cy: y + 11, r: 9, fill: 'url(#gold)' }, 1.2);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el('path', { d: `M${kx + Math.cos(a) * 3.6} ${y + 11 + Math.sin(a) * 3.6} L${kx + Math.cos(a) * 6.6} ${y + 11 + Math.sin(a) * 6.6}`, stroke: '#a8520c', 'stroke-width': 1 }, t); }
  el('circle', { cx: kx, cy: y + 11, r: 2.8, fill: '#fff4c8' }, t);
}
function slider(p, x, y, w, v) {
  const t = g(p, { filter: 'url(#drop)' });
  el('rect', { x, y, width: w, height: 12, rx: 6, fill: OUT }, t);
  el('rect', { x: x + 1.4, y: y + 1.4, width: w - 2.8, height: 9.2, rx: 4.6, fill: '#3a1e0c' }, t);
  el('rect', { x: x + 1.4, y: y + 1.4, width: (w - 2.8) * v, height: 9.2, rx: 4.6, fill: 'url(#saffron)' }, t);
  el('rect', { x: x + 3, y: y + 2.4, width: (w - 6) * v, height: 2.4, rx: 1.2, fill: '#fff', opacity: 0.35 }, t);
  icon.diya(t, x + w * v, y + 9, 8, true);
}
function tab(p, x, y, w, label, active) {
  const t = g(p, { filter: 'url(#drop)' });
  outlined(t, 'path', { d: `M${x} ${y + 22} V${y + 6} Q${x} ${y} ${x + 6} ${y} H${x + w - 6} Q${x + w} ${y} ${x + w} ${y + 6} V${y + 22} Z`, fill: active ? 'url(#btnRed)' : 'url(#woodDark)' }, 1.4);
  el('path', { d: `M${x + 3} ${y + 4} H${x + w - 3}`, stroke: '#ffd66b', 'stroke-width': 1.2, opacity: active ? 1 : 0.4 }, t);
  T(t, x + w / 2, y + 15.5, label, 11, { sw: 2.6, fill: active ? '#fff8e6' : '#e0c8a0', max: w - 10 });
}
function logo(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  const glow = el('circle', { cx: 0, cy: -8, r: 56, fill: 'url(#sunDisc)', opacity: 0.85 }, t);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; el('path', { d: `M${Math.cos(a) * 30} ${-8 + Math.sin(a) * 30} L${Math.cos(a + 0.08) * 66} ${-8 + Math.sin(a + 0.08) * 66} L${Math.cos(a - 0.08) * 66} ${-8 + Math.sin(a - 0.08) * 66} Z`, fill: '#ffd25a', opacity: 0.5 }, t); }
  const word = (txt, yy, size) => {
    for (let k = 5; k >= 1; k--) T(t, 0, yy + k, txt, size, { font: 'Rozha One', weight: 400, fill: '#6a1e08', stroke: '#3a1004', sw: 6, ls: 1 });
    T(t, 0, yy, txt, size, { font: 'Rozha One', weight: 400, fill: 'url(#logoGold)', stroke: OUT, sw: 6, ls: 1 });
    const hi = T(t, 0, yy - 1, txt, size, { font: 'Rozha One', weight: 400, fill: 'none', stroke: '#fff6c8', sw: 0.8, ls: 1 });
    hi.setAttribute('opacity', 0.7);
  };
  word('SANDSTONE', -10, 34);
  ribbon(t, 0, 2, 120, 'KINGDOM', 17);
  T(t, 0, 40, 'TOWER DEFENSE', 9, { sw: 2.4, ls: 2, fill: '#ffe8b0' });
}


// ============================================================ royal chest
// An open treasure chest: dark wood, gold bands and lion feet, a ruby clasp,
// red velvet lining, and treasure spilling out under a shaft of light.
function royalChest(p, x, y, s = 1) {
  const t = g(p, { transform: `translate(${x} ${y}) scale(${s})` });
  const halo = el('circle', { cx: 0, cy: -24, r: 40, fill: 'url(#holy)' }, t);
  anim(halo, { attributeName: 'r', values: '36;44;36', dur: '2s' });
  for (let i = -3; i <= 3; i++) el('path', { d: `M${i * 4} -30 L${i * 10 - 5} -62 L${i * 10 + 5} -62 Z`, fill: '#fff6c8', opacity: 0.2 }, t);
  shadow(t, 0, 2, 30, 5, 0.4);
  // open lid behind the box
  outlined(t, 'path', { d: 'M-26 -30 L-24 -52 Q0 -64 24 -52 L26 -30 Z', fill: 'url(#woodDark)' }, 1.6);
  outlined(t, 'path', { d: 'M-21 -32 L-19.6 -49 Q0 -59 19.6 -49 L21 -32 Z', fill: 'url(#btnRed)' }, 1.1);
  for (let i = -16; i <= 16; i += 8) el('circle', { cx: i, cy: -42 - (16 - Math.abs(i)) * 0.25, r: 1.2, fill: '#ffd66b' }, t);
  el('path', { d: 'M-24 -52 Q0 -64 24 -52', stroke: 'url(#goldRim)', 'stroke-width': 3, fill: 'none' }, t);
  // treasure heap
  [[-14, -32], [-6, -36], [4, -35], [13, -32], [-9, -29], [9, -29], [0, -31]].forEach(([a, b]) => coinIcon(t, a, b, 5));
  rubyIcon(t, -3, -42, 5.4);
  outlined(t, 'circle', { cx: 10, cy: -40, r: 3.8, fill: 'url(#gemBlue)' }, 0.8);
  outlined(t, 'circle', { cx: -14, cy: -39, r: 3.4, fill: 'url(#gemGreen)' }, 0.8);
  for (let i = 0; i < 9; i++) outlined(t, 'circle', { cx: -20 + i * 2.6, cy: -30 + Math.sin(i / 2.6) * 5, r: 1.3, fill: '#fffaf0' }, 0.4);
  // a small crown on top of the heap
  outlined(t, 'path', { d: 'M2 -44 L2 -50 L5 -47 L8 -52 L11 -47 L14 -50 L14 -44 Z', fill: 'url(#gold)' }, 0.8);
  outlined(t, 'circle', { cx: 8, cy: -52.6, r: 1.2, fill: '#e2342a' }, 0.4);
  // the box
  outlined(t, 'path', { d: 'M-28 -30 H28 L26 -2 H-26 Z', fill: 'url(#woodDark)' }, 1.8);
  for (let i = -20; i <= 20; i += 8) el('path', { d: `M${i} -28 V-4`, stroke: '#2a1608', 'stroke-width': 0.6, opacity: 0.5 }, t);
  for (const yy of [-29, -4]) { el('path', { d: `M-28 ${yy} H28`, stroke: OUT, 'stroke-width': 5 }, t); el('path', { d: `M-28 ${yy} H28`, stroke: 'url(#goldRim)', 'stroke-width': 3.2 }, t); }
  for (const xx of [-18, 18]) { el('path', { d: `M${xx} -30 V-2`, stroke: OUT, 'stroke-width': 5 }, t); el('path', { d: `M${xx} -30 V-2`, stroke: 'url(#goldRim)', 'stroke-width': 3.2 }, t); }
  for (const [cx, cy] of [[-26, -27], [26, -27], [-25, -6], [25, -6]]) outlined(t, 'circle', { cx, cy, r: 2.2, fill: 'url(#gold)' }, 0.6);
  // ornate front plate with a ruby clasp and lotus filigree
  outlined(t, 'path', { d: 'M-9 -24 H9 V-12 Q0 -6 -9 -12 Z', fill: 'url(#gold)' }, 1.2);
  el('path', { d: 'M-7 -14 Q-4 -20 0 -16 Q4 -20 7 -14', stroke: '#8a5a0c', 'stroke-width': 0.8, fill: 'none' }, t);
  rubyIcon(t, 0, -18, 3.6);
  // lion-paw feet
  for (const fx of [-22, 22]) outlined(t, 'path', { d: `M${fx - 5} -2 Q${fx - 6} 3 ${fx - 2} 3 H${fx + 2} Q${fx + 6} 3 ${fx + 5} -2 Z`, fill: 'url(#gold)' }, 1);
  [[-19, -50], [21, -46], [0, -66], [-24, -38]].forEach(([a, b], i) => { const sp = g(t); sparkle(sp, a, b, 3 + (i % 2)); anim(sp, { attributeName: 'opacity', values: '0;1;0', dur: `${1.2 + i * 0.3}s` }); });
  return t;
}
