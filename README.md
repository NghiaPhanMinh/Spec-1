# Pause — Generative Clockwork and Portrait

Live: https://nghiaphanminh.github.io/Spec-1/

Camera starts automatically in clock mode. Raise a palm to run time; lower it to freeze. Space toggles the clock. Press 2 to switch to the camera portrait. Only the selected mode renders and tracks.

Mode 2 returns to white space, blue contours and bold grid lettering. There is no aura, orbit, camera-color fill or suit overlay. Camera segmentation defines the complete foreground without pose-based crop regions or distance limits. The contour has subtle continuous flow.

On a raised palm, outlines and letters transition from blue to hot pink over two seconds. The smaller hollow sentence and its grid letters fade in over those same two seconds. An italic serif typeface is selected per gesture. The sentence follows the hand and wraps/clamps within the screen. Lowering the palm reverses the transition.

Hand, pose and segmentation processing stays on device. No frames are recorded or uploaded. Detection quality still depends on camera framing, lighting and occlusion. HTTPS, camera permission and network access to load models are required. GitHub Pages publishes dist/ on main pushes. p5.js is bundled under LGPL.

Transfer revision: a reversible two-second progression fades the decision words from the body, pulses intermediate stationary grid cells toward the hand, then reveals the sentence. Lowering the palm reverses the progression. The sentence uses gently deforming outlined serif typography, with more font choices. Two interior tonal contours plus the external contour preserve camera detail. Pose inference and its circular envelope are removed. This also removes the earlier distance restriction; segmentation can still include unwanted foreground objects.
