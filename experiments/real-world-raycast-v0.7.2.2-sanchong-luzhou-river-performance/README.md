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
- Keep `?fixture=1` deterministic validation; fixture uses a deliberately smaller render budget so CI exercises the LOD path without lowering the live Safari budget.

## Acceptance

- V0.7.2 and V0.7.2.1 regression tests still PASS.
- V0.7.2.2 deterministic fixture proves the render set is reduced and each role stays inside its budget.
- Live uses the higher `live-safari` budget; final Safari FPS is not inferred from headless Chromium.
- LowPolySportCoupeV5 remains 4-wheel grounded and accelerates normally.
- 844×390 simultaneous touch still works.
- Final Safari FPS and river visibility remain the physical-device visual gate.
