# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- PR #1–#11 remain open Draft and unmerged unless a fresh repository check says otherwise.
- Current development branch: `feature/v0.9.2-first-30-seconds` (PR #11, Draft).
- V0.9.2 base authority: validated V0.9.1 SHA `8d569a5f9e6414dbe591616a07eae54e025783f6`.
- Last deployed immutable preview before V0.9.2: https://qookey109-pixel.github.io/car/v0.9.1-8d569a5/
- Do not merge automatically and do not overwrite/delete immutable rollback previews.

## Award-candidate standard

The project is now judged as a submission-quality playable work, not as a feature prototype.

Primary design criteria:

1. First-30-second clarity
2. Driving feel
3. Route identity
4. Visual/audio cohesion
5. Finish payoff
6. Replay motivation
7. Desktop/mobile polish
8. Performance stability
9. Submission presentation

## V0.9.2 — First 30 Seconds

V0.9.2 improves first-run comprehension without adding a tutorial modal or interrupting control.

Implemented:

- Existing route cinematic remains the first presentation beat.
- DOM-only `FirstRunDirector` follows the route card on a first-ever run.
- Presentation uses `pointer-events:none`; no input lock or pause is introduced.
- First cue: `GO`.
  - touch copy: `GAS`
  - desktop copy: `W / ↑`
- Once speed builds, the cue shifts to a short N₂O hint.
  - touch copy: `N₂O`
  - desktop copy: `Shift`
- First checkpoint hit produces `CLEAN` and ends onboarding.
- Guidance is once-per-session so restarts/returning play are not repeatedly interrupted.
- Guidance self-terminates if the first gate is not reached during the onboarding window.
- Compact 844×390 landscape uses a 108px bottom safety corridor, verified without overlap on Chromium and WebKit.
- The acceptance test waits for the real cue state instead of assuming CI timer precision.
- FirstRunDirector adds 0 Three.js render groups and has no physics, route, score, Ghost or traffic authority.

## Version identity

Submission-candidate identification is synchronized to:

`0.9.2`

This includes package metadata, runtime snapshot, F3 debug label and version-aware smoke tests.

## Preserved award systems

- Award Presentation:
  - FLOW / PRECISION / RHYTHM route identities
  - rank-adaptive finish climax
  - PB finish treatment
  - procedural route/finish stingers
- Award HUD:
  - reduced engineering-panel weight
  - stronger speed hierarchy
  - compact 844×390 layout
  - de-emphasized quality badge
- Replay Momentum V3
- PB Ghost Replay
- Traffic Flow V3
- District Awareness V3
- Objective Compass
- Checkpoint Feedback
- Stage Transition

## Preserved gameplay contracts

- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h with HUD `R`.
- Progressive touch steering remains intact.
- Route coordinates, checkpoint radii and scoring thresholds are unchanged.
- Traffic remains visual-only with 0 physics bodies / 0 colliders / 0 camera occluders.
- Existing camera, VFX, procedural audio and adaptive-quality contracts remain intact.

## Final V0.9.2 acceptance evidence

Final accepted feature/documentation candidate before publication:

`a84a54f6fcf9fb3e9dcc09c1783e96da218c9dfe`

Main validation:

https://github.com/qookey109-pixel/car/actions/runs/36832765400

Independent validation:

- Audio Feel: https://github.com/qookey109-pixel/car/actions/runs/36832771881
- Objective Compass: https://github.com/qookey109-pixel/car/actions/runs/36832771884

Results:

- Chromium: 29/29 SUCCESS.
- WebKit: 29/29 SUCCESS.
- Audio Feel: SUCCESS.
- Objective Compass: SUCCESS.
- First 30 Seconds: PASS.
- Flow: `GO → N₂O hint → checkpoint CLEAN`.
- 844×390 mobile control corridor: PASS with 108px bottom safety corridor.
- FirstRunDirector WebGL render groups: 0.
- Award Presentation: PASS with 0 WebGL draw-call delta.
- Award HUD: PASS.
- Browser smoke: 103.9 km/h after 3s.
- A left: -50.0m.
- D right: +49.4m.
- Reverse peak: 41.4 km/h.
- Traffic Flow V3 queue gap: 7.50m.
- Red follower: 0.00m/s.
- Green follower: 7.46m/s.
- First-30 render sample: 57 calls.
- Chromium LOW: 59 calls / 95,988 triangles / peak 180.7 km/h.
- Hard LOW budget remains <=60 calls / <=110,000 triangles.

Final QA artifacts:

- Chromium QA: `11147937177`
  - SHA256 `b639536079a1c86bb56a62f4ea43ed464ecafe2dc04704ee6f780d50bdf3b656`
- WebKit QA: `11148426920`
  - SHA256 `d9d0f92692819db5222640fffb67a66c272b7c86c00453a29a0f612415e05610`

WebKit CI is browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Publication gate

The code/presentation acceptance gate is complete. After this documentation sync, rerun the exact-head matrix once so the published SHA includes both accepted implementation and final evidence. Publish one SHA-specific immutable V0.9.2 Pages preview only after that run succeeds.

## Remaining submission work

- Real Mac Safari hardware verification.
- Final desktop/mobile visual QA using the frozen preview.
- Freeze representative screenshots.
- Produce a 30–60 second gameplay showcase.
- Freeze project statement / design rationale.
- Final submission build freeze.
