# Project Status

Status date: 2026-10-01 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main` (do not write directly)
- Current development branch: `feature/v0.8.1-city-atmosphere-polish` (PR #2, Draft)
- PR #1 remains the independent V0.8.0 Safari/manual candidate at `201b9f721fe04fa9e4df040afa44aa363a60ed3b`.
- Last fully validated and deployed V0.8.1 candidate before the current polish pass: `0c20859a29b3c9d278a2fe9799dad31f32dbca78`.
- Current immutable preview: https://qookey109-pixel.github.io/car/v0.8.1-0c20859/
- Do not merge automatically or delete/replace immutable rollback previews.

## Current baseline

V0.8.1 — City Atmosphere + Replayability Polish, layered on the validated V0.8.0 game loop.

Implemented and preserved:

- Three.js + cannon-es RaycastVehicle
- A = left, D = right; reverse remains about 41.4 km/h with HUD `R`
- Three rotating routes with route-specific PBs
- District Awareness V3 and Objective Compass
- Checkpoint Feedback V1 and Stage Transition V1
- Replay Momentum V3:
  - route-specific score/time pursuit
  - route identity: 河岸東環 = 高速長彎, 霓虹西環 = 密集轉向, 高架折返 = 煞車節奏
  - per-route S-rank clear count
  - next-route identity + PB shown on the main menu
- Progressive mobile steering for touch only; keyboard/gamepad contracts remain unchanged
- Procedural city atmosphere, traffic-signal phases and facade-light rhythm
- Inline SVG favicon; no `favicon.ico` network request
- Adaptive quality and deterministic Chromium/WebKit QA

## Performance contracts

- Software LOW hard budget: <= 60 draw calls / <= 110,000 triangles
- Previous validated candidate: about 56 calls / 94,908 triangles at high speed
- No decorative collider or camera-occluder additions in the current polish pass
- WebKit CI is browser-engine regression evidence, not real Mac Safari hardware FPS

## Validation state

The previous `0c20859a...` candidate passed the full Chromium + WebKit matrix and was published immutably.

The current Replay Momentum V3 / route-identity / mobile-control polish must pass the same gates before receiving a new immutable preview:

1. Static smoke
2. Production build
3. Chromium + WebKit browser play
4. A/D + reverse contract
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum
7. Audio
8. LOW render budget
9. 844x390 mobile layout/input evidence

## Known limitations

- Full traffic AI is still deferred; current city life comes from procedural signals, lighting rhythm and static urban detail.
- Weather cycle is deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real Mac Safari visual/FPS/input/audio-feel acceptance remains a separate manual gate.

## Next action

Run the exact-head Chromium + WebKit acceptance matrix for the current polish pass. Fix only measured regressions, then publish a new SHA-specific immutable preview while preserving all existing preview bytes.
