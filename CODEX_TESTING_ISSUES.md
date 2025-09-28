# CODEX 自動測試失敗原因分析

以下列出目前程式碼狀態中，會讓 CODEX 無法在本機容器內直接執行自動測試的主要問題：

## 1. 強烈依賴 Google Apps Script 專屬物件

後端核心函式大量使用 `DocumentApp`、`DriveApp`、`HtmlService`、`Utilities`、`Session` 等 Apps Script 提供的全域物件，這些物件只存在於 Google Apps Script 的執行環境。在 CODEX 的測試容器中，這些全域物件並不存在，因此一旦嘗試在本地 Node.js 或一般 JavaScript 執行環境中載入 `AppCore.gs`，程式會立即因為找不到對應名稱而拋出 `ReferenceError`，導致無法啟動測試流程。【F:AppCore.gs†L15-L87】

## 2. 實際雲端資源 ID 被硬編在程式碼內

`DataStore.gs` 直接寫死多組 Google Drive/Docs/試算表的 ID 與名稱。即使在本地建立模擬的 Apps Script 物件，這些硬編的 ID 仍會觸發對雲端真實資源的存取，導致測試無法在離線或未授權的環境下執行，甚至可能造成敏感資料外洩風險。【F:DataStore.gs†L9-L14】

## 3. 文件產生流程需要實際的 Google Docs 物件

`applyAndSave` 與相關寫入函式會呼叫 `createDocumentFromTemplate` 來複製範本、開啟文件本體並取得 `Body` 物件，接著操作段落、插入表格與分頁。這整個流程仰賴 Apps Script 的文件 API，沒有這些 API 時無法建立任何假資料或虛擬文件，因而無法撰寫可在 CODEX 容器中執行的自動化測試案例。【F:AppCore.gs†L63-L181】【F:AppCore.gs†L402-L515】

## 4. 專案缺乏可執行的測試腳本

`package.json` 中的 `test` 指令僅回傳字串 `"no tests yet"`，代表專案尚未設計任何可在 Node.js 環境執行的單元或整合測試。即使先前三點問題已解決，CODEX 仍找不到測試入口點，因此會直接結束而無法驗證功能正確性。【F:package.json†L1-L17】

---

若要讓 CODEX 能執行自動測試，除了要為程式碼抽離 Apps Script 依賴並提供可替換的模擬層外，也必須補齊實際的測試腳本與測資，避免上述阻礙再次發生。
