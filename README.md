# Pause — generative camera artwork

Live: https://nghiaphanminh.github.io/Spec-1/

Space toggles clock time. The clock camera starts automatically after browser permission. Press 2 to switch to the camera portrait; only the selected mode renders or uses the camera.

Portrait mode uses smoothed outlines, a mask-derived animated noise aura, and fixed-grid decision-language shading on white. Thirty illustrative examples of exclusionary decision language rotate through the rows every five seconds. Letters near the face are lighter. No gender inference is performed.

A raised palm reveals a large white-filled, black-outlined message near the hand. Lowering it reverses the drawing reveal. Camera colors fill silhouette grid cells over five seconds, from the center outward. They whiten in reverse, from the outer cells inward. A destination-in silhouette mask clips the colored cells and shading.

Pose landmarks gate the segmentation: confident shoulders, a visible head-to-shoulder span, and apparent shoulder width above 14% of the camera frame are required. This is a framing heuristic, not a measured distance; false detections and missed people remain possible. Segmentation is restricted to accepted pose regions. Hands, pose and segmentation run locally. No images are uploaded or recorded.

GitHub Pages publishes dist/ from main. p5.js is bundled under LGPL. MediaPipe models load on demand via jsDelivr and Google. Camera and model loading require HTTPS, network access and camera permission.
