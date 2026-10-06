# Project Status

Status date: 2026-10-06 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- `main` remains formal authority and is not modified directly.
- Earlier development PRs remain Draft / unmerged unless a fresh repository check says otherwise.
- Current development branch: `feature/v0.9.4-route-signature`.
- Current PR: #13 — `V0.9.4 — Route Signature Art Direction`.
- Base: current validated V0.9.3 Submission Package head.
- Last immutable accepted preview before V0.9.4:
  - game: https://qookey109-pixel.github.io/car/v0.9.3-ad0fa5f/
  - submission brief: https://qookey109-pixel.github.io/car/v0.9.3-ad0fa5f/submission/
- No automatic merge.
- Immutable previews must never be overwritten or deleted.

## Award-candidate standard

The project is judged as a submission-quality playable work rather than a feature prototype.

Primary criteria:

1. First-30-second clarity
2. Driving feel
3. Route identity
4. Art-direction memorability
5. Visual/audio cohesion
6. Finish payoff
7. Replay motivation
8. Desktop/mobile polish
9. Performance stability
10. Submission presentation

## V0.9.4 — Route Signature Art Direction

V0.9.4 gives the same procedural city three distinct route-level visual signatures.

### 河岸東環 — FLOW

- cool cyan night
- warm street-light balance
- cyan road / HUD / presentation accent
- baseline fog-density contract remains unchanged

### 霓虹西環 — PRECISION

- magenta fog / background bias
- cyan + magenta facade emphasis
- pink HUD / presentation accent

### 高架折返 — RHYTHM

- steel-blue night balance
- amber facade / road emphasis
- warm amber HUD / presentation accent

## Single-authority design

`CityAtmosphere.setRouteSignature(routeName)` is the visual authority.

It retunes only existing resources:

- scene background
- fog color / density
- hemisphere / ambient / sun / rim / fill colors
- existing facade material colors
- existing road edge / dash colors
- existing street-edge emissive
- one DOM CSS variable: `--route-accent`

Award Presentation, Award HUD and FirstRunDirector consume the same DOM accent.

## Preserved hard contracts

- 0 new geometry
- 0 new WebGL render groups
- 0 new physics bodies
- 0 new colliders
- 0 new camera occluders
- A = physical left
- D = physical right
- reverse remains ~41.4 km/h with HUD `R`
- existing route coordinates / scoring / checkpoint thresholds unchanged
- Replay Momentum V3 preserved
- PB Ghost Replay preserved
- Traffic Flow V3 preserved
- First 30 Seconds preserved
- Award Presentation / Award HUD preserved

## V0.9.4 pre-final evidence

Validated pre-documentation head:

`6b6c7345bd9cb11d0e4c57450b94c45abe591386`

Main validation:

https://github.com/qookey109-pixel/car/actions/runs/37409007605

Results:

- Chromium: 30/30 SUCCESS
- WebKit: 30/30 SUCCESS
- independent Audio Feel: SUCCESS
- independent Objective Compass: SUCCESS
- Browser smoke: 103.9 km/h after 3s
- A left: -50.0m
- D right: +49.4m
- reverse peak: 41.4 km/h
- Award Presentation: PASS
- Award HUD: PASS
- First 30 Seconds: PASS
- Route Signature: PASS
  - river / neon / viaduct measurably distinct
  - 0 physics-body delta
  - 0 camera-occluder delta
  - stable 58 calls / 95,988 triangles across all signatures
- Chromium LOW: 59 calls / 95,988 triangles / peak 180.7 km/h
- hard LOW budget: <=60 calls / <=110,000 triangles

Pre-final QA artifacts:

- Chromium: `11388481489`
  - SHA256 `b4b00be624f8d49eeb45f664f9c1453463cab77522b90a2d609192111dca2dbe`
- WebKit: `11388107919`
  - SHA256 `b661dbea3f1b37b40ff1b5f85153aec15d8b1de9d7922af19205f15474cfdf17`

WebKit remains browser-engine regression evidence, not real Mac Safari hardware FPS.

## Submission package V0.9.4

The deterministic submission capture is expanded from 7 to 9 screenshots:

1. title screen
2. 河岸東環 signature
3. 霓虹西環 signature
4. 高架折返 signature
5. First 30 Seconds
6. speed / city
7. Ghost pursuit
8. finish climax
9. 844×390 mobile

Plus:

- deterministic gameplay showcase WebM
- updated `docs/SUBMISSION_PACKAGE.md`
- updated public `/submission/` brief page

## Final V0.9.4 gate

The final exact PR #13 head must pass:

1. static smoke
2. production build
3. Chromium + WebKit browser play
4. A/D + reverse
5. City / District / Camera / VFX / Compass
6. Checkpoint / Stage Transition / Replay Momentum
7. Ghost Replay
8. Traffic Flow V3
9. Award Presentation
10. Award HUD
11. First 30 Seconds
12. Route Signature
13. Audio
14. Chromium LOW budget
15. regenerated V0.9.4 submission capture artifact with 9 PNG frames + WebM

Only after those gates should a new SHA-specific immutable V0.9.4 Pages preview be published.

## Remaining final-submission checks

- Real Mac Safari hardware verification
- human visual review of the regenerated 9-frame set
- final hero-frame selection
- competition-specific word / character limit confirmation
- final submission freeze tag / receipt
