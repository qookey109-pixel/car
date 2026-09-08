# AI Resource Hub Integration Policy

Source index: `qookey109-pixel/ai-resource-hub`.

The Resource Hub is a discovery and research index for this game. It is not a blanket dependency list and does not grant permission to copy linked code or assets.

## Selection rules

A resource may be integrated only when it materially improves one of these areas:

1. Game Feel
2. Art Direction / Atmosphere
3. Gameplay / Progression
4. Performance
5. Testing / QA
6. Accessibility / UI quality
7. Deployment / observability

Before integration, verify the original project's current license, commercial-use terms, runtime cost and maintenance risk.

## Current shortlist

### ThreeUI Community
- Role: Three.js/WebGL UI, shader and interaction reference.
- Catalog status: MIT.
- Integration policy: reuse only compatible MIT implementation patterns/components with attribution where required; do not pull Pro-only content.

### ABYSSAL — Natural Disasters
- Role: high-end WebGL rendering, atmosphere, post-processing and adaptive-quality reference.
- Catalog status: MIT.
- Integration policy: use rendering ideas selectively. Do not replace the driving game with an ocean/weather simulation or import expensive effects without FPS gates.

### Addy's Agent Skills
- Role: spec/build/test/review/performance workflow reference.
- Catalog status: MIT.
- Integration policy: development process only; not shipped runtime code.

### SoundShockAudio
- Role: discovery source for audio tools and samples.
- Catalog status: source licenses vary.
- Integration policy: no sample may enter this repository until its exact source, author and commercial-use license are documented in `THIRD_PARTY_ASSETS.md`.

### OpenStreetMap
- Role: optional real-world roads/buildings/geospatial data in future modes.
- License: ODbL-1.0 for OSM data.
- Integration policy: preserve attribution and comply with API/tile/Nominatim usage policies. Do not assume official public servers are an unlimited production backend.

## Explicit non-goals

- Do not install every Resource Hub entry.
- Do not import unknown-license GitHub code.
- Do not hotlink third-party art/audio.
- Do not copy another game's protected visuals, UI or assets.
- Do not add heavy GPU effects unless performance telemetry shows enough headroom.
