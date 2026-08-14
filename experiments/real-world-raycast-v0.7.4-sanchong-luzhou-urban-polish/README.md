# Sanchong–Luzhou Taiwan Urban Polish V0.7.4

V0.7.4 is a visual-only polish wrapper over the validated V0.7.3 Taiwan Urban Identity layer.

## Scope

- Keep V53 `main/index.html` untouched.
- Keep LowPolySportCoupeV5 / cannon-es RaycastVehicle parameters untouched.
- Keep V0.6 roads, V0.7 City footprints, V0.7.1.x Streetscape and V0.7.2.x river/bridge geometry intact.
- Keep V0.7.3 window bands, balconies, awnings, signs, AC units and rooftop tanks.
- Add near-field facade color variation, ground-floor shopfront glass, deeper canopies, arcade-like columns/beams, horizontal signs/lightboxes, rooftop parapets, window mullions and a small budget of generic bus shelters.
- Do not add real brands, logos, shop names or fake landmarks.
- Use InstancedMesh, shared geometry/materials and strict distance/instance budgets.

## Runtime contract

V0.7.4 adds:

- `worldUrbanPolishReady`
- `worldUrbanPolishVersion = SanchongLuzhouUrbanPolishV074`
- `worldUrbanPolishSource`
- `worldUrbanPolishCounts`
- `worldUrbanPolishOwnCounts`
- `worldUrbanPolishDrawMeshes`
- `worldUrbanPolishRenderStats`

## Acceptance

- V0.7.2.2 river-performance regression still PASS.
- V0.7.3 urban-identity regression still PASS.
- V0.7.4 polish counts are non-zero and remain within declared budgets.
- Added V0.7.4 draw meshes stay <= 14.
- LowPolySportCoupeV5 remains grounded, accelerates and enters DRIFT.
- 844×390 simultaneous touch remains functional.
- No blocking console/page errors.
- Final city feel and Safari FPS remain physical-browser visual gates after CI.
