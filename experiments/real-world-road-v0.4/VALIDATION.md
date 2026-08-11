# V0.4 Validation Checklist

目前狀態：程式碼結構完成，尚未宣稱真實瀏覽器完整 PASS。

## 靜態檢查項目

- [x] chunk key / bounds / 3×3 desired set
- [x] 同 chunk loading 去重
- [x] Overpass endpoint fallback
- [x] AbortController 取消過時 loading chunk
- [x] TTL 快取
- [x] maxResident + LRU 淘汰
- [x] OSM node / way → road segment
- [x] highway / lanes / width metadata
- [x] bridge / tunnel / layer metadata 保留
- [x] Debug viewer 可顯示 ready / loading / error / segment 數
- [x] 不包含交通規則

## 必須實際驗證

- [ ] GitHub Pages 能載入 ES module
- [ ] Overpass CORS / rate limit 在 Pages 正常
- [ ] 台北 101 初始 3×3 chunk 成功
- [ ] 連續跨越 3 個以上 chunk 時舊請求能取消
- [ ] LRU 淘汰後 Three.js mesh 不殘留
- [ ] 低速與高速移動不會重複請求同 chunk
- [ ] 手機 Safari 記憶體不持續成長
