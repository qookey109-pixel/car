# Sanchong–Luzhou City Layer V0.7

V0.7 stacks a city-massing layer on top of the validated Sanchong–Luzhou Morning World V0.6. It preserves `LowPolySportCoupeV5 + cannon-es RaycastVehicle` and the V0.6 road foundation.

## Scope

- default center: `25.0731, 121.4810`
- V0.6 road world remains unchanged
- OSM `building=*` footprints are loaded in a ~1.4 km city radius
- footprint orientation is preserved with an oriented bounding-box approximation
- height priority: `height` → `building:levels` → deterministic type-based estimate
- maximum rendered buildings: 2600, nearest-first
- building facades are batched with `InstancedMesh`
- near buildings (~430 m) cast shadows; farther buildings stay visual-only for performance
- block/pavement pads reduce the previous green-field test-track look
- deterministic fixture/fallback city remains available for CI and Overpass failures

## Purpose

The V0.6 screenshot proved the road and vehicle foundation, but it still looked like a road test field. V0.7 targets the first clear city-feel gate: dense building massing and varied skyline around the real road network while protecting mobile performance.

## Physics safety

V0.7 imports V0.6 and only attaches to the same Three.js scene. It does not rewrite V5 suspension, wheel friction, engine force, steering, brake, chassis mass, or RaycastVehicle setup.

## Deferred after this slice

- exact polygon extrusion instead of oriented massing boxes
- river / floodway water layer
- bridges and vertical separation
- traffic signals, lamps, signs and trees
- storefront/signage language
- physical curbs / guardrails
- AI traffic and traffic-law enforcement
- physical iPhone Safari / Android Chrome verification
