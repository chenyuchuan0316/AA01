# AA01 計畫助手

AA01 是一套以 Google Apps Script 打造的 Google 文件附加功能。長照個管師可在計畫書公版文件中開啟「計畫助手」側欄，填入個案資訊後，由程式自動：

1. 依照命名規則複製公版文件到指定雲端硬碟資料夾。
2. 將側欄輸入內容寫入新文件的各個段落。
3. 回傳新檔資訊並自動開啟，節省大量手動編修時間。

本文說明整體架構、環境需求、運作流程以及每個檔案的角色，協助開發者或使用者快速了解系統。

## 計畫書標題規格（HEADING_SPEC）

AA01 的所有段落寫入函式都必須符合下列標題規格。此結構同時對應前端表單的章節配置與輸出文件的標題階層；調整任一段落時，請先比對 `HEADING_SPEC_VERSION` 是否需要升版，並確保所有 `applyH1_*`、模板字典以及側欄 UI 仍完整覆蓋每一個節點。為避免未來維護時誤刪標題，請在程式碼審查中逐項核對此表列，並確認回歸測試的輸出文件不缺漏任何標題。

```javascript
/* ===== 完整版 HEADING_SPEC（for CODEX 指令直接覆蓋） ===== */
const HEADING_SPEC_VERSION = '2025-09-24';

const HEADING_SPEC = Object.freeze([
  /* =================== H1：基本資訊 =================== */
  {
    id:'h1-basic', tag:'h1', label:'基本資訊', page:'basic',
    children:[
      { id:'h2-basic-unit-code',      tag:'h2', label:'單位代碼' },
      { id:'h2-basic-case-manager',    tag:'h2', label:'個案管理師' },
      { id:'h2-basic-case-name',       tag:'h2', label:'個案姓名' },
      { id:'h2-basic-consultant-name', tag:'h2', label:'照專姓名' },
      { id:'h2-basic-cms-level',       tag:'h2', label:'CMS 等級' }
    ]
  },

  /* =================== H1：計畫目標 =================== */
  {
    id:'h1-goals', tag:'h1', label:'計畫目標', page:'goals',
    children:[

      /* H2 一、電聯日期 */
      {
        id:'h2-goals-call', tag:'h2', label:'一、電聯日期',
        children:[
          { id:'h3-goals-call-date',    tag:'h3', label:'電聯日期' },
          { id:'h3-goals-call-consult', tag:'h3', label:'照顧專員約訪' } // checkbox
        ]
      },

      /* H2 二、家訪日期 */
      {
        id:'h2-goals-homevisit', tag:'h2', label:'二、家訪日期',
        children:[
          { id:'h3-goals-homevisit-date', tag:'h3', label:'家訪日期' },
          { id:'h3-goals-prep-date',      tag:'h3', label:'出院日期' }
        ]
      },

      /* H2 三、偕同訪視者 */
      {
        id:'h2-goals-companions', tag:'h2', label:'三、偕同訪視者',
        children:[
          { id:'h3-goals-primary-rel',  tag:'h3', label:'主要照顧者關係' },
          { id:'h3-goals-primary-name', tag:'h3', label:'主要照顧者姓名' },
          { id:'h3-goals-extra-rel',    tag:'h3', label:'其他參與者關係' },
          { id:'h3-goals-extra-name',   tag:'h3', label:'其他參與者姓名' }
        ]
      },

      /* H2 四、個案概況（六大分項） */
      {
        id:'h2-goals-overview', tag:'h2', label:'四、個案概況',
        children:[

          /* H3 （一）身心概況：細化到 H5/H6，對齊現有 UI 群組 */
          {
            id:'h3-goals-s1', tag:'h3', label:'（一）身心概況',
            children:[

              /* 基本資料 */
              { id:'h4-goals-s1-basic', tag:'h4', label:'基本資料（年齡／性別／語言）' },

              /* 感官功能 */
              {
                id:'h4-goals-s1-sensory', tag:'h4', label:'感官功能',
                children:[
                  { id:'h5-goals-s1-vision',  tag:'h5', label:'視力' },
                  { id:'h5-goals-s1-hearing', tag:'h5', label:'聽力' }
                ]
              },

              /* 口腔與吞嚥 */
              {
                id:'h4-goals-s1-oral', tag:'h4', label:'口腔與吞嚥功能',
                children:[
                  { id:'h5-goals-s1-swallow',    tag:'h5', label:'吞嚥功能' },
                  { id:'h5-goals-s1-oral-teeth', tag:'h5', label:'口腔與牙齒' }
                ]
              },

              /* 移動功能 */
              {
                id:'h4-goals-s1-mobility', tag:'h4', label:'移動功能',
                children:[
                  { id:'h5-goals-s1-transfer', tag:'h5', label:'起身／移位能力' },
                  { id:'h5-goals-s1-walk',     tag:'h5', label:'行走與上下樓梯' },
                  { id:'h5-goals-s1-balance',  tag:'h5', label:'平衡程度' },
                  { id:'h5-goals-s1-sitting',  tag:'h5', label:'坐姿穩定性與輪椅安全' },
                  { id:'h5-goals-s1-gait',     tag:'h5', label:'步態' }
                ]
              },

              /* ADL */
              {
                id:'h4-goals-s1-adl', tag:'h4', label:'ADL（日常生活活動）',
                children:[
                  { id:'h5-goals-s1-adl-items', tag:'h5', label:'進食／盥洗／洗澡／穿脫衣／如廁清潔' }
                ]
              },

              /* IADL */
              {
                id:'h4-goals-s1-iadl', tag:'h4', label:'IADL（工具性日常活動）',
                children:[
                  { id:'h5-goals-s1-iadl-items', tag:'h5', label:'電話／購物／備餐／餐具清洗／家務／財務' }
                ]
              },

              /* 排泄功能 */
              {
                id:'h4-goals-s1-excretion', tag:'h4', label:'排泄功能',
                children:[
                  { id:'h5-goals-s1-urine-day',   tag:'h5', label:'日間排尿' },
                  { id:'h5-goals-s1-urine-night', tag:'h5', label:'夜間排尿' },
                  { id:'h5-goals-s1-nocturia',    tag:'h5', label:'夜尿次數' }
                ]
              },

              /* 健康與病史 */
              {
                id:'h4-goals-s1-health', tag:'h4', label:'健康狀況與病史',
                children:[
                  { id:'h5-goals-s1-dhx',        tag:'h5', label:'慢性病史' },
                  { id:'h5-goals-s1-surgery',    tag:'h5', label:'手術史' },
                  { id:'h5-goals-s1-allergy',    tag:'h5', label:'藥物過敏' },
                  { id:'h5-goals-s1-medication', tag:'h5', label:'現用藥物' },
                  { id:'h5-goals-s1-clinic',     tag:'h5', label:'固定就醫單位' },
                  { id:'h5-goals-s1-rx',         tag:'h5', label:'處方型態' },
                  { id:'h5-goals-s1-med-manage', tag:'h5', label:'用藥管理方式' },
                  { id:'h5-goals-s1-transport',  tag:'h5', label:'就醫交通方式' },
                  { id:'h5-goals-s1-devices',    tag:'h5', label:'管路／裝置' },
                  { id:'h5-goals-s1-disability', tag:'h5', label:'身心障礙資訊（唯讀同步）' }
                ]
              },

              /* 心理與行為 */
              {
                id:'h4-goals-s1-psych', tag:'h4', label:'心理與行為狀態',
                children:[
                  { id:'h5-goals-s1-emotion',  tag:'h5', label:'情緒狀態' },
                  { id:'h5-goals-s1-behavior', tag:'h5', label:'行為表現' },
                  { id:'h5-goals-s1-cognition',tag:'h5', label:'認知功能' },
                  { id:'h5-goals-s1-awareness',tag:'h5', label:'意識狀態' },
                  { id:'h5-goals-s1-sleep',    tag:'h5', label:'睡眠品質與原因' },
                  { id:'h5-goals-s1-daytime',  tag:'h5', label:'白天活動' },
                  { id:'h5-goals-s1-pain',     tag:'h5', label:'疼痛與強度／部位' },
                  { id:'h5-goals-s1-lesion',   tag:'h5', label:'皮膚病灶' }
                ]
              },

              /* 總結建議 */
              {
                id:'h4-goals-s1-summary', tag:'h4', label:'總結建議',
                children:[
                  { id:'h5-goals-s1-actions', tag:'h5', label:'建議措施' },
                  { id:'h5-goals-s1-notes',   tag:'h5', label:'補充內容' }
                ]
              }
            ]
          },

          /* H3 （二）經濟收入（依你要求完整 H3 之後層級） */
          {
            id:'h3-goals-s2', tag:'h3', label:'（二）經濟收入',
            children:[
              { id:'h4-goals-s2-sources',    tag:'h4', label:'主要經濟來源（多選）' },
              { id:'h4-goals-s2-id',         tag:'h4', label:'戶籍／福利身分' },
              {
                id:'h4-goals-s2-dis-level', tag:'h4', label:'身心障礙等級',
                children:[
                  { id:'h5-goals-s2-dis-cat',  tag:'h5', label:'身心障礙類別（條件顯示）' },
                  { id:'h5-goals-s2-dis-sync', tag:'h5', label:'跨段同步顯示（至身心概況）' }
                ]
              }
            ]
          },

          /* H3 （三）居住環境 */
          {
            id:'h3-goals-s3', tag:'h3', label:'（三）居住環境',
            children:[
              { id:'h4-goals-s3-type',          tag:'h4', label:'居住型態' },
              { id:'h4-goals-s3-own',           tag:'h4', label:'居住權屬' },
              { id:'h4-goals-s3-clean',         tag:'h4', label:'整潔度／異味' },
              { id:'h4-goals-s3-rent',          tag:'h4', label:'租賃細項（租金／管理費）' },
              { id:'h4-goals-s3-accessibility', tag:'h4', label:'無障礙設施' },
              { id:'h4-goals-s3-aids',          tag:'h4', label:'輔具' }
            ]
          },

          /* H3 （四）社會支持 */
          {
            id:'h3-goals-s4', tag:'h3', label:'（四）社會支持',
            children:[
              { id:'h4-goals-s4-primary',  tag:'h4', label:'主照者關係／姓名／同住' },
              { id:'h4-goals-s4-decider',  tag:'h4', label:'主要聯繫人／決策者' },
              { id:'h4-goals-s4-cocare',   tag:'h4', label:'共同照顧者（多筆）' },
              { id:'h4-goals-s4-formal',   tag:'h4', label:'正式資源（居服／日照／專業／交通／喘息／送餐）' },
              { id:'h4-goals-s4-informal', tag:'h4', label:'非正式資源（據點／鄰里／宗教／財團）' },
              { id:'h4-goals-s4-risk',     tag:'h4', label:'高風險評估' }
            ]
          },

          /* H3 （五）其他 */
          {
            id:'h3-goals-s5', tag:'h3', label:'（五）其他',
            children:[
              { id:'h4-goals-s5-background', tag:'h4', label:'成長背景／職業／習慣' }
            ]
          },

          /* H3 （六）複評評值 */
          {
            id:'h3-goals-s6', tag:'h3', label:'（六）複評評值',
            children:[
              { id:'h4-goals-s6-before', tag:'h4', label:'介入前' },
              { id:'h4-goals-s6-after',  tag:'h4', label:'介入後' }
            ]
          }
        ]
      },

      /* H2 五、照顧目標 */
      {
        id:'h2-goals-targets', tag:'h2', label:'五、照顧目標',
        children:[
          { id:'h3-goals-targets-problems', tag:'h3', label:'（一）照顧問題' },
          { id:'h3-goals-targets-short',    tag:'h3', label:'（二）短期目標（0–3 個月）' },
          { id:'h3-goals-targets-mid',      tag:'h3', label:'（三）中期目標（3–4 個月）' },
          { id:'h3-goals-targets-long',     tag:'h3', label:'（四）長期目標（4–6 個月）' }
        ]
      },

      /* H2 六、不一致原因說明 */
      {
        id:'h2-goals-mismatch', tag:'h2', label:'六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃',
        children:[
          { id:'h3-goals-mismatch-1', tag:'h3', label:'（一）目標達成的狀況以及未達成的差距' },
          { id:'h3-goals-mismatch-2', tag:'h3', label:'（二）資源的變動情形' },
          { id:'h3-goals-mismatch-3', tag:'h3', label:'（三）未使用的替代方案或是可能的影響' }
        ]
      }
    ]
  },

  /* =================== H1：計畫執行規劃 =================== */
  {
    id:'h1-exec', tag:'h1', label:'計畫執行規劃', page:'execution',
    children:[
      {
        id:'h2-exec-services', tag:'h2', label:'一、長照服務核定項目、頻率',
        children:[
          { id:'h3-exec-b',          tag:'h3', label:'（一）B碼' },
          { id:'h3-exec-c',          tag:'h3', label:'（二）C碼' },
          { id:'h3-exec-d',          tag:'h3', label:'（三）D碼' },
          { id:'h3-exec-ef',         tag:'h3', label:'（四）E.F碼' },
          { id:'h3-exec-g',          tag:'h3', label:'（五）G碼' },
          { id:'h3-exec-sc',         tag:'h3', label:'（六）SC碼' },
          { id:'h3-exec-nutrition',  tag:'h3', label:'（七）營養餐飲服務' },
          { id:'h3-exec-emergency',  tag:'h3', label:'（八）緊急救援服務' }
        ]
      },
      { id:'h2-exec-referral',        tag:'h2', label:'二、轉介其他服務資源' },
      { id:'h2-exec-station',         tag:'h2', label:'三、巷弄長照站資訊與意願' },      // 你在新版 HTML 已加入此區塊
      { id:'h2-exec-emergency-note',  tag:'h2', label:'四、緊急救援服務說明' },          // 新增說明區
      { id:'h2-exec-attachment2',     tag:'h2', label:'附件二（服務計畫明細）預覽' },    // 預覽區
      { id:'h2-exec-attachment1',     tag:'h2', label:'附件一：計畫執行規劃預覽' }       // 預覽區
    ]
  },

  /* =================== H1：其他備註 =================== */
  {
    id:'h1-notes', tag:'h1', label:'其他備註', page:'notes',
    children:[
      { id:'h2-notes-other', tag:'h2', label:'其他（個案特殊狀況或其他未盡事宜可備註於此）' }
    ]
  }
]);
```

### 檢核與維護流程

1. **程式碼變更審查**：任何會影響標題輸出的 PR，都必須附上以此規格為基準的檢查結果，逐一列出新增、刪除或改動的節點並說明調整理由。
2. **回歸測試**：執行 `applyAndSave(form)` 產生最新文件，確認輸出段落的標題階層與 `HEADING_SPEC` 完全一致，避免因模板或程式重構遺漏節點。
3. **版本同步**：若 `HEADING_SPEC` 有變動，請同步更新 `HEADING_SPEC_VERSION`，並在提交訊息與 `AGENTS.md` 的規範段落註記此次修改內容，方便後續追蹤。

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
| `AppCore.gs` | 入口流程、文件寫入、通用工具與人員名單查詢皆集中於此；`applyH1_*` 會透過 `renderSimpleTemplate` 套用模板字典輸出段落。亦提供 `getServiceCatalog()` 給前端取得服務資料。|
| `DataStore.gs` | 外部資源 ID、桃園市長照給付資料庫靜態表，以及 H1 段落所需的模板與詞彙表，供 `AppCore.gs` 與前端查詢。|
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
   - 使用者輸入資料時即時重組段落文字（特別是「(一)身心概況」等長段落），並以分段卡片呈現；可透過「只看變更」切換上一次提交與目前輸入的差異（資料存於 `localStorage` 的 `AA01.section1.previousSegments`）。
   - 送出前依序執行欄位驗證、跨欄位規則引擎（`FORM_RULES`）與樣式檢查器：規則可自動隱藏/清空/修正欄位並在必要時阻擋提交，樣式檢查器則檢查半形標點、連續空白等問題並以 Toast 告知。
   - 將所有欄位整合成 `form` 物件，呼叫 `applyAndSave(form)`。

3. **後端寫入** (`AppCore.gs`)
   - `applyAndSave` 先計算新檔名稱（`FNA1_YYYYMMDD_個案姓名_個管師姓名_V{版號}`），並以「個案×個管師」為唯一鍵遞增版號。
   - 於 `OUTPUT_FOLDER_ID` 指定的資料夾中，以 `TEMPLATE_DOC_ID` 為模板建立副本並開啟 Body。
   - `DOCUMENT_WRITERS` 依序呼叫 `applyH1_*` 函式處理各段落（邏輯集中於 `AppCore.gs`）：
    - `applyH1_CallDate` / `applyH1_VisitDate`：更新標題列文字或插入出院日期。
    - `applyH1_Attendees`：組出偕同訪視者句子（包含主照者、照專、其他參與者）。
    - `applyH1_CaseProfile`：依新版層級輸出「四、個案概況」，（一）身心概況細分為基本資料、感官功能、吞嚥與飲食、口腔／牙齒、疼痛與皮膚、移動功能、排泄與輔具、ADL、IADL、情緒與行為、醫療與用藥、睡眠與日間活動、管路／裝置、身障資訊、建議措施與補充；後續保留（二）經濟收入、（三）居住環境、（四）社會支持、（五）其他、（六）複評評值（含結構化預覽），必要時補上預設文字並同步更新唯讀欄位。
    - `applyH1_CareGoals`：寫入照顧問題、短/中期四格、長期目標。
    - `applyH1_MismatchPlan`：整合不一致原因與常用快捷語句。
   - 接著透過 `applyPlanExecutionPage` 與 `applyPlanServiceSummaryPage` 在文件結尾加入頁 2（計畫執行規劃）與頁 3（服務明細），自動插入分頁。
   - 完成後儲存關閉文件，回傳新檔資訊給前端。

4. **前端回饋**
   - 側欄顯示「已建立新檔並寫入內容」訊息並開啟新文件分頁。

---

## 介面重點說明（Sidebar.html）

* 側欄頂端提供「基本資訊／計畫目標／計畫執行規劃／其他備註」四個分頁與字級切換（A／A＋／A＋＋，對應 20px／約 24px／約 26px）。系統會記住使用者選擇並自動重新計算黏附元件與間距；螢幕高度小於 640px 時亦會自動壓縮 padding/gap 約 5–10%，避免畫面塞不下。完成「基本資訊」頁籤的必填欄位後，介面會自動帶入下一頁的「計畫目標」，縮短手動切換步驟。
* 每個段落標題列提供「只看未填」「顯示進階」「全部收合」三種控制。切換結果會寫入 `localStorage`，重新整理或返回表單後仍維持上一個選擇；行動端首次開啟預設啟用「只看未填」，減少滑動距離。
* **基本資訊 H1**：欄位改以 H2 標題呈現（單位代碼、個案管理師、個案姓名、照專姓名、CMS 等級），單位代碼仍決定個管師與照專名單。
* **計畫目標 H1**：電聯日期、家訪日期、偕同訪視者皆以 H2 區塊呈現，內層使用 H3 欄位；同頁的「四、個案概況」維持 H3 標題，方便捲動導覽。
* **（一）身心概況**：
  - H4/H5 重新分組：基本資料（年齡、性別、認知溝通、意識狀態）、感官功能（視力補充／眼鏡依從性、聽力狀態／助聽依從性）、吞嚥與飲食（吞嚥等級、症狀、飲食質地、管灌方式）、口腔／牙齒、疼痛與皮膚、移動功能、排泄與輔具、ADL、IADL、情緒與行為、醫療與用藥、睡眠與日間活動、管路／裝置、身障資訊（唯讀）、建議措施與補充。
  - 內建多層邏輯（視力、聽力、疼痛、皮膚病灶、ADL、睡眠等），透過即時組句產生段落。
  - 預覽區改為分段卡片，每段提供「回到來源欄位」捷徑，並可切換「只看變更」比較上一版內容。
  - `FORM_RULES` 描述跨欄位關係（例如夜間集尿袋與夜尿次數互斥、吞嚥與飲食質地矛盾），可隱藏欄位、清空輸入、顯示警告或阻擋提交。
  - `buildSection1Text_v2` 會根據輸入組成各段落文本並提供 diff 資訊給預覽卡片。
* **（二）~（四）**：經濟收入、居住環境、社會支持皆維持既有表單邏輯並組句；經濟收入段落同步設定身障等級／類別並回寫至「身心概況」的唯讀資訊。
* **(五)(六)**：其他與複評評值提供自由文字欄位，使用者可直接輸入或貼上內容。
* **正式資源（B 服務）**：日間照顧與 BD03 交通車會依 CMS 等級及桃園市給付額度自動推估每週/每月可使用次數、耗用點數與剩餘額度，並將建議文字同步至服務計畫與附件摘要。所有服務代碼在加入計畫時，側欄亦會套用對應的「使用方式」範本，讓填寫者僅需視個案微調敘述。月單位欄位新增 +1／+5／+10 以及清除快捷按鈕，行動裝置也能快速設定用量；在計畫執行規劃分頁中改以「服務類別」聚合卡呈現（如居家服務 B/C、專業服務 D…），同類型服務會自動合併於同一張卡片，方便一次檢視多個代碼。
* **照顧目標**：支援問題清單（最多 5 項）及短/中/長期目標；長期目標會彙整短中期欄位。
* **不一致原因與追蹤計畫**：常用快捷語句可勾選後自動附加在第三欄。
* **附件預覽（其他備註分頁）**：顯示計畫執行規劃文字及服務明細表，與輸出附件同步更新。服務明細會依類別聚合並依承接/指定單位合併列，同時提供「複製表格」與「複製為純文字」兩種按鈕，可直接貼到試算表或 Word；自費總額、動態 padding 與浮動按鈕高度也會隨視窗更新。
* **其他備註**：第三頁新增「其他備註」大欄位，可補充個案特殊狀況；內容會寫入附件三，未填寫時則在文件顯示「（未填寫備註）」提醒。
* **產出按鈕**：送出前進行欄位驗證並組成 `form` 物件，若樣式檢查器偵測到半形標點或異常空白會以提醒 Toast 阻擋提交。

### 預覽卡片、規則引擎與樣式檢查

* **分段預覽與差異比對**：`SECTION1_PREVIEW_META` 定義卡片順序與錨點。最新預覽結果儲存在 `section1PreviewState.segments`，成功送出後會序列化成 map 寫入 `localStorage`（key：`AA01.section1.previousSegments`），供「只看變更」模式比較上一版內容。若卡片僅顯示變更，可點右上角按鈕跳回對應欄位調整。
* **宣告式跨欄位規則**：`FORM_RULES` 位於 `Sidebar.html`，每條規則包含 `if` 條件陣列與 `then` 動作陣列。動作支援 `hide`（暫時隱藏）、`clear`（清空值）、`fix`（自動修正）、`warn`（顯示提醒 Toast）、`block`（標記為錯誤並阻擋提交）。`runSection1Rules()` 每次組句時執行，並在 UI 顯示警告或可點選的錯誤清單，新增規則時只需擴充 `FORM_RULES`。
* **樣式檢查器工作流程**：`STYLE_CHECK_FIELDS` 指定需檢查的輸出欄位；`runStyleChecker()` 會檢測連續空白、半形標點與標點前空格，一旦偵測會為欄位加上 `input-invalid` 標記並以 Toast 顯示提示。送出成功後 `clearStyleCheckerMarks()` 會移除標記，避免殘留紅框。

## 給付與防呆規則整理

以下依政策條文彙整服務代碼的額度、互斥與頻次限制，括號為來源頁碼，方便對照原始文件。

### 一、全域防呆規則（跨所有碼別）
* 額度不可互相流用：個人長照服務的 B/C（照顧與專業）與 D（交通）、E/F（輔具與居家無障礙）、G（喘息）額度彼此獨立，不得互挪；同屬第一款（B/C）下各目額度也不得互挪。（第 7 條、附表二、三；p.3、p.9–10）
* 發給週期與結餘：B/C、D 按月給付，未滿月比例計，結餘可自照顧計畫核定月起 6 個月內保留，期滿歸零；E/F 每三年給付一次；G 每年給付一次，且使用期間不得依其他法令申請相同性質補助。（p.5）
* 聘僱外籍看護之家戶限制：B/C 額度僅給付 30%，且原則限用 C 碼；例外放行到宅沐浴車 BA09/BA09a 以及社區式交通 BD03，仍受 30% 總額度限制。（p.4、p.20–21、p.35）
* 喘息服務（G 碼）排除條件：無家庭照顧者或已有其他法令補助臨時／短期照顧者，不得給付喘息額度。（p.4–5）
* 可臨時提供之 BA 碼：BA01、BA07、BA12、BA14、BA17a、BA17b、BA17c、BA17d1、BA17d2、BA23、BA24 可先行服務後補核；BA22 不得臨時提供。（p.7、p.27）
* 同時段不可重複申報原則：多數互斥指同一時段不得併報，或同日／同月限申報次數，詳各碼別條款。

### 二、AA 碼（照顧管理／政策加計）—互斥／上限
* AA01 與 AA02 同月不得併計；專任個管同月 120 組為準，可超額至 150 組但超額每組減付 10%。不扣額度、免部分負擔。（p.11–12）
* AA03：每一個 C 碼專業服務（不含 CC01）僅能申請一次，且該時段需同時提供限定 BA 碼之一。不扣額度、免部分負擔。（p.12–13）
* AA04：臨終日前後指定時點僅限申請一次。不扣額度、免部分負擔。（p.13）
* AA05：同服務單位對同個案每日限加計一次（不得加計於 BA16）。不扣額度、免部分負擔。（p.13–14）
* AA06：每日限一次，限搭配 BA01／BA07／BA12 指定情形。不扣額度、免部分負擔。（p.14–15）
* AA07：每月申請一次，限等級四級（含）以上並符合家庭條件。不扣額度、免部分負擔。（p.15）
* AA08 與 AA09：同日不得同時申請；同服務單位同個案一日限加計一次。不扣額度、免部分負擔。（p.15）
* AA10：夜間緊急服務一日為一給付單位。不扣額度、免部分負擔。（p.15）
* AA11：同一領有身障證明之對象每日只限申請一次（居家式與社區式可分別計一次）。不扣額度、免部分負擔。（p.16）
* AA12：每年上限二次（每 6 個月一次）。不扣額度、免部分負擔。（p.16–17）

### 三、BA 碼（居家照顧）—互斥／上限
* BA01：原則每日 1 組，必要時早晚各 1 組；同一時段不得與 BA07、BA23 併報。可臨時提供。（p.17）
* BA02：每 30 分鐘 1 單位，單日上限 3 小時；不得與其他組合併用。（p.17–18）
* BA03：不得僅作為他項服務前後之觀察；無日上限明文。（p.18）
* BA04：每餐 1 組。（p.18）
* BA05：在家備餐每次 1 組；一日管灌備餐 1 組；同住個案共用時僅擇一人扣 B/C 額度與部分負擔。（p.18–19）
* BA07：同時段不得與 BA01、BA23 併報；可臨時提供。（p.19）
* BA08：無頻次上限明文；提供者需符合資格限制。（p.19–20）
* BA09／BA09a：外籍看護之家戶與中低收特照津貼對象可使用（例外於第 10 條），並有團隊規模要求。（p.20–21）
* BA10：完整一次為一單位。（p.21）
* BA11：完整一次為一單位。（p.21）
* BA12：不得用於電梯／爬梯機／樓梯升降椅；問題清單須含「移位」或「上下樓梯」；可臨時提供。（p.21–22）
* BA13：每 30 分鐘 1 單位；符合 BA12 條件時得併用。（p.22）
* BA14：不適用於定期復健或透析；出門起 1.5 小時內用本碼，逾 1.5 小時改依實際時數用 BA13；可臨時提供。（p.22–23）
* BA15：每 30 分鐘 1 單位；共用區域僅給付 50%，其餘自付；同住多個案住同一臥室僅擇一人扣額度；獨居定義明確。（p.23–24）
* BA16：距離 5 公里內適用；含家人物品則僅給付 50%；超距離費用自付。（p.24）
* BA17a：每日上限 3 組，可與 BA17b 同時加計；可臨時提供。（p.24–25）
* BA17b：每日上限 3 組；可臨時提供。（p.25）
* BA17c：每週上限 7 組；可臨時提供。（p.25–26）
* BA17d1：每日上限 1 組；可臨時提供。（p.26）
* BA17d2：每週上限 3 組，特殊情況得專案增次；可臨時提供。（p.26）
* BA17e：每週上限 1 組。（p.26）
* BA18：不得與任何其他組合同時段使用（可接續）。（p.26）
* BA20：不得與任何其他組合同時段使用（可接續）。（p.27）
* BA22：不得搭配其他照顧組合；服務時段 06:00–20:00 至少三次；非此時段依審核得加計 AA08；不得臨時提供。（p.27）
* BA23：同時段不得與 BA01、BA07 併報；可臨時提供。（p.27–28）
* BA24：若在 BA01／BA07 過程中執行，不得另計；可臨時提供。（p.28）

### 四、BB（日間照顧）與 BC（家庭托顧）—互斥／上限
* 全日（BB01/03/05/07/09/11/13；BC01/03/05/07/09/11/13）：一日為一單位；交通另計（D 碼或 BD03）。（p.28–34）
* 半日（BB02/04/06/08/10/12/14；BC02/04/06/08/10/12/14）：半日為一單位，同日不得申請兩次；交通另計。（p.28–34）

### 五、BD 碼（社區式補充）
* BD03：住家與機構距離 ≤10 公里方適用（超距離自付）；每趟 1 單位；須職業駕照駕駛；外籍看護之家戶可使用。（p.34–35）
* BD01／BD02：未見額外互斥或頻次上限明文。（p.34）

### 六、C 碼（專業服務）—互斥／上限
* CA07：3 次（含評估）= 1 單位。（p.35–38）
* CA08：4 次（含評估與 ISP 擬定）= 1 單位。（p.35–38）
* CB01：4 次（含評估）= 1 單位；CB02：6 次；CB03：3 次；CB04：6 次。（p.35–38）
* CC01：2 次（含評估）= 1 單位；所需輔具／空間修繕另依 E／F 碼計。（p.35–38）
* CD02：3 次（含評估）+ 1 次評值 = 1 單位。（p.35–38）

### 七、D 碼（交通接送）
* DA01：每次 1 單位；就醫轉乘／接駁經地方政府核認後，起迄任一端不必限於居家或院所；支付價格由所在地主管機關公告；駕駛須職業駕照。（p.38–39、p.7、p.19）

### 八、G 碼（喘息服務）
* GA09 居家喘息：2 小時 = 1 單位；單日上限 10 小時；如有陪同就醫可加計 BA14。（p.40）
* GA03／GA04／GA05／GA06／GA07：單位別（全日、半日、夜間、每小時）含交通接送；GA05（機構住宿式）1 日（24 小時）= 1 單位；GA06 夜間定義 18:00–翌日 08:00。另依第 11 條排除條件執行互斥。（p.39–40、p.4–5）

### 九、E 碼（輔具）—互斥／上限（租賃單位／最低使用年限／擇一／依附關係）
* 整體額度：每三年一次；與身障輔具補助互斥，相同項目且未達最低使用年限者不得重複申請。（第 10 條第 2 項、p.4–5、p.41–60）
* 通則：可租賃者皆以 1 月為租賃單位（未滿月比例計）；EG01/EG02、EC03 等註明「免部分負擔」；各碼頁列出最低使用年限（多為 2–10 年）。（各碼頁）
* EA01：限購置，最低使用年限 3 年。（p.41）
* EB01／EB02：單支柺杖限購置，可核給雙側，年限 5／3 年。（p.41）
* EB03：助行器限購置，年限 3 年。（p.41）
* EB04：助步車可租賃或購置，租賃以月計，年限 3 年。（p.41–42）
* EC01／EC02／EC03：輪椅 A/B/C 三擇一；EC02 可租賃（月租），EC03 免部分負擔，年限 3 年。（p.42–43）
* EC04～EC06：輪椅附加功能 A/B/C 可租賃（月租），必須搭配 EC02 或 EC03 同時申請，年限 3 年。（p.43–44）
* EC07～EC10：擺位系統 A–D 限購置；EC07 與 EC08 擇一；單支側支撐架補助減半；年限 3 年。（p.44–45）
* EC11／EC12：電動輪椅與電動代步車二擇一，皆限租賃（月租）。（p.45–46）
* ED01～ED06：移位腰帶／板／吊帶／滑墊／轉盤限購置，年限 3–5 年。（p.46–48）
* ED07：移位機可租賃（月租）或購置，年限 10 年，含吊帶。ED08 吊帶限購置，僅適用於購置 ED07 滿 3 年之更換，年限 3 年。（p.48–49）
* EE01～EE05：電話擴音、閃光／震動警示、火警、門鈴等限購置，年限 5 年。（p.49）
* EF01～EF03：衣著／生活／飲食用輔具限購置，年限 3 年。（p.49–50）
* EG01／EG02：氣墊床 A/B 可租賃或購置，免部分負擔，年限 3 年。（p.50–51）
* EG03～EG09：輪椅座墊 A–G 限購置，多數免部分負擔，年限 2–5 年。（p.51–52）
* EH01：居家用照顧床可租賃或購置，年限 5 年。EH02／EH03 附加功能需搭配 EH01 同時申請；EH04／EH05 為爬梯機（每趟或月租）。（p.52–54）

### 十、F 碼（居家無障礙環境改善）—互斥／上限
* 整體額度：每三年一次；多屬限購置，常以單處或尺寸計價；最低使用年限多為 10 年（少數 3 年）。（p.5、p.54–60）
* FA01：扶手每 10 公分補助 150 元，年限 10 年。（p.54–55）
* FA02：可動式扶手按單支計價，年限 10 年。（p.55）
* FA03～FA05：非固定式斜坡板 A/B/C，年限 10 年。（p.55）
* FA06：固定式斜坡道，年限 10 年。（p.55–56）
* FA07：架高式和式地板拆除，年限 10 年。（p.56）
* FA08：反光貼條或消光／止滑，單處計價，年限 3 年。（p.56）
* FA09：隔間每平方公尺 600 元，年限 10 年。（p.57）
* FA10：防滑措施，單處計價，年限 10 年。（p.57）
* FA11／FA12：同一處門改善僅能擇一款（A 或 B），年限 10 年。（p.57–58）
* FA13：水龍頭，單處計價，年限 10 年。（p.58）
* FA14～FA21：浴缸、洗臉台、馬桶、壁掛式淋浴椅、流理台、抽油煙機位置、特殊洗槽／浴槽等，單處計價，年限 10 年。（p.58–60）

### 十一、常見「同時段互斥／疊代」對照（程式必設的衝突集）
* 同時段互斥組合：
  - BA01 ↔ BA07／BA23
  - BA07 ↔ BA01／BA23
  - BA23 ↔ BA01／BA07
  - BA18、BA20：與所有其他 BA 同時段互斥（可接續）
  - AA08 ↔ AA09：同日互斥（僅能擇一加計一次）
  - BA22：與所有其他 BA 互斥
  - BA24：若在 BA01／BA07 進行中不得另計
  - EC01／EC02／EC03：三擇一
  - EC11 ↔ EC12：二擇一
  - EC07 ↔ EC08：二擇一
  - EH02／EH03：必須依附 EH01 同時申請
  - AA01 ↔ AA02：同月互斥

### 十二、可直接落實的「防呆機制與連動」建議（邏輯清單）
* 時間衝突檢核：
  - 建立「同時段互斥集合」包含 (BA01,BA07)、(BA01,BA23)、(BA07,BA23)、BA18 全互斥、BA20 全互斥、BA22 全互斥、AA08 與 AA09 同日互斥。若有重疊區間則擋案。
* 日／週／月上限：
  - BA02 ≤ 3 小時／日；BA17a ≤ 3 組／日；BA17b ≤ 3 組／日；BA17c ≤ 7 組／週；BA17d1 ≤ 1／日；BA17d2 ≤ 3／週（可專案放寬）；BA17e ≤ 1／週；GA09 ≤ 10 小時／日，超過即退件。
* 事件型上限：
  - BA01 原則 1 組／日（可早晚各 1）；BA04 每餐 1 組；BA05 在家備餐每次 1 組／一日管灌備餐 1 組；BA10/11 完整一次 1 單位；BB/BC 半日同日不得二次；GA05 1 日為 1 單位。
* 條件式開關：
  - BA12 需問題清單含「移位」或「上下樓梯」，且未使用電梯／爬梯機／樓梯升降椅。
  - BA14 超過 1.5 小時自動改以 BA13 補差；復健／透析請改走 D 碼與 BA13 等其他代碼。
  - BA15 共用區域自動 50% 給付；BA16 超 5 公里自付差額。
* AA 加計互斥與次數：
  - AA01/AA02 同月互斥；AA08 與 AA09 同日互斥且每日限加計一次；AA07 每月一次；AA11 每日一次（居家式與社區式各計）。
* 聘僱外籍看護自動限縮：
  - B/C 總額度上限 30%；預設僅允許 C 碼，但放行 BA09/BA09a、BD03 例外；結帳時阻擋其他 BA 碼。
* 喘息（G）排他：
  - 若無家庭照顧者或已領受他法同質臨托／短期照顧，阻擋 G 碼。
* 額度週期與結餘：
  - B/C、D 月度結餘保留 6 個月；E/F 三年一次；G 一年一次。期滿自動歸零；複評升／降等依第 13 條從優生效日處理結餘。
* 輔具互斥與依附：
  - EC01/02/03 三擇一；EC11/EC12 二擇一；EC07/EC08 二擇一；EC04～EC06 必須搭配 EC02 或 EC03；EH02/EH03 必須搭配 EH01。
  - 與身障輔具補助重疊檢核：相同項目且未達最低使用年限則阻擋。

---

## 常見維護與擴充建議

* 新增段落：在 `AppCore.gs` 中新增對應的 `applyH1_NewSection(body, form)`，並於 `DOCUMENT_WRITERS` 中按段落順序呼叫。
* 調整輸出格式：優先修改 `AppCore.gs` 內對應的 `applyH1_*` 段落，必要時更新同檔案中的共用工具函式；若涉及固定句構或詞彙，請同步調整 `DataStore.gs` 的 `H1_*` 模板字典後再套用。
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
