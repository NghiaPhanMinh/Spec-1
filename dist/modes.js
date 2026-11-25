/**
 * Pause decision — Mounts only the live portrait iframe; switching folders/visibility releases camera and audio.
 * Most project-specific code was generated/revised with OpenAI Codex under the author's design direction.
 * AI scope and review responsibilities: AI-ASSISTANCE.md.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')],
    home = document.getElementById("home-panel"),
    info = document.getElementById("info-panel"),
    camera = document.getElementById("camera-page"),
    host = document.getElementById("artwork-host");
  let frame = null,
    active = "home",
    inView = false,
    homeScroll = 0;
  function unload() {
    if (frame) window.siteSound?.setFacecam(false);
    frame?.remove();
    frame = null;
  }
  // Load the camera only in the visible artwork section; unload it everywhere else.
  function sync() {
    if (
      active !== "home" ||
      !inView ||
      document.hidden ||
      document.body.dataset.artworkAllowed === "false"
    ) {
      unload();
      return;
    }
    if (frame) return;
    frame = document.createElement("iframe");
    frame.src = "portrait.html?v=submission-51";
    frame.title = "Interactive letter portrait";
    frame.allow = "camera";
    host.append(frame);
    window.siteSound?.setFacecam(true);
  }
  // Select a document tab and keep ARIA selection, scroll position and camera lifecycle in sync.
  function activate(name, { focus = false } = {}) {
    if (name === active) {
      if (focus) tabs.find((t) => t.dataset.panel === name)?.focus();
      return;
    }
    if (active === "home") homeScroll = window.scrollY;
    active = name;
    document.body.dataset.folder = name;
    home.hidden = name !== "home";
    info.hidden = name !== "info";
    for (const tab of tabs) {
      const selected = tab.dataset.panel === name;
      tab.classList.toggle("selected", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    history.replaceState(
      null,
      "",
      name === "info" ? "#info" : location.pathname + location.search,
    );
    window.scrollTo({ top: name === "home" ? homeScroll : 0, behavior: "instant" });
    sync();
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => activate(tab.dataset.panel));
    tab.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const target =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      activate(tabs[target].dataset.panel, { focus: true });
    });
  }
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio > 0.12;
      sync();
    },
    { threshold: [0, 0.12, 0.25] },
  );
  observer.observe(camera);
  document.addEventListener("narrative-stage-change", sync);
  document.addEventListener("visibilitychange", sync);
  addEventListener("pagehide", unload);
  const now = new Date(),
    time = document.getElementById("current-date");
  time.textContent = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
  time.dateTime = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
  if (location.hash === "#info") activate("info");
})();
