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

## 車身視覺 V2

依使用者指定，舊版方盒車身已淘汰。現在改成自製、game-ready 的低多邊形跑車語言，不直接搬用外部商店模型檔：

- 低、寬、楔形 sports coupe 比例
- 斜前擋、側窗、後窗
- 前低後高的 hood / rear deck 輪廓
- 前後保桿與 front splitter
- 側裙與外擴 fender 視覺
- 後尾翼
- 發光前燈與尾燈
- 12-sided low-poly 輪胎與 8-sided 金屬輪圈
- flat-shaded 車漆 / 玻璃 / trim 材質

車身視覺與 RaycastVehicle 物理解耦：本次只換 render mesh，沒有改 chassis、wheel points、suspension、engine force、steering 或 drift physics。

視覺改版後 GitHub Actions `Raycast Vehicle Validation` Run #5 (`31466039371`) PASS，確認四輪接地、加速、轉向、DRIFT、手機雙觸點與 console-error Gate 沒有因車身重做而退化。

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
- drift entry threshold: `18 km/h`

## 驗證原則

V0.1 驗證：

1. 車身會受重力下落並由四輪射線懸吊支撐。
2. 四輪可保持接地。
3. 油門可推動真剛體車身，而且前進方向與視覺車頭一致。
4. 前輪 steering 可改變航向。
5. DRIFT 模式可改變後輪抓地與車身滑移。
6. 手機橫式 GAS + LEFT 可同時保持輸入。
7. Browser console error 必須為 0。
8. 視覺改版不得改變既有 physics baseline。

這不是最終賽車物理。下一階段才會加入真實 OSM 道路 mesh、坡度、護欄、AI traffic 與更完整的輪胎 slip-angle 調校。
