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
- PR #6 V0.8.4 Traffic Behavior remains open Draft and unmerged.
- Current development branch: `feature/v0.8.5-traffic-flow` (PR #7, Draft).
- V0.8.5 base authority: exact validated V0.8.4 SHA `bb85eef880a3dfb60bd7f6ca684277097d953a92`.
- Last deployed immutable V0.8.4 preview: https://qookey109-pixel.github.io/car/v0.8.4-bb85eef/
- Do not merge automatically or overwrite/delete immutable rollback previews.

## V0.8.5 — Traffic Flow Polish

The current branch deepens ambient traffic behavior without adding any render group or gameplay authority.

Implemented:

- 18 visual traffic cars are organized as 9 modeled lanes × 2 cars per lane.
- Existing `CityAtmosphere.signalPhase` remains the single traffic-signal authority.
- Each car has independent cruise speed and velocity state.
- Same-lane front-car detection uses deterministic forward distance on the wrapped traffic corridor.
- Configured safe following gap: 7.5m.
- Configured active following distance: 24m.
- Red-light queues now form behind the lead car rather than multiple cars collapsing onto one stop line.
- Green-light release propagates naturally as the lead car accelerates away.
- Brake lights use per-instance tail-light color:
  - bright red during real deceleration / stop
  - dim red after acceleration resumes
- Brake-light behavior adds 0 draw calls; the traffic layer remains exactly 3 InstancedMesh groups:
  - vehicle bodies
  - headlights
  - taillights
- Body + lights retain the 24m near-player exclusion.
- Traffic remains 0 physics bodies, 0 colliders and 0 camera occluders.

## Preserved contracts

- A = physical left, D = physical right.
- Reverse remains about 41.4 km/h and HUD gear remains `R`.
- Progressive touch steering remains intact.
- Route coordinates, checkpoint radii, challenge order and scoring thresholds are unchanged.
- Replay Momentum V3 and PB Ghost Replay remain intact.
- District Awareness V3, Objective Compass, Checkpoint Feedback and Stage Transition remain intact.
- Procedural city atmosphere, facade rhythm, camera, VFX and audio remain intact.

## Performance evidence

First V0.8.5 code-gate run:

- Chromium + WebKit: 26/26 steps SUCCESS on each engine.
- Traffic Flow V3: PASS.
- Queue safe-gap probe: 7.50m.
- Red-light follower stop: 0.00 m/s.
- Green-light follower resume: 7.46 m/s.
- Dynamic brake-light state: PASS.
- Traffic render groups remain exactly 3.
- Chromium numeric LOW at high speed: 59 calls / 95,988 triangles / peak 180.7 km/h.
- Hard LOW budget remains <=60 calls / <=110,000 triangles.
- Physics-body and camera-occluder counts remain unchanged.
- WebKit CI is browser-engine regression evidence only, not real Mac Safari hardware FPS.

## Validation gate

The final exact PR #7 head must pass:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum V3
7. Ghost Replay
8. Traffic V3 red stop / green release
9. 7.5m queue spacing
10. Dynamic brake lights
11. Near-player exclusion for body + lights
12. Audio
13. Software LOW numeric budget
14. 844x390 mobile layout/input evidence

## Known limitations

- Ambient traffic remains visual-only and intentionally cannot collide with the player.
- Traffic uses paired modeled lanes rather than a full road-network planner.
- No lane changing or overtaking is modeled.
- Signal-aware behavior remains limited to the existing central signal grid.
- Vehicle light geometry stays intentionally minimal to preserve the render budget.
- Ghost data remains local-browser/local-device only.
- Weather cycles remain deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real Mac Safari hardware FPS/input/audio-feel acceptance remains a separate manual gate.

## Next action

Run the final exact-head Chromium + WebKit acceptance matrix for PR #7. If fully green, publish a new SHA-specific immutable Pages preview while preserving all earlier preview bytes, then record the exact SHA, artifacts and publication run in PR #7.
