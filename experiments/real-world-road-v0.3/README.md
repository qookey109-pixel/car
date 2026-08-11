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
- 撞擊後速度損失與回推，避免直接穿出主要道路
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

目前完成程式結構與靜態契約核對；仍不可宣稱真實瀏覽器 / 手機完整 PASS。

需要實際驗證：

1. 台北 101 周邊 Overpass 載入
2. 路口鋪面是否能正確補洞
3. 高速道路護欄是否會誤封路口
4. 碰撞後是否會卡入護欄
5. 住宅巷道是否不會因主要道路護欄策略而被封閉
6. 手機多指 GAS + 轉向 + DRIFT / N₂O
7. 不同 Lat / Lon 的路網密度與效能

## 下一階段候選

先不做交通規則。V0.4 優先考慮：道路幾何穩定化、橋隧高度分層前置資料、Chunk Streaming 原型，以及與 V53 技巧 / 視覺系統的可插拔介面。
