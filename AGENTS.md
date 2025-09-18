# AGENTS 指南

本檔案說明 `/workspace/AA01` 專案的開發習慣與注意事項。若要修改此專案的任何檔案（含文件），請先閱讀以下內容。

## 專案定位
* 這是一個 Google Apps Script 專案，綁定 Google 文件（Google Docs）。
* 目的：協助長照計畫文件的批次填寫，使用者在文件中開啟自訂側欄後輸入資料，即可自動複製公版、寫入段落並命名新檔。

## 程式結構
* `Main.gs` 為進入點，負責顯示 `Sidebar.html` 以及 `applyAndSave(form)` 主流程。
* 其餘 `.gs` 檔案依段落拆分（例如 `H1_CallDate.gs`、`H1_CaseProfile.gs` 等），每支檔案應僅包含對應段落的邏輯。
* `Utils.gs` 和 `FilesVersion.gs` 提供共用工具函式，不應混入業務邏輯。
* `Sidebar.html` 為唯一前端檔案，內含 HTML/CSS/原生 JavaScript，需能於 Google Apps Script HtmlService 正常運作。

## 開發原則
1. **模組責任單一化**：新增功能時，優先尋找對應的 `H1_*.gs` 檔案擴充。如需新增段落請建立新檔案並以 `applyH1_*` 命名。
2. **避免外部依賴**：Apps Script 環境無 npm，請使用平台內建服務（`DocumentApp`、`DriveApp`、`SpreadsheetApp` 等）。
3. **前端相容性**：側欄程式碼僅能使用 ES5/ES6 基礎語法，避免需要編譯的語法或框架。
4. **常數管理**：所有外部資源 ID 必須集中在 `Constants.gs`，修改時請同步更新 README 的「環境設定」。
5. **輸出規格**：所有寫入 Google 文件的函式都應接收 Document Body 與 form 資料物件，不得直接操作 UI 元素。
6. **本地測試**：本專案無自動化測試。如有邏輯調整，請在 Apps Script IDE 內實際跑一次 `applyAndSave` 並確認輸出。

## 提交前檢查
* 確認無多餘的 `Logger.log` 或測試碼。
* 若調整文件結構，請在 README 的「運作流程」或「介面說明」補充。
* 本專案無預設格式化工具，但請維持原有縮排（2 空格）與命名慣例。

## 文件與說明
* README.md 應維持最新、具體的操作指南與架構說明。
* 若新增重大功能，請在 README 加上使用步驟與注意事項。

## 測試與驗證
* 目前無自動化測試。請至少手動確認：
  1. 自訂功能表能顯示並開啟側欄。
  2. 側欄輸入最小必填欄位後，能成功建立新文件且命名正確。
  3. 外部資源（照專/個管師名單）查詢仍可運作。

感謝協助維護本專案！
