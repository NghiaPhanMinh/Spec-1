# Pause — Generative Clockwork

Live: https://nghiaphanminh.github.io/Spec-1/

Space toggles time. 1 toggles the camera. A raised open palm resumes time; lowering it freezes time on the next sample. Palm inference samples one independent image every second; camera preview appears at the bottom right. Gender is not inferred.

Smooth domain-warped grayscale transitions into coral, apricot, yellow, teal and lavender. Small glyphs are rendered directly at display resolution. One centered clock randomly uses Arabic, Roman, minimal analog, hours/minutes or hours/minutes/seconds styling on page load. Clock outlines use Difference blending at full contrast.

GitHub Pages publishes dist/ on main changes. p5.js is bundled; MediaPipe and the palm model load on demand. Camera requires HTTPS and permission. No camera images are recorded or uploaded.

Frozen visuals use fast nested domain-warped grayscale marble contours. Flowing visuals retain the coral-to-lavender palette at increased speed. Glyphs follow local noise brightness, displacement and angle. Clock variants include square and open dials. Versioned asset links refresh cached code.
