# Sanchong–Luzhou Taiwan Urban Identity V0.7.3

V0.7.3 is a visual-only urban identity wrapper over the validated V0.7.2.2 stack.

## Scope

- Keep V53 `main/index.html` untouched.
- Keep LowPolySportCoupeV5 / cannon-es RaycastVehicle parameters untouched.
- Keep V0.6 roads, V0.7 City footprints, V0.7.1.x Streetscape, V0.7.2.1 river geometry and V0.7.2.2 performance contracts intact.
- Reuse the existing city building transforms instead of rebuilding OSM buildings.
- Add near-field Taiwan-style urban visual grammar using InstancedMesh budgets:
  - horizontal window bands
  - balcony slabs + railings
  - storefront awnings
  - generic vertical sign boxes (no fake business names)
  - AC outdoor units
  - rooftop water tanks
- Keep the layer derived from existing city geometry so it follows the same world origin and road-clearance decisions.

## Acceptance

- V0.7.2.2 regression remains PASS.
- `worldUrbanIdentityVersion = SanchongLuzhouTaiwanUrbanIdentityV073`.
- Fixture produces non-zero windows, balconies, awnings, signs, AC units and rooftop tanks.
- Added identity layer stays within fixed instance budgets and <= 10 added draw meshes.
- LowPolySportCoupeV5 remains grounded and accelerates normally.
- 844×390 simultaneous touch remains functional.
- Final city feel and Safari FPS remain physical-device visual gates.
