# Pause — generative camera artwork

Live: https://nghiaphanminh.github.io/Spec-1/

Press **2** to switch between the clock and camera portrait. The portrait loads only on selection, and its camera, tracking and rendering stop when it is removed. Space toggles the clock. Its hand camera starts automatically after browser permission.

Portrait mode maps foreground segmentation onto a stable 17–21 px grid, maintaining separate foreground silhouettes in their camera positions. Blocks contain large crisp glyphs whose grayscale tone and identity animate with noise. Spatial cell keys keep settled letters stationary. Only a small number shed, with a maximum of 32 falling letters. The body is framed at 82% of the display.

A raised open palm transforms the cells into small letter particles filling the phrase “No woman in the room? Pause the decision.” The sentence follows the palm with smoothing and remains inside the screen. The background becomes fully colored animated domain-warped coral, yellow, teal and lavender noise. Lowering the hand restores the body cells.

Person segmentation and palm detection run locally using MediaPipe; no frames are uploaded or recorded. Camera/hand detection quality depends on framing, light and occlusion; physical multi-person tracking is not automatically validated. No gender classification. The camera requires HTTPS, network access to load models, and visitor permission. GitHub Pages publishes dist/ on main pushes. Bundled p5.js is LGPL; tracking assets load on demand from jsDelivr and Google.

Clock revision: softened grayscale domain warp replaces the dense marble. A normal analog dial has 12 blue glowing marks, with line, circle or soft circle variations selected on reload. Hand-only clock tracking samples roughly eight times per second; lowering the hand freezes time. Portrait noise colors and the surrounding halo map to camera foreground and brightness for an animated thermal-camera-inspired effect. This is a visual treatment, not a measurement of temperature.

Star clock revision: white raster bloom sprites replace all dial outlines, tick lines and linear hands. Twelve four-point star markers form the dial; larger hour and minute stars and a ticking seconds star indicate time through their angle and orbit radius. The same white light treatment is used in both background states. Sprites are generated once and reused each frame.

Smooth sweep revision: four cardinal stars retain their size; the other eight markers are smaller. Hour star sits on an inner orbit with marker-sized glow; minute and second stars are smaller. Seconds sweep continuously behind the markers. Fixed dial stars are cached at display resolution, glow sprites use native canvas blits, and native text rendering retains the existing glyph detail. Clock animation targets 60 fps while noise updates at its original cadence, with faster noise evolution. Clock tracking uses the portrait VIDEO hand model and gesture rule, processes only fresh frames, starts automatically, and stops on portrait entry or hidden pages.

Mode 2 grid revision: portrait shading and sentence share one persistent screen grid. Raising a palm crossfades cell opacity without particle travel; bright image regions have no shading. Sentence movement follows the hand by updating cell coverage on the same grid. One expanding grid ripple of dashes and glyphs is triggered on palm raise. Contours use 512 x 384 sampling and display-resolution antialiasing. Falling-letter motion is removed from this revision.
