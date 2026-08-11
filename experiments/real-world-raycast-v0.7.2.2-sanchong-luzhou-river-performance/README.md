# Sanchong–Luzhou River Performance V0.7.2.2

V0.7.2.2 is a render/performance wrapper over the validated V0.7.2.1 river & bridge layer.

## Scope

- Keep V53 main untouched.
- Keep LowPolySportCoupeV5 / cannon-es RaycastVehicle parameters untouched.
- Keep V0.6 roads, V0.7 City, V0.7.1.x Streetscape and V0.7.2.1 river geometry contracts intact.
- Replace river/bridge materials with lighter shared materials after V0.7.2.1 finishes loading.
- Apply distance + instance budgets to river highlights, banks, levees, bridge decks/rails/piers.
- Disable river/bridge shadow casting to reduce Safari render cost.
- Add `?view=river` acceptance center (`25.0734, 121.4685`) so Safari visual checks start close to the river/bridge area instead of searching from the city center.
- Keep `?fixture=1` deterministic validation.

## Acceptance

- V0.7.2 and V0.7.2.1 regression tests still PASS.
- V0.7.2.2 render set is smaller than the raw V0.7.2.1 set.
- LowPolySportCoupeV5 remains 4-wheel grounded and accelerates normally.
- 844×390 simultaneous touch still works.
- Final Safari FPS and river visibility remain a physical-device visual gate; CI only blocks catastrophic FPS regressions.
