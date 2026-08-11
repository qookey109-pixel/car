# Cannon Raycast Vehicle V0.1 Lab

平行實驗，不修改根目錄 V53，也不取代既有 Real World Road / Arcade + AI Lab。

## 目的

驗證 `Three.js + cannon-es RaycastVehicle` 是否適合作為後續 3D 賽車物理底座，同時建立可在手機瀏覽器運行的低多邊形正式車模方向。

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

## Low-Poly Sport Coupe V5

V5 保留 V4 已驗證的 volumetric 車身與 Raycast 物理，改用「視覺疊加層」繼續補正式遊戲車模細節，避免為了外觀重寫物理核心。

- V4 的 9 段 body cross-sections + 5 段 coupe roof 保留
- deeper recessed inner wheel wells
- body-color outer wheel-arch lip + carbon inner lip
- 更明顯前後 fender shoulder
- front center intake / brake ducts / canards
- hood power bulge + crease lines
- 立體 projector headlamp lens + internal light core
- volumetric rear lamp lens
- deeper rear bumper / diffuser / license recess / tow hook
- side skirt / aero blade / shoulder crease
- 可見 underbody、中心結構、rear hardware 與 exhaust routing
- rim outer ring + hub + wheel nuts
- 每輪 14 段 low-poly tire tread
- wheel nuts / tread blocks 使用 `THREE.InstancedMesh` 批次化，降低重複細節 draw calls
- `visualVersion = LowPolySportCoupeV5`

V5 沒有更改 chassis mass、wheel points、suspension、engine force、steering、frictionSlip 或 drift entry threshold。

## 操作

- `W / ↑`：油門
- `S / ↓`：煞車，低速時倒車
- `A / D`：轉向
- `Space`：Arcade drift assist
- `R`：重置

## 物理基線

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

V5 validated run: **Run #23 `31470470206` — PASS**.

驗證包含：

1. `visualVersion === LowPolySportCoupeV5`。
2. V5 detail contract：underbody、14-block tread、volumetric projector、Instanced wheel detail 都必須存在。
3. 4/4 Raycast wheels 建立並可落地支撐車身。
4. W 必須朝視覺車頭 `-Z` 前進。
5. 加速必須在 state-based Gate 內達 12 km/h，再達 25 km/h。
6. steering 在至少 25 km/h 的可比較速度下驗證，不用低速瞬間偏移冒充轉向能力。
7. DRIFT 必須實際進入 `DRIFT` state 並產生 slip。
8. 漂移期間至少兩輪保持接地。
9. 844×390 mobile landscape GAS + LEFT 真雙觸點 PASS。
10. Browser console error = 0。

Run #23 實測摘要：

- 4/4 wheels grounded
- time to 12 km/h: `1154 ms`
- time to 25 km/h: `2220 ms`
- steering sample: `36 km/h`, lateral movement `0.50 m / 0.9 s`, slip `7.6°`
- drift entry: `39 km/h`, 4/4 grounded
- drift sample reached `48 km/h`
- mobile GAS + LEFT sample: `18 km/h`, 4/4 grounded
- console errors: `0`

GitHub Actions headless FPS 數字不作為實機 FPS 結論；實體手機效能仍需另外驗證。

## Pages 預覽

正式首頁 V53 保持不動。

- V4：`https://qookey109-pixel.github.io/car/preview/raycast-v4/`
- V5：發布後使用 `https://qookey109-pixel.github.io/car/preview/raycast-v5/`

## 尚未驗證

- 實體 iPhone Safari
- 實體 Android Chrome
- 長時間 thermal / GC
- 真實 OSM 道路 mesh / 坡度
- 真實護欄、路緣與碰撞整合
- AI Traffic
- 更完整 tyre slip-angle curve

下一階段：把 V5 車身 + Raycast 物理接到真實 OSM 道路，並與 PR #3 Arcade Controller 做 A/B 遊玩比較。
