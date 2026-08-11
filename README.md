# Car／Neon Racer City Chase — V53 恢復候選

目前根目錄是已驗證雜湊的 V53 單檔候選：`index.html`（SHA-256 `ace6fc690ac39b5c205d61843aa2bc54ed0490df2fbb01a8ddbee98e7134668e`）。它是最新**可恢復候選**，不是已確認的 GitHub main。

## 啟動

建議以本機伺服器啟動，避免 `file://` 下的 Service Worker 行為差異：

```sh
cd /Users/qoo/Desktop/car
python3 -m http.server 8011
```

然後開啟 `http://127.0.0.1:8011/`。首次載入後可使用遊戲內的安全模式、快取清除與部署診斷工具。請另行在實體 iPhone Safari 與 Android Chrome 驗證；附件內的 V49／V53 Chromium 測試不能當作真機通過證據。

## 目錄

| 位置 | 內容 |
|---|---|
| `index.html` | V53 Canvas 偽 3D 主線候選。 |
| `versions/local-webgl-v7.1-20260729/` | 更新前的 WebGL V7.1 完整快照，包含 IndexedDB 資料持久化層；不刪除。 |
| `versions/neon-racer-v51/`、`versions/neon-racer-v52/` | 可比較的舊單檔版本。 |
| `versions/legacy-pwa/` | V21、V22、V24、V26 的 PWA 歷史版本。 |
| `recovered_sources/` | 歷史恢復來源；不得直接覆蓋主線。 |
| `docs/` | Handoff、版本時間線、恢復報告、測試限制與匯入來源治理資料。 |

## 已知資產缺口

本次恢復沒有原始車圖、icons、manifest 與 14 個 WAV bytes。V53 對這些檔案有內建視覺與音效 fallback，但並不表示離線 PWA 或完整素材已恢復。不得以空白檔或舊版本資產冒充補齊；完整清單見 `docs/import-recovery/manifest/MISSING_OR_UNAVAILABLE.md`。

## 更新原則

- 不把 `versions/` 中任何檔案平鋪覆蓋根目錄。
- 不把 V41、V48～V53 的已完成成果重做或回退。
- V53 的程式／設定 key、cache 與 diagnostics 必須一起驗證，避免舊快取碰撞。
- 真正正式 Repository、Git branch 與線上部署來源仍待確認。
