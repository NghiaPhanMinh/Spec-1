# Pause — Generative Clockwork and Portrait

Live: https://nghiaphanminh.github.io/Spec-1/

Camera starts automatically in clock mode. Raise a palm to run time; lower it to freeze. Space toggles the clock. Press 2 to switch to the camera portrait. Only the selected mode renders and tracks.

Mode 2 returns to white space, blue contours and bold grid lettering. There is no aura, orbit, camera-color fill or suit overlay. Pose filtering reserves extra space above the nose for the forehead and hair, rather than cutting the segmentation at its old upper bounding box. The contour has subtle continuous flow.

On a raised palm, outlines and letters transition from blue to hot pink over two seconds. The smaller hollow sentence and its grid letters fade in over those same two seconds. An italic serif typeface is selected per gesture. The sentence follows the hand and wraps/clamps within the screen. Lowering the palm reverses the transition.

Hand, pose and segmentation processing stays on device. No frames are recorded or uploaded. Detection quality still depends on camera framing, lighting and occlusion. HTTPS, camera permission and network access to load models are required. GitHub Pages publishes dist/ on main pushes. p5.js is bundled under LGPL.
