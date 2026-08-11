# CURRENT HANDOFF — Car／Neon Racer

## 專案資訊

- Repository：`qookey109-pixel/car`
- Branch：`main`
- 正式主程式：`index.html`
- 目前版本：Neon Racer City Chase V53
- 技術方向：手機橫向優先、Canvas 偽 3D 賽車遊戲

## 目前狀態

V53 已在 `main` 作為正式開發基準。2026-08-11 已移除資料恢復階段留下的舊版本資料夾、recovered sources 與 recovery/import 文件，避免後續 Codex 誤用舊檔。

清理前完整 Repository 快照保留在：

`archive/pre-cleanup-20260811`

## 已完成且不要無故重做

- V41 十輪穩定性精修
- V48 分層音效設計與備援
- V49 效能分析能力
- V50 核心模組化成果
- V51 單檔啟動修復
- V52 安全模式與部署診斷
- V53 追尾鏡頭、導航線、小地圖、技巧 HUD、DRIFT／N₂O 手機操作

## 重要產品決策

- 手機橫向優先，桌面支援
- 追尾近距第三人稱視角為主，不因 UI 參考圖任意改掉主鏡頭
- 車輛選擇以顏色為主，不採新手／高速車型分類
- 撞牆需要明顯減速
- 操控方向是更緊的轉向、更強抓地與較快加速
- 漂移系統包含分數、連段、胎痕／煙霧與氮氣相關回饋

## 驗證限制

歷史模組測試與瀏覽器模擬可當回歸證據，但不能代替實體 iPhone Safari／Android Chrome 驗證。

## 下一步

任何新開發先讀：

1. 根目錄 `README.md`
2. `docs/PROJECT_STATUS.md`
3. 本文件
4. `index.html`

然後以 `main` 最新提交直接延續，不從 archive 或聊天匯出包重新設計整個專案。
