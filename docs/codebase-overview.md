# AA01 程式碼總覽

本文整理 `/workspace/AA01` 儲存庫目前所有檔案與其責任，協助快速理解專案架構、測試流程、部署腳本與參考資料。內容依目錄分區列出每個檔案功能、與其他模組的關聯，以及需要注意的維運重點。

## 1. 專案整體概述

- **專案定位**：AA01 為 Google Apps Script（GAS）建置的 Google Docs 附加元件，提供長照個管師在側欄填寫表單後，自動生成計畫書文件。【F:README.md†L1-L16】
- **主要流程**：`AppCore.gs` 建立自訂功能表與側欄、處理 Web App 健康檢查路由，透過 `applyAndSave` 複製模板、執行多個段落寫入函式，再回傳新檔資訊。【F:src/AppCore.gs†L15-L186】
- **資料來源**：`DataStore.gs` 定義模板、輸出資料夾與名單試算表的 ID，並提供段落模板與桃園市長照給付資料庫靜態資料供側欄與文件寫入共用。【F:src/DataStore.gs†L9-L140】
- **前端介面**：`Sidebar.html` 內含整體 UI、RWD CSS 變數、側欄導覽與表單結構，支援桌機與行動裝置並提供多處可測試的 data-testid。【F:src/Sidebar.html†L1-L200】
- **測試矩陣**：透過 Jest + jest-axe 檢查表單可達性、Playwright 覆蓋本地 HTML 與遠端 Web App、pa11y 進行自動化無障礙掃描、`health-check.mjs` 檢查部署網址 HTTP 回應。【F:package.json†L6-L36】【F:scripts/health-check.mjs†L1-L64】
- **部署腳本**：`gas-deploy.mjs` 支援 Service Account JSON、OIDC 或 OAuth refresh token，將 `src/` 中 Apps Script 檔案打包後呼叫 Script API 建立版本與部署；`get-refresh-token.mjs` 協助取得 OAuth refresh token。【F:gas-deploy.mjs†L1-L170】【F:get-refresh-token.mjs†L1-L120】

## 2. 根目錄與一般文件

- `AGENTS.md`：定義整個儲存庫的開發規範、指令優先序、自動修復流程與 HEADING_SCHEMA 審查要求。【F:AGENTS.md†L1-L187】
- `README.md`：專案說明、環境設定、測試/部署指令、CI 需求、HEADING_SCHEMA 詳細規格與常見問題排除步驟。【F:README.md†L1-L240】
- `CHANGELOG.md`：2025-09-30 版本的新增/變更/移除項目，記錄依賴升級與 README 更新。【F:CHANGELOG.md†L1-L16】
- `CODEX_TESTING_ISSUES.md`：說明無法在本地容器執行自動測試的原因（GAS 依賴、硬編資源 ID、缺乏測試腳本等），供診斷使用。【F:CODEX_TESTING_ISSUES.md†L1-L27】
- `outdated.json`：`npm outdated` 產出示例，目前只剩 `@google/clasp` 需 major 升級評估。【F:outdated.json†L1-L7】
- `aa01_ui_code_audit_suspicious.csv`：UI 稽核工具輸出的可疑 ID 與 CSS 使用狀態列表，標記未使用/重複 ID 等問題以利整理。【F:aa01_ui_code_audit_suspicious.csv†L1-L30】
- `clasprc_base64.txt`：保存 `.clasprc.json` 的 Base64 字串範例，供部署流程或秘密管理參考。【F:clasprc_base64.txt†L1-L8】
- `桃園市_長照給付資料庫_v1.xlsx`：桃園市長照給付資料庫原始試算表，對應 `DataStore.gs` 中的靜態 JSON 內容（僅供參考，程式未直接讀取）。
- `新增 文字文件.txt`：空白占位檔，可刪除或作為測試用途。

## 3. `src/` 目錄（Apps Script 核心）

- `AppCore.gs`
  - 建立 Docs 自訂功能表與側欄 (`onOpen`、`showSidebar`)。【F:src/AppCore.gs†L15-L33】
  - `doGet` 提供 Web App 入口與 `/route=health` 健康檢查回應，失敗時回傳 JSON 便於診斷。【F:src/AppCore.gs†L35-L60】
  - `DOCUMENT_WRITERS` 與 `runDocumentWriters` 管理多個段落寫入函式，逐一處理 H1 標題、執行計畫與備註頁面。【F:src/AppCore.gs†L88-L118】
  - `buildDocumentNaming` 依個案與個管師組合產生檔名並呼叫 `computeNextVersionByKey` 計算版號；`createDocumentFromTemplate` 複製模板檔案。【F:src/AppCore.gs†L120-L160】
  - `renderSimpleTemplate`、`resolveTemplateValue`、`replaceAfterHeadingColon` 等輔助函式處理模板文字、定位段落、插入多行內容，後續區塊則涵蓋 H1~H3 各段落寫入規則與附件頁面處理。
  - 各 `applyH1_*` 函式整合 `DataStore.gs` 常數，例如使用 `H1_TEMPLATES` 填入電聯日期、家訪日期附註、訪談成員列表、個案概況分段內容與照顧目標選項，並根據表單欄位在文件中插入段落或表格。
- `DataStore.gs`
  - 集中管理 GAS 模板/資料夾/名單的檔案與工作表 ID；提供 `H1_TEMPLATES`、`H1_CASE_PROFILE_SECTIONS` 等常數供 `AppCore.gs` 使用。【F:src/DataStore.gs†L9-L85】
  - 定義照顧問題字典、目標分類對應、段落標題變體與桃園市長照給付額度表，供側欄選單與段落輸出統一格式。【F:src/DataStore.gs†L87-L172】
  - `TAOYUAN_LTC_DATA` 包含需求等級補助上限、交通補助分類與其他靜態表格資料，未直接與邏輯綁定但保留在程式內作為查詢來源。【F:src/DataStore.gs†L174-L250】
- `Main.gs`：占位函式 `hello()`，在 GAS 環境中可做為簡單示範或測試入口。【F:src/Main.gs†L1-L3】
- `Sidebar.html`
  - HTML `#appMain` 包含分頁導覽、基本資料表單、訪談紀錄、照顧目標設定等結構；大量使用 `data-testid` 便於測試定位。【F:src/Sidebar.html†L1-L200】
  - CSS 透過自訂變數、媒體查詢與 `clamp` 調整桌機/行動版排版，處理側欄抽屜、固定工具列、欄位網格等 RWD 行為。
  - 內嵌 JavaScript 管理表單互動（如快速跳頁、檢核狀態區塊、下載附件等），並透過 `google.script.run` 與後端互動（檔案未完全列出，但多數邏輯在後段）。
- `appsscript.json`：Apps Script manifest，設定時區、例外紀錄與 Web App 執行權限（僅限網域使用者，執行身分為部署者）。【F:src/appsscript.json†L1-L8】

## 4. `scripts/` 目錄（Node 工具）

- `url-helper.mjs`：提供 URL 驗證與組裝 (`assertHttpBase`、`normalizePath`、`buildTargetURL`)，並具備寫出 JSON 工具 `safeWriteJson`，供健康檢查、Playwright 與 workflow 共用。【F:scripts/url-helper.mjs†L1-L63】
- `url-helper.d.ts`：對應 `url-helper.mjs` 的 TypeScript 宣告檔，讓 Jest/Playwright 測試可使用型別推斷。【F:scripts/url-helper.d.ts†L1-L7】
- `auto-repair.mjs`：重試指令工具，可設定主要指令、驗證指令、最大重試次數與退避秒數，並具備智慧停損（重複錯誤簽章即終止）。【F:scripts/auto-repair.mjs†L1-L98】
- `health-check.mjs`：讀取 `GAS_WEBAPP_URL` 與 `E2E_PATH`，組合目標網址後進行 fetch（支援 ProxyAgent 與隧道失敗回退），接受 200 或 3xx；會輸出 `artifacts/health-url.json`、`artifacts/health.json` 供 CI 分析。【F:scripts/health-check.mjs†L1-L64】
- `run-pa11y.mjs`：載入 `.env` 後決定掃描目標（遠端部署或本地 HTML），以 pa11y 依 WCAG 2.0 AA 檢測無障礙問題並列出違規清單。【F:scripts/run-pa11y.mjs†L1-L34】

## 5. `__tests__/` 目錄（Jest 測試）

- `sample.test.ts`：驗證 `fixtures/basic-form.json` 提供的基本欄位結構，做為 smoke 測試基礎。【F:__tests__/sample.test.ts†L1-L17】
- `fixtures/basic-form.json`：最小化表單 JSON 固定資 料，用於測試與樣本輸出。【F:__tests__/fixtures/basic-form.json†L1-L5】
- `a11y/sidebar-a11y.test.ts`：載入 `Sidebar.html`，以 jest-axe 檢查基本資料區塊與側欄導覽的無障礙違規。【F:__tests__/a11y/sidebar-a11y.test.ts†L1-L25】
- `scripts/url-helper.test.ts`：涵蓋 `assertHttpBase`、`normalizePath`、`buildTargetURL`、`safeWriteJson` 的錯誤處理與路徑標準化邏輯。【F:__tests__/scripts/url-helper.test.ts†L1-L42】

## 6. `playwright/` 目錄（E2E 測試）

- `utils/openPage.ts`：統一根據 `E2E_TARGET` 決定本地或遠端載入 `Sidebar.html`，並確保遠端網址不重複 `/exec`、登入態有效且側欄節點可見。【F:playwright/utils/openPage.ts†L1-L39】
- `ui.spec.ts`：針對本地 HTML 的 RWD 與互動測試（欄位網格列數、側欄抽屜、關係選單 optgroup、必填欄位狀態順序等）。【F:playwright/ui.spec.ts†L1-L88】
- `remote.spec.ts`：遠端部署 smoke，需 `HAS_AUTH=true` 才會執行；檢查桌機/平板/手機的側欄顯示、抽屜切換與 contact visit grid 呈現。【F:playwright/remote.spec.ts†L1-L49】
- `playwright.config.mjs`：共用設定（多裝置專案、輸出目錄、trace/screenshot 行為），並在遠端模式下呼叫 `buildTargetURL` 取得基準網址。【F:playwright.config.mjs†L1-L37】

## 7. `test/` 目錄（Jest 設定）

- `setup-tests.cjs`：載入 `@testing-library/jest-dom` 並將 jest-axe `toHaveNoViolations` matcher 加入預設 expect。【F:test/setup-tests.cjs†L1-L7】
- `setup-tests.d.ts`：補充 `toHaveNoViolations` 的 TypeScript 宣告，避免測試編譯警告。【F:test/setup-tests.d.ts†L1-L9】

## 8. `docs/` 與 `reports/` 目錄

- `docs/upgrade-plan.md`：2025-09-30 升版計畫，含過時套件盤點、分批策略、風險評估與驗證/回滾策略建議。【F:docs/upgrade-plan.md†L1-L63】
- `docs/upgrade-report.md`：對應升版成果報告，列出升級前後版本、測試結果與後續建議。提供高風險項目描述與 CI 驗證清單。【F:docs/upgrade-report.md†L1-L36】
- `reports/round-0~5/summary.md`：多輪程式碼審核或基線評估紀錄，包含指令執行情形、失敗原因與下一步建議。例：Round 0 指出 typecheck、Playwright、coverage 等主要缺口。【F:reports/round-0/summary.md†L1-L32】

## 9. 專案設定與工具鏈

- `package.json`：定義 npm 指令、lint-staged 規則、開發相依與 overrides；測試流程涵蓋 lint、Jest、Playwright、pa11y、健康檢查與 predeploy 檢查。【F:package.json†L1-L38】
- `package-lock.json`：鎖定 npm 相依版本，確保 CI 與本地環境一致。
- `tsconfig.test.json` / `tsconfig.json`：採 NodeNext 模組解析，納入 `__tests__/`、`test/`、`playwright/` 與 `src/utils/`，並關閉 emit；根 `tsconfig.json` 單純延伸測試設定。【F:tsconfig.test.json†L1-L15】【F:tsconfig.json†L1-L3】
- `jest.config.cjs`：主 Jest 設定，使用 jsdom 環境、ts-jest ESM 轉換、coverage 收集規則與測試啟動檔案。【F:jest.config.cjs†L1-L30】
- `jest.config.js`：簡化版本（Node 環境、無轉換），可提供部分外部腳本或工具需求。【F:jest.config.js†L1-L6】
- `eslint.config.js`：ESLint flat config，整合 TypeScript、Jest、Playwright 規則與忽略目錄設定。【F:eslint.config.js†L1-L45】
- `prettier.config.cjs`：Prettier 格式化偏好（100 字寬、2 空格、單引號、忽略 HTML 空白敏感度）。【F:prettier.config.cjs†L1-L9】
- `depcheck.config.cjs`：Depcheck 設定特殊解析器與忽略清單，避免誤報常用工具。【F:depcheck.config.cjs†L1-L15】
- `knip.json`：Knip 靜態分析忽略清單（特定腳本與相依）。【F:knip.json†L1-L8】
- `eslint.config.js`、`knip.json`、`depcheck.config.cjs` 等共同維持靜態分析與依賴掃描的一致性。
- `gas-deploy.mjs`、`get-refresh-token.mjs` 位於根目錄，負責部署與授權流程（詳見第 4 節）。
- `scripts/`、`playwright/`、`test/` 等目錄結合 `package.json` 的 npm 指令，支撐 predeploy、CI workflow 與手動驗收。

## 10. 其他資源

- `node_modules/`：安裝的開發相依與工具（Jest、Playwright、Google APIs 等），由 `package-lock.json` 管理版本。
- `reports/`、`docs/` 與 CSV/XLSX 檔案提供升版紀錄、審核建議與參考資料，與核心程式分離以利維護。

---

本文件可做為後續維護或新成員導覽的基礎，若新增檔案或調整流程，建議同步更新以保持總覽的完整性。
