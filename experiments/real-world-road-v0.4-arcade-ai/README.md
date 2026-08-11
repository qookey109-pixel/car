# Real World Road V0.4 — Arcade Kart Handling + AI Traffic

V0.4 延續 V0.3 的道路邊界／護欄方向，加入第一版真正的 Arcade Kart 操控與 AI 車流。根目錄 Neon Racer V53 不修改。

## 已完成

- OSM / Overpass 真實道路載入
- 可駕駛道路過濾
- 道路寬度與虛線車道標記
- 主要道路護欄 Mesh 與簡化邊界碰撞
- 路口附近取消護欄碰撞，避免交叉口被封死
- 道路 / 路肩 / 離路三段手感
- 高抓地正常轉向
- 高速轉向曲線
- 非漂移時強力抑制 lateral velocity
- `GRIP → DRIFT → RECOVER` 三段漂移狀態
- 漂移時人工側向滑移與向心修正
- 漂移角度 × 速度 × 時間累積 Drift Charge
- Drift Charge 滿後獲得 N₂O token
- 最多儲存 3 顆 N₂O
- N₂O 提升加速、最高速與鏡頭 FOV
- 離路時降低抓地、加速、最高速，且集氣效率失效
- 12 台程序化 AI 車流
- AI 沿 OSM node / segment graph 巡航
- AI 路口選路以保持前進方向為主，帶少量隨機
- AI 車距過近時簡化減速
- 玩家與 AI 有輕量 soft-contact 減速
- 桌面：WASD / 方向鍵、Space DRIFT、Shift / N N₂O
- 手機：LEFT / RIGHT / GAS / BRAKE / DRIFT / N₂O

## 明確不做

本 Prototype 不實作基礎交通規則：

- 不做紅綠燈 / 交通號誌
- 不做速限
- 不做單行道限制
- 不做停讓 / 路權
- 不做 turn restrictions
- 不做真實交通法規 AI

目前 AI 車流只是用來讓 OSM 真實道路開始有車輛活動，驗證遊戲性與效能。

## 啟動

```sh
python3 -m http.server 8011
```

開啟：

`/experiments/real-world-road-v0.4/`

## 尚未完成

- AI 車型與性格差異
- 更穩定的複雜路口 graph traversal
- 玩家 / AI 更完整的 arcade collision response
- 漂移火花、胎痕、煙霧、N₂O 視覺特效
- V53 Skill Chain / Race Flow 完整接入
- 建築、DEM、橋隧高度分層
- 全球 Chunk Streaming

## 安全邊界

- 不修改根目錄 `index.html`
- PR 維持 Draft，不自動 merge
- V0.1 / V0.2 / V0.3 全部保留
- 不直接複製 STK / Unity 原始碼；本版為依 Arcade Handling 概念自行實作
