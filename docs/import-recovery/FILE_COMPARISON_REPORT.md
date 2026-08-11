# Car／Neon Racer — 檔案比較報告

建立時間：2026-07-29（Asia/Taipei）

## 比對範圍與判讀限制

| 類別 | 路徑／數量 | 結論 |
|---|---|---|
| 目前本機比較基準 | `/Users/qoo/Desktop/car`，5 個檔案 | 此路徑由前序對話指定，但**不是 Git Repository**；`/Users/qoo/Documents/GitHub/Car` 也不存在。因此不能證實它是正式 main，也無法列出 Git 的未提交差異。 |
| GPT 匯出批次 | `00_manifest...` 至 `06_chat...`，45 個檔案 | 這是恢復／治理／歷史版本材料，不是可直接覆蓋的專案樹。 |
| 直接提供附件 | `index(33).html`、`index(34).html`、`index(37).html`、`V49_DEVICE_TEST_REPORT.json` | 分別為 V51、V52、V53 單檔程式與 V49 測試報告；納入本報告的「GPT 匯出來源」。 |
| 雜湊方法 | SHA-256、逐檔位元組比較 | 本機 5 檔與 GPT 來源 49 檔之間的相同 SHA-256 數量為 **0**。 |

匯出包本身明定 V53 只是「最新可恢復候選」，不是已確認 GitHub main；V51～V53 及 V49 的測試結論也不等同於真機驗證。本報告未複製、覆蓋、刪除或重新命名 `/Users/qoo/Desktop/car` 內任何檔案。

## 本機檔案清單（均應視為受保護工作狀態）

| 相對路徑 | Bytes | SHA-256 | 檔案時間 | 判讀 |
|---|---:|---|---|---|
| `README.md` | 794 | `caeb8e62…cc4026` | 2026-07-29 20:43 +0800 | V7.1 說明；包含 IndexedDB 說明。 |
| `index.html` | 6,324 | `77c46e21…c2ebf2` | 2026-07-29 20:43 +0800 | `全 3D 模型車高空賽道 V7.1`。 |
| `style.css` | 24,273 | `ca269f30…600e01` | 2026-07-09 13:42 +0800 | V6.9／V7.1 介面樣式。 |
| `js/game3d.js` | 59,623 | `736d53a1…82e88b` | 2026-07-29 20:43 +0800 | WebGL 賽車程式。 |
| `js/local-database.js` | 4,359 | `a05f02ef…f5ed9` | 2026-07-29 20:43 +0800 | IndexedDB 與 localStorage fallback。 |

沒有 `.git`，所以「未提交」無法從 Git 證明；但沒有共同基準可安全復原，以上五檔都必須視為不可覆蓋的本機修改／工作狀態。特別是 `js/local-database.js` 在 GPT 匯出中沒有對應檔案。

## 僅存在於 GPT 匯出來源的檔案

### 可執行或可比較來源

| 檔案 | 版本／用途 | 可能新舊 |
|---|---|---|
| `index(33).html` | V51 單檔、220,534 bytes、`56d1de70…5581f` | 比 V52、V53 舊。 |
| `index(34).html` | V52 單檔、233,322 bytes、`5d4d9de9…2f414` | 比 V53 舊。 |
| `index(37).html` | V53 單檔、259,867 bytes、`ace6fc69…4668e` | 匯出中最新可恢復**候選**。 |
| `V49_DEVICE_TEST_REPORT.json` | V49 Chromium 模擬測試失敗紀錄、7,881 bytes、`daafb254…300d5` | 比 V50～V53 舊；不是成功驗證。 |
| `01_core_source/recovered_sources/traffic-ai_historical_recovered.js` | 歷史 AI 程式片段 | 舊來源；README 明定不可直接覆蓋。 |
| `01_core_source/versions_review/v21|v22|v24|v26/{manifest.webmanifest,sw.js}` | PWA 歷史版本 | 都早於 V51～V53。 |
| `01_core_source/recovered_sources/manifest_v21|v22|v24|v26.webmanifest` | 上述 manifest 的恢復副本 | 歷史版；不可平鋪套用。 |

### 文件、資料、治理與資產索引

下列全都不存在於本機比較基準：

- `00_manifest_and_instructions/`：`CODEX_IMPORT_PROMPT.md`、`EXPORT_MANIFEST.md`、`LOCAL_UPDATE_INSTRUCTIONS.md`、`MISSING_OR_UNAVAILABLE.md`、`ORIGINAL_ATTACHMENT_DOWNLOAD_LIST.csv`、`PACKAGE_INTEGRITY.json`、`VERSIONS_REVIEW_INDEX.md`
- `01_core_source/README.md`
- `02_docs_handoffs-3/`：`CHANGELOG_RECOVERED.md`、`PROJECT_STATUS.md`、`README.md`、`docs/VERSION_TIMELINE.md`、`docs/handoffs/car_handoff_recovered_2026-07-29.md`，以及 `docs/recovered_reports/` 內的 7 份 V41～V53 報告／JSON
- `03_data-2/`：`README.md`、`inventory/FILE_LIBRARY_INDEX.csv`、`reports/architecture/V50_ARCHITECTURE_REPORT.json`、`reports/validation/V51_VALIDATION.json`、`reports/validation/V53_VALIDATION.json`
- `04_scripts_tests_workflows/`：`KNOWN_TEST_EVIDENCE.md`、`README.md`（此批沒有真正 scripts、tests 或 workflows）
- `05_assets/`：`ASSET_DOWNLOAD_INDEX.md`、`README.md`（此批沒有圖片、音效或 icons bytes）
- `06_chat_only_decisions-4/`：`CHAT_ONLY_DECISIONS.md`、`PROJECT_HANDOFF_RECOVERED.md`

## 僅存在於本機的檔案

`README.md`、`index.html`、`style.css`、`js/game3d.js`、`js/local-database.js` 都只存在於本機；其中 README 的同名治理文件不屬於同一角色，不能視為相同檔案。

## 同路徑／同角色內容差異與完全相同檔案

### 嚴格相對路徑

兩個根目錄沒有同一個相對路徑，因此沒有「同路徑但內容不同」或「跨來源完全相同」的檔案。跨來源 SHA-256 交集為零。

### 需要人工對照的同角色檔案

| 本機 | GPT 來源 | 結果 |
|---|---|---|
| `index.html`（6,324 bytes、WebGL V7.1） | `index(33).html` V51、`index(34).html` V52、`index(37).html` V53（單檔 Canvas） | 全部內容不同、結構不同、技術路線不同；不可覆蓋。 |
| `README.md`（遊戲使用說明） | `01_core_source/README.md`、`02_docs_handoffs-3/README.md`、`03_data-2/README.md` 等 | 全部內容不同；匯出 README 多為批次治理說明，不能取代遊戲 README。 |
| `js/game3d.js` | V53 HTML 內以 `data-source` 嵌入的多個模組 | 非一對一映射；V53 是 Canvas 偽 3D 模組集合，本機是單一 WebGL 程式。 |
| `js/local-database.js` | 無 | 僅本機；不可被任何匯出檔覆蓋。 |

### GPT 匯出內部完全相同的重複資料

| 內容 | 完全相同位置 | 處理建議 |
|---|---|---|
| V21 manifest | `recovered_sources/manifest_v21.webmanifest`、`versions_review/v21/manifest.webmanifest` | 保留版本化副本；不平鋪。 |
| V22 manifest | 對應 `v22` 的兩個位置 | 同上。 |
| V24 manifest | 對應 `v24` 的兩個位置 | 同上。 |
| V26 manifest | 對應 `v26` 的兩個位置 | 同上。 |
| V50 架構報告 | `02_docs_handoffs-3/docs/recovered_reports/`、`03_data-2/reports/architecture/` | 可用一份作來源、另一份作文件索引；不需合併進遊戲根目錄。 |
| 恢復 Handoff | `02_docs_handoffs-3/docs/handoffs/`、`06_chat_only_decisions-4/` | 文件副本；保留其來源語意。 |

## 可能較新／較舊的版本判讀

1. **可確認的匯出內部順序**：V21／V22／V24／V26 → V49 → V51 → V52 → V53。`index(37).html` 的 259,867 bytes 也與 V53 驗證 JSON 的 `indexBytes` 一致。
2. **V53 對本機不構成「較新」證明**：匯出資料的 V53 建立時間為 2026-07-12；本機檔案時間多為 2026-07-29，但本機 title 為另一命名系統的 V7.1、且無 Git 記錄。檔案系統 mtime 不能作為版本祖先關係證據。
3. **本機 V7.1 可能是較晚修改的另一支線**：它實際使用 WebGL、六色選車、320 km/h、強敵 AI 與 IndexedDB；沒有來源 commit 或導入記錄，不能宣稱它比 V53 新，也不能把它降級為舊版。
4. **V49 報告較舊且不代表通過**：附件顯示 Chromium 因 crashpad／環境失敗；它不表示遊戲壞掉，也不能作真機通過證據。

## 命名與路徑衝突

- 下載檔名 `index(33).html`、`index(34).html`、`index(37).html` 原本都是各版本的 `index.html`。若放進本機根目錄會發生覆寫衝突；必須保留版本目錄與原始 hash。
- `README.md` 在本機及多個匯出批次重複，但角色不同（遊戲說明 vs 匯出治理）。不可用檔名比對後覆蓋。
- 同名 `manifest.webmanifest`、`sw.js` 橫跨 V21／V22／V24／V26，不能混合版本。
- 匯出說明預期 `02_docs_handoffs`、`03_data`、`06_chat_only_decisions`，實際下載資料夾帶有 `-3`、`-2`、`-4` 後綴；匯入時不可假設路徑可直接對應。
- `MISSING_OR_UNAVAILABLE.md` 曾稱 V49 原檔不可用，但目前已提供 `V49_DEVICE_TEST_REPORT.json`。這是附件可用性後來改變，不是可覆蓋程式碼的授權。

## 初步結論

本機與 GPT 匯出不是可安全逐檔同步的兩個 checkout，而是「無 Git 的 WebGL V7.1 工作樹」與「Canvas V53 為主的恢復／歷史檔案庫」。目前正確動作是先保留兩者、確定真正正式 Repository，再由已驗證的 V53 候選建立隔離測試分支或複本；詳見 `PROPOSED_UPDATE_PLAN.md` 與 `CONFLICTS_REQUIRING_REVIEW.md`。
