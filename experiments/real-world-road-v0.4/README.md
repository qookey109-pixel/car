# Real World Road V0.4 — Chunk Streaming Lab

V0.4 不加入交通規則，專注處理「車可以持續往外開」需要的路網載入架構。

## 本版新增

- 以經緯度切成固定大小道路 chunk
- 玩家接近 chunk 邊界時預抓鄰近 3×3 區塊
- Chunk 狀態：idle / loading / ready / error
- Overpass 雙 endpoint fallback
- chunk 快取與 TTL
- 最大常駐 chunk 數量與 LRU 淘汰
- AbortController：快速移動時可取消過時請求
- 同一 chunk 去重，避免重複向 Overpass 發送請求
- OSM way/node 解析成可供 Three.js 使用的本地道路 segment
- 保留 bridge / tunnel / layer / lanes / highway metadata，為後續橋隧高度分層做前置
- Debug 頁面可用 WASD / 方向鍵移動觀察 chunk streaming

## 明確不做

- 交通號誌
- 單行道強制行駛
- turn restrictions
- 路權 / 優先權
- NPC 交通規則

## 與 V0.3 關係

V0.3 仍是目前可駕駛真實道路 Prototype；V0.4 先獨立驗證 streaming core，不直接改 V0.3，避免尚未驗證的全球載入邏輯破壞既有駕駛成果。

## 啟動

```sh
python3 -m http.server 8011
```

開啟：

`/experiments/real-world-road-v0.4/`

## 下一步

若 V0.4 chunk lifecycle 驗證正常，再把 `streaming-core.js` 接到 V0.3 的道路 mesh / collision pipeline，形成可持續移動的 V0.5。