# Sanchong–Luzhou Streetscape V0.7.1

Stacked on the validated V0.7 City Layer. This slice keeps the same LowPolySportCoupeV5 + cannon-es RaycastVehicle and adds urban density/detail without rewriting vehicle physics.

## Added

- building facade bands and rooftop caps derived from the existing V0.7 instanced building transforms
- sidewalks along OSM primary/secondary/tertiary/residential streets
- street lights
- street trees
- visual traffic signals
- deterministic fixture/fallback mode
- desktop and 844×390 multi-touch regression validation

## Performance guardrails

- streetscape radius: ~950 m
- sidewalks capped at 1800 pieces
- street lights capped at 420
- trees capped at 320
- traffic signals capped at 120
- facade enhancement capped at the nearest 1500 building instances
- all repeated props use InstancedMesh

## Safety

This layer does not modify V5 suspension, tire friction, engine, steering, brake, chassis, or RaycastVehicle parameters. V0.6 roads and V0.7 building data remain the inherited foundation.

## Deferred

- Tamsui River / Erchong floodway
- bridges
- storefront/signage system
- exact polygon building extrusion
- physical iPhone Safari / Android Chrome verification
