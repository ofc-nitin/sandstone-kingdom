// Fits the 844 x 390 battlefield to any screen without stretching or cropping anything
// important. Wider phones see extra scenery at the sides, tablets above and below.
export const WORLD_W = 844;
export const WORLD_H = 390;
// Background art extends this far beyond the battlefield so the extra space is filled.
export const BLEED_X = 120;
export const BLEED_Y = 170;

export function computeView(cssW, cssH, dpr, safe = { l: 0, r: 0, t: 0, b: 0 }) {
  const s = Math.min(cssW / WORLD_W, cssH / WORLD_H);
  const ox = (cssW - WORLD_W * s) / 2, oy = (cssH - WORLD_H * s) / 2;
  // UI scale follows the screen size, a little smaller than the battlefield so the HUD stays out
  // of the way; clamped so it never gets tiny on small phones or huge on tablets and desktops.
  // Tap areas keep a 44 px minimum on their own (see the tap helpers).
  const u = Math.max(0.74, Math.min(1.25, Math.min(cssW / WORLD_W, cssH / WORLD_H) * 0.88));
  return {
    cssW, cssH, dpr, s, ox, oy, u, safe,
    toWorld: (x, y) => ({ x: (x - ox) / s, y: (y - oy) / s }),
    toScreen: (x, y) => ({ x: ox + x * s, y: oy + y * s }),
    // pixels per art unit for sprites drawn at world scale `k`
    px: (k = 1) => Math.min(4, s * dpr * k),
  };
}

// Reads the phone's safe-area insets (notches, rounded corners) from CSS env().
export function readSafeArea() {
  const probe = document.getElementById('safe-probe');
  if (!probe) return { l: 0, r: 0, t: 0, b: 0 };
  const cs = getComputedStyle(probe);
  const n = (v) => parseFloat(v) || 0;
  return { l: n(cs.paddingLeft), r: n(cs.paddingRight), t: n(cs.paddingTop), b: n(cs.paddingBottom) };
}
