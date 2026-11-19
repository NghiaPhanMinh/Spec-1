# Pause — Generative Clockwork

Live website: https://nghiaphanminh.github.io/Spec-1/

Press **Space** to pause or resume time. Press **1** to start or stop the camera. Hold an open, fingers-together palm to resume time. Camera hand detection runs on one frame every two seconds. It does not infer gender. Camera images stay on device.

The p5.js artwork uses animated domain-warped noise rendered as changing letter glyphs. A low-resolution text field scales to the canvas for smooth, efficient motion. Fast black, white and grey interference slows into pastel when time resumes. Random outlines of clocks, numeral dials and gears use Difference blending.

GitHub Pages publishes `dist/` automatically after changes are pushed to `main`. MediaPipe Tasks Vision and its hand model are loaded on demand from jsDelivr and Google. Camera detection needs HTTPS, network access and the visitor's camera permission. p5.js 1.11.3 is bundled under its LGPL license.
