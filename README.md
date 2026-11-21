# Pause — Letter Portrait and Star Clock

Live: https://nghiaphanminh.github.io/Spec-1/

Portrait loads first. Press 2 to switch to the clock. Each experience loads its own camera/model only when selected; disposal releases camera, animation and worker resources.

Portrait transfer lasts three seconds each way. Source occupancy comes from the actual person mask. Connected foreground regions are grouped independently, and each source group maps to grid cells inside the full sentence lettering. The intermediate occupied footprint morphs between those source/target cells rather than filling a broad cone. Directional body and sentence reveals are retained. Multiple real people still depend on segmentation quality and occlusion.

Opinion phrases are deterministically reshuffled in place every two seconds. They do not scroll down the screen. All glyph positions remain on the established grid.

Open-hand validation allows joined fingers and a tucked thumb while requiring a genuine detected wrist/palm and four extended fingers. Two qualifying detections confirm the gesture, with short loss tolerance. Detection/presence/tracking thresholds are .55/.6/.6. The same validator is shared with the clock. Neither skin color nor gender is used as a trigger.

Contour calculation runs in a module Worker; drawing is capped at 30fps at full display pixel density. Worker contour jobs are limited to roughly 5fps, while segmentation and palm inference continue. No frames are uploaded, stored or recorded. Camera inference and rendering performance depend on the device and lighting. HTTPS, permission and network access to load MediaPipe models are required.

GitHub Pages publishes dist/ after main pushes. p5.js is bundled under LGPL.

Correction: transfer footprints no longer interpolate or move between the body and sentence. A route of fixed grid addresses is prepared for each masked source-to-sentence assignment. Each cell retains its own opinion glyph and location; a narrow opacity pulse visits neighboring cells in order. Reverse uses the same route backward. The three-second directional body and sentence reveal remains. Route maps rebuild only when the sentence moves to a different grid location or wraps.
