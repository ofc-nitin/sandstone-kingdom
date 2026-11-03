// A road made of cubic Bezier segments, flattened into a polyline so enemies can move
// along it by distance. Pure math, no DOM, so it runs in tests too.

// spec: { start: [x, y], curves: [[c1x, c1y, c2x, c2y, x, y], ...] }
export function makePath(spec, samplesPerCurve = 48) {
  const pts = [spec.start.slice()];
  let [px, py] = spec.start;
  for (const [c1x, c1y, c2x, c2y, x, y] of spec.curves) {
    for (let i = 1; i <= samplesPerCurve; i++) {
      const t = i / samplesPerCurve, u = 1 - t;
      pts.push([
        u * u * u * px + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        u * u * u * py + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      ]);
    }
    [px, py] = [x, y];
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const length = cum[cum.length - 1];

  // position and heading at distance d along the road
  function at(d) {
    d = Math.max(0, Math.min(length, d));
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
    const seg = cum[hi] - cum[lo] || 1, f = (d - cum[lo]) / seg;
    const [ax, ay] = pts[lo], [bx, by] = pts[hi];
    return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, angle: Math.atan2(by - ay, bx - ax) };
  }
  // distance along the road of the closest point to (x, y), and how far away it is
  function nearest(x, y) {
    let best = { d: 0, dist: Infinity };
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
      const qx = ax + vx * t, qy = ay + vy * t, dist = Math.hypot(x - qx, y - qy);
      if (dist < best.dist) best = { d: cum[i - 1] + t * Math.sqrt(len2), dist };
    }
    return best;
  }
  // SVG path string, used to paint the road
  const svg = `M${spec.start.join(' ')} ` + spec.curves.map((c) => 'C' + c.join(' ')).join(' ');
  return { length, at, nearest, points: pts, svg };
}
