# Pause — Generative Clockwork and Portrait

Live: https://nghiaphanminh.github.io/Spec-1/

Camera starts automatically in clock mode. Raise a palm to run time; lower it to freeze. Space toggles the clock. Press 2 to switch to the camera portrait. Only the selected mode renders and tracks; camera resources are released on switching.

Portrait: fixed grid cells show a limited camera palette, with three generic skin-tone and three dark-hair swatches. A black suit, white shirt and red triangular tie are drawn under the head, clipped inside the masked body. All text is bold; body text is blue #0000FF with lower opacity near the face. On a raised palm, text becomes hot pink #FF1493 and a large, hollow outlined sentence filled with grid glyphs appears. The sentence follows the hand, wraps and clamps within the screen.

Orbits and noise auras are removed. Pose confidence, apparent shoulder width and a pose-based body envelope filter the segmentation before clipping. Distant/uncertain bodies are rejected, though framing, lighting, occlusion and false detections remain real camera limitations. The mask is not an identity classifier. Hand and pose processing stays on device; no frames are recorded or uploaded.

Models load on demand from jsDelivr and Google. HTTPS, camera permission and network access are needed. GitHub Pages automatically publishes dist/ on main pushes. p5.js is bundled under LGPL.
