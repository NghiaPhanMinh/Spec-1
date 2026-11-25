/**
 * Pause decision — Reads shared site-config.json appearance defaults and exposes them as CSS variables.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
(() => {
  const defaults = {
    background: "#f9f9f9",
    gridColor: "#000000",
    gridOpacity: 0.1,
    gridLineOpacity: 0.1,
    gridSpacing: innerWidth < 600 ? 12 : 15,
    tabStroke: 1.2,
    gradientPink: "#e9a2cf",
    gradientPeach: "#7f8df5",
    gradientCream: "#c7caf5",
    gradientSpeed: 1,
    gradientNoise: 0,
  };
  function apply(config) {
    for (const [key, value] of Object.entries(defaults))
      document.documentElement.style.setProperty("--site-" + key, config[key] ?? value);
    document.dispatchEvent(new Event("site-style-change"));
  }
  apply(defaults);
  fetch("site-config.json?v=submission-51", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : defaults))
    .then(apply)
    .catch(() => {});
})();
