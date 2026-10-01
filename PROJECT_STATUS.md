# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- PR #1–#7 remain open Draft and unmerged.
- Current development branch: `feature/v0.9.0-award-candidate` (PR #8, Draft).
- V0.9 base authority: exact validated V0.8.5 SHA `9d41669c9fb87ee86638d1dbfe90b75102ba193d`.
- Last deployed immutable V0.8.5 preview: https://qookey109-pixel.github.io/car/v0.8.5-9d41669/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## Product direction

V0.9 changes the project standard from "feature-complete prototype" to "award-candidate playable work".

The core design target is a short, memorable night-driving experience where the player recognizes the identity of the route, feels a clean driving rhythm within seconds, and receives a strong audiovisual payoff when finishing or beating a personal best.

The project should be judged by:

1. First-30-second clarity
2. Driving feel
3. Route identity
4. Visual/audio cohesion
5. Replay motivation
6. Mobile/desktop polish
7. Performance stability
8. Submission-quality presentation

## V0.9 — Award Candidate Presentation

Implemented in this line:

- Runtime/package/debug identity upgraded to `0.9.0`.
- Title screen reframed as `三蘆夜行 · Award Candidate`.
- Main CTA changed from generic "開始旅程" to "進入夜行".
- New DOM-only `AwardPresentation` layer with zero Three.js render groups.
- Three route-specific cinematic intro identities:
  - 河岸東環 — RIVER EAST LOOP / 高速長彎 / FLOW
  - 霓虹西環 — NEON WEST LOOP / 密集轉向 / PRECISION
  - 高架折返 — VIADUCT RETURN / 煞車節奏 / RHYTHM
- Each route receives its own short editorial line rather than a generic START toast alone.
- Route intro never locks controls and uses `pointer-events:none`.
- New finish climax keyed to rank:
  - S — NIGHT MASTERED
  - A — CITY FLOW
  - B — NIGHT RUN COMPLETE
  - C — ROUTE CLEARED
- Finish climax distinguishes new personal best from ordinary clear.
- Finish presentation is explicitly stacked above the result screen.
- New procedural route-start audio stinger.
- New procedural finish stinger with rank root and additional PB note.
- Existing result screen, Replay Momentum V3, Ghost Replay and route PB systems remain authoritative.
- No new 3D object, collider, physics body or draw call is introduced by the presentation layer.

## Preserved gameplay contracts

- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h and HUD gear remains `R`.
- Progressive touch steering remains intact.
- Three route coordinates, checkpoint radii and scoring thresholds are unchanged.
- Replay Momentum V3 remains intact.
- PB Ghost Replay remains intact.
- Traffic Flow V3 remains intact:
  - 9 modeled lanes
  - 18 cars
  - 7.5m safe queue gap
  - dynamic brake lights
  - signal-aware stop/release
- District Awareness V3, Objective Compass, Checkpoint Feedback and Stage Transition remain intact.
- Existing camera, VFX, procedural audio and adaptive quality contracts remain intact.

## First V0.9 code-gate evidence

Validated code candidate:

`c910c75aa48382719833fd31bfef5e15dbd11b6e`

Run:

https://github.com/qookey109-pixel/car/actions/runs/36822636450

Results:

- Chromium: 27/27 steps SUCCESS.
- WebKit: 27/27 steps SUCCESS.
- Independent Audio Feel: SUCCESS.
- Independent Objective Compass: SUCCESS.
- Award Presentation: PASS.
- Three route identities: 3/3.
- Rank/PB finish states: PASS.
- Presentation pointer events: none.
- Presentation WebGL draw-call delta: 0.
- Finish presentation z-index > result screen: PASS.
- Browser smoke: 103.9 km/h after 3s.
- A left: -50.0m.
- D right: +49.4m.
- Reverse peak: 41.4 km/h.
- City atmosphere: 100 signals.
- Traffic Flow V3 queue gap: 7.50m.
- Red follower: 0.00m/s.
- Green follower: 7.46m/s.
- Chromium LOW: 59 calls / 95,988 triangles / peak 180.7 km/h.
- Hard LOW budget remains <=60 calls / <=110,000 triangles.

Artifacts:

- Chromium QA: `11143978623`
  - SHA256 `92015bfc335a8583a4afba5d9d9daf46072beb2bfbb56a620ed45fa7a1482c62`
- WebKit QA: `11144018303`
  - SHA256 `885dbfe32eff17466d2e4fb98d08155fe354c8f06d86a1755617105b28960440`

WebKit CI remains browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Final validation gate

The final exact PR #8 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. V0.9 runtime/package identity
5. A/D + reverse contract
6. City / District / Camera / VFX / Compass
7. Checkpoint / Stage Transition / Replay Momentum V3
8. Ghost Replay
9. Traffic Flow V3
10. Award Presentation route intro / rank-PB finish / stacking / input transparency
11. Audio
12. Software LOW numeric budget
13. 844x390 mobile layout/input evidence

## Known limitations

- Award Presentation is a first presentation pass; it is not yet the complete submission package.
- Ambient traffic remains visual-only and does not collide with the player.
- Traffic uses paired modeled lanes rather than full route planning.
- Ghost data remains local-browser/local-device only.
- Weather cycles remain deferred.
- Audio remains fully procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real Mac Safari hardware FPS/input/audio-feel acceptance remains a separate manual gate.
- Award submission screenshots, capture video and final submission copy are not yet frozen.

## Next action

Run the final exact-head V0.9 acceptance matrix. If fully green, publish a new SHA-specific immutable Pages preview while preserving all previous previews byte-for-byte, then record final SHA/artifacts/publication evidence in PR #8.
