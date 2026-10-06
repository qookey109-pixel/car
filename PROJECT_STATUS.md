# Project Status

Status date: 2026-10-06 (Asia/Taipei)

## Authority

- Repository: `qookey109-pixel/car`
- `main` remains formal authority and is not modified directly.
- Earlier development PRs remain Draft / unmerged unless a fresh repository check says otherwise.
- Current development branch: `feature/v0.9.5-submission-convergence`.
- Current PR: #15 — `V0.9.5 — Submission Visual Convergence`.
- Base branch: `feature/v0.9.4-route-signature`.
- Base exact SHA: `47a702bc732439e8de94d996b092625bfc1ebd63`.
- Keep `main` untouched.
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

## V0.9.5 — Submission Visual Convergence

V0.9.5 converges the strongest presentation work onto the validated V0.9.4 route-signature build without introducing a parallel gameplay branch.

### Title / first impression

- Replaces engineering-heavy feature chips with route identities:
  - FLOW — 河岸東環
  - PRECISION — 霓虹西環
  - RHYTHM — 高架折返
- Reduces implementation copy on the title screen.
- Strengthens title hierarchy, route color signatures and primary-action hierarchy.
- Adds keyboard-visible focus states and mobile safe-area handling.

### Cinematic gameplay presentation

- Route and finish beats temporarily quiet normal HUD.
- Mobile controls remain interactive during cinematic focus.
- Engineering telemetry is hidden from normal player view while debug access is preserved.
- Compact-landscape HUD density remains reduced.

### Result / finish payoff

- Result screen is treated as a poster-like final frame.
- Rank, route accent, PB strip and replay momentum remain the visual focus.
- Numeric presentation uses tabular figures for cleaner result comparison.

## Preserved hard contracts

- No new Three.js geometry.
- No new WebGL render groups.
- No new physics bodies.
- No new colliders.
- No new camera occluders.
- A = physical left.
- D = physical right.
- Reverse / routes / scoring / PB Ghost / Traffic Flow V3 / First 30 Seconds remain unchanged.
- Runtime gameplay authority remains the validated V0.9.2 contract.
- V0.9.4 route-signature art direction remains the visual authority.
- LOW budget remains <=60 calls / <=110,000 triangles.

## Current V0.9.5 head

Latest authored polish commit:

`aa02d3397fea16d89f260aefbd6d273dd0c96a94`

Previous fully observed V0.9.5 validation head:

`b71add3b6feb6a1f62b736269f3230f7b5f0a81d`

Observed at that head:

- Objective Compass Validation: SUCCESS
- Submission visual acceptance was included in the city-atmosphere validation matrix.
- Submission capture workflow targets `feature/v0.9.5-submission-convergence`.
- Submission artifact name: `v095-submission-package`.

## Final V0.9.5 gate

The final exact PR #15 head should pass:

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
13. Submission Visual acceptance
14. Audio
15. Chromium LOW budget
16. regenerated V0.9.5 submission capture artifact with 9 PNG frames + WebM

Only after those gates should a new SHA-specific immutable V0.9.5 Pages preview be published.

## Remaining final-submission checks

- Real Mac Safari hardware verification
- human visual review of the regenerated 9-frame set
- final hero-frame selection
- competition-specific word / character limit confirmation
- final submission freeze tag / receipt
