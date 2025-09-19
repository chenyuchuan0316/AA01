# AA01 計畫助手

AA01 是一套以 Google Apps Script 打造的 Google 文件附加功能。長照個管師可在計畫書公版文件中開啟「計畫助手」側欄，填入個案資訊後，由程式自動：

1. 依照命名規則複製公版文件到指定雲端硬碟資料夾。
2. 將側欄輸入內容寫入新文件的各個段落。
3. 回傳新檔資訊並自動開啟，節省大量手動編修時間。

本文說明整體架構、環境需求、運作流程以及每個檔案的角色，協助開發者或使用者快速了解系統。

---

## 系統架構概覽

```
HtmlService：Sidebar.html
   ├── showSidebar()（Google Docs 側欄模式）
   └── doGet()（Apps Script Web App 模式）
          ├── 收集輸入、組句、基本驗證
          └── 呼叫 google.script.run.applyAndSave(form)
                  └── AppCore.gs / applyAndSave(form)
                        ├── 文件寫入器（H1 段落、附件頁）
                        └── 服務資料查詢（透過 DataStore.gs）
```

* **前端 (Sidebar.html)**：使用原生 HTML/CSS/JavaScript 建立表單介面，並在提交前負責資料整理、文字重組、欄位驗證。
* **後端 (`*.gs`)**：在 Apps Script Runtime 中執行。主要負責複製模板文件、依段落更新內容、查詢 Google 試算表等。

---

## 關鍵檔案與模組

| 檔案 | 內容摘要 |
| --- | --- |
| `AGENTS.md` | 專案維護指南與開發原則。|
| `AppCore.gs` | 入口流程、文件寫入、通用工具與人員名單查詢皆集中於此。亦提供 `getServiceCatalog()` 給前端取得服務資料。|
| `DataStore.gs` | 外部資源 ID 及桃園市長照給付資料庫靜態表，供 `AppCore.gs` 與前端查詢。|
| `Sidebar.html` | 側欄 UI 與邏輯。負責收集使用者輸入、產生描述文字、基本驗證與呼叫後端函式。|

---

## 執行環境與外部資源

AA01 需在 Google Workspace 環境執行，並取得下列服務權限：

* Google Docs API (`DocumentApp`)：讀寫公版文件內容。
* Google Drive API (`DriveApp`)：複製模板並寫入指定資料夾。
* Google Sheets API (`SpreadsheetApp`)：讀取個管師及照專名單。

部署前請在 `DataStore.gs` 調整以下常數為自己環境的 ID：

| 常數 | 用途 |
| --- | --- |
| `TEMPLATE_DOC_ID` | 計畫書公版 Google 文件 ID。|
| `OUTPUT_FOLDER_ID` | 輸出文件的雲端硬碟資料夾 ID。|
| `MANAGERS_SHEET_ID` / `MANAGERS_SHEET_NAME` | 存放個管師名單的試算表與工作表名稱（B 欄=員工編號、H 欄=姓名）。|
| `CONSULTANTS_BOOK_ID` / `CONSULTANTS_BOOK_NAME` | 照專名單試算表資訊（A 欄=單位代碼、B 欄=姓名、C 欄=狀態）。|

> ⚠️ 這些 ID 為特定環境的資源。若未更新，程式將無法存取或寫入正確資料。

---

## 部署與初始化流程

AA01 可以透過兩種模式使用：綁定 Google 文件的側欄（原始設計），或是將相同介面部署成獨立 Web App。無論哪種模式，請先在 `Constants.gs` 設定正確的資源 ID。

### 方式一：Google 文件側欄（預設）

1. **建立 Google 文件專案**
   - 在目標 Google 文件中開啟 `Extensions → Apps Script`，建立專案。
   - 將此儲存庫中的所有檔案（`.gs` 與 `Sidebar.html`）貼入 Apps Script IDE。

2. **設定常數**
   - 依實際資源填入 `Constants.gs`。
   - 確認模板文件與輸出資料夾的共用權限允許 Apps Script 帳號存取。

3. **授權**
   - 第一次執行 `showSidebar` 或 `applyAndSave` 時，需授權 Apps Script 存取 Docs/Drive/Sheets。

4. **測試**
   - 於模板文件中重新載入頁面，應看到「計畫助手」功能表。
   - 開啟側欄、填入測試資料並點選「產出」，確認能成功建立新檔。

### 方式二：Apps Script Web App

1. **建立獨立 Apps Script 專案**
   - 前往 [script.google.com](https://script.google.com) 建立新的（未綁定任何文件的）專案。
   - 將本儲存庫的所有檔案貼入專案；`AppCore.gs` 內的 `doGet()` 會回傳與側欄相同的 HtmlService 介面。

2. **設定常數**
   - 仍需依實際資源填入 `Constants.gs`，並確認模板/資料夾/試算表授權正確。

3. **部署**
   - 在 Apps Script 中選擇 `Deploy → New deployment → Web app`（或 `Test deployments` 進行預覽）。
   - 設定執行身份與分享範圍，例如「Only myself」或「Anyone within domain」。

4. **授權與使用**
   - 第一次開啟 Web App URL 時授權所需的 Docs/Drive/Sheets 權限。
   - 授權後即可在瀏覽器中全頁使用同一套表單流程，產出結果與側欄模式相同。

### 選用：使用 `clasp` 本地開發

若需要在本地與 Apps Script 同步，可安裝 [clasp](https://github.com/google/clasp) 並將本專案連結至遠端 Apps Script 專案，以利版本控管。此儲存庫採平面檔案結構，與 `clasp` 預設格式相容。

---

## 運作流程細節

1. **顯示側欄**
   - `onOpen` 在文件載入時建立「計畫助手」功能表，使用者點選後執行 `showSidebar()`。
   - `showSidebar` 以 `HtmlService` 載入 `Sidebar.html`，側欄寬度 420px。

2. **側欄互動** (`Sidebar.html`)
   - 初始化時預設「電聯日期」「家訪日期」為今日，並透過 `google.script.run` 載入個管師及照專名單。
   - 使用者輸入資料時即時重組段落文字（特別是「(一)身心概況」等長段落），並顯示預覽。
   - 送出前執行驗證：必填欄位、部分協助的說明文字、皮膚病灶醫療院所等。
   - 將所有欄位整合成 `form` 物件，呼叫 `applyAndSave(form)`。

3. **後端寫入** (`AppCore.gs`)
   - `applyAndSave` 先計算新檔名稱（`單位代碼_家訪日期_個案姓名_V{版號}`）。
   - 於 `OUTPUT_FOLDER_ID` 指定的資料夾中，以 `TEMPLATE_DOC_ID` 為模板建立副本並開啟 Body。
   - `DOCUMENT_WRITERS` 依序呼叫 `applyH1_*` 函式處理各段落（邏輯集中於 `AppCore.gs`）：
    - `applyH1_CallDate` / `applyH1_VisitDate`：更新標題列文字或插入出院日期。
    - `applyH1_Attendees`：組出偕同訪視者句子（包含主照者、照專、其他參與者）。
    - `applyH1_CaseProfile`：分段處理個案概況六大小節，必要時補上預設文字。
    - `applyH1_CareGoals`：寫入照顧問題、短/中期四格、長期目標。
    - `applyH1_MismatchPlan`：整合不一致原因與常用快捷語句。
   - 接著透過 `applyPlanExecutionPage` 與 `applyPlanServiceSummaryPage` 在文件結尾加入頁 2（計畫執行規劃）與頁 3（服務明細），自動插入分頁。
   - 完成後儲存關閉文件，回傳新檔資訊給前端。

4. **前端回饋**
   - 側欄顯示「已建立新檔並寫入內容」訊息並開啟新文件分頁。

---

## 介面重點說明（Sidebar.html）

* 側欄頂端提供「計畫目標／計畫執行規劃／其他備註」三個分頁，對應輸出文件的主要區塊與附件。
* **基本資料**：單位代碼決定下拉選單內容（個管師、照專名單）。
* **(一) 身心概況**：
  - 內建多層邏輯（視力、聽力、疼痛、皮膚病灶、ADL、睡眠等），透過即時組句產生段落。
  - `buildSection1Text_v2` 會根據輸入產出完整句子並呈現在預覽框。
* **(二)~(四)**：經濟收入、居住環境、社會支持皆維持既有表單邏輯並組句。
* **(五)(六)**：其他與複評評值提供自由文字欄位，使用者可直接輸入或貼上內容。
* **正式資源（B 服務）**：日間照顧與 BD03 交通車會依 CMS 等級及桃園市給付額度自動推估每週/每月可使用次數、耗用點數與剩餘額度，並將建議文字同步至服務計畫與附件摘要。所有服務代碼在加入計畫時，側欄亦會套用對應的「使用方式」範本，讓填寫者僅需視個案微調敘述。月單位欄位新增 +1／+5／+10 以及清除快捷按鈕，行動裝置也能快速設定用量；附件二預覽上方則即時計算 CMS 月額度、B/C 總耗用點數與預估餘額，無需切換頁面即可掌握額度使用狀況。
* **照顧目標**：支援問題清單（最多 5 項）及短/中/長期目標；長期目標會彙整短中期欄位。
* **不一致原因與追蹤計畫**：常用快捷語句可勾選後自動附加在第三欄。
* **附件預覽（其他備註分頁）**：顯示計畫執行規劃文字及服務明細表，與輸出附件同步更新。
* **產出按鈕**：送出前進行欄位驗證並組成 `form` 物件。

---

## 常見維護與擴充建議

* 新增段落：在 `AppCore.gs` 中新增對應的 `applyH1_NewSection(body, form)`，並於 `DOCUMENT_WRITERS` 中按段落順序呼叫。
* 調整輸出格式：優先修改 `AppCore.gs` 內對應的 `applyH1_*` 段落，必要時更新同檔案中的共用工具函式。
* 新增欄位：
  1. 在 `Sidebar.html` 新增 UI 與資料整合邏輯。
  2. 調整 `applyAndSave` 的 `form` 組裝。
  3. 在 `AppCore.gs` 中對應的 `applyH1_*` 函式使用新欄位。
* 更新給付資料：若桃園市長照給付標準調整，請同步更新 `桃園市_長照給付資料庫_v1.xlsx` 並重新產出 `DataStore.gs` 中的 `TAOYUAN_LTC_DATA` 段落，同時檢視 `Sidebar.html` 內的服務代碼敘述是否對應。
* 即時欄位驗證：若新增欄位需依條件顯示錯誤提示，請於 `Sidebar.html` 的 `validateSection1` 或相關段落驗證函式補強，維持與 UI 提示一致。

---

## 測試建議

因專案沒有自動化測試，建議在每次修改後手動進行：

1. 於測試文件中開啟側欄，完成一份最小案例（僅必填欄位），確保能產生文件且內容完整。
2. 嘗試含有全部欄位的完整案例，確認段落組句格式正確（包含多重選項、快捷語句）。
3. 測試外部資源失敗情境（如撤除試算表權限），確認錯誤訊息清楚易懂。

---

## 版本控管

* 目前程式碼以平面檔案管理，適合直接複製到 Apps Script IDE。
* 建議在雲端端開啟 `File → Manage Versions`，將穩定版標記版本，以便回復。
* 若與多名開發者協作，建議採用 Git 儲存庫（如本專案）搭配 `clasp` 同步程式碼。

---

## 支援與回饋

若使用者或同仁發現：

* 字典/下拉選項需更新。
* 新段落文字格式與政策調整。
* 產出文件內容有誤或漏填。

請更新 Issues 或直接修改程式後提交 PR，並確保 README 與 `Constants.gs` 的說明保持同步。

祝開發順利！
