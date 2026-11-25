/**
 * Pause decision — Traces the camera segmentation mask into reusable contour paths off the UI thread.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
import { contours } from "./portrait-geometry.js?v=bounded-15";
self.onmessage = ({ data: { mask, luminance } }) => {
  const paths = [
    ...contours((i) => mask[i * 4] / 255, 512, 384, 0.55),
    ...contours((i) => (mask[i * 4] > 210 ? luminance[i] : NaN), 512, 384, 0.34),
  ];
  self.postMessage(paths);
};
