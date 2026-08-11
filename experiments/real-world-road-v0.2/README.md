# Real World Road V0.2

隔離式真實道路可駕駛 Prototype。**不修改根目錄 Neon Racer V53。**

## V0.2 新增

- 只保留可供汽車行駛的主要 OpenStreetMap `highway=*` 類型，排除 footway / path / cycleway / steps 等。
- 道路 segment 建立空間格網索引，提供即時最近道路查詢。
- 離路判定：道路 / 路肩 / 離路三段狀態。
- 離路時降低加速、最高速與抓地，並提高阻力。
- 依 OSM `lanes` 與道路類型估算車道數與寬度。
- 使用 InstancedMesh 產生道路與虛線車道標記，降低 draw-call 壓力。
- 載入後自動將車輛放到最近道路並對齊道路方向。
- V53 風格操作語意：
  - 方向鍵 / WASD：轉向、油門、煞車
  - `Space` / DRIFT：漂移輸入
  - `Shift` / `N` / N₂O：氮氣
- N₂O 有容量、消耗與恢復，作用於加速、最高速及追尾鏡頭 FOV。
- 手機提供獨立 LEFT / RIGHT / GAS / BRAKE / DRIFT / N₂O 按鍵。
- Overpass 具第二端點 fallback。

## 啟動

```sh
python3 -m http.server 8011
```

開啟：

`/experiments/real-world-road-v0.2/`

## 驗證重點

1. 台北 101 周邊是否能成功取得可駕駛道路。
2. 車輛是否會自動生成在最近道路上並朝道路方向。
3. 路面中央／車道分隔虛線是否大致沿著 OSM 路線。
4. 開出道路後 HUD 是否切換「路肩／離路」，速度是否明顯下降。
5. `Space` 漂移與 `Shift/N` 氮氣是否符合 V53 操作語意。
6. 手機橫向多指操作是否能同時油門＋轉向／漂移／氮氣。

## 尚未包含

- 實體道路邊界碰撞與護欄
- OSM turn restrictions / traffic rules
- 真實標線種類、號誌、停止線
- DEM 高低差、坡度
- 橋梁／隧道高度分層
- 建築與地標
- 全球 Chunk Streaming / cache
- V53 技巧分數、Race Flow、AI 車流完整整合

V0.2 的目標仍是驗證「真實路網 + 車輛手感 + 道路約束」這三層可以穩定共存，再進入 V0.3。
