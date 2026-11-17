# Pause — Generative Clockwork

Live website: https://nghiaphanminh.github.io/Spec-1/

Full-screen p5.js generative artwork. GitHub Pages publishes `dist/` automatically when changes are pushed to `main`.

- Fresh randomized arrangements of outlined clocks and gears on every load and regeneration.
- White-heavy animated domain-warped monochrome halftone, transitioning to soft pastel flow when a face is present.
- Pastel outlines in DIFFERENCE blend mode at 25% opacity (75% transparent).
- Right swipe on canvas, Right Arrow, or shuffle icon regenerates palette and formation. With the camera enabled, a hand swipe toward the right side of the mirrored camera also regenerates.
- Camera icon starts on-device MediaPipe face/hand tracking. **Any face resumes time; this does not identify gender.** No confirmation button or identity classification.
- Sound icon enables synthesized noise, rewind chime, freeze cue and ticking. Gentle motion and fullscreen icons are available.
- Small mirrored camera is foggy while frozen and clearer while running. No camera frames are saved or uploaded.

Serve `dist/` over HTTPS or localhost. Dependencies: bundled p5.js 1.11.3 (LGPL), MediaPipe Tasks Vision 0.10.21 via jsDelivr, Google-hosted MediaPipe models. Camera/gesture tracking requires network access to load these assets and camera permission. Camera denial and model failure show a brief actionable error; the artwork and pointer swipe still work.
