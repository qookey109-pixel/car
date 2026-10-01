# Neon Racer — 三蘆夜行

V0.8.1 City Atmosphere + Replayability Polish for `qookey109-pixel/car`.

The active development branch is a complete replayable Three.js driving loop: start → drive → challenge → score → finish → chase a route-specific personal best.

## Current features

- Three.js + cannon-es RaycastVehicle
- Stylized Sanchong/Luzhou-inspired night city
- Third-person dynamic camera with collision avoidance and dynamic FOV
- Drift, nitro, score and combo systems
- Three rotating city routes:
  - 河岸東環 — 高速長彎 / HIGH SPEED
  - 霓虹西環 — 密集轉向 / TECHNICAL
  - 高架折返 — 煞車節奏 / BRAKE FLOW
- Route-specific PBs for score / time / combo, plus per-route S-rank clear counts
- Replay Momentum V3 with score + time delta targets
- Main-menu next-route identity + PB summary
- District Awareness, Objective Compass, checkpoint feedback and stage transitions
- Desktop keyboard, mobile multi-touch and gamepad input
- Progressive touch steering while preserving direct A/D keyboard steering
- Procedural audio, traffic-signal phases, facade-light rhythm and lightweight VFX
- Adaptive quality + debug HUD
- Immutable SHA-specific GitHub Pages previews

## Current validated preview

Last fully validated/deployed candidate before the current polish pass:

https://qookey109-pixel.github.io/car/v0.8.1-0c20859/

Exact game SHA:

`0c20859a29b3c9d278a2fe9799dad31f32dbca78`

The current development head may be newer than this preview. Repository state and PR #2 are authoritative.

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
```

The V0.8.1 workflow runs the same gameplay contracts on Chromium and WebKit. Chromium SwiftShader also owns the numeric LOW render budget.

Hard LOW budget:

- draw calls <= 60
- triangles <= 110,000

WebKit CI is browser-engine regression evidence only and is not a substitute for real Mac Safari FPS testing.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city/world generation and atmosphere
- `src/gameplay/` — challenge, route and scoring loop
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — lightweight particles and speed feedback
- `src/ui/` — HUD, navigation, stage transition and replay momentum

## Asset and resource policy

The active implementation is primarily procedural and does not redistribute unknown third-party game art or audio. External resources are references until their source license and provenance are explicitly reviewed.

See `THIRD_PARTY_ASSETS.md` and `docs/RESOURCE_HUB_INTEGRATION.md`.

## Known limitations

- Full traffic AI is deferred.
- Weather cycles are deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real-device Safari visual/FPS/input/audio-feel acceptance remains a manual gate.

## Repository safety

- `main` is not modified directly.
- PR #1 remains the V0.8.0 Safari/manual-release candidate.
- PR #2 remains Draft while V0.8.1 polish continues.
- Immutable rollback previews must not be overwritten or deleted.
