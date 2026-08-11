# PROJECT_STATUS — Car／Neon Racer

核對日期：2026-08-11

## 正式來源

- Repository：`qookey109-pixel/car`
- Default branch：`main`
- Repository 已確認可讀寫
- 目前根目錄主程式：`index.html`
- 目前版本：Neon Racer City Chase V53

## V53 目前主線功能

- Canvas 偽 3D 追尾視角
- 路面導航線、路線小地圖與轉彎提示
- 技巧分數、倍率、漂移、擦身與氮氣連段
- 手機 DRIFT 與 N₂O 按鍵
- 單檔啟動修復、安全模式與部署診斷

## 專案清理

2026-08-11 將資料恢復階段留下的舊版本與中介資料從 `main` 移除，包括：

- `versions/`
- `recovered_sources/`
- `docs/import-recovery/`
- `docs/recovered-reports/`
- 舊 recovered Handoff／時間線／恢復型 changelog

清理前完整狀態已建立備份分支：

`archive/pre-cleanup-20260811`

這些歷史資料不得重新回灌 `main`，除非是針對明確 regression 做人工比對。

## 驗證限制

- 先前模組測試已有通過紀錄
- 歷史 Chromium 行動尺寸 smoke test 不等於實體手機驗證
- 實體 iPhone Safari／Android Chrome 長時間遊玩仍應在重大更新後重新驗證

## 開發原則

1. 以 `main` 最新提交為唯一正式開發基準。
2. 不重做已完成的 V41、V48～V53 能力，除非出現可重現問題。
3. 不用 archive branch 的舊程式直接覆蓋主線。
4. UI、操控與物理修改必須保持手機橫向優先。
5. 後續交給 Codex 時，先讀取此文件與根目錄 README，再修改程式。
