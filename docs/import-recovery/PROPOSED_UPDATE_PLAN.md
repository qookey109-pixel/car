# Car／Neon Racer — 建議更新計畫（待確認）

狀態：**只讀比較已完成；本計畫尚未獲批准，禁止套用。**

## 目標

在不覆蓋 `/Users/qoo/Desktop/car` 的 V7.1 工作狀態下，判斷 V53 單檔候選與真正正式 Repository 的關係，並建立可驗證、可回復的後續導入路徑。

## 前置條件

1. 使用者指定真正正式 Repository 的完整本機路徑；目前匯出文件中的 `/Users/qoo/Documents/GitHub/Car` 不存在，`/Users/qoo/Desktop/car` 也不是 Git Repository。
2. 維持 GitHub 離線：不 fetch、pull、push、commit 或建立 PR，直到使用者另行授權。
3. 將下列本機工作狀態列為保護對象：`README.md`、`index.html`、`style.css`、`js/game3d.js`、`js/local-database.js`。

## 建議執行順序

| 階段 | 動作 | 產出／驗證 | 風險控制 |
|---|---|---|---|
| 0. 指定權威來源 | 確認正式 Git checkout 路徑與目前 branch／commit／status。 | 可重現的基準清單。 | 未指定前不更新任何檔案。 |
| 1. 建立只讀快照 | 對正式 checkout 和 `/Users/qoo/Desktop/car` 分別記錄 SHA-256、Git status 與檔案清單。 | 可回溯的比較基線。 | 不使用「複製覆蓋」作備份。 |
| 2. 隔離 V53 候選 | 在明確批准的暫存複本建立 `candidates/v53/index.html`，以 `ace6fc69…4668e` 驗證完整性。 | V53 可重現候選，不接觸正式根目錄。 | 不把 `index(37).html` 改名覆蓋為根目錄 `index.html`。 |
| 3. 靜態與瀏覽器 QA | 對 V53 候選檢查單檔載入、safe mode、diagnostics、mobile buttons、導航線、技巧鏈；另測本機 V7.1 不受影響。 | 分開的 QA 結果；實體 iPhone／Android 仍標為待驗。 | 不把既有失敗 Chromium smoke test 轉述為通過。 |
| 4. 決策分流 | 選擇「V53 為主線候選」、「保留 V7.1 WebGL 支線」、或「只保存 V53 作歷史」。 | 明確產品與技術路線。 | 不把 Canvas 模組拆片直接塞入 `game3d.js`。 |
| 5. 選擇性移植 | 僅在使用者逐項確認後，移植需求，不移植整份檔案：例如 V53 的 N₂O／DRIFT UI、導航線、技巧 HUD、safe-mode／診斷。 | 每項都有來源、測試與回退方式。 | 保持 V7.1 的 IndexedDB 及現有六色車／AI 行為，除非另行核准。 |
| 6. 文件化 | 將恢復文件放入正式 repo 的文件區（非根 README），附來源 hash、版本與「候選」註記。 | 可追溯 history。 | V21～V26、V49、V51、V52 不覆蓋主線。 |

## 建議更新清單（尚未執行）

### 可安全進行，但需先批准

- 建立唯讀快照清單與隔離 review 目錄。
- 將 GPT 匯出治理文件納入獨立 `docs/import-review/`，保留來源 batch 名稱和 hash。
- 對 V53 候選執行獨立測試，補上先前 V49／V53 失敗的測試限制。
- 建立 V7.1 ↔ V53 功能矩陣，讓產品決策先於程式碼合併。

### 不建議直接更新

- 不用 V51、V52 或 V53 的 `index.html` 覆蓋本機 `index.html`。
- 不把 V21～V26 的 `manifest.webmanifest`、`sw.js` 放到本機根目錄。
- 不把歷史 `traffic-ai_historical_recovered.js` 覆蓋 `js/game3d.js`。
- 不以 GPT 匯出 README 覆蓋本機 README。
- 不刪除或取代本機 `js/local-database.js`；它沒有 GPT 匯出等價檔。

## 需要使用者批准的決策

1. 哪個路徑才是正式 Repository？
2. V53 Canvas 偽 3D 與目前 V7.1 WebGL 3D，哪一條是要繼續的產品主線？
3. 是否建立隔離測試複本，並在測試後才選擇性移植功能？
4. 若選擇 V53，是否保留 V7.1 的 IndexedDB 資料格式，並另做顯式遷移？

在上述決策確認前，本計畫不授權任何正式本機檔案的複製、覆蓋、刪除、重新命名或 Git 操作。
