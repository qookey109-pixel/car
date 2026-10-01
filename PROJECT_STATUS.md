# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- PR #1–#11 remain open Draft and unmerged.
- Current development branch: `feature/v0.9.2-first-30-seconds` (PR #11, Draft).
- V0.9.2 base authority: exact validated V0.9.1 SHA `8d569a5f9e6414dbe591616a07eae54e025783f6`.
- Last deployed immutable preview: https://qookey109-pixel.github.io/car/v0.9.1-8d569a5/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## Award-candidate direction

The project is now evaluated as a submission-quality playable work, not as a feature prototype.

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

V0.9.2 improves the first-run experience without adding a tutorial modal or blocking control.

Implemented:

- Existing route cinematic remains the first presentation beat.
- A DOM-only `FirstRunDirector` follows the route card on a first-ever run.
- The onboarding is `pointer-events:none` and never pauses or locks the player.
- First cue: `GO` with device-aware input copy:
  - touch: `GAS`
  - desktop: `W / ↑`
- When speed builds, the cue changes to a short N₂O hint:
  - touch: `N₂O`
  - desktop: `Shift`
- First checkpoint hit produces a short `CLEAN` confirmation and ends onboarding.
- Onboarding is once-per-session and does not repeatedly interrupt returning/restarted players.
- The cue automatically stops if the player does not reach the first gate within the onboarding window.
- Compact 844×390 landscape uses a 110px bottom safety corridor so onboarding never overlaps mobile controls.
- FirstRunDirector adds 0 Three.js render groups and has no physics, score, route, Ghost or traffic authority.

## Preserved award systems

- V0.9 Award Presentation:
  - route-specific FLOW / PRECISION / RHYTHM identities
  - rank-adaptive finish climax
  - PB finish treatment
  - procedural route/finish stingers
- V0.9.1 Award HUD:
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

## V0.9.2 code-gate evidence

Validated code candidate:

`e0548f7e6bd95b9959fbe481c5313bf0959cacab`

Run:

https://github.com/qookey109-pixel/car/actions/runs/36830412803

Results:

- Chromium: 29/29 SUCCESS.
- WebKit: 29/29 SUCCESS.
- Independent Audio Feel: SUCCESS.
- Independent Objective Compass: SUCCESS.
- First 30 Seconds: PASS.
- Flow: `GO → N₂O hint → checkpoint CLEAN`.
- First-run only / once-per-session suppression: PASS.
- 844×390 mobile control corridor: PASS after subpixel-safe 110px clearance.
- FirstRunDirector WebGL render groups: 0.
- Award Presentation: PASS with 0 WebGL draw-call delta.
- Award HUD: PASS.
- Browser smoke: 103.9 km/h after 3s.
- A left: -50.0m.
- D right: +49.4m.
- Reverse peak: 41.4 km/h.
- Chromium LOW: 59 calls / 95,988 triangles / peak 180.7 km/h.
- Hard LOW budget remains <=60 calls / <=110,000 triangles.

Artifacts:

- Chromium QA: `11146738792`
  - SHA256 `ddd4b4b07b5a9970d0b3d7608cc9c843a689ba78f041bd99f174a04ddb08ff67`
- WebKit QA: `11147262027`
  - SHA256 `fc37cef76ef929bdf33d577b6caf30623a634b28db2eae1ed751b8d6960c650c`

WebKit CI is browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Final V0.9.2 gate

The final exact PR #11 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum
7. Ghost Replay
8. Traffic Flow V3
9. Award Presentation
10. Award HUD
11. First 30 Seconds
12. Audio
13. Software LOW numeric budget
14. 844×390 mobile input/layout evidence

## Remaining submission work

- Real Mac Safari hardware verification.
- Final desktop/mobile visual QA.
- Freeze representative screenshots.
- Produce a 30–60 second gameplay showcase.
- Freeze project statement / design rationale.
- Final submission build freeze.

## Next action

Run the final exact-head V0.9.2 matrix after documentation sync. If fully green, publish a SHA-specific immutable Pages preview while preserving every prior preview byte-for-byte.
