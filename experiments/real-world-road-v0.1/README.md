# Real World Road V0.1

隔離式 Prototype，不覆蓋根目錄 V53 恢復候選。

## 目標

驗證以下最小閉環：

OpenStreetMap / Overpass → 真實道路中心線 → 本地公尺座標 → 3D road mesh → 可駕駛車輛。

## 預設測試點

台北 101：

- lat `25.033964`
- lon `121.564468`
- 半徑 `1200 m`

可直接在 HUD 改緯度 / 經度後重新載入。

## 執行

此版本使用 ES module 與 CDN Three.js，請透過 HTTP server 開啟：

```sh
python3 -m http.server 8011
```

再前往：

```text
http://127.0.0.1:8011/experiments/real-world-road-v0.1/
```

## 操作

- `W` / `↑`：加速
- `S` / `↓`：煞車 / 倒車
- `A D` / `← →`：轉向
- 手機：左下觸控方向鍵

## V0.1 已做

- Overpass API 動態抓取 `highway=*`
- WGS84 經緯度轉本地公尺座標
- 依 `highway` / `lanes` 粗略估算道路寬度
- 道路中心線生成平面 3D mesh
- 程序化車輛
- 基礎加速、煞車、倒車、轉向
- 第三人稱追尾鏡頭
- 手機觸控操作
- 霧化 / 地面 / 基礎光照

## 明確未做

- 不修改 V53 根目錄 `index.html`
- 尚未做道路碰撞 / 離路減速
- 尚未做 lane markings / 車道方向
- 尚未做 DEM 地形
- 尚未做橋梁 / 隧道 / 建築
- 尚未做 chunk streaming
- 尚未接回既有 Neon Racer 的漂移、N₂O、技巧分數與 race flow

## 下一步驗收

1. 在桌面 Chrome / Safari 以 HTTP server 實跑。
2. 確認台北 101 周邊道路輪廓可辨識。
3. 確認 Overpass CORS / rate-limit 行為。
4. 再決定是否把 Real World Road Generator 接進 V53，而不是直接覆寫 V53。
