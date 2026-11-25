# AI assistance record

Most project-specific implementation was generated and revised with OpenAI Codex in response to Phan Minh Nghia’s design instructions. This is not a claim of unaided student coding. The author supplied the concept, sub-CTA, visual decisions, original recordings, screenshots and iterative feedback. Codex also helped draft and condense the design document and perform technical checks.

## Code scope

| File | Codex-generated/revised work |
| --- | --- |
| appearance.js | shared appearance settings and CSS variables |
| contour-worker.js | mask contour tracing |
| dialogue.js | landing typography, terminal sequence, navigation and reversals |
| folder-tabs.js | folder outlines and selection animation |
| info-garden.js | water, stems, petals and combined color logic |
| info-type.js | typing and erase loops |
| modes.js | tab state and camera lifecycle |
| portrait-geometry.js | cell routes and transfer geometry |
| portrait.js | p5 portrait, segmentation integration, stopping gesture and portal compositing |
| site-grid.js | cached grid textures |
| sketch.js | gradient orbs and flowing wave rendering |
| sound.js | recording playback, live distortion, typing cues and synthesized interface sounds |
| stop-gesture.js | hand-geometry validation |
| uncover.js | generative garden/blocks and background-click portals |

HTML structure, CSS layout/animation, shared JSON configuration, README and code explanations were also generated/revised with Codex. The bundled p5 library and MediaPipe modules/models are third-party software, not student- or Codex-authored project code.

## Sound and text boundaries

Fan, glass/cup and keyboard recordings were created by the author and edited in Audacity. Codex implemented live distortion/filtering/crossfades, sample timing, and procedural click/binary cues; these cues are not additional original recording files. Group text and the quoted UN statement have their own provenance. Codex assisted the documentation wording; the author must verify its accuracy.

## What edited and commented means

Edited: inspect and adapt generated code to your requirements, fix or remove unsuitable parts, and test the changed behavior. Design requests and AI revisions are part of the history, but they do not prove personal understanding or manual student edits. Do not claim you personally wrote/reworked lines that Codex changed.

Commented: explain what a function is responsible for, what its inputs/state mean, why important rules exist, and which references/libraries were used. Existing comments and CODE-GUIDE.md assist review; read and revise them in your own understanding before submission. Formatting and a generic AI disclaimer alone are insufficient evidence.

Examples to explain: why terminal clicks are excluded from portals; why a five-second palm hold is separate from the three-second text transfer; why the portrait loop stops when the iframe unloads.

This record summarises conversation evidence; it is not a verbatim prompt log or a claim about an unknown model version.

## Author-reported review and parameter changes

At final review the author reports reviewing the AI-assisted implementation, commenting on AI use and adjusting selected parameters/metrics. This credits review, design direction and parameter changes rather than sole authorship of the implementation. Specific parameter values or a manual-edit diff have not been supplied, so no particular value change is attributed here.

The reported review focuses on:

- Background grid and letter generation: site-grid.js.
- Camera silhouette and contour lines: portrait.js, contour-worker.js, portrait-geometry.js.
- Transitions and hand-positioned text: portrait.js, dialogue.js, stop-gesture.js.
- Noise/gradient generation and motion: sketch.js.
- Blue-block and flower growth: uncover.js; related Info growth rules in info-garden.js.

Codex remains credited for generating/revising most project-specific code. Third-party p5.js and MediaPipe components retain their separate credits.
