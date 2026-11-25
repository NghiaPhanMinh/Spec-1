# Pause decision

Phan Minh Nghia · s4176100 · COMM2754 · 25 November 2026.
Class: Thursday 11:30–14:30. 25 November 2026 is the project date (Wednesday), not a claim that it is Thursday.

## Run
Start a static server in this directory and open index.html through localhost (for example, npx --yes http-server . -p 8080 with Node/npm installed). Use Chrome/Edge, enable audio with a user gesture and allow camera for the artwork. Internet is required for MediaPipe modules, WASM and models. Camera images are processed in the browser, not recorded or uploaded by this application.

Home plays the quote; scroll/ArrowDown advances, ArrowUp/Backspace reverses. Enter advances terminal sentences. Skip opens the artwork. Hold a stopping palm for five seconds to open the gradient; lower it to reverse. Click eligible background pixels for brief portals, with a two-second cooldown. Info's blue/pink/purple words toggle water, flowers and their combined state. Black terminal clicks never open portals.

No 0/2 preview shortcuts are available. The old clock and full-gradient debug preview are shelved outside the published dist directory.

## Implementation and credits
The main portrait uses p5.js 1.11.3 for canvas creation, pixel density, 30fps draw scheduling and window resizing. Layer compositing uses its drawingContext. MediaPipe supplies person segmentation and palm landmarks; project code interprets those landmarks as a stopping gesture. See CODE-GUIDE.md and THIRD-PARTY-NOTICES.md.

Project code is GPL-3.0-or-later. Full license: LICENSE. Third-party libraries retain their own licenses. Sound recordings belong to the author and are not relicensed as library code. AI-assisted implementation is disclosed in code headers; the author must review, understand and explain their submitted work.

Live/contact: https://nghiaphanminh.github.io/Spec-1/
Source: https://github.com/NghiaPhanMinh/Spec-1
