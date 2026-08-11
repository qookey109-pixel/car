# Car／Neon Racer — 需人工審查的衝突

狀態：**阻擋直接更新。** 本文件列出的項目需由使用者確認；任何一項都不能靠檔名、mtime 或版本號自行解決。

## P0：權威來源與技術路線

| 衝突 | 證據 | 為何阻擋 | 需要決策 |
|---|---|---|---|
| 正式本機 Repository 未確認 | 匯出文件指定 `/Users/qoo/Documents/GitHub/Car` 為待確認且該路徑不存在；目前 `/Users/qoo/Desktop/car` 沒有 `.git`。 | 無法判斷本機未提交變更、main、發布來源或是否可更新。 | 指定正式 checkout。 |
| WebGL V7.1 vs Canvas V53 | 本機 `index.html` 是「全 3D 模型車高空賽道 V7.1」與 `webgl` context；V53 文件明定 Canvas 偽 3D 城市追車。 | 不是同一檔案的版本差，而是不同架構與體驗；直接覆蓋會消滅一條工作支線。 | 選定主線，或明確雙線維護。 |
| 版本號不可排序 | 本機 V7.1 及 V6.8 設定鍵，匯出為 V21～V53。 | 7.1 不是 V53 的可比較前身／後繼證據。 | 以 commit／原始來源判定譜系。 |

## P1：聊天決策與目前本機程式碼的差異

| 聊天決策 | 本機證據 | 判讀 |
|---|---|---|
| 保持追尾鏡頭、手機橫向優先 | 本機有追尾視角按鈕、orientation gate 與 landscape CSS。 | **一致**。 |
| 六種車色、約 320 km/h、至少兩名強敵 AI | 本機有 6 個色彩按鈕、`maxSpeed`／顯示上限 320、`champion` 和 `rival` AI。 | **一致**。 |
| 左下方向；右下 GAS、BRAKE、NITRO、DRIFT | 本機僅有啟動、煞車、加速按鈕；轉向／漂移為 canvas pointer 或鍵盤邏輯，沒有明確 N₂O／DRIFT 行動按鈕。 | **不一致／功能缺口**。 |
| 漂移含分數、胎痕、煙霧與氮氣系統 | 本機有漂移判斷、煙霧粒子與 boost，但找不到技巧分數／倍率、胎痕及獨立 N₂O UI。 | **部分一致**。 |
| 撞牆必須明顯減速 | 本機 `game3d.js` 明註「取消撞牆減速」，邊界只推回。 | **直接衝突**。 |
| V53 的追尾 UI、導航線、小地圖、技巧 HUD、safe mode／診斷不可重做或覆蓋 | 本機沒有 V53 的中央導航線、V53 小地圖／技巧 HUD、safe-mode、cache repair 或 deployment diagnostics。 | **未整合；不能聲稱已保留**。 |
| Rapier 啟動問題後回退穩定版 | 本機使用 WebGL 自製程式，未發現 Rapier。 | 不使用 Rapier 與決策方向相容，但無法確認它是否就是該回退版本。 |

## P1：檔案與命名衝突

1. 三份下載附件的原始主檔名都是 `index.html`，但被下載端改名為 `index(33).html`、`index(34).html`、`index(37).html`。其中 V53 不能以改名後檔名判定可直接取代本機根 `index.html`。
2. `README.md` 在本機與多個匯出批次同名，但內容角色不同。把匯出 README 放進根目錄會破壞遊戲說明。
3. V21、V22、V24、V26 各自有同名 manifest／service worker；混用會造成快取／PWA 版本碰撞。
4. GPT 匯出內有 V50 架構報告與 recovered handoff 的完全相同副本；兩者是文件重複，不是可寫入遊戲程式的變更。
5. 匯出資料夾名稱帶有下載後綴（`-2`、`-3`、`-4`），與內容文件所述的原始相對路徑不同；匯入腳本若硬編碼路徑會失敗或寫錯位置。

## P1：測試與資料完整性風險

- `V49_DEVICE_TEST_REPORT.json` 的 Chromium 流程失敗於工具／crashpad 環境；它沒有證明遊戲失敗，但也不構成通過。
- V53 驗證 JSON 表示模組測試通過，且 V53 單檔大小與附件一致；同一份 JSON 仍記錄 mobile smoke test 失敗，且非實體 iPhone Safari。
- 匯出包缺少多數原始 assets、WAV、icons、scripts、tests、workflows、package.json 與早期完整模組。任何「完整恢復」宣稱都不成立。
- V53 的完整附件目前已由 `index(37).html` 提供，與舊的「bytes unavailable」清單存在時間上的落差；應更新可用性紀錄，但不能把這視為主線認證。

## P0：不得覆蓋的本機工作狀態

本機資料夾不含 Git，沒有可安全辨識的 baseline；因此以下都視為受保護：

- `/Users/qoo/Desktop/car/index.html`
- `/Users/qoo/Desktop/car/style.css`
- `/Users/qoo/Desktop/car/js/game3d.js`
- `/Users/qoo/Desktop/car/js/local-database.js`
- `/Users/qoo/Desktop/car/README.md`

其中 `js/local-database.js` 是 GPT 匯出完全沒有的資料持久化層。任何 V53 導入若要保留它，都必須先設計 V53 localStorage keys 與 IndexedDB schema 的雙向遷移／相容策略；不可直接刪除。

## 解決門檻

在下列三項全部獲得明確確認前，維持零修改：

1. 正式 Repository 路徑與所選分支。
2. V7.1 WebGL 或 V53 Canvas 的主線決策。
3. 是否批准在隔離複本驗證 V53，再選擇性移植功能。
