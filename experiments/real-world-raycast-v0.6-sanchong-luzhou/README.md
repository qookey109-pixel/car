# Sanchong–Luzhou Morning World V0.6

Stacked experiment on top of Real World Raycast V0.5. It keeps the validated `LowPolySportCoupeV5 + cannon-es RaycastVehicle` and changes the default world to the Sanchong + Luzhou area in New Taipei City.

## Region

- world label: `Sanchong-Luzhou`
- default center: `25.0731, 121.4810`
- live road fetch radius: about 3 km
- Sanchong reference center is around `25.061°N, 121.488°E`
- Luzhou reference center is around `25.085°N, 121.474°E`

## Morning world

- fixed morning look around 08:00
- pale blue sky
- warm low-angle directional sun
- long shadows
- light urban haze
- no live-weather dependency yet

## Road detail upgrade

- road width derived from highway class + `lanes`
- separate asphalt and visual shoulder layers
- white road-edge lines
- double yellow center lines on two-way roads
- lane separator markings based on lane count
- intersection asphalt pads to reduce visible segment cracks
- InstancedMesh used for repeated long road/marking pieces
- ROAD / SHOULDER / OFFROAD gameplay classification retained

## Physics safety

V5 RaycastVehicle parameters are not rewritten by this layer. The road-detail work is primarily world rendering and nearest-road classification.

## Deferred

- photorealistic Google 3D Tiles
- OSM building extrusion / Taipei streetscape layer
- real DEM slope
- bridge/tunnel vertical separation
- physical curbs / guardrails
- AI traffic merge
- traffic-law enforcement
- physical iPhone Safari / Android Chrome verification
