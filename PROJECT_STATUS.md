# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` — do not write directly.
- PR #1 V0.8.0 remains open Draft and unmerged.
- PR #2 V0.8.1 remains open Draft and unmerged.
- PR #3 tooling remains open Draft and unmerged.
- PR #4 V0.8.2 Ghost Replay remains open Draft and unmerged.
- PR #5 V0.8.3 Ambient Traffic remains open Draft and unmerged.
- Current development branch: `feature/v0.8.4-traffic-behavior` (PR #6, Draft).
- V0.8.4 base authority: exact validated V0.8.3 SHA `64d15677647243fe7b4adcc8f1d92e2003cd604f`.
- Last deployed immutable V0.8.3 preview: https://qookey109-pixel.github.io/car/v0.8.3-64d1567/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## V0.8.4 — Traffic Behavior Polish

The current branch makes ambient traffic visually obey the existing city signal rhythm while remaining completely outside gameplay physics.

Implemented:

- Existing `CityAtmosphere.signalPhase` remains the single signal authority.
- `CityAtmosphere.isSignalGreen(...)` exposes read-only lane/intersection signal state to visual traffic.
- 18 ambient cars retain independent visual speed state.
- Cars approaching a red signal smoothly decelerate toward the existing stop line.
- Cars resume acceleration when the same signal authority turns green.
- Outer roads without modeled traffic signals continue normal ambient flow.
- Two additional InstancedMesh groups add headlights and taillights for all 18 cars.
- Vehicle body + headlights + taillights still follow the 24m near-player exclusion.
- Traffic remains 0 physics bodies, 0 colliders and 0 camera occluders.
- Traffic cannot alter score, route progression, player input, player collision or vehicle handling.

## Preserved contracts

- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h and HUD gear remains `R`.
- Progressive touch steering remains intact.
- Route coordinates, checkpoint radii, challenge order and scoring thresholds are unchanged.
- Replay Momentum V3 and PB Ghost Replay remain intact.
- District Awareness V3, Objective Compass, Checkpoint Feedback and Stage Transition remain intact.
- Procedural city atmosphere, facade rhythm, camera, VFX and audio remain intact.

## Performance evidence

First V0.8.4 code-gate run:

- Chromium + WebKit: 26/26 steps SUCCESS on each engine.
- Signal-aware Traffic V2: PASS.
- Red-light stop probe: 0.08 m/s.
- Green-light resume probe: 8.48 m/s.
- Ambient traffic render groups: 3 total — body + headlights + taillights.
- Ghost + Traffic + Lights: 59 calls / 96,000 triangles.
- Chromium numeric LOW at high speed: 59 calls / 95,988 triangles / peak 180.7 km/h.
- Hard LOW budget remains <=60 calls / <=110,000 triangles.
- Physics-body and camera-occluder counts remain unchanged.
- WebKit CI is browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Validation gate

The final exact PR #6 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum V3
7. Ghost Replay
8. Traffic V2 signal mapping / red stop / green resume
9. Near-player exclusion for body + lights
10. Audio
11. Software LOW numeric budget
12. 844x390 mobile layout/input evidence

## Known limitations

- Ambient traffic remains visual-only and intentionally cannot collide with the player.
- Signal-aware behavior is limited to intersections covered by the existing central traffic-signal grid.
- Ambient traffic does not perform lane changes, overtakes or route planning.
- Vehicle light geometry is intentionally minimal to preserve the render budget.
- Ghost data remains local-browser/local-device only.
- Weather cycles remain deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real Mac Safari hardware FPS/input/audio-feel acceptance remains a separate manual gate.

## Next action

Run the final exact-head Chromium + WebKit acceptance matrix for PR #6. If fully green, publish a new SHA-specific immutable Pages preview while preserving all earlier preview bytes, then record the exact SHA, artifacts and publication run in PR #6.
