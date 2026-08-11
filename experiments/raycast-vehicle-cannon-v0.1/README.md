# Cannon Raycast Vehicle V0.1 Lab

平行實驗，不修改根目錄 V53，也不取代既有 `real-world-road-v0.4-arcade-ai`。

## 目的

驗證 `Three.js + cannon-es RaycastVehicle` 是否比目前自訂 Arcade 車輛模型更適合作為後續 3D 賽車物理底座。

## 技術基線

- Three.js `0.185.0`
- cannon-es `0.20.0`
- `CANNON.RaycastVehicle`
- 900 kg chassis rigid body
- 4 wheel raycast suspension
- front-wheel steering
- rear-wheel drive
- chase camera
- desktop + mobile multi-touch controls

## 操作

- `W / ↑`：油門
- `S / ↓`：煞車，低速時倒車
- `A / D`：轉向
- `Space`：Arcade drift assist（降低後輪 frictionSlip + 輕量 handbrake/yaw assist）
- `R`：重置

## V0.1 物理參數

- chassis mass: `900 kg`
- wheel radius: `0.36 m`
- suspension stiffness: `34`
- suspension rest length: `0.34 m`
- compression damping: `4.8`
- relaxation damping: `2.4`
- normal frictionSlip: `4.2`
- drift rear frictionSlip: `1.25`
- drift front frictionSlip: `3.3`
- max engine force: about `6200 N` per driven wheel setting
- speed-sensitive steering: about `0.48 → 0.17 rad`

## 驗證原則

V0.1 先驗證：

1. 車身會受重力下落並由四輪射線懸吊支撐。
2. 四輪可保持接地。
3. 油門可推動真剛體車身。
4. 前輪 steering 可改變航向。
5. DRIFT 模式可改變後輪抓地與車身滑移。
6. 手機橫式 GAS + LEFT 可同時保持輸入。
7. Browser console error 必須為 0。

這不是最終賽車物理。若 V0.1 Browser Lab 通過，下一階段才會加入真實 OSM 道路 mesh、坡度、護欄、AI traffic 與更完整的輪胎 slip-angle 調校。
