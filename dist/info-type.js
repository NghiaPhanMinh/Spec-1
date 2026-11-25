/**
 * Pause decision — Types and erases colored Info labels while preserving layout and accessible names.
 * AI-assisted implementation, iteratively revised to the author's design direction.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
// Keep full text in the layout while the visible letters type and erase in place.
(() => {
  const panel = document.getElementById("info-panel"),
    items = [];
  for (const button of panel.querySelectorAll("[data-info-effect]")) {
    const text = button.textContent;
    button.setAttribute("aria-label", text);
    button.textContent = "";
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      if (/^\s+$/.test(word)) {
        button.append(document.createTextNode(word));
        continue;
      }
      const group = document.createElement("span");
      group.className = "info-type-word";
      group.setAttribute("aria-hidden", "true");
      for (const letter of Array.from(word)) {
        const glyph = document.createElement("span");
        glyph.className = "info-type-letter";
        glyph.textContent = letter;
        group.append(glyph);
      }
      button.append(group);
    }
    items.push([...button.querySelectorAll(".info-type-letter")]);
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        button.click();
      }
    });
  }
  let origin = 0,
    raf = 0,
    previous = -1;
  function frame(now) {
    raf = 0;
    if (panel.hidden || document.hidden) return;
    if (!origin) origin = now;
    const phase = (now - origin) % 11000,
      progress =
        phase < 3000 ? phase / 3000 : phase < 8000 ? 1 : 1 - (phase - 8000) / 3000,
      bucket = Math.floor(progress * 1000);
    if (bucket !== previous) {
      previous = bucket;
      for (const letters of items) {
        const count = Math.floor(progress * letters.length);
        letters.forEach((letter, index) => {
          letter.style.visibility = index < count ? "visible" : "hidden";
          letter.classList.toggle(
            "typing-head",
            progress < 1 && index === Math.max(0, count - 1),
          );
        });
      }
      panel.dataset.typePhase =
        phase < 3000 ? "typing" : phase < 8000 ? "holding" : "erasing";
    }
    raf = requestAnimationFrame(frame);
  }
  // Seed a fresh randomized garden or structural block frontier for the selected word.
  function start() {
    if (!panel.hidden && !document.hidden && !raf) {
      origin = 0;
      previous = -1;
      raf = requestAnimationFrame(frame);
    }
  }
  new MutationObserver(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    start();
  });
  start();
})();
