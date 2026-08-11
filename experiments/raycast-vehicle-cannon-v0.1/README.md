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

## 車身視覺 V4

V3 已改成真正 volumetric low-poly 車身，V4 再針對「追尾視角仍容易扁平」繼續改善。外觀方向維持低多邊形跑車語言，但使用自製 Three.js 幾何，不直接複製或內嵌外部商店模型。

- 9 段 longitudinal body cross-sections，拉長前鼻並加強前後葉子板體積
- 5 段 roof cross-sections，降低車頂並強化 coupe roofline
- 暗色 inner wheel wells + 外擴 wheel-arch trim，讓輪胎與車身有真正的深度層次
- 車門 skin、門縫、門把與側裙
- hood crease、雙 hood vents、前格柵與格柵直柵
- JDM-style rear dark garnish、雙尾燈、rear diffuser
- 側進氣口、後視鏡、A/B/C pillars
- 6-spoke low-poly wheels、brake disc / caliper
- 雙排氣與尾翼
- clearcoat paint、ACES tone mapping、rim / fill light
- procedural contact shadow，讓車身在道路上有接地重量感
- 更低、更近、略帶側偏移 chase camera
- `visualVersion = LowPolySportCoupeV4`

車身視覺與 RaycastVehicle 物理解耦：V4 沒有改 chassis mass、wheel points、suspension、engine force、steering、frictionSlip 或 drift entry threshold。

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

## Browser Gameplay Validation

最新 V4 validation：Run #15 `31468470267` — **PASS**。

驗證包含：

1. `visualVersion` 必須是 `LowPolySportCoupeV4`，避免快取或舊版誤測。
2. 車身會受重力下落並由四輪射線懸吊支撐。
3. 四輪可保持接地。
4. 油門可推動真剛體車身，而且前進方向與視覺車頭一致。
5. 前輪 steering 可改變航向。
6. DRIFT 必須實際進入 `DRIFT` state，並產生 slip。
7. 漂移期間至少兩輪保持接地。
8. 844×390 mobile landscape GAS + LEFT 真雙觸點 PASS。
9. Browser console error 必須為 0。

## Pages 預覽

正式首頁 V53 保持不動。3D Raycast V4 使用獨立預覽入口：

`https://qookey109-pixel.github.io/car/preview/raycast-v3/`

網址名稱暫時保留 `raycast-v3`，避免既有書籤失效，但頁面內容已更新為 V4，頁面標題與 HUD 會明確顯示 `Low-Poly Sport Coupe V4`。

## 尚未驗證

- 實體 iPhone Safari
- 實體 Android Chrome
- 長時間 thermal / GC
- 真實 OSM 道路 mesh / 坡度
- 真實護欄、路緣與碰撞整合
- AI Traffic
- 更完整 tyre slip-angle curve

下一階段建議把 V4 車身與 Raycast 物理接進真實 OSM 道路，並做 PR #3 Arcade Controller vs PR #4 RaycastVehicle 的 A/B 遊玩比較。
