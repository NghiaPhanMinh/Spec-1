# Pause — Letter Portrait and Star Clock

Live: https://nghiaphanminh.github.io/Spec-1/

Portrait loads first. Press 2 to switch to the clock. Each experience loads its own camera/model only when selected; disposal releases camera, animation and worker resources.

Portrait transfer lasts three seconds each way. Source occupancy comes from the actual person mask. Connected foreground regions are grouped independently, and each source group maps to grid cells inside the full sentence lettering. The intermediate occupied footprint morphs between those source/target cells rather than filling a broad cone. Directional body and sentence reveals are retained. Multiple real people still depend on segmentation quality and occlusion.

Opinion phrases are deterministically reshuffled in place every two seconds. They do not scroll down the screen. All glyph positions remain on the established grid.

Open-hand validation allows joined fingers and a tucked thumb while requiring a genuine detected wrist/palm and four extended fingers. Two qualifying detections confirm the gesture, with short loss tolerance. Detection/presence/tracking thresholds are .55/.6/.6. The same validator is shared with the clock. Neither skin color nor gender is used as a trigger.

Contour calculation runs in a module Worker; drawing is capped at 30fps at full display pixel density. Worker contour jobs are limited to roughly 5fps, while segmentation and palm inference continue. No frames are uploaded, stored or recorded. Camera inference and rendering performance depend on the device and lighting. HTTPS, permission and network access to load MediaPipe models are required.

GitHub Pages publishes dist/ after main pushes. p5.js is bundled under LGPL.

Correction: transfer footprints no longer interpolate or move between the body and sentence. A route of fixed grid addresses is prepared for each masked source-to-sentence assignment. Each cell retains its own opinion glyph and location; a narrow opacity pulse visits neighboring cells in order. Reverse uses the same route backward. The three-second directional body and sentence reveal remains. Route maps rebuild only when the sentence moves to a different grid location or wraps.

Front-page revision: layered white Home/Info folder tabs frame a scrolling document. Home opens with the centered, justified quote; literal title/body tags are part of the reference design. Camera art loads only when scrolled into view and is removed when leaving the section, selecting Info, or hiding the page. Press 2 within the artwork to switch portrait/clock. Info contains project/group/course details, a live Vietnam-local date, SDG 5 link, quote attribution to António Guterres (UN News, 13 March 2019), and the call to action. Desktop uses two document columns; narrow screens use one.

Folder/grid revision: selected Home/Info tabs rise in place with rounder curves, heavier outlines, one rear folder line and rounded frame ends. A fixed, non-interactive full-screen grid shows letters at 10% opacity and faint grid lines; it remains one layer during scrolling and tab changes. Portrait cell spacing increases to 18px desktop / 14px narrow, with smaller glyph-to-cell ratio for more breathing room. Camera and transfer logic are retained.

Info Customize controls both columns or either separately: scale, x/y, typeface, font size/weight, line height, letter/word/paragraph spacing, alignment, color, column gap and document width. Move handles support pointer dragging and arrow keys (Shift for 10px). Settings persist in localStorage under pause-info-layout-v1 and can be reset. These preferences are browser-local, not written back to the shared website source.

Folder revision 19: continuous SVG folder rules, neutral uppercase background at 20% opacity on #F9F9F9, direct Info content editing, browser-local Save and JSON backup import/export. Customize also controls page background, background letters, opacity, grid spacing and tab stroke.

Revision 20: stationary folder tabs, black completed viewport outline, hidden native scrollbar with scrolling retained, 15% background glyph opacity, transparent portrait canvas over the fixed site grid, matching 15px/12px uppercase camera cells.

Revision 21: shorter wider inset folder tabs with two layered continuous rules and a damped pick animation; 10% letter/grid opacity defaults; ] opens/closes a draggable adjustment panel across both pages and camera modes; content, appearance, and panel position save automatically in this browser. JSON backup remains available for transferring settings.

Revision 22 adds a terminal dialogue between the landing page and artwork. The first scroll plays the quote's typing, pink emphasis, and POWER expansion once. Eight dialogue beats reveal in two seconds; Enter/Backspace or buttons navigate, and Skip opens the artwork. Dark sections composite a cached white 8% grid over the same fixed grid coordinates. Portrait cells read the parent grid spacing and viewport origin, with masked blue cell borders. Folder hover previews push the other folder back without grey fills.

Shared configuration lives in dist/site-config.json. All visitors read shared defaults from the main branch, with an update check every minute. In ] > Shared GitHub settings, repository collaborators connect a fine-grained GitHub token scoped to this repository with Contents read/write. The token stays only in memory. Edits are debounced and uploaded through GitHub's Contents API; failed uploads remain local with a visible status. Editor window position is excluded from shared uploads. GitHub Pages rebuilds automatically after a configuration commit. Do not put credentials in the JSON or repository.

Revision 23 replaces scroll-through Home with a reversible, locked sequence: blank opening, character typing with a caret, continuous word-position interpolation into justified rows, per-letter pink emphasis, POWER growth, selection/deletion, and a cached circular grid wipe into the dialogue. Every gesture advances one completed stage. Reverse gestures undo stages and dialogue text. Inactive sections are inert and the camera is mounted only at the artwork stage. Returning from artwork reverses its reveal and unloads capture. Each new portrait builds letters over 3.2 seconds, then traces contour paths by their measured length; fully revealed contours are cached between worker results. Inactive folder hover stays behind the unchanged selected folder.

Revision 24: the landing intro runs automatically in five seconds (2.1s typing, .3s justification, temporary continuous blue gender-equality selection, pink text, then blue POWER selection/growth). All selections clear at rest. Home cancels the current sequence, unloads the camera and restarts at the top. Landing exit selects complete lines, deletes instantly, briefly blinks the caret, then uses exact cached site-grid light/dark textures for the circular wipe. Command beats reset immediately and type in green over three seconds. The black surface is inset and clipped within the folder frame. Inactive hover raises its back rule with the tab. Camera cell borders stay blue and fade with body text during the hand transition, then rebuild on return; no pink cell lattice remains.
