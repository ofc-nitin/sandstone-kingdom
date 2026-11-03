// Turns the game's SVG drawing functions into bitmap canvases, once, at the exact
// resolution the screen needs. Drawing bitmaps each frame is much faster than SVG.
/* global defs, uiDefs, el */

const NS = 'http://www.w3.org/2000/svg';

// SVG drawn as an image cannot see the page's fonts, so text sprites carry the font data inside.
let fontCSS = '';
export async function loadSpriteFonts() {
  const files = [['Rozha One', 400, 'fonts/RozhaOne-400.woff2'], ['Martel', 700, 'fonts/Martel-700.woff2'], ['Martel', 900, 'fonts/Martel-900.woff2']];
  try {
    const parts = await Promise.all(files.map(async ([fam, w, url]) => {
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
    }));
    fontCSS = parts.join('');
  } catch { fontCSS = ''; }
}

// draw(svg) draws with origin at the sprite's anchor (feet / base).
// box = [x, y, w, h] in art units around that origin; scale = pixels per art unit.
export async function rasterize(draw, box, scale, { ui = false } = {}) {
  const [bx, by, bw, bh] = box;
  const pw = Math.max(1, Math.ceil(bw * scale)), ph = Math.max(1, Math.ceil(bh * scale));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('width', pw);
  svg.setAttribute('height', ph);
  svg.setAttribute('viewBox', `${bx} ${by} ${bw} ${bh}`);
  // measure() and getComputedTextLength need the SVG in the document while drawing
  svg.style.cssText = 'position:absolute;left:-99999px;top:0';
  document.body.appendChild(svg);
  (ui ? uiDefs : defs)(svg);
  draw(svg);
  svg.querySelectorAll('animate, animateTransform').forEach((a) => a.remove());
  svg.remove();
  svg.removeAttribute('style'); // the off-screen position must not end up inside the image
  if (fontCSS && svg.querySelector('text')) { const st = document.createElementNS(NS, 'style'); st.textContent = fontCSS; svg.insertBefore(st, svg.firstChild); }
  const text = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = pw;
  c.height = ph;
  c.getContext('2d').drawImage(img, 0, 0, pw, ph);
  return { canvas: c, box, scale };
}

// Draw a rasterized sprite so its art-space origin lands on (x, y) in the current
// canvas transform, at `size` art units per world unit.
export function blit(ctx, sprite, x, y, size = 1, flip = false, alpha = 1) {
  const [bx, by, bw, bh] = sprite.box;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(sprite.canvas, bx * size, by * size, bw * size, bh * size);
  ctx.restore();
}
