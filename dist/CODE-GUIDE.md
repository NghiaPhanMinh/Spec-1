# How the code works

This is a reading guide, not the assessed design document or a claim that the author has already mastered each section.

## Read in this order
1. index.html: the semantic content: Home, terminal, camera host and Info.
2. folder.css and folder-tabs.js: typography, grid-aligned layout and moving file-folder frame.
3. dialogue.js: the narrative state machine. A stage index chooses the current beat; a busy flag prevents gestures interrupting a transition. A requestAnimationFrame loop interpolates quote positions/colors and section wipes. The sentences array contains the complete abstract.
4. modes.js: camera lifecycle. It mounts portrait.html only when artwork is active; leaving it unloads the iframe, camera and ambience.
5. portrait.js: p5 setup creates the canvas; draw renders one frame; windowResized rebuilds the grid. A separate capture timer runs MediaPipe. The person mask tells which cells belong to the person. Exclusionary sentences are mapped onto those cells. Palm validation starts a five-second hold; fixed grid routes reveal the collective stop message. A hand-centered gradient portal opens and reverses before code returns to the portrait. Offscreen canvases preserve independent masks, text and outlines.
6. stop-gesture.js: checks wrist/palm proportions and extended fingers from 21 landmark coordinates. It does not infer anyone's gender.
7. contour-worker.js: traces edges away from the main thread so the interface remains responsive. Cached path lengths reveal blue outlines progressively.
8. uncover.js: seeds randomized flowers and structural blocks. Stems grow before petals; spacing/exclusion bounds protect the central text. The opposite effect retracts before a new one grows. Brief click portals reveal the same hidden gradient, quantized to the established grid.
9. sketch.js: creates eased radial gradients, drifting orbs and flowing waves. It uses offscreen Canvas layers, not a second p5 animation loop.
10. site-grid.js: caches the page letter lattice and matched light/dark textures for transitions. appearance.js reads shared site-config.json appearance values.
11. info-garden.js: fills four water rows from the center, then enables flowers; combined conditions turn water/flowers purple. Reversal drains rather than hiding water. info-type.js handles the colored text loop.
12. sound.js: one Web Audio graph plays the author's three recordings. Gains/crossfades create quiet mechanical ambience; typed letters trigger original-speed keyboard samples. Bling marks world entry. Master compression/filtering and click cooldowns limit peaks and repetitions.

## Important concepts to explain in your own words
- Array/loop: one rule draws many grid cells; it is not manually placing every letter.
- Randomness: seed/position/length/delay variations make gardens and textures differ each run.
- State machine: only one narrative stage is active; transitions have a start/end and reverse path.
- Interpolation/easing: progress values between zero and one move/color/reveal objects smoothly.
- Mask: a grayscale camera map limits code to the person's silhouette.
- Worker: a background thread calculates contours; the main thread draws them.
- Resource cleanup: stop tracks, models, timers and p5 when leaving the artwork.

## Library versus project work
p5 provides renderer/lifecycle primitives, not the SDG narrative, garden rules or portal design. MediaPipe provides mask/landmark inference, not the stopping-hand timing or the artwork's argument. Cite libraries because you use them; if a tutorial/example also influenced implementation, cite that actual example separately. Do not invent tutorial sources.

Functions with substantial rendering/geometry remain longer than the brief's general 15-line preference. Formatting/comments improve readability but are not a guarantee of full code-style compliance. Prioritize understanding those functions before submission.
