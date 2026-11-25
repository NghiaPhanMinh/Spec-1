/**
 * Pause decision — Owns the Web Audio graph, original recording playback, typing timing and quiet fan crossfade.
 * AI-assisted implementation, iteratively revised to the author's design direction.
 * Library credits and licenses: THIRD-PARTY-NOTICES.md. Review guide: CODE-GUIDE.md.
 * Project code: GPL-3.0-or-later (see LICENSE); vendor licenses remain unchanged.
 */
// One audio graph for the page and its camera iframe. Original recordings stay local to the site.
(() => {
  const CONFIG = {
    master: 0.72,
    fanNormal: 0.14,
    fanCreepyDry: 0.11,
    fanHarsh: 0.035,
    noise: 0.008,
    typingGain: 0.24,
  };
  const files = {
      fan: "audio/fan-corrected.mp3",
      bling: "audio/bling-entry.mp3",
      keyboard: "audio/typing-fixed.mp3",
    },
    raw = {},
    buffers = {},
    pending = {};
  let ctx,
    master,
    fan = null,
    bling = null,
    facecam = false,
    portraitReady = false,
    raised = false,
    portalMix = 0,
    handPortalMix = 0,
    gradientOpen = false,
    worldEntered = false,
    typingToken = 0,
    voices = new Set(),
    textures = new Set(),
    reverseBuffer = null,
    blingToken = 0,
    lastControlClick = -Infinity;
  const downloads = Object.fromEntries(
    Object.entries(files).map(([key, url]) => [
      key,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw Error("Audio unavailable");
          return r.arrayBuffer();
        })
        .then((b) => (raw[key] = b))
        .catch(() => null),
    ]),
  );
  function ramp(param, value, time = 0.18) {
    param.cancelScheduledValues(ctx.currentTime);
    param.setTargetAtTime(value, ctx.currentTime, time / 3);
  }
  // Create the shared audio graph only after a browser user gesture unlocks audio.
  function init() {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      ctx = new Audio();
      master = ctx.createGain();
      master.gain.value = CONFIG.master;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -5;
      limiter.knee.value = 3;
      limiter.ratio.value = 16;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      master.connect(limiter);
      const soft = ctx.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = 4200;
      soft.Q.value = 0.5;
      limiter.connect(soft);
      soft.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return true;
  }
  async function buffer(key) {
    if (!init()) return null;
    if (buffers[key]) return buffers[key];
    if (!pending[key])
      pending[key] = downloads[key]
        .then(() => (raw[key] ? ctx.decodeAudioData(raw[key].slice(0)) : null))
        .then((b) => (buffers[key] = b))
        .catch(() => null);
    return pending[key];
  }
  function stopOne(sound) {
    if (!sound || !ctx) return;
    ramp(sound.gain.gain, 0, 0.06);
    try {
      sound.source.stop(ctx.currentTime + 0.08);
    } catch {}
    setTimeout(() => {
      sound.source.disconnect();
      sound.gain.disconnect();
    }, 120);
  }
  async function startFan() {
    const b = await buffer("fan");
    if (!b || !facecam || !portraitReady || document.hidden || fan) return;
    const source = ctx.createBufferSource(),
      dry = ctx.createGain(),
      pre = ctx.createGain(),
      distortion = ctx.createWaveShaper(),
      wet = ctx.createGain(),
      noise = ctx.createBufferSource(),
      noiseGain = ctx.createGain(),
      filter = ctx.createBiquadFilter(),
      bus = ctx.createGain();
    source.buffer = b;
    source.loop = true;
    pre.gain.value = 0.8;
    const curve = new Float32Array(4096);
    for (let i = 0; i < curve.length; i++)
      curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 2.2);
    distortion.curve = curve;
    distortion.oversample = "2x";
    const grain = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
      data = grain.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = grain;
    noise.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 650;
    filter.Q.value = 0.55;
    source.connect(dry);
    dry.connect(bus);
    source.connect(pre);
    pre.connect(distortion);
    distortion.connect(wet);
    wet.connect(bus);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(bus);
    bus.connect(master);
    bus.gain.value = 0;
    dry.gain.value =
      CONFIG.fanCreepyDry + (CONFIG.fanNormal - CONFIG.fanCreepyDry) * portalMix;
    wet.gain.value = CONFIG.fanHarsh * (1 - portalMix);
    noiseGain.gain.value = CONFIG.noise * (1 - portalMix);
    fan = {
      source,
      noise,
      dry,
      wet,
      noiseGain,
      bus,
      nodes: [source, noise, dry, pre, distortion, wet, filter, noiseGain, bus],
    };
    source.start();
    noise.start();
    const fade = new Float32Array(128);
    for (let i = 0; i < fade.length; i++) {
      const t = i / (fade.length - 1);
      fade[i] = t * t * (3 - 2 * t);
    }
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.setValueCurveAtTime(fade, ctx.currentTime, 5);
    state();
  }
  function stopFan() {
    if (!fan) return;
    const old = fan;
    fan = null;
    ramp(old.bus.gain, 0, 0.12);
    old.source.stop(ctx.currentTime + 0.14);
    old.noise.stop(ctx.currentTime + 0.14);
    setTimeout(() => old.nodes.forEach((n) => n.disconnect()), 180);
  }
  function state() {
    document.body.dataset.fanSound =
      facecam && !portraitReady
        ? "loading"
        : facecam
          ? portalMix >= 0.99
            ? "normal"
            : portalMix > 0
              ? "transitioning"
              : "creepy"
          : "off";
    document.body.dataset.soundReady = String(ctx?.state === "running");
  }
  function portal(value, covered = value >= 1) {
    const entered = gradientOpen || value > 0;
    if (entered && !worldEntered) playBling();
    if (!entered && worldEntered) {
      blingToken++;
      stopOne(bling);
      bling = null;
    }
    worldEntered = entered;
    handPortalMix = Math.max(0, Math.min(1, value));
    const next = gradientOpen ? 1 : handPortalMix;
    if (next === portalMix) return;
    portalMix = next;
    if (fan) {
      ramp(
        fan.dry.gain,
        CONFIG.fanCreepyDry + (CONFIG.fanNormal - CONFIG.fanCreepyDry) * portalMix,
        0.6,
      );
      ramp(fan.wet.gain, CONFIG.fanHarsh * (1 - portalMix), 0.6);
      ramp(fan.noiseGain.gain, CONFIG.noise * (1 - portalMix), 0.6);
    }
    state();
  }
  function gradient(value) {
    gradientOpen = !!value;
    portal(handPortalMix);
  }
  function hand(value) {
    raised = !!value;
    state();
  }
  function setFacecam(value) {
    facecam = !!value;
    portraitReady = false;
    raised = false;
    handPortalMix = 0;
    portalMix = gradientOpen ? 1 : 0;
    worldEntered = gradientOpen;
    if (facecam) {
      init();
      startFan();
    } else {
      stopFan();
      stopTyping();
    }
    state();
  }
  async function playBling() {
    const token = ++blingToken,
      b = await buffer("bling");
    if (!b || token !== blingToken || document.hidden) return;
    stopOne(bling);
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = b;
    source.connect(gain);
    gain.connect(master);
    const now = ctx.currentTime + 1,
      duration = b.duration;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.85, now + 0.012);
    gain.gain.setValueAtTime(0.85, now + duration - 0.08);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    source.start(now, 0, duration);
    bling = { source, gain };
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (bling?.source === source) bling = null;
    };
    document.body.dataset.lastSound = "bling";
  }
  async function word({ delay = 0, layered = true, reverse = false } = {}) {
    const token = typingToken,
      b = await buffer("keyboard");
    if (!b || ctx.state !== "running" || token !== typingToken || document.hidden) return;
    if (reverse && !reverseBuffer) {
      reverseBuffer = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++)
        reverseBuffer.getChannelData(ch).set(b.getChannelData(ch).slice().reverse());
    }
    const count = layered && Math.random() > 0.65 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const source = ctx.createBufferSource(),
        gain = ctx.createGain(),
        pan = ctx.createStereoPanner?.();
      source.buffer = reverse ? reverseBuffer : b;
      source.playbackRate.value = 1;
      source.connect(gain);
      if (pan) {
        pan.pan.value = (Math.random() - 0.5) * 0.12;
        gain.connect(pan);
        pan.connect(master);
      } else gain.connect(master);
      const when = ctx.currentTime + delay + i * 0.045,
        duration = b.duration;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(
        (CONFIG.typingGain * (0.88 + Math.random() * 0.12)) / (i ? 2.5 : 1),
        when + 0.003,
      );
      gain.gain.setValueAtTime(
        CONFIG.typingGain * (i ? 0.36 : 0.95),
        when + Math.max(0.004, duration - 0.012),
      );
      gain.gain.linearRampToValueAtTime(0, when + duration);
      const voice = { source, gain };
      voices.add(voice);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        pan?.disconnect();
        voices.delete(voice);
      };
      source.start(when);
      if (voices.size > 128) {
        const oldest = voices.values().next().value;
        stopOne(oldest);
        voices.delete(oldest);
      }
    }
    document.body.dataset.lastSound = "typing-word";
    document.body.dataset.typingHits = String(
      Number(document.body.dataset.typingHits || 0) + 1,
    );
  }
  function letters(sentence, seconds = 3, reverse = false) {
    stopTyping();
    const count = Array.from(sentence).filter((c) => /\p{L}/u.test(c)).length;
    for (let i = 0; i < count; i++)
      word({ delay: (i * seconds) / Math.max(1, count), layered: false, reverse });
    document.body.dataset.letterSequence = String(count);
    document.body.dataset.letterDirection = reverse ? "reverse" : "forward";
  }
  function stopTyping() {
    typingToken++;
    for (const voice of voices) stopOne(voice);
    voices.clear();
  }
  function ready() {
    if (!facecam || portraitReady) return;
    portraitReady = true;
    startFan();
    state();
  }
  // Synthesize a filtered mouse mechanism or fixed binary pulse sequence at a restrained gain.
  function texture(kind = "click", seconds = 0.075) {
    if (!init() || ctx.state !== "running" || document.hidden) return;
    const source = ctx.createBufferSource(),
      gain = ctx.createGain(),
      filter = ctx.createBiquadFilter(),
      length = Math.ceil(ctx.sampleRate * seconds),
      b = ctx.createBuffer(1, length, ctx.sampleRate),
      data = b.getChannelData(0);
    const bits = [
      0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1,
      0, 0, 1, 0,
    ];
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      if (kind === "click") {
        let value = 0;
        for (const [start, level] of [
          [0, 1],
          [0.023, 0.48],
        ]) {
          const age = t - start;
          if (age < 0) continue;
          const attack = Math.min(1, age / 0.0008);
          value +=
            level *
            attack *
            ((Math.random() * 2 - 1) * Math.exp(-age / 0.0035) * 0.42 +
              Math.sin(age * Math.PI * 2 * 560) * Math.exp(-age / 0.007) * 0.58);
        }
        data[i] = value;
      } else {
        const slot = seconds / bits.length,
          k = Math.min(bits.length - 1, Math.floor(t / slot)),
          local = t - k * slot,
          bit = bits[k],
          pulse = (start, width) => {
            const age = local - start;
            return age < 0 || age > width
              ? 0
              : Math.min(1, age / 0.001, (width - age) / 0.002);
          },
          gate = bit
            ? pulse(0, slot * 0.2) + pulse(slot * 0.38, slot * 0.2)
            : pulse(0, slot * 0.36),
          carrier =
            Math.sin(t * Math.PI * 2 * 720) + 0.16 * Math.sin(t * Math.PI * 2 * 2160),
          clock =
            k % 8 === 0
              ? Math.sin(local * Math.PI * 2 * 150) * Math.exp(-local * 200) * 0.2
              : 0;
        data[i] = carrier * gate * 0.62 + clock;
      }
    }
    source.buffer = b;
    filter.type = "lowpass";
    filter.frequency.value = kind === "click" ? 2400 : 1600;
    filter.Q.value = 0.5;
    gain.gain.value = kind === "click" ? 0.18 : 0.055;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    const voice = { source, gain };
    textures.add(voice);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      textures.delete(voice);
    };
    source.start();
    document.body.dataset.lastTexture =
      kind === "click" ? "mouse-click" : "binary-transition";
  }
  function stopTextures() {
    for (const voice of textures) stopOne(voice);
    textures.clear();
  }
  window.siteSound = {
    setFacecam,
    ready,
    hand,
    portal,
    gradient,
    word,
    letters,
    stopTyping,
    click: () => texture(),
    transition: (seconds = 1) => texture("binary", seconds),
    CONFIG,
  };
  function unlock() {
    if (init()) for (const key of Object.keys(files)) buffer(key);
    if (facecam) startFan();
    state();
  }
  addEventListener("pointerdown", unlock, { capture: true });
  addEventListener("keydown", unlock, { capture: true });
  addEventListener(
    "click",
    (e) => {
      const control = e.target.closest(
        "button,a[href],[role=button],[role=tab],summary,input,select,label",
      );
      if (
        !control ||
        control.matches(":disabled,[aria-disabled=true]") ||
        control.closest("[inert]")
      )
        return;
      const now = performance.now();
      if (now - lastControlClick < 2000) return;
      lastControlClick = now;
      texture();
    },
    { capture: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopFan();
      stopTyping();
      stopTextures();
      blingToken++;
      stopOne(bling);
      bling = null;
    } else if (facecam) startFan();
  });
  addEventListener("pagehide", () => {
    facecam = false;
    stopFan();
    stopTyping();
    blingToken++;
    stopOne(bling);
    ctx?.close();
  });
  state();
})();
