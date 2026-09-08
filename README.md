# Neon Racer — 三蘆夜行

V0.8.0 Playable City Game Loop for the `qookey109-pixel/car` project.

This branch turns the Three.js real-world driving prototype into a complete replayable run: start → drive → challenge → score → finish → replay.

## Features

- Three.js + cannon-es RaycastVehicle
- Stylized Sanchong/Luzhou-inspired night city
- Third-person dynamic camera with collision avoidance and dynamic FOV
- Drift, nitro, score and combo systems
- Three gameplay challenges: Time Attack, Drift Run, Speed Trap
- Start, pause, restart, settings and completion screens
- Keyboard, simultaneous mobile touch and gamepad controls
- Procedural audio and lightweight driving VFX
- Adaptive quality and debug HUD
- Instanced urban scenery for browser performance

## Installation

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Production

```bash
npm run build
npm run preview
```

The production output is written to `dist/`.

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake / reverse
- `A D` / `← →`: steering
- `Space`: handbrake / drift
- `Shift`: nitro
- Mouse drag: orbit driving camera
- `R`: reset vehicle
- `ESC`: pause / resume
- `F3`: debug HUD
- Gamepad: left stick steering, right stick camera, triggers throttle/brake

## Graphics settings

The in-game settings menu provides Auto / High / Medium / Low quality, resolution scale, bloom, shadows and motion effects. Auto quality can reduce rendering cost when sustained FPS is low.

## QA

```bash
npm test
npm run build
npm run test:browser
```

Browser QA covers desktop and 844×390 mobile landscape. It checks boot, start, acceleration, finite camera state, pause/resume, restart, simultaneous touch input, WebGL/console/page errors and core runtime snapshot values.

## Architecture

- `src/core/` — game loop and input
- `src/vehicle/` — RaycastVehicle and car visuals
- `src/world/` — city/world generation
- `src/gameplay/` — challenge and scoring loop
- `src/rendering/` — adaptive quality
- `src/audio/` — procedural Web Audio
- `src/vfx/` — lightweight particles and feedback
- `src/ui/` — HUD and menus

## Debug mode

Append `?debug=1` or press `F3` to display FPS, draw calls, triangles, vehicle position, speed, challenge state and quality mode.

## Asset and resource policy

The current V0.8.0 implementation is primarily procedural and does not redistribute third-party game art. External resources are treated as references or optional future sources only after license review. See `THIRD_PARTY_ASSETS.md` and `docs/RESOURCE_HUB_INTEGRATION.md`.

## Recovery provenance

The repository was recreated on 2026-09-08. A user-provided V53 recovery ZIP exists as a recovery candidate, but V0.8.0 is developed as a new modular Three.js branch rather than silently claiming lost V0.7.x history was recovered. Repository state is authoritative going forward.

## Known limitations

- V0.8.0 is a stylized city game, not a photorealistic digital twin.
- Traffic AI, weather cycles and persistent career progression are not yet enabled.
- Audio is procedural to avoid unclear asset licensing.
- Real-device Safari visual/FPS acceptance remains a separate manual gate after automated Chromium QA.
