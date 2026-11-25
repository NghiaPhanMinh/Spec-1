/**
 * Pause decision — Validates an open stopping palm from 21 normalized MediaPipe hand landmarks.
 * AI-assisted implementation, iteratively revised to the author's design direction.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
export function isStopPalm(h) {
  if (
    !h ||
    h.length !== 21 ||
    h.some((p) => ![p.x, p.y, p.z ?? 0].every(Number.isFinite))
  )
    return false;
  const d = (a, b) => Math.hypot(h[a].x - h[b].x, h[a].y - h[b].y),
    w = d(5, 17),
    length = d(0, 9);
  if (w < 0.025 || length < 0.03 || w / length < 0.35 || w / length > 2.2) return false;
  const ax = (h[9].x - h[0].x) / length,
    ay = (h[9].y - h[0].y) / length;
  for (const [base, pip, dip, tip] of [
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
  ]) {
    if (d(tip, base) < w * 0.4 || d(tip, 0) < d(pip, 0) * 1.08) return false;
    const ux = h[pip].x - h[base].x,
      uy = h[pip].y - h[base].y,
      vx = h[tip].x - h[dip].x,
      vy = h[tip].y - h[dip].y;
    if ((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1) < 0.55)
      return false;
    if ((h[tip].x - h[pip].x) * ax + (h[tip].y - h[pip].y) * ay < w * 0.1) return false;
  }
  return d(8, 20) > w * 0.15 && d(8, 20) < w * 2.4;
}
