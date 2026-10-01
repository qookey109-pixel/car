# Neon Racer — 三蘆夜行

V0.9 Award Candidate development line for `qookey109-pixel/car`.

This branch turns the validated V0.8.5 technical foundation into the first submission-oriented version of the game. The priority is no longer adding isolated features; it is creating a cohesive, memorable playable work with a clear first impression, strong route identity, satisfying finish payoff and stable cross-device performance.

## Creative direction

**三蘆夜行** is a short-form urban night-driving game built around three route personalities:

- 河岸東環 — 高速長彎 / FLOW
- 霓虹西環 — 密集轉向 / PRECISION
- 高架折返 — 煞車節奏 / RHYTHM

The player should understand the next goal quickly, feel the city and vehicle rhythm within the first seconds, then be pulled into replay through rank, route PB, Ghost pursuit and route mastery.

The award-candidate standard is:

- recognizable identity in the first 30 seconds
- clean driving feel
- clear challenge hierarchy
- audiovisual cohesion
- strong finish/payoff
- replay motivation
- desktop/mobile usability
- measurable performance discipline

## Current features

- Three.js + cannon-es RaycastVehicle
- Stylized Sanchong/Luzhou-inspired night city
- Third-person dynamic camera with collision avoidance and dynamic FOV
- Drift, nitro, score and combo systems
- Three rotating routes with distinct driving identities
- Route-specific PBs for score / time / combo plus per-route S-rank clears
- Replay Momentum V3
- PB Ghost Replay with live AHEAD / BEHIND / EVEN delta
- Traffic Flow V3:
  - 9 modeled lanes / 18 visual traffic cars
  - signal-aware red stop / green release
  - 7.5m safe queue gap
  - dynamic brake lights
  - exactly three traffic render groups
  - 0 physics bodies / 0 colliders / 0 camera occluders
- District Awareness V3
- Objective Compass
- Checkpoint Feedback
- Stage Transition
- Desktop keyboard, mobile multi-touch and gamepad input
- Progressive touch steering with direct A/D keyboard steering preserved
- Procedural engine / drift / nitro / feedback audio
- Adaptive quality + debug HUD
- Immutable SHA-specific GitHub Pages previews

## V0.9 Award Presentation

V0.9 adds a DOM-only cinematic presentation layer without increasing WebGL render cost.

### Route intro

Each route receives a dedicated intro identity:

- 河岸東環 — `RIVER EAST LOOP` / `FLOW`
  - 「沿河壓住速度，把整座夜色甩在身後。」
- 霓虹西環 — `NEON WEST LOOP` / `PRECISION`
  - 「在最窄的街廓裡，切出最乾淨的節奏。」
- 高架折返 — `VIADUCT RETURN` / `RHYTHM`
  - 「晚一點煞車，早一點回正，在高架前封關。」

The intro layer uses `pointer-events:none`, does not lock player controls and adds zero Three.js render groups.

### Finish climax

Completion presentation adapts to rank:

- S — `NIGHT MASTERED`
- A — `CITY FLOW`
- B — `NIGHT RUN COMPLETE`
- C — `ROUTE CLEARED`

A new PB receives a distinct `PERSONAL BEST · NEW NIGHT RECORD` treatment. Ordinary clears point back toward Ghost pursuit.

The finish layer is explicitly stacked above the result screen so the climax remains visible in the real completion flow.

### Award audio

- Route start uses a short three-note procedural identity.
- Finish uses a rank-dependent root and an additional note for a new PB.
- Existing engine, drift, wind, nitro, checkpoint and impact audio remain intact.

## Current validated base preview

V0.9 is based on the fully validated V0.8.5 candidate:

https://qookey109-pixel.github.io/car/v0.8.5-9d41669/

Base exact SHA:

`9d41669c9fb87ee86638d1dbfe90b75102ba193d`

A V0.9 immutable preview is published only after the final exact branch head passes the full Chromium + WebKit matrix.

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

Package/runtime version:

`0.9.0`

## QA

```bash
npm test
npm run build
npm run test:browser
node tests/award-presentation-smoke.mjs
node tests/ghost-replay-smoke.mjs
node tests/ambient-traffic-smoke.mjs
```

The V0.9 workflow runs the full gameplay contract on Chromium and WebKit.

Hard Chromium LOW budget:

- draw calls <= 60
- triangles <= 110,000

V0.9 Award Presentation acceptance verifies:

- all 3 route identities
- S/B finish copy and PB/non-PB states
- input transparency
- finish overlay stacking above result screen
- route-start and finish audio methods
- 0 WebGL draw-call delta

First V0.9 code-gate evidence:

- Chromium: 27/27 SUCCESS
- WebKit: 27/27 SUCCESS
- Award Presentation: PASS
- presentation WebGL delta: 0 calls
- A left: -50.0m
- D right: +49.4m
- reverse peak: 41.4 km/h
- Traffic Flow V3 queue gap: 7.50m
- red follower: 0.00m/s
- green follower: 7.46m/s
- Chromium high-speed LOW: 59 calls / 95,988 triangles / peak 180.7 km/h

WebKit CI is browser-engine regression evidence only and is not a substitute for real Mac Safari hardware FPS testing.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city generation, atmosphere and traffic flow
- `src/gameplay/` — challenges, route logic and Ghost Replay
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — lightweight particles and speed feedback
- `src/ui/` — HUD, navigation, stage transition, replay momentum and Award Presentation

## Submission status

V0.9 is the first **Award Candidate**, not the final frozen submission.

Still required before a final competition package:

- real Mac Safari hardware verification
- final visual QA pass on desktop and mobile
- representative screenshots
- 30–60 second gameplay capture
- concise project statement / design rationale
- final submission build freeze

## Repository safety

- `main` is not modified directly.
- PR #1–#7 remain independent and unmerged.
- PR #8 remains Draft while V0.9 validation is active.
- Immutable rollback previews must not be overwritten or deleted.
