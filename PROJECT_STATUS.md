# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- V0.8.0 branch / PR #1 remains open Draft and unmerged.
- V0.8.1 branch / PR #2 remains open Draft and unmerged.
- Tooling PR #3 remains open Draft and unmerged.
- Current development branch: `feature/v0.8.2-ghost-replay` (PR #4, Draft).
- V0.8.2 base authority: exact validated V0.8.1 SHA `116daefc58722aae788cda147dbab1b6627c4309`.
- Last deployed immutable V0.8.1 preview: https://qookey109-pixel.github.io/car/v0.8.1-116daef/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## V0.8.2 — Ghost Replay

The current branch adds personal-best ghost pursuit without changing the validated vehicle, route or challenge contracts.

Implemented:

- Route-specific PB ghost storage in separate localStorage key `neon-racer-ghosts-v1`.
- Existing saves with no ghost data remain valid and start with no ghost.
- A ghost is available only for the same route that owns the stored PB trajectory.
- Only a new route best time replaces that route's stored ghost.
- Non-PB runs never overwrite the stored PB ghost.
- Ghost trajectory samples are bounded to 900 records at approximately 0.2s cadence.
- One translucent visual-only Three.js mesh represents the PB car.
- Ghost adds no cannon-es body, collider or camera occluder.
- Live HUD delta reports AHEAD / BEHIND / EVEN against the nearest monotonic PB trajectory sample.
- Ghost playback is hidden outside active gameplay and when the route has no PB ghost.
- Main shell is labeled V0.8.2 while the existing runtime snapshot compatibility contract remains preserved.

## Preserved contracts

- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h and HUD gear remains `R`.
- Progressive touch steering from V0.8.1 remains intact.
- Route coordinates, checkpoint radii, challenge order and scoring thresholds are unchanged.
- District Awareness V3, Objective Compass, Checkpoint Feedback, Stage Transition and Replay Momentum V3 remain intact.
- City atmosphere, traffic signal phases, facade rhythm, camera behavior, VFX and procedural audio remain intact.
- No new physics body, decorative collider or camera occluder is added.

## Performance target

- Software LOW hard budget remains <= 60 draw calls / <= 110,000 triangles.
- Ghost acceptance explicitly measures inactive vs active rendering and requires <=2-call delta plus absolute <=60 calls.
- The first V0.8.2 code-gate run measured Ghost rendering at 55→56 calls with 0 added physics bodies.
- Chromium numeric LOW remained 56 calls / 94,908 triangles / peak 180.7 km/h.
- WebKit CI is browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Validation gate

The final exact PR #4 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum V3
7. Ghost Replay route isolation, PB persistence, live delta and render budget
8. Audio
9. Software LOW numeric budget
10. 844x390 mobile layout/input evidence

## Known limitations

- Ghost data is local-device/local-browser only; there is no account cloud sync.
- Ghost is a lightweight translucent silhouette, not a full duplicate vehicle model.
- Full traffic AI remains deferred.
- Weather cycles remain deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real Mac Safari visual/FPS/input/audio-feel acceptance remains a separate manual gate.

## Next action

Run the final exact-head Chromium + WebKit acceptance matrix for PR #4. If fully green, publish a new SHA-specific immutable Pages preview while preserving all earlier preview bytes, then record the exact SHA, artifacts and publication run in PR #4.
