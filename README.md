# Pause — generative camera artwork

Live: https://nghiaphanminh.github.io/Spec-1/

Press **2** to switch between the clock and camera portrait. The portrait loads only on selection, and its camera, tracking and rendering stop when it is removed. Space toggles the clock; 1 toggles the clock camera.

Portrait mode maps foreground segmentation onto a stable 17–21 px grid, maintaining separate foreground silhouettes in their camera positions. Blocks contain large crisp glyphs whose grayscale tone and identity animate with noise. Spatial cell keys keep settled letters stationary. Only a small number shed, with a maximum of 32 falling letters. The body is framed at 82% of the display.

A raised open palm transforms the cells into small letter particles filling the phrase “No woman in the room? Pause the decision.” The sentence follows the palm with smoothing and remains inside the screen. The background becomes fully colored animated domain-warped coral, yellow, teal and lavender noise. Lowering the hand restores the body cells.

Person segmentation and palm detection run locally using MediaPipe; no frames are uploaded or recorded. Camera/hand detection quality depends on framing, light and occlusion; physical multi-person tracking is not automatically validated. No gender classification. The camera requires HTTPS, network access to load models, and visitor permission. GitHub Pages publishes dist/ on main pushes. Bundled p5.js is LGPL; tracking assets load on demand from jsDelivr and Google.
