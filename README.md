# Neon Racer — 三蘆夜行

V0.8.2 Ghost Replay development line for `qookey109-pixel/car`.

This branch builds on the validated V0.8.1 city/replay polish and adds route-specific personal-best ghost pursuit while preserving the existing driving, scoring and render-budget contracts.

## Current features

- Three.js + cannon-es RaycastVehicle
- Stylized Sanchong/Luzhou-inspired night city
- Third-person dynamic camera with collision avoidance and dynamic FOV
- Drift, nitro, score and combo systems
- Three rotating routes with distinct driving identities:
  - 河岸東環 — 高速長彎 / HIGH SPEED
  - 霓虹西環 — 密集轉向 / TECHNICAL
  - 高架折返 — 煞車節奏 / BRAKE FLOW
- Route-specific PBs for score / time / combo plus per-route S-rank clear counts
- Replay Momentum V3 with score + time pursuit targets
- Main-menu next-route identity + PB summary
- V0.8.2 PB Ghost Replay:
  - same-route PB trajectory only
  - live AHEAD / BEHIND / EVEN delta
  - only new route-best time replaces the saved ghost
  - separate backward-compatible localStorage store
  - one translucent visual-only ghost mesh
  - no physics body or collider
- District Awareness, Objective Compass, checkpoint feedback and stage transitions
- Desktop keyboard, mobile multi-touch and gamepad input
- Progressive touch steering while direct keyboard A/D steering remains unchanged
- Procedural audio, traffic-signal phases, facade-light rhythm and lightweight VFX
- Adaptive quality + debug HUD
- Immutable SHA-specific GitHub Pages previews

## Current validated base preview

The V0.8.2 branch is based on the fully validated V0.8.1 candidate:

https://qookey109-pixel.github.io/car/v0.8.1-116daef/

Base exact SHA:

`116daefc58722aae788cda147dbab1b6627c4309`

The V0.8.2 preview is published only after its final exact branch head passes the full Chromium + WebKit acceptance matrix.

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

## Ghost Replay behavior

Ghost Replay uses a separate `neon-racer-ghosts-v1` localStorage key.

Each route stores at most one best-time trajectory. Samples are bounded and recorded at a low fixed cadence. A run that does not improve the route's best time cannot replace the existing ghost. The feature remains local to the current browser/device.

The ghost is visual-only: it has no cannon-es body, collision response, camera-occluder role or gameplay authority.

## QA

```bash
npm test
npm run build
npm run test:browser
node tests/ghost-replay-smoke.mjs
```

The V0.8.x workflow runs the gameplay contracts on Chromium and WebKit. Chromium SwiftShader also owns the numeric LOW render budget.

Hard LOW budget:

- draw calls <= 60
- triangles <= 110,000

Ghost-specific acceptance additionally verifies:

- empty/legacy storage compatibility
- route isolation
- PB-only replacement
- live HUD delta
- 0 added physics bodies
- active Ghost rendering remains inside the render budget

WebKit CI is browser-engine regression evidence only and is not a substitute for real Mac Safari FPS testing.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city/world generation and atmosphere
- `src/gameplay/` — challenges, route logic and Ghost Replay
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — lightweight particles and speed feedback
- `src/ui/` — HUD, navigation, stage transition and replay momentum

## Asset and resource policy

The active implementation is primarily procedural and does not redistribute unknown third-party game art or audio. External resources remain references until source license and provenance are explicitly reviewed.

See `THIRD_PARTY_ASSETS.md` and `docs/RESOURCE_HUB_INTEGRATION.md`.

## Known limitations

- Ghosts do not sync between devices.
- Ghost visual is intentionally lightweight rather than a full cloned car.
- Full traffic AI is deferred.
- Weather cycles are deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real-device Safari visual/FPS/input/audio-feel acceptance remains a manual gate.

## Repository safety

- `main` is not modified directly.
- PR #1 / PR #2 / PR #3 remain independent and unmerged.
- PR #4 remains Draft while V0.8.2 validation is active.
- Immutable rollback previews must not be overwritten or deleted.
