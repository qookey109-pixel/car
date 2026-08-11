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

## 道路規則資料：可以顯示，但不強制玩家遵守

本專案是 Arcade Racing，不做真實交通執法。OSM 中若有相關資料，可以在後續版本讀取並做成場景標示／HUD 提示：

- 紅綠燈 / 交通號誌：可以做視覺物件與燈號顯示
- `maxspeed`：可以顯示速限牌或 HUD 資訊
- `oneway`：可以顯示道路方向箭頭
- `stop` / `give_way`：可以顯示停止牌、讓路牌、停止線／讓路線
- turn restrictions：可以顯示禁止左轉、禁止右轉等標誌
- 路權 / 優先道路：可以作為道路資訊或視覺標示

### 重要：只標示，不限制賽車

- 速限牌 **不會改變玩家最高速**
- 超過 OSM `maxspeed` **不會自動煞車或降速**
- 單行道箭頭 **不會阻止玩家逆向行駛**
- 紅燈 **不會鎖油門或強制停車**
- STOP / GIVE WAY **不會強制停讓**
- turn restriction **不會禁止玩家轉彎**
- AI 車流目前也不需要遵守真實交通法規

這些資料的用途是增加真實世界道路辨識度與場景感，不取代 Arcade Racing 的自由駕駛與高速玩法。

## 啟動

```sh
python3 -m http.server 8011
```

開啟：

`/experiments/real-world-road-v0.4-arcade-ai/`

## 尚未完成

- OSM 速限牌 / 單行箭頭 / STOP / GIVE WAY / traffic signals 的視覺標示
- turn restriction 標誌視覺化
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
