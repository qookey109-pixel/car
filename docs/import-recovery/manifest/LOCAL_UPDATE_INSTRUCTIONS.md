# LOCAL_UPDATE_INSTRUCTIONS

## 重要原則

不要直接把任何 ZIP 解壓覆蓋到正式專案資料夾。

## 建議流程

1. 在 Mac 建立暫存目錄：

   ```bash
   mkdir -p ~/Desktop/car-chatgpt-export-review
   ```

2. 將所有 ZIP 解壓到該暫存目錄。
3. 將本機正式專案路徑填入環境變數；目前實際路徑待確認：

   ```bash
   export CAR_REPO="/Users/qoo/Documents/GitHub/Car"
   export CAR_EXPORT="$HOME/Desktop/car-chatgpt-export-review"
   ```

4. 先檢查本機狀態，不修改：

   ```bash
   cd "$CAR_REPO"
   git status --short
   git rev-parse HEAD
   find . -maxdepth 3 -type f | sort > /tmp/car-local-files.txt
   ```

5. 比較檔案清單：

   ```bash
   find "$CAR_EXPORT" -type f | sort > /tmp/car-export-files.txt
   diff -u /tmp/car-local-files.txt /tmp/car-export-files.txt || true
   ```

6. 對單一檔案逐一比較：

   ```bash
   diff -u "$CAR_REPO/path/to/file" "$CAR_EXPORT/path/to/file" || true
   ```

7. `versions_review/`、`recovered_sources/` 與 `recovered_reports/` 不應直接複製到正式根目錄；先由 Codex 判斷用途。
8. V53 只能視為最新可恢復候選；在 GitHub 恢復前不可宣稱是正式 main。
9. 先建立本機備份分支或複本，再套用確定需要的差異。
10. 更新完成後再執行現有測試；不要降低 QA 門檻。
