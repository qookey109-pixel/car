# Third-Party Assets and Libraries

V0.8.0 intentionally avoids redistributing unknown or copied game assets.

## Runtime libraries

| Component | Source | License | Usage |
|---|---|---|---|
| Three.js | https://github.com/mrdoob/three.js | MIT | Rendering, camera, scene, post-processing helpers |
| cannon-es | https://github.com/pmndrs/cannon-es | MIT | RaycastVehicle physics |
| Vite | https://github.com/vitejs/vite | MIT | Development and production build tooling |
| Playwright | https://github.com/microsoft/playwright | Apache-2.0 | Automated browser QA only |

## Art / audio

Current V0.8.0 art is generated from Three.js primitives and procedural geometry/materials. Current audio is generated with Web Audio APIs.

No third-party model, texture, logo, music track, sound effect or commercial game asset is redistributed in this branch.

## Resource Hub policy

`qookey109-pixel/ai-resource-hub` is used as a discovery index. Entries are not automatically imported. Every future asset or code dependency must be checked at its original source for current license and commercial-use terms before inclusion.

Examples currently treated as references rather than copied assets:

- ThreeUI Community — MIT; useful for Three.js/WebGL UI and shader implementation patterns.
- ABYSSAL / Natural Disasters — MIT; rendering pipeline and adaptive-quality reference.
- Addy's Agent Skills — MIT; engineering workflow / QA reference, not runtime code.
- SoundShockAudio — resource index only; individual audio licenses vary and must be reviewed separately.
- OpenStreetMap — ODbL data source if enabled in a later real-world mode; attribution and usage-policy compliance required.
