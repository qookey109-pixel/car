# Project Status

Status date: 2026-09-09 (UTC)

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main`
- Current development branch: `feature/v0.8.1-city-atmosphere-polish` (PR #2, Draft, base PR #1 branch)
- PR #1 remains the independent V0.8.0 manual Safari candidate at `201b9f721fe04fa9e4df040afa44aa363a60ed3b`.
- Previous fully validated V0.8.1 candidate: `7aac4c3052422f75ce9430912b597d781ad06dd2`.
- Do not modify `main`, merge either PR, or replace/delete fixed rollback previews.
- The repository was recreated on 2026-09-08. Lost historical V0.7.x branches are not assumed recovered.

## Current development baseline

V0.8.1 — City Atmosphere Polish, layered on V0.8.0

District awareness candidate adds a current district HUD label, active objective district,
shared spatial classification and per-route checkpoint/drift/speed district metadata.
HUD boundary hysteresis is 4m; static metadata and visual classification use exact existing
72m core / 32m avenue boundaries. Route positions, scoring, challenge order and physics are unchanged.
The existing speed gates are in Avenue; this pass does not claim Core-specific gameplay.

Candidate validation is pending until exact-SHA CI and visual QA are recorded in PR #2.
The workflow runs Chromium and WebKit against the same contracts, including district
boundaries, all three routes, restart, completion and 844×390 layout. Only Chromium
SwiftShader numeric counters establish the <=60 calls / <=110,000 triangles LOW budget.
WebKit engine acceptance never represents real Mac Safari FPS.

Preserved V0.8.1 contracts: 100 traffic signals / four groups; near-street-v2 has
936 instances / one group; district-rhythm-v1 retains 9 core / 34 avenue / 56 edge
buildings; cameraOccluders, A-left/D-right, ~41.4 km/h reverse and persistent HUD R,
Box ground, -Z vehicle forward and no transmission material.

Last validated preview: https://qookey109-pixel.github.io/car/v0.8.1-7aac4c3/
V0.8.0 Safari candidate: https://qookey109-pixel.github.io/car/v0.8.0-201b9f/

Implemented on the development branch:

- Three.js / Vite modular web game
- cannon-es RaycastVehicle driving physics
- third-person dynamic camera
- drift, nitro, combo and score
- three sequential challenges
- start / pause / restart / settings / completion flow
- procedural city art, atmosphere, audio and lightweight VFX
- desktop, mobile multi-touch and gamepad input
- adaptive quality and debug HUD
- static, production-build and browser-play QA gates

## Current gate

Do not call V0.8.0 release-ready until all of the following are true:

1. GitHub Actions static smoke PASS
2. Production build PASS
3. Chromium desktop play smoke PASS
4. 844×390 multi-touch smoke PASS
5. Visual QA screenshots inspected
6. Real Safari visual/FPS acceptance completed

## Known limitations

- Traffic AI, weather cycle and persistent progression are deferred.
- Current audio is procedural.
- Real-world OSM mode is not yet restored as an authoritative branch in the recreated repository.
- V53 recovery ZIP is treated as a recovery candidate only, not as proof that lost experimental history was restored.

## Next action

Validate the district-awareness candidate, inspect screenshots, then publish its immutable
preview and record the exact SHA in PR #2. Later district-specific route selection must be
versioned separately. Real Mac Safari visual/FPS/input/audio acceptance remains pending.
