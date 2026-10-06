# 3D Asset Intake Pipeline

Car / Neon Racer uses **arielshad/3d-asset-server** as a development-time discovery and licensing aid for future 3D assets.

Upstream:
- Repository: https://github.com/arielshad/3d-asset-server
- Licence: Apache-2.0
- Hosted service documented upstream: https://3d.shep.bot
- Capabilities: multi-source 3D model / material / texture / HDRI search, licence metadata, MCP, HTTP API and CLI.

## Current V0.9.5 rule

This integration is **discovery-only during V0.9.5 Submission Visual Convergence**.

The current award-candidate contract remains immutable:
- 0 new Three.js geometry
- 0 new WebGL render groups
- 0 new physics bodies or colliders
- 0 new camera occluders
- Chromium LOW budget <= 60 calls / <= 110,000 triangles

No asset found through 3d-asset-server may be loaded into the V0.9.5 runtime until a later branch explicitly authorizes geometry changes.

## Intended uses

Use the asset server to shortlist:
- urban props
- traffic / parked-car variants
- street furniture
- building details
- signage
- materials / PBR textures
- night HDRIs and environment references
- future player-car variants

Prefer assets with clear licence metadata and low runtime cost.

## Intake gate

Every candidate asset must be entered in `assets/ASSET_MANIFEST.json` before integration.

Required evidence:
1. source provider and canonical asset URL
2. author / creator where available
3. licence and attribution requirement
4. downloaded format
5. triangle / polygon estimate
6. texture resolution and file size
7. intended game use
8. performance impact estimate
9. status: candidate / approved / rejected / integrated

## Licence policy

Prefer, in order:
1. CC0 / public-domain-compatible assets
2. permissive attribution licences that allow redistribution
3. royalty-free assets whose terms explicitly allow game/web redistribution

Do not ingest an asset if its licence is unknown, ambiguous, account-bound, non-redistributable, or incompatible with public GitHub Pages distribution.

The 3d-asset-server software is Apache-2.0, but **individual discovered assets keep their own licences**. Always follow the asset's source licence rather than assuming the server licence applies to downloaded content.

## Performance policy

Before any future asset is accepted into runtime:
- compare draw calls before/after
- compare rendered triangles before/after
- check mobile 844x390 composition
- test Chromium and WebKit
- verify no camera occlusion regression
- verify collision/physics additions are intentional and separately approved

For V0.9.5, discovery may continue but runtime asset count remains unchanged.

## Suggested search profile

For this project, prioritize queries such as:
- low poly urban street props
- low poly parked car
- night city PBR
- road asphalt PBR
- concrete barrier low poly
- street light low poly
- neon sign game asset
- urban HDRI night

Use `free=true` where supported and prefer direct-download, clearly licensed sources such as Poly Haven, ambientCG, Kenney, TextureCan and other explicitly compatible providers.

## Agent / MCP use

The upstream project exposes MCP tools including search and asset download. Agents may use those tools for discovery, but downloads must not be committed or wired into runtime automatically.

Workflow:
`search -> shortlist -> verify licence -> record manifest -> performance review -> explicit integration branch -> QA`.

This preserves the current submission candidate while giving future visual-development branches a repeatable 3D asset pipeline.
