# Neon Racer — 三蘆夜行

V0.9.2 Award Candidate development line for `qookey109-pixel/car`.

This version treats the project as a submission-quality playable work rather than a feature prototype. The focus is a memorable first impression, strong route identity, clean driving feel, finish payoff, replay motivation and stable desktop/mobile performance.

## Creative direction

**三蘆夜行** is a short-form urban night-driving game built around three route personalities:

- 河岸東環 — 高速長彎 / FLOW
- 霓虹西環 — 密集轉向 / PRECISION
- 高架折返 — 煞車節奏 / RHYTHM

The intended loop is simple: understand the next goal immediately, find the city's rhythm, clear the route, then return for rank, route PB and Ghost pursuit.

## V0.9.2 — First 30 Seconds

The first-run experience is now directed without a tutorial modal.

Flow:

1. Route cinematic establishes the current route identity.
2. A short `GO` cue appears only for a first-ever session.
3. Input copy adapts to device:
   - touch: `GAS`
   - desktop: `W / ↑`
4. Once speed builds, the cue shifts to the existing nitro control:
   - touch: `N₂O`
   - desktop: `Shift`
5. The first checkpoint returns `CLEAN` and immediately ends onboarding.

The layer is DOM/CSS only, uses `pointer-events:none`, never pauses the game and adds zero Three.js render groups.

On 844×390 landscape, the cue uses a 108px bottom safety corridor so it remains visually separated from mobile driving controls on both Chromium and WebKit.

## Award presentation

Each route has a distinct cinematic identity:

- 河岸東環 — `RIVER EAST LOOP` / `FLOW`
- 霓虹西環 — `NEON WEST LOOP` / `PRECISION`
- 高架折返 — `VIADUCT RETURN` / `RHYTHM`

Finish treatment adapts to rank:

- S — `NIGHT MASTERED`
- A — `CITY FLOW`
- B — `NIGHT RUN COMPLETE`
- C — `ROUTE CLEARED`

New route PBs receive a dedicated `PERSONAL BEST · NEW NIGHT RECORD` treatment. Existing Replay Momentum and Ghost systems remain the replay authority.

## Award HUD

V0.9.1 established the current HUD hierarchy:

- lighter glass treatment
- stronger speed emphasis
- tighter objective panel
- cleaner score/combo block
- de-emphasized engineering quality badge
- compact 844×390 landscape layout

The HUD polish is CSS/DOM-only and does not change WebGL render cost.

## Current gameplay

- Three.js + cannon-es RaycastVehicle
- third-person dynamic camera with collision avoidance and speed-reactive FOV
- drift, nitro, score and combo systems
- three rotating routes
- route PBs for score / time / combo
- per-route S-rank clears
- Replay Momentum V3
- PB Ghost Replay with AHEAD / BEHIND / EVEN delta
- Traffic Flow V3:
  - 9 modeled lanes / 18 visual cars
  - traffic-signal red stop / green release
  - 7.5m queue gap
  - dynamic brake lights
  - exactly 3 traffic render groups
  - 0 physics bodies / 0 colliders / 0 camera occluders
- District Awareness V3
- Objective Compass
- Checkpoint Feedback
- Stage Transition
- keyboard, mobile multi-touch and gamepad input
- progressive touch steering while keyboard A/D remains direct
- procedural engine / drift / nitro / feedback audio
- adaptive quality and debug HUD

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake / reverse
- `A` / `←`: steer left
- `D` / `→`: steer right
- `Space`: handbrake / drift
- `Shift`: nitro
- Mouse drag: orbit camera
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

`0.9.2`

## Current rollback preview

The last immutable accepted build before V0.9.2 is:

https://qookey109-pixel.github.io/car/v0.9.1-8d569a5/

Exact V0.9.1 SHA:

`8d569a5f9e6414dbe591616a07eae54e025783f6`

V0.9.2 receives its own immutable URL only after the final exact-head gate passes.

## QA

```bash
npm test
npm run build
npm run test:browser
node tests/award-presentation-smoke.mjs
node tests/award-hud-smoke.mjs
node tests/first-30-seconds-smoke.mjs
node tests/ghost-replay-smoke.mjs
node tests/ambient-traffic-smoke.mjs
```

The workflow runs the gameplay/presentation contract on Chromium and WebKit.

Hard Chromium LOW budget:

- draw calls <= 60
- triangles <= 110,000

Pre-final V0.9.2 evidence:

- Chromium: 29/29 SUCCESS
- WebKit: 29/29 SUCCESS
- First 30 Seconds: PASS
- mobile control corridor: PASS
- Award Presentation: PASS
- Award HUD: PASS
- presentation/onboarding WebGL groups: 0
- A left: -50.0m
- D right: +49.4m
- reverse peak: 41.4 km/h
- Traffic Flow queue gap: 7.50m
- Chromium high-speed LOW: 59 calls / 95,988 triangles / peak 180.7 km/h

Pre-final validation run:

https://github.com/qookey109-pixel/car/actions/runs/36831816336

WebKit CI is browser-engine regression evidence only and is not a substitute for real Mac Safari hardware FPS testing.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city generation, atmosphere and traffic flow
- `src/gameplay/` — challenges, route logic and Ghost Replay
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — speed and collision feedback
- `src/ui/` — HUD, navigation, replay, Award Presentation and FirstRunDirector

## Submission status

V0.9.2 is an **Award Candidate**, not yet the final frozen competition package.

Remaining work after the immutable V0.9.2 preview:

- real Mac Safari hardware verification
- final visual QA on desktop/mobile
- representative competition screenshots
- 30–60 second gameplay showcase
- concise project statement / design rationale
- final submission freeze

## Repository safety

- `main` is not modified directly.
- Development stays on Draft PRs.
- No automatic merge.
- Immutable rollback previews are never overwritten.
