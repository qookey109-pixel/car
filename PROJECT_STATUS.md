# Project Status

Status date: 2026-09-08

## Authority

- Repository: `qookey109-pixel/car`
- Formal branch: `main`
- Current development branch: `feature/v0.8.0-playable-city-game-loop`
- The repository was recreated on 2026-09-08. Lost historical V0.7.x branches are not assumed recovered.

## Current development baseline

V0.8.0 — Playable City Game Loop

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

Run V0.8.0 CI, inspect screenshots, fix runtime/render/game-feel defects, then publish a fixed preview for Safari acceptance.
