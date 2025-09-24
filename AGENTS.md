# AGENTS 指南（強化版）

本檔案為 `/workspace/AA01` 專案的開發規範。所有在此資料夾內進行的修改（含程式、樣式、文件）皆需遵循以下指引。

## 專案定位與整體原則
- 這是一個綁定 Google 文件的 Google Apps Script（GAS）專案，目的為協助長照計畫文件的批次填寫與產出。
- GAS 執行環境無法使用 npm 或第三方函式庫，請以平台原生 API（DocumentApp、DriveApp、SpreadsheetApp 等）完成需求。
- 側欄前端必須維持 ES5/ES6 基礎語法，確保能在 Google Docs HtmlService 中執行。
- 所有輸出 Google 文件的函式應接收 Document Body 與表單資料物件，避免直接存取 UI 元件。

## 檔案職責
| 檔名 | 職責說明 |
| ---- | -------- |
| `AppCore.gs` | 進入點腳本，負責建立自訂功能表、開啟 `Sidebar.html`，並串接核心流程（例如 `applyAndSaveAA01(data)`／舊別名 `applyAndSave(form)`）。 |
| `DataStore.gs` | 提供資料存取與快取邏輯，例如外部表單、名單或設定值的讀寫。不得混入畫面控制或檔案複製邏輯。 |
| `Sidebar.html` | 側欄前端，包含 HTML/CSS/原生 JavaScript，負責輸入介面、表單驗證與與 GAS 後端互動。 |
| `README.md` | 維護專案說明、環境設定、操作流程與重要變更紀錄。任何功能調整都需同步更新。 |
| `桃園市_長照給付資料庫_v1.xlsx` | 參考資料或匯入清單，請勿直接在程式中硬編列。必要時應透過 `DataStore.gs` 讀取。 |

> 若日後新增 `.gs` 檔案，請依段落或模組職責拆分，檔名以 `H1_*` 或對應功能命名，並在此表格補上職責說明。

## 目錄結構與命名
- 所有段落邏輯請維持單一責任，避免出現大型多段落函式。
- 共用工具或常數請分別放在 `Utils.gs` 與 `Constants.gs`（若檔案不存在請建立），統一管理。
- 新增檔案時須比照既有檔案使用 2 空格縮排、駝峰式命名，以及 `applyH1_*` 函式命名規則。

## 提交前檢查
1. 確認無暫時性程式碼（`Logger.log`、`console.log`、註解掉的測試片段）。
2. 文件類調整需同步更新 `README.md` 的對應段落（環境設定、運作流程或介面說明）。
3. 檢查程式縮排為 2 空格，且遵守 GAS 支援語法（避免使用 `async/await`、`Proxy` 等高階特性）。
4. 若調整檔案職責或流程，記得更新本檔案的對應段落。
5. 透過 Google Apps Script IDE 實際執行一次主流程（`applyAndSaveAA01` 或相關觸發函式），確認產出無誤。

## Git 協作與提交規範
- **分支策略**：採用 GitHub Flow。每項需求或修正建立 `feature/<summary>`、`fix/<summary>` 或 `docs/<summary>` 分支；完成後發送 PR，待審核者核准後由作者自行合併。
- **同步主幹**：開發期間請定期以 `git fetch` 與 `git rebase origin/main`（或 `pull --rebase`）保持分支最新，降低衝突。
- **PR 要求**：PR 描述需列出變更摘要、測試或驗證結果、影響範圍與回滾方式，並在必要時附上側欄畫面或輸出文件截圖。

### Commit 訊息格式
- 採用 `<type>: <summary>` 結構，`<type>` 建議使用 `feat`、`fix`、`docs`、`refactor`、`chore` 等小寫祈使句，摘要字數控制在 72 字元以內。
- 需要關聯 Issue 時在訊息末段以 `Refs #123` 或 `Fixes #123` 註記；多個 Issue 以空白分隔。
- 單一 commit 專注一項邏輯變更，若包含文件更新請視情況拆出 `docs:` commit，方便回溯。

### Issue 與 PR 模板
- Issue 請使用 `.github/ISSUE_TEMPLATE/bug_report.md`、`feature_request.md`（若尚未建立模板，提交時亦需包含「摘要、重現步驟、預期結果、實際結果、影響範圍」欄位）。
- PR 請使用 `.github/pull_request_template.md`，至少說明「變更摘要、測試結果、相關 Issue、風險與回滾計畫」。若尚未建置模板，請在 PR 內手動提供上述資訊。

## 程式碼風格與資訊安全擴充
- **JavaScript / Apps Script**：維持 2 空格縮排與駝峰式命名；避免使用 GAS 不支援的語法。提交前可執行 `npm exec prettier --write` 與 `npm exec eslint --fix`（若在本地環境配置對應設定）。
- **HTML**：屬性使用雙引號並依語意排序（ID、class、data-*、aria-*、其他屬性）；標籤閉合完整，巢狀層級以 2 空格縮排。
- **CSS**：採用 `kebab-case` 類別命名，屬性順序建議依布局（display → position → box model → 排版 → 視覺）。可使用 Prettier 或 Stylelint 自動化格式化。
- **Markdown / 文件**：標題階層從 `#` 開始遞增，不跳級；表格需留空白行區隔，列表維持一致縮排。
- **敏感資訊保護**：禁止提交真實個案資料、身分證號、API 金鑰或未公開的雲端連結。若需示範資料，請以匿名化內容取代，並確認 Logs、測試檔案未遺留個資。
- **審查重點**：Code Review 時需再次確認提交未包含個資、授權截圖等敏感資訊，並確保 README 的安全性提示與實作同步。

## 測試策略
- **核心流程測試**：於 Apps Script IDE 手動執行 `applyAndSaveAA01(data)`（或舊別名 `applyAndSave(form)`），使用最小與完整的表單資料，確認文件複製、命名與內容寫入皆成功。
- **資料來源驗證**：如果有對 `DataStore.gs` 的調整，需確認外部資源（Google Sheet、SpreadsheetApp 等）權限正確，並以測試資料跑過一次讀寫。
- **錯誤處理檢查**：刻意提供缺漏欄位或錯誤格式，確保前端提示與後端防呆邏輯正常。
- **回歸測試**：針對受影響的段落函式（例如 `applyH1_*`），再次執行並比對輸出段落是否維持原本格式與占位符替換。

## 行動端驗收
- 於 Google Docs 行動版或瀏覽器的行動模擬模式中開啟文件，確認自訂側欄可正確載入與操作。
- 驗證輸入欄位在狹窄螢幕下仍可閱讀與操作，必要時調整 `Sidebar.html` 之 CSS。
- 測試表單提交流程，確保 Toast 或提示訊息在行動裝置上不會被遮蔽。
- 如需上傳或選擇檔案，請確認觸控操作與權限流程在行動端行得通。

## 文件維護準則
- 重大功能新增、欄位變更或流程異動，必須更新 `README.md` 並在最上方加註「更新日期」。
- 若有外部依賴（例如雲端硬碟範本、第三方 API），請於 README 的環境設定段落補充取得方式與權限需求。
- 圖片或附件應存放於專案內適當目錄，並在 README 中提供說明或連結。

## HEADING_SPEC 版本控管與審查流程
- 所有標題階層的增減都必須對應到下列 `HEADING_SPEC`，並於程式碼審查中逐項對照，避免側欄或輸出文件遺漏章節。調整任一節點時請同步更新 `HEADING_SPEC_VERSION`。

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

- **審查重點**：
  1. PR 審核者需逐一比對調整前後的 `HEADING_SPEC`，確認章節未被誤刪或遺漏，並在評論中記錄比對結果。
  2. 任何影響標題輸出的修改必須附上最新產出的文件截圖或段落節點比對結果，證明階層仍與規格一致。
  3. 若 `HEADING_SPEC` 發生變動，請同時更新 `README.md` 的對應段落並在提交訊息內描述異動原因，以利追蹤。

## Codex 任務塊
- 當任務中提供「Codex 指令」或特定 Markdown 區塊時，請完整複製內容，不得自行增刪。
- 若任務要求新增或覆蓋檔案，務必使用對應檔名並確認內容無遺漏。
- 所有指令完成後須使用題示的 Commit 訊息，並在必要時補充 PR 說明。
- 進行多步驟任務時，建議在本檔案或 README 記錄注意事項，避免後續貢獻者遺忘。

## 版本與責任
- 修改本檔案後請立即 Commit，確保規範變動可追蹤。
- 若與實際流程不符，應優先同步修正，避免造成誤導。
- 對於跨檔案影響的需求，請於 Commit 訊息中清楚敘述範圍與目的。

感謝協助維護本專案！
