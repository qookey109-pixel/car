# Sanchong–Luzhou River & Bridges V0.7.2

Stacked on V0.7.1.2. This slice adds geographic identity without changing the V53 main game or V5 RaycastVehicle physics.

## Added

- OSM waterway / natural=water query in a 2.1 km radius
- Tamsui-river / canal style water ribbons
- river-bank strips
- OSM highway bridge detection
- bridge deck, rails and lightweight piers
- deterministic fixture fallback
- snapshot fields for automated validation

## Preserved

- `main/index.html` V53 untouched
- V5 suspension / tire / engine / steering / braking untouched
- V0.6 road physics untouched
- V0.7 city and V0.7.1.x streetscape remain upstream layers

## Deferred

- DEM / true bridge elevation
- physical bridge deck collision replacement
- photorealistic water
- named landmark bridge models
- traffic on bridges

The V0.7.2 gate requires the river layer, bridge layer, V5 car, city/street layers and mobile controls to coexist without regression.
