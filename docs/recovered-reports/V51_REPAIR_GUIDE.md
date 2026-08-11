# Neon Racer V51 啟動修復指南

## 最簡單的上傳方式
V51 的核心 CSS 與 JavaScript 已全部嵌入 `index.html`。

即使 GitHub 上沒有成功上傳 `js/` 或 `styles.css`，遊戲核心仍能啟動。
`assets/` 與 `audio/` 建議一併上傳；缺少時會使用 Canvas 車輛與合成音備援。

## GitHub Pages 更新
1. 刪除或覆蓋舊的 `index.html`。
2. 上傳 V51 的 `index.html`。
3. 建議一併上傳 `assets/`、`audio/`、`icons/` 與 `manifest.webmanifest`。
4. 開啟：
   `https://qoo109.github.io/?v=v51&repair=1`

## 仍然打不開
頁面等待 12 秒後會顯示「遊戲啟動修復」。
按「清除快取後重試」，它會：
- 取消舊 Service Worker
- 清除舊 Neon Racer 快取
- 加入新的 repair 參數重新載入

## V51 主要修復
- 單一 HTML 核心，避免漏傳 30 多個 JS 模組
- 自動清除舊 Service Worker 與舊快取
- 全域 JavaScript 錯誤顯示
- 啟動逾時救援畫面
- V50 設定自動遷移
- 車輛圖片與 WAV 音效仍保留失敗備援
