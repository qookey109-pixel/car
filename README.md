# 三蘆夜行 — Neon Racer

V0.9.0 Award Candidate Presentation line for `qookey109-pixel/car`.

The project is now being treated as a complete game work intended for design-award submission, not as a technology demo. V0.9.0 keeps the validated V0.8.5 driving/traffic foundation and focuses on the first 30 seconds, route identity, completion ceremony and presentation hierarchy.

## Creative premise

**AFTER RAIN · BEFORE DAWN**

雨停之後，城市還沒睡。穿過河岸、高架與密集街廓，在天亮以前留下最快的一次夜行。

The player cycles through three recognizable city-driving identities:

- 河岸東環 — 高速長彎 / HIGH SPEED
- 霓虹西環 — 密集轉向 / TECHNICAL
- 高架折返 — 煞車節奏 / BRAKE FLOW

## V0.9.0 presentation pass

- Opening screen prioritizes the game identity instead of implementation technology.
- Main opening no longer exposes RaycastVehicle / Gamepad / PB Ghost / Traffic Flow as player-facing feature chips.
- 三條路線 become the primary opening vocabulary.
- Main CTA: `進入夜行`.
- Route-start title cards show route number, name and driving identity.
- Normal player HUD hides the engineering-oriented quality badge.
- Completion presentation uses `NIGHT RUN COMPLETE`.
- Result seal carries route + rank identity.
- S-rank, A-rank and new-PB states have differentiated presentation.
- 844×390 mobile landscape has dedicated compact presentation rules.
- Runtime exposes `release:'0.9.0'` and `presentation:'award-candidate-v1'`.
- Legacy `version:'0.8.0'` remains for compatibility with existing tests/integrations.

## Validated gameplay foundation

- Three.js + cannon-es RaycastVehicle.
- Third-person dynamic camera with collision avoidance and dynamic FOV.
- Drift, nitro, score and combo systems.
- Three-route challenge rotation.
- Replay Momentum V3.
- PB Ghost Replay with AHEAD / BEHIND / EVEN delta.
- Traffic Flow V3:
  - 18 visual cars across 9 modeled lanes
  - signal-aware red stop / green release
  - 7.5m queue gap
  - dynamic brake-light instance colors
  - exactly 3 traffic render groups
  - 0 physics bodies / colliders / camera occluders
- District Awareness V3.
- Objective Compass.
- Checkpoint feedback and Stage Transition.
- Desktop keyboard, mobile multi-touch and gamepad input.
- Procedural vehicle/audio feedback.
- Immutable SHA-specific GitHub Pages previews.

## Current validated base preview

V0.9.0 is based on the fully validated V0.8.5 candidate:

https://qookey109-pixel.github.io/car/v0.8.5-9d41669/

Base exact SHA:

`9d41669c9fb87ee86638d1dbfe90b75102ba193d`

A V0.9.0 preview is published only after its final exact feature head passes the complete Chromium + WebKit matrix.

## Installation

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake / reverse
- `A` / `←`: steer left
- `D` / `→`: steer right
- `Space`: handbrake / drift
- `Shift`: nitro
- Mouse drag: orbit driving camera
- `R`: reset vehicle
- `ESC`: pause / resume
- `F3`: debug HUD
- Gamepad: left stick steering, right stick camera, triggers throttle/brake

## QA

```bash
npm test
npm run build
npm run test:browser
node tests/ghost-replay-smoke.mjs
node tests/ambient-traffic-smoke.mjs
node tests/award-presentation-smoke.mjs
```

The full V0.9.0 workflow runs the gameplay and presentation contracts on Chromium and WebKit.

Award-presentation acceptance verifies:

- opening identity and manifesto
- route-based rather than engineering-based opening vocabulary
- route title card
- S/PB result ceremony
- hidden player-facing quality badge
- desktop presentation screenshots
- 844×390 opening / route title / result visibility
- LOW render-budget compliance

First V0.9.0 code gate:

- Run: `36825204400`
- Chromium: 27/27 SUCCESS
- WebKit: 27/27 SUCCESS
- Chromium LOW: 60 calls / 96,428 triangles / peak 180.7 km/h

Hard LOW budget:

- draw calls <= 60
- triangles <= 110,000

The V0.9.0 presentation layer adds no Three.js world object or independent render group. Because the current LOW measurement can reach the 60-call ceiling, subsequent world-art additions should reuse/merge existing batches or first remove a draw call.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city, atmosphere and traffic flow
- `src/gameplay/` — challenge routes and Ghost Replay
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — speed / drift feedback
- `src/ui/` — HUD, route title, stage transition and replay momentum

## Award-candidate direction

The next passes should be judged by whether a reviewer remembers the game after a short session, not by feature count.

Priorities after V0.9.0 Presentation Pass 1:

- stronger authored soundscape without masking driving feedback
- more distinctive 三蘆 visual motifs using existing render batches
- route-specific audiovisual rhythm
- final opening-to-finish pacing
- final submission screenshots / gameplay reel / project statement
- real Mac Safari final acceptance

## Known limitations

- Traffic remains visual-only and does not collide with the player.
- Traffic uses modeled paired lanes rather than a full road-network planner.
- Ghosts remain local-device/local-browser only.
- Audio is procedural and not yet a final authored soundscape.
- Weather choreography is deferred.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real-device Safari visual/FPS/input/audio-feel acceptance remains a manual gate.

## Repository safety

- `main` is not modified directly.
- Earlier PRs remain independent and unmerged.
- PR #9 remains Draft while V0.9.0 validation is active.
- Immutable rollback previews must not be overwritten or deleted.
