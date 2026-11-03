// Turns the game's SVG drawing functions into bitmap canvases, once, at the exact
// resolution the screen needs. Drawing bitmaps each frame is much faster than SVG.
/* global defs, uiDefs, el */

const NS = 'http://www.w3.org/2000/svg';

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
