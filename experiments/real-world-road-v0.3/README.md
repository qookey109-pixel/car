# Real World Road V0.3

獨立於 Neon Racer V53 主線的真實道路 Prototype。

## V0.3 目標

這版不加入交通規則，專注把「在真實道路上開車」本身做穩。

新增：

- 道路邊界 / 護欄碰撞（motorway / trunk / primary 類道路）
- 高速道路護欄視覺
- OSM 共用節點路口辨識
- 路口圓形鋪面補洞，降低道路段交會處裂縫
- 路口範圍內暫停護欄碰撞，避免擋住轉彎
- 路肩柔性回正力
- 非漂移、低轉向輸入時的輕量道路方向貼合
- V0.2 的離路判定、車道線、N₂O、DRIFT、多點觸控全部保留
- 第二 Overpass endpoint fallback

## 明確不做

V0.3 不包含：

- 交通號誌
- 單行道強制行駛
- turn restrictions
- 路權 / 優先權
- NPC 交通規則
- DEM / 真實高低差
- 橋梁與隧道高度分層
- 建築
- 全球 Chunk Streaming
- V53 Race Flow / AI / 技巧系統完整移植

## 啟動

```sh
python3 -m http.server 8011
```

開啟：

```text
/experiments/real-world-road-v0.3/
```

## 操作

- WASD / 方向鍵：駕駛
- Space：DRIFT
- Shift / N：N₂O
- 手機：LEFT / RIGHT / GAS / BRAKE / DRIFT / N₂O

## 驗證邊界

目前已做 JavaScript ES module 語法檢查與靜態契約檢查。

仍需實際瀏覽器驗證：

1. 台北 101 周邊 Overpass 載入
2. 路口鋪面是否能正確補洞
3. 高速道路護欄是否會誤封路口
4. 碰撞後是否會卡入護欄
5. 手機多指 GAS + 轉向 + DRIFT / N₂O
6. 不同 Lat / Lon 的路網密度與效能
