# CODEX_IMPORT_PROMPT

請盤點並比較「Car／Neon Racer」專案，不要直接覆蓋本機 Repository。

## 輸入

- 本機正式 Repository：請先由使用者確認路徑
- ChatGPT 匯出包：本資料夾中的六個批次
- GitHub 暫時不可用，不要 fetch、pull、push、commit 或建立 PR

## 優先閱讀

1. `00_manifest_and_instructions/EXPORT_MANIFEST.md`
2. `00_manifest_and_instructions/MISSING_OR_UNAVAILABLE.md`
3. `00_manifest_and_instructions/LOCAL_UPDATE_INSTRUCTIONS.md`
4. `06_chat_only_decisions/CHAT_ONLY_DECISIONS.md`
5. `02_docs_handoffs/PROJECT_STATUS.md`
6. `02_docs_handoffs/docs/handoffs/car_handoff_recovered_2026-07-29.md`

## 規則

- 先讀取本機檔案與 Git 狀態。
- 產生逐檔差異報告，不立即修改。
- 不把 `versions_review/` 當成正式最新版。
- 不用恢復摘要、截斷內容或檔案庫 ID 代替原始碼。
- V53 是最新可恢復候選，不等於已確認 main。
- 保留 V41、V48～V53 已完成成果，不重做。
- 將衝突分成：本機較新、匯出較新、無法判斷。
- 提出安全更新計畫，等待使用者明確批准後才寫入本機。
