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
- shoulder / offroad engine-force reduction
- offroad horizontal drag + yaw damping
- desktop + mobile controls inherited from PR #4
- no traffic-law enforcement

## Validation

`tests/real-world-raycast-validation.mjs` uses `?fixture=1` so CI does not depend on Overpass availability.

Required gates:

1. `LowPolySportCoupeV5` is still the active car.
2. 4 Raycast wheels exist and >=3 settle on the ground.
3. deterministic road fixture builds >=10 segments.
4. spawn begins on ROAD.
5. W accelerates to >=18 km/h while staying on-road.
6. steering causes lateral movement.
7. DRIFT state can be entered while remaining stable.
8. forced offroad teleport reports OFFROAD.
9. 844x390 mobile GAS + LEFT real multi-touch works.
10. browser console errors = 0.

## Explicitly deferred

- DEM elevation / slope
- bridge / tunnel vertical layers
- physical guardrail / curb collision
- AI traffic integration
- chunk streaming integration
- traffic rules / stop lights / one-way enforcement
- physical iPhone Safari / Android Chrome testing

This branch is intentionally stacked on PR #4 so the OSM integration diff stays separate from the validated RaycastVehicle base.
