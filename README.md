# Car／Neon Racer City Chase — V53

這個 Repository 是本專案目前的正式 GitHub 來源：`qookey109-pixel/car`。

- Default branch：`main`
- 目前主程式：`index.html`
- 目前版本：Neon Racer City Chase V53
- 技術：單檔 HTML + Canvas 偽 3D，手機橫向操作優先

## 啟動

建議用本機 HTTP Server 執行：

```sh
python3 -m http.server 8011
```

然後開啟：

```text
http://127.0.0.1:8011/
```

## 目前保留功能

- 低位追尾第三人稱鏡頭
- 路面導航線、路線小地圖與轉彎提示
- 技巧分數、倍率與連段
- 漂移、反打、擦身與氮氣計分
- 速度表、檔位與氮氣量
- 手機 DRIFT 與 N₂O 操作
- V51～V52 延續的啟動修復、安全模式與診斷機制

## 專案整理

2026-08-11 已將先前為資料恢復而放入 `main` 的歷史版本、recovered sources、import-recovery 文件移出主線，避免 Codex 或後續開發誤把舊版當成正式來源。

清理前完整狀態保留在：

```text
archive/pre-cleanup-20260811
```

因此 `main` 後續一律以目前 V53 與最新提交為準，不再從舊版本資料夾回推正式程式。

## 驗證限制

先前已有模組與瀏覽器測試證據，但仍不應把歷史 Chromium 模擬結果視為完整的實體 iPhone Safari／Android Chrome 驗證。

更多目前狀態請看 `docs/PROJECT_STATUS.md`。
