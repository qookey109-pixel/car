# Neon Racer — 三蘆夜行

V0.8.4 Traffic Behavior Polish development line for `qookey109-pixel/car`.

This branch builds on the validated V0.8.3 Ambient Traffic candidate and makes visual traffic obey the existing city signal rhythm while preserving the player vehicle, route, replay and render-budget contracts.

## Current features

- Three.js + cannon-es RaycastVehicle
- Stylized Sanchong/Luzhou-inspired night city
- Third-person dynamic camera with collision avoidance and dynamic FOV
- Drift, nitro, score and combo systems
- Three rotating routes with distinct driving identities:
  - 河岸東環 — 高速長彎 / HIGH SPEED
  - 霓虹西環 — 密集轉向 / TECHNICAL
  - 高架折返 — 煞車節奏 / BRAKE FLOW
- Route-specific PBs for score / time / combo plus per-route S-rank clears
- Replay Momentum V3 with score + time pursuit targets
- PB Ghost Replay with same-route trajectories and live AHEAD / BEHIND / EVEN delta
- V0.8.4 Signal-aware Ambient Traffic:
  - 18 deterministic visual city cars
  - existing CityAtmosphere signal phase is the single authority
  - red-light deceleration and stop
  - green-light acceleration resume
  - one InstancedMesh for vehicle bodies
  - one InstancedMesh for headlights
  - one InstancedMesh for taillights
  - 24m near-player exclusion applies to body + lights
  - 0 physics bodies / 0 colliders / 0 camera occluders
- District Awareness, Objective Compass, checkpoint feedback and stage transitions
- Desktop keyboard, mobile multi-touch and gamepad input
- Progressive touch steering with direct keyboard A/D preserved
- Procedural audio, traffic-signal phases, facade-light rhythm and lightweight VFX
- Adaptive quality + debug HUD
- Immutable SHA-specific GitHub Pages previews

## Current validated base preview

V0.8.4 is based on the fully validated V0.8.3 candidate:

https://qookey109-pixel.github.io/car/v0.8.3-64d1567/

Base exact SHA:

`64d15677647243fe7b4adcc8f1d92e2003cd604f`

A V0.8.4 preview is published only after the final exact branch head passes the full Chromium + WebKit matrix.

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

## Traffic behavior

Ambient traffic remains visual city atmosphere, not collision gameplay.

The central signal grid is still owned by `CityAtmosphere`. Ambient traffic only reads that existing authority through `isSignalGreen(...)`, avoiding a duplicate traffic-light model.

Cars on signalized central roads reduce their own visual speed as they approach a red stop line and resume when the same signal turns green. Roads outside the modeled signal grid continue uninterrupted ambient flow.

Headlights and taillights are each one shared `InstancedMesh`, so all 18 cars use only three traffic render groups total.

## Ghost Replay behavior

Ghost Replay continues to use the separate `neon-racer-ghosts-v1` localStorage key. Only a new same-route best time replaces a stored ghost; non-PB runs do not overwrite it.

## QA

```bash
npm test
npm run build
npm run test:browser
node tests/ghost-replay-smoke.mjs
node tests/ambient-traffic-smoke.mjs
```

The V0.8.x workflow runs all gameplay contracts on Chromium and WebKit.

Hard Chromium LOW budget:

- draw calls <= 60
- triangles <= 110,000

V0.8.4 traffic acceptance verifies:

- existing traffic-signal authority mapping
- red-light stop
- green-light resume
- 18 traffic bodies in one InstancedMesh
- 36 headlight instances in one InstancedMesh
- 36 taillight instances in one InstancedMesh
- near-player exclusion for body + lights
- 0 physics-body changes
- 0 camera-occluder changes
- Ghost + Traffic + Lights stays inside the hard budget

First code-gate evidence measured:

- red-light stop: 0.08 m/s
- green-light resume: 8.48 m/s
- Ghost + Traffic + Lights: 59 calls / 96,000 triangles
- Chromium high-speed LOW: 59 calls / 95,988 triangles / peak 180.7 km/h

WebKit CI is browser-engine regression evidence only and is not a substitute for real Mac Safari FPS testing.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city generation, atmosphere and signal-aware ambient traffic
- `src/gameplay/` — challenges, route logic and Ghost Replay
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — lightweight particles and speed feedback
- `src/ui/` — HUD, navigation, stage transition and replay momentum

## Known limitations

- Ambient traffic is visual-only; it does not collide with the player.
- Only the existing central signal grid controls traffic stopping.
- Ambient traffic does not perform lane changes, overtakes or route planning.
- Ghosts remain local-device/local-browser only.
- Weather cycles remain deferred.
- Audio remains procedural.
- Real-world OSM mode is not restored as an authoritative active branch.
- Real-device Safari visual/FPS/input/audio-feel acceptance remains a manual gate.

## Repository safety

- `main` is not modified directly.
- PR #1–#5 remain independent and unmerged.
- PR #6 remains Draft while V0.8.4 validation is active.
- Immutable rollback previews must not be overwritten or deleted.
