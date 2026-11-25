/**
 * Pause decision — Builds grid-cell routes between the segmented person and the stop-hand sentence.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
// Marching-squares contours stitched into paths before corner-cut smoothing.
export function smoothPath(points, closed = true, passes = 2) {
  let out = points;
  for (let k = 0; k < passes; k++) {
    const next = [];
    if (!closed) next.push(out[0]);
    for (let i = 0; i < (closed ? out.length : out.length - 1); i++) {
      const a = out[i],
        b = out[(i + 1) % out.length];
      next.push(
        [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
        [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
      );
    }
    if (!closed) next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}
export function contours(value, w, h, level) {
  const nodes = new Map(),
    edges = [];
  const node = (p) => {
    const key = Math.round(p[0] * 1000) + "," + Math.round(p[1] * 1000);
    if (!nodes.has(key)) nodes.set(key, { p, edges: [] });
    return nodes.get(key);
  };
  for (let y = 1; y < h - 2; y++)
    for (let x = 1; x < w - 2; x++) {
      const id = x + y * w,
        a = value(id),
        b = value(id + 1),
        c = value(id + w + 1),
        d = value(id + w);
      if (![a, b, c, d].every(Number.isFinite)) continue;
      const bits =
        (a >= level ? 1 : 0) |
        (b >= level ? 2 : 0) |
        (c >= level ? 4 : 0) |
        (d >= level ? 8 : 0);
      if (bits === 0 || bits === 15) continue;
      const hits = [];
      if (a >= level !== b >= level) hits.push([x + (level - a) / (b - a), y]);
      if (b >= level !== c >= level) hits.push([x + 1, y + (level - b) / (c - b)]);
      if (c >= level !== d >= level) hits.push([x + 1 - (level - c) / (d - c), y + 1]);
      if (d >= level !== a >= level) hits.push([x, y + 1 - (level - d) / (a - d)]);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        const edge = { a: node(hits[i]), b: node(hits[i + 1]), used: false };
        edge.a.edges.push(edge);
        edge.b.edges.push(edge);
        edges.push(edge);
      }
    }
  const paths = [];
  for (const edge of edges) {
    if (edge.used) continue;
    let start =
        edge.a.edges.length === 1 ? edge.a : edge.b.edges.length === 1 ? edge.b : edge.a,
      at = start,
      path = [at.p];
    while (true) {
      const e = at.edges.find((e) => !e.used);
      if (!e) break;
      e.used = true;
      at = e.a === at ? e.b : e.a;
      path.push(at.p);
      if (at === start) break;
    }
    if (path.length < 24) continue;
    const closed = at === start;
    if (closed) path.pop();
    paths.push({ points: smoothPath(path, closed, 2), closed });
  }
  return paths;
}
