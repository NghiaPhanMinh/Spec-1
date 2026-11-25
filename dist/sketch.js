/**
 * Pause decision — Renders the shared soft gradient and wave backdrop revealed by click and hand portals.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
// Shared background renderer. Uses the site's existing canvas lifecycle and controls.
(() => {
  const CONFIG = {
    colors: { cream: "#c7caf5", pink: "#e9a2cf", magenta: "#9d9bea", orange: "#7f8df5" },
    blur: { back: 48, front: 7, line: 5 },
    steps: 12,
    drift: 35,
    breathing: 0.05,
  };
  const back = document.createElement("canvas"),
    front = document.createElement("canvas"),
    grain = document.createElement("canvas"),
    bc = back.getContext("2d"),
    fc = front.getContext("2d"),
    gc = grain.getContext("2d");
  let width = 0,
    height = 0;
  const seed = Math.random() * 100;
  const smooth = (t) => {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    },
    hash = (x, y) => {
      const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return v - Math.floor(v);
    },
    noise = (x, y) => {
      const a = Math.floor(x),
        b = Math.floor(y),
        u = smooth(x - a),
        v = smooth(y - b),
        mix = (a, b, t) => a + (b - a) * t;
      return mix(
        mix(hash(a, b), hash(a + 1, b), u),
        mix(hash(a, b + 1), hash(a + 1, b + 1), u),
        v,
      );
    },
    rgb = (c) => {
      const n = parseInt(c.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    rgba = (c, a) => "rgba(" + rgb(c).join(",") + "," + a + ")";
  function easedGradientStops(g, color) {
    for (let i = 0; i < CONFIG.steps; i++) {
      const t = i / (CONFIG.steps - 1);
      g.addColorStop(t, rgba(color, 1 - smooth(t)));
    }
  }
  function drawGlow(c, x, y, r) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    easedGradientStops(g, "#ffffff");
    c.save();
    c.globalCompositeOperation = "screen";
    c.globalAlpha = 0.16;
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }
  // Use eased radial color stops for soft orb edges rather than a flat colored disc.
  function drawOrb(c, x, y, r, o) {
    const g = c.createRadialGradient(x - r * 0.28, y - r * 0.22, 0, x, y, r),
      colors = [
        o.peach || CONFIG.colors.orange,
        o.pink || CONFIG.colors.pink,
        CONFIG.colors.magenta,
      ];
    for (let i = 0; i < CONFIG.steps; i++) {
      const t = i / (CONFIG.steps - 1),
        part = t < 0.48 ? 0 : 1,
        u = smooth(part ? (t - 0.48) / 0.52 : t / 0.48),
        a = rgb(colors[part]),
        b = rgb(colors[part + 1]),
        color = a.map((n, j) => Math.round(n + (b[j] - n) * u));
      g.addColorStop(
        t,
        "rgba(" + color.join(",") + "," + (1 - smooth((t - 0.22) / 0.78)) + ")",
      );
    }
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Rebuild viewport-sized layers and grid addresses so every effect stays aligned.
  function resize(w, h) {
    if (width === w && height === h) return;
    width = w;
    height = h;
    for (const c of [back, front, grain]) {
      c.width = w;
      c.height = h;
    }
    const pixels = gc.createImageData(w, h);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const v = Math.random() * 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
      pixels.data[i + 3] = 15;
    }
    gc.putImageData(pixels, 0, 0);
  }
  // Render drifting gradient orbs and smooth waves into offscreen layers.
  function render(c, now, o, w, h) {
    resize(w, h);
    const t = now * 0.00012 * (o.speed ?? 1),
      drift = Math.min(w, h) * 0.13,
      positions = [
        [-0.04, 0.16, 0.46],
        [1, 0.72, 0.48],
        [0.43, 1.08, 0.42],
      ];
    bc.clearRect(0, 0, w, h);
    bc.fillStyle = o.cream || CONFIG.colors.cream;
    bc.fillRect(0, 0, w, h);
    fc.clearRect(0, 0, w, h);
    positions.forEach(([x, y, r], i) => {
      const dx = (noise(seed + i * 7, t) - 0.5) * drift * 2,
        dy = (noise(seed + 40 + i * 9, t) - 0.5) * drift * 2;
      drawOrb(
        bc,
        x * w + dx,
        y * h + dy,
        w * r * (1 + Math.sin(t + i) * CONFIG.breathing),
        o,
      );
    });
    drawGlow(
      bc,
      w * 0.6 + (noise(seed + 200, t) - 0.5) * drift * 2,
      h * 0.28 + (noise(seed + 250, t) - 0.5) * drift * 2,
      w * 0.23,
    );
    c.clearRect(0, 0, w, h);
    c.fillStyle = o.cream || CONFIG.colors.cream;
    c.fillRect(0, 0, w, h);
    c.save();
    if ("filter" in c) {
      c.filter = "blur(" + CONFIG.blur.back * 0.5 + "px)";
      c.drawImage(back, 0, 0);
    } else {
      c.globalAlpha = 1 / 24;
      for (let i = 0; i < 24; i++) {
        const angle = i * 2.39996,
          r = Math.sqrt(i / 24) * w * 0.04;
        c.drawImage(back, Math.cos(angle) * r, Math.sin(angle) * r);
      }
    }
    c.restore();
    c.save();
    if ("filter" in c) c.filter = "blur(" + CONFIG.blur.front * 0.5 + "px)";
    c.drawImage(front, 0, 0);
    c.restore();
    c.save();
    c.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i++) {
      const path = () => {
        c.beginPath();
        for (let x = -20; x < w + 20; x += 4) {
          const u = x / w;
          const y =
            h * (0.5 + Math.sin(t * 0.3 + i * 1.65) * 0.65) +
            Math.sin(u * Math.PI * 1.35 - t * 0.7 + i) * h * 0.19 +
            Math.sin(u * Math.PI * 0.65 + t * 0.4 + i * 0.8) * h * 0.1;
          x === -20 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
      };
      c.strokeStyle = "#fff4e8";
      c.lineCap = "round";
      c.globalAlpha = 0.32;
      c.lineWidth = 5;
      if ("filter" in c) c.filter = "blur(4px)";
      path();
      c.filter = "none";
      c.globalAlpha = 0.72;
      c.lineWidth = 1.2;
      path();
    }
    c.restore();
    if (o.grain > 0) {
      c.save();
      c.globalCompositeOperation = "overlay";
      c.globalAlpha = Math.min(1, o.grain);
      c.drawImage(grain, 0, 0);
      c.restore();
    }
  }
  window.glowBackdrop = { render, CONFIG };
})();
