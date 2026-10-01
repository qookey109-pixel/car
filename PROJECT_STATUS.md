# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- PR #1–#7 remain open Draft and unmerged.
- Current development branch: `feature/v0.9.0-award-presentation` (PR #9, Draft).
- V0.9.0 base authority: exact validated V0.8.5 SHA `9d41669c9fb87ee86638d1dbfe90b75102ba193d`.
- Last deployed immutable V0.8.5 preview: https://qookey109-pixel.github.io/car/v0.8.5-9d41669/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## V0.9.0 — Award Candidate Presentation

V0.9.0 changes the product goal from engineering-demo completeness to award-submission presentation quality while preserving the validated driving/traffic foundation.

Implemented presentation pass:

- Opening screen is reframed around the work itself rather than engine/tool labels.
- Title identity: `三蘆夜行`.
- Opening manifesto: `AFTER RAIN · BEFORE DAWN`.
- Opening copy establishes a rain-after-midnight / before-dawn city run premise.
- Technical feature chips are removed from the main player-facing opening.
- The three route identities become the opening navigation language:
  - 河岸東環
  - 霓虹西環
  - 高架折返
- Primary CTA changes to `進入夜行`.
- Normal player HUD hides the engineering-oriented AUTO quality badge.
- Each run receives a short route title card showing route number, route name and driving identity.
- Completion is reframed as `NIGHT RUN COMPLETE`.
- Result screen exposes a SANLU route/rank seal.
- S-rank and A-rank presentation states are visually distinct.
- New PB result state receives a separate gold-accent hierarchy.
- Desktop and 844×390 mobile-landscape presentation receive separate layout rules.
- Release metadata now exposes `release:'0.9.0'` and `presentation:'award-candidate-v1'` while preserving legacy `version:'0.8.0'` compatibility.

## Preserved gameplay contracts

- Player vehicle physics are unchanged.
- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h and HUD gear remains `R`.
- Progressive touch steering remains intact.
- Route coordinates, checkpoint radii, challenge order and scoring thresholds are unchanged.
- Replay Momentum V3 and PB Ghost Replay remain intact.
- Traffic Flow V3 remains:
  - 9 modeled lanes / 18 visual cars
  - 7.5m queue gap
  - red-light queue stop
  - green-light release
  - dynamic brake lights
  - exactly 3 traffic render groups
  - 0 physics bodies / 0 colliders / 0 camera occluders
- District Awareness V3, Objective Compass, Checkpoint Feedback and Stage Transition remain intact.

## Presentation acceptance

Dedicated `award-presentation-smoke.mjs` verifies:

- 三蘆夜行 opening identity.
- No Raycast Vehicle / Gamepad / PB Ghost / Traffic Flow engineering labels on the opening screen.
- Route list replaces technical feature chips.
- `進入夜行` CTA.
- Player-facing quality badge hidden.
- Route 01/03 title card and route-driving identity.
- S-rank result state.
- New PB result state.
- SANLU route/rank seal.
- Desktop screenshots.
- 844×390 opening visibility.
- 844×390 route-title visibility.
- 844×390 result-card visibility.
- Presentation does not exceed the LOW render budget.

## First V0.9.0 code-gate evidence

Run `36825204400`:

- Chromium: 27/27 SUCCESS.
- WebKit: 27/27 SUCCESS.
- Award Presentation: PASS on both engines.
- Browser play: PASS.
- A/D + reverse: PASS.
- Ghost Replay: PASS.
- Traffic Flow V3: PASS.
- Chromium LOW: 60 calls / 96,428 triangles / peak 180.7 km/h.
- Hard budget remains <=60 calls / <=110,000 triangles.
- No new Three.js world object, collider, physics body or camera occluder was added by the presentation pass.

The presentation pass itself is DOM/CSS-only; the LOW measurement reached the existing 60-call ceiling during the code-gate run, so future world-render additions require draw-call reduction or reuse rather than new render groups.

## Validation gate

The final exact PR #9 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum V3
7. Ghost Replay
8. Traffic Flow V3
9. Award Presentation desktop + 844×390 acceptance
10. Audio
11. Software LOW numeric budget

## Known limitations / next award work

- This is Presentation Pass 1, not the final award submission build.
- World rendering is at the 60-call hard ceiling in the first V0.9.0 gate; no new independent world render group should be added without first reducing calls.
- Ambient traffic remains visual-only.
- Ghost data remains local-browser/local-device only.
- Audio remains procedural and is not yet a final authored soundscape.
- Weather choreography is deferred.
- Real Mac Safari hardware FPS/input/audio-feel acceptance remains a separate manual gate.
- Award-submission capture package (hero screenshots, 30–60s gameplay reel, final project statement) is not yet frozen.

## Next action

Run the final exact-head Chromium + WebKit acceptance matrix for PR #9. If fully green, publish a new SHA-specific immutable Pages preview while preserving all previous preview bytes, then record the exact SHA, artifacts and publication run in PR #9.
