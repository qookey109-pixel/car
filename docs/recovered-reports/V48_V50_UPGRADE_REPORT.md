# Neon Racer V48～V50 升級報告

## V48：分層音效素材
- 14 個本地 WAV 音效檔
- 四層引擎循環音
- 輪胎、雨水與護欄循環音
- 換檔、回火、碰撞、三角錐、積水、雷聲及超車單次音效
- 音效素材失敗時自動使用原本的合成音
- 音效為本專案預先渲染素材，不是商業車輛實地錄音

## V49：效能分析
- 遊戲內 15 秒效能分析
- 平均 FPS、1% Low、P95 幀時間、最差幀及長幀統計
- 支援瀏覽器記憶體資料時顯示 JS Heap
- 可下載 JSON 報告
- 自動裝置瀏覽器測試受執行環境 Chromium crashpad 限制，未宣稱已完成實體手機測試
- 真實 iPhone／Android 可直接在設定頁執行分析

## V50：核心模組化
- settings-store.js：設定遷移與資料驗證
- audio-system.js：完整音訊生命週期
- performance-ui.js：效能介面與事件
- app.js 從 2576 行降至 2318 行
- 原有 physics、collision、input、track、radar、lighting 等模組全部保留

## 不包含
- V47 車庫
- 金幣、任務、分數或付費機制
