# Pause — Letter Portrait and Star Clock

Live: https://nghiaphanminh.github.io/Spec-1/

The white camera portrait loads first. Press 2 to switch to the star clock, and 2 again to return. Each experience lives in its own disposable iframe; only the selected experience loads camera models and runs animation. Removing an experience stops its camera and render loop.

Portrait: bold grid lettering shades the camera foreground in blue, with an outer silhouette and one interior tone contour. Outlined serif message glyphs have wider, bolder bodies and fine outlines that match the figure line. A raised stop palm initiates a three-second directional transfer across the complete body and sentence. Intermediate grid cells pulse along a broad corridor covering both extents. Lowering the hand reverses the wave toward and across the body. The sentence follows the hand and fits within screen bounds.

Both modes use the shared stop-gesture validator: a detected wrist/palm, four straight extended fingers, thumb geometry and minimum hand scale. Model confidence thresholds are raised and three consecutive qualifying frames are required. This is hand-geometry validation, not skin/color detection or gender inference. Camera accuracy remains dependent on lighting, framing and occlusion.

HTTPS, camera permission and network access to jsDelivr/Google model assets are required. Processing stays on device, with no frame recording or uploads. GitHub Pages publishes dist/ after pushes to main. p5.js is bundled under LGPL.
