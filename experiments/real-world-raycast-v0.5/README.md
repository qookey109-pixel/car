# Real World Raycast V0.5

Stacked experiment on top of PR #4. It keeps the validated `LowPolySportCoupeV5 + cannon-es RaycastVehicle` and replaces the lab test strip with OpenStreetMap road geometry.

## Scope

- default origin: Taipei 101 (`25.033964, 121.564468`)
- live Overpass road fetch with two endpoints
- deterministic fixture fallback for CI / outage safety
- drivable highway filtering
- OSM lanes -> approximate road width
- local-meter projection around map origin
- segment spatial grid + nearest-road lookup
- InstancedMesh road surfaces + center markings
- V5 900 kg chassis / 4-wheel raycast suspension unchanged
- spawn aligned to nearest road heading
- ROAD / SHOULDER / OFFROAD classification
- PR #4 engine force remains completely untouched
- shoulder / offroad slowdown uses additive horizontal drag only
- offroad yaw damping
- desktop + mobile controls inherited from PR #4
- no traffic-law enforcement

## Browser Gameplay Validation

Validated code commit: `d7ba6b97d4463aa03b009dee7c2447724634175d`

GitHub Actions Run #4: `31473682205` — **PASS**.

`tests/real-world-raycast-validation.mjs` uses `?fixture=1` so CI does not depend on Overpass availability.

Validated gates and samples:

1. `LowPolySportCoupeV5` remains the active car.
2. 4 Raycast wheels exist and all 4 settle on the ground.
3. deterministic road fixture builds 15 road segments.
4. spawn begins on ROAD, exactly on the centerline sample.
5. W reaches 18 km/h while still ROAD / 4 of 4 wheels grounded.
6. steering sample reaches 26 km/h and about 0.20 m lateral movement.
7. DRIFT enters at 33 km/h with 4 of 4 wheels grounded.
8. forced offroad teleport reports OFFROAD (~141.8 m from nearest road centerline).
9. 844x390 mobile GAS + LEFT real multi-touch reaches 20 km/h with 4 of 4 wheels grounded.
10. browser console errors = 0.

The failed diagnostic run before this PASS showed the first integration's engine-force wrapper pinning road speed near 2 km/h. That wrapper was removed rather than weakening the validation gate. The validated V0.5 road layer no longer modifies RaycastVehicle engine force.

## Explicitly deferred

- DEM elevation / slope
- bridge / tunnel vertical layers
- physical guardrail / curb collision
- AI traffic integration
- chunk streaming integration
- traffic rules / stop lights / one-way enforcement
- physical iPhone Safari / Android Chrome testing

This branch is intentionally stacked on PR #4 so the OSM integration diff stays separate from the validated RaycastVehicle base.
