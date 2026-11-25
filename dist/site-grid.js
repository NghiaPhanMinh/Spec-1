/**
 * Pause decision — Caches the page-wide letter grid and composites matched light/dark section textures.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
// Two cached textures share one viewport grid; scrolling only composites them.
(() => {
  const canvas = document.getElementById("site-grid"),
    ctx = canvas.getContext("2d"),
    light = document.createElement("canvas"),
    dark = document.createElement("canvas");
  const phrases = [
    "PASS THE MIC.",
    "CHANGE WHO DECIDES.",
    "MAKE ROOM FOR EVERY VOICE.",
    "NO WOMAN IN THE ROOM?",
    "PAUSE THE DECISION.",
  ];
  let timer,
    pending = false,
    w = 0,
    h = 0,
    d = 1,
    glyphStep = 15;
  window.siteGridGlyph = (x, y) => {
    const step = glyphStep,
      row = Math.floor(y / step),
      col = Math.floor(x / step),
      epoch = Math.floor(Date.now() / 2000),
      phrase =
        phrases[
          (((row * 7 + epoch) % phrases.length) + phrases.length) % phrases.length
        ] + " ";
    return phrase[(((col + row * 3) % phrase.length) + phrase.length) % phrase.length];
  };
  // Synthesize a filtered mouse mechanism or fixed binary pulse sequence at a restrained gain.
  function texture(target, color, opacity, lineOpacity, step) {
    target.width = w * d;
    target.height = h * d;
    const c = target.getContext("2d");
    c.scale(d, d);
    c.strokeStyle = color;
    c.globalAlpha = lineOpacity;
    c.lineWidth = 0.5;
    c.beginPath();
    for (let x = 0; x < w; x += step) {
      c.moveTo(x, 0);
      c.lineTo(x, h);
    }
    for (let y = 0; y < h; y += step) {
      c.moveTo(0, y);
      c.lineTo(w, y);
    }
    c.stroke();
    c.font = `500 ${step * 0.76}px monospace`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = color;
    c.globalAlpha = opacity;
    const epoch = Math.floor(Date.now() / 2000);
    for (let row = 0, y = step / 2; y < h; y += step, row++) {
      const phrase = phrases[(row * 7 + epoch) % phrases.length] + " ";
      for (let col = 0, x = step / 2; x < w; x += step, col++)
        c.fillText(phrase[(col + row * 3) % phrase.length], x, y);
    }
  }
  function composite() {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(light, 0, 0, w, h);
    const info = document.getElementById("info-panel");
    if (!info.hidden) return;
    const terminal = document.getElementById("dialogue-page");
    if (!terminal || document.getElementById("home-panel").hidden) return;
    const r = terminal.getBoundingClientRect(),
      top = Math.max(64, r.top),
      bottom = Math.min(h - 3, r.bottom - 3);
    if (bottom <= top) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(3, top, w - 6, bottom - top);
    ctx.clip();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(dark, 0, 0, w, h);
    ctx.restore();
  }
  function rebuild() {
    if (document.hidden) return;
    w = innerWidth;
    h = innerHeight;
    d = Math.min(devicePixelRatio || 1, 2);
    const style = getComputedStyle(document.documentElement),
      step = Number(style.getPropertyValue("--site-gridSpacing")) || (w < 600 ? 12 : 15),
      opacity = Number(style.getPropertyValue("--site-gridOpacity")) || 0,
      lineOpacity = Number(style.getPropertyValue("--site-gridLineOpacity")) || 0,
      color = style.getPropertyValue("--site-gridColor").trim() || "#000";
    glyphStep = step;
    canvas.width = w * d;
    canvas.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    texture(light, color, opacity, lineOpacity, step);
    texture(dark, "#62ed91", 0.08, 0.08, step);
    composite();
  }
  window.siteGridSnapshot = function (isDark) {
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const c = copy.getContext("2d");
    c.fillStyle = isDark
      ? "#000"
      : getComputedStyle(document.documentElement)
          .getPropertyValue("--site-background")
          .trim() || "#f9f9f9";
    c.fillRect(0, 0, copy.width, copy.height);
    c.drawImage(isDark ? dark : light, 0, 0);
    return copy;
  };
  new MutationObserver(() => requestAnimationFrame(composite)).observe(
    document.getElementById("info-panel"),
    { attributes: true, attributeFilter: ["hidden"] },
  );
  function schedule() {
    clearInterval(timer);
    rebuild();
    if (!document.hidden) timer = setInterval(rebuild, 2000);
  }
  document.addEventListener("site-style-change", rebuild);
  addEventListener(
    "scroll",
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          composite();
        });
      }
    },
    { passive: true },
  );
  addEventListener("resize", rebuild);
  document.addEventListener("visibilitychange", schedule);
  schedule();
  addEventListener("pagehide", () => clearInterval(timer));
})();
