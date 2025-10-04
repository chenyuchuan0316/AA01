# AA01 程式碼全覽說明

本文件彙整 `/workspace/AA01` 儲存庫的所有檔案，說明各自的角色、核心邏輯與相依關係，協助新成員快速掌握整體架構。

## 1. 專案定位與核心流程

- `README.md`：提供專案定位（Google Apps Script 附加功能）、環境需求、部署與測試流程，以及 `GAS_WEBAPP_URL` 等環境變數的設定規則。【F:README.md†L1-L164】
- `CHANGELOG.md`：記錄 2025-09-30 的重大調整，包括 Jest/Puppeteer 升級、部署腳本擴充與文件更新。【F:CHANGELOG.md†L1-L18】
- `CODEX_TESTING_ISSUES.md`：說明自動測試在本機容器失敗的原因，強調 Apps Script 依賴與硬編資源 ID 的限制。【F:CODEX_TESTING_ISSUES.md†L1-L33】

## 2. Apps Script 伺服端模組（`src/`）

- `Main.gs`：保留原始 `hello()` 範例函式，作為 Apps Script 進入點的預設佔位。【F:src/Main.gs†L1-L3】
- `AppCore.gs`：
  - 建立自訂功能表與側欄（`onOpen`、`showSidebar`、`buildAppHtmlOutput`）。【F:src/AppCore.gs†L15-L34】
  - `doGet` 提供 Web App 入口與健康檢查路由，於錯誤時回傳 JSON。【F:src/AppCore.gs†L36-L62】
  - 文件產生主流程：`applyAndSave` 透過 `buildDocumentNaming` 與 `createDocumentFromTemplate` 複製模板，再依 `DOCUMENT_WRITERS` 執行段落寫入。【F:src/AppCore.gs†L64-L181】
  - 段落寫入函式如 `applyH1_CallDate`、`applyH1_MismatchPlan` 等，對照 `DataStore.gs` 中的模板與標題變體處理文件內容。【F:src/AppCore.gs†L183-L370】【F:src/AppCore.gs†L402-L515】
- `DataStore.gs`：定義模板文件、輸出資料夾、名單試算表等資源 ID，並提供段落模板、照顧問題對照表與桃園市長照給付資料等靜態資料來源。【F:src/DataStore.gs†L1-L126】【F:src/DataStore.gs†L152-L216】
- `Sidebar.html`：
  - 以大量 CSS 變數與 RWD 規則建立側欄版面，涵蓋桌機與行動裝置布局、表單樣式與狀態顯示。【F:src/Sidebar.html†L1-L120】
  - HTML 結構包括基本資訊、目標設定、計畫執行與備註等群組，並使用 `data-testid` 與可存取性語義標籤協助測試與無障礙。【F:src/Sidebar.html†L121-L350】
  - 內嵌腳本維護標題階層 `HEADING_SCHEMA`、側邊導覽狀態、表單驗證與進度統計；同時管理字級偏好、Toast 與 API 呼叫行為。【F:src/Sidebar.html†L4620-L4786】
- `appsscript.json`：設定時區、V8 執行階段與 Web App 權限（僅網域內可存取，執行身分為部署者）。【F:src/appsscript.json†L1-L8】

## 3. Node.js 工具與部署腳本

- `gas-deploy.mjs`：支援 OAuth refresh token、Service Account JSON 與 ADC/OIDC 三種認證，蒐集 `src/` 下 Apps Script 檔案後呼叫 Script API 建版並更新部署。【F:gas-deploy.mjs†L1-L128】【F:gas-deploy.mjs†L130-L214】
- `get-refresh-token.mjs`：啟動本地 HTTP 伺服器完成 OAuth 授權，輸出 refresh token 供部署腳本使用。【F:get-refresh-token.mjs†L1-L112】
- `scripts/auto-repair.mjs`：提供自動修復重試框架，可設定主要指令、驗證指令、最大重試次數與退避時間。【F:scripts/auto-repair.mjs†L1-L100】
- `scripts/health-check.mjs`：依 `GAS_WEBAPP_URL` 與 `E2E_PATH` 取得目標網址，支援 Proxy，並將回應摘要寫入 `artifacts` 以利 CI 解析。【F:scripts/health-check.mjs†L1-L72】
- `scripts/run-pa11y.mjs`：載入 `.env`，在缺少遠端網址時改掃描本地 `Sidebar.html`，使用 pa11y 進行 WCAG 2.1 AA 無障礙檢測。【F:scripts/run-pa11y.mjs†L1-L34】
- `scripts/url-helper.mjs` 與 `scripts/url-helper.d.ts`：整理 Web App 基底網址與測試路徑、驗證 `http/https`、輸出 JSON 檔案，並提供 TypeScript 型別定義供 Playwright 工具引用。【F:scripts/url-helper.mjs†L1-L65】【F:scripts/url-helper.d.ts†L1-L8】

## 4. 測試與驗證資源

- `package.json`：定義 lint、Jest、Playwright、pa11y、健康檢查等指令與 Node 18 / npm 10 需求，並列出相關開發依賴與 overrides。【F:package.json†L1-L62】
- Jest：
  - `jest.config.cjs` 以 jsdom 環境與 `ts-jest` 支援 TypeScript，蒐集 `scripts/`、`src/` 覆蓋率並啟用 `test/setup-tests.cjs`。【F:jest.config.cjs†L1-L32】
  - `jest.config.js` 提供 Node 環境的簡化設定（兼容部分工具）。【F:jest.config.js†L1-L6】
  - `__tests__/sample.test.ts` 驗證基本表單夾具格式；`__tests__/a11y/sidebar-a11y.test.ts` 以 `jest-axe` 檢查無障礙；`__tests__/scripts/url-helper.test.ts` 覆蓋 URL 工具各種邊界情境；`__tests__/fixtures/basic-form.json` 為測試資料。【F:**tests**/sample.test.ts†L1-L18】【F:**tests**/a11y/sidebar-a11y.test.ts†L1-L24】【F:**tests**/scripts/url-helper.test.ts†L1-L46】【F:**tests**/fixtures/basic-form.json†L1-L5】
  - `test/setup-tests.cjs` 匯入 `jest-dom` 與 `jest-axe` 擴充；`test/setup-tests.d.ts` 宣告自訂 Matcher 型別。【F:test/setup-tests.cjs†L1-L7】【F:test/setup-tests.d.ts†L1-L8】
- Playwright：
  - `playwright.config.mjs` 依 `E2E_TARGET` 切換本地/遠端 baseURL，設定三種裝置專案並儲存報告至 `artifacts/`。【F:playwright.config.mjs†L1-L37】
  - `playwright/ui.spec.ts` 在本地模式檢查 RWD 網格、側欄切換、關係下拉選項與 aria 狀態順序。【F:playwright/ui.spec.ts†L1-L99】
  - `playwright/remote.spec.ts` 於提供登入態時測試遠端部署的 RWD 行為與連結正規化，並透過環境變數自動跳過未授權情境。【F:playwright/remote.spec.ts†L1-L46】
  - `playwright/utils/openPage.ts` 將 `scripts/url-helper.mjs` 匯入 Playwright，統一設定 viewport、處理登入狀態與關鍵元素等待條件。【F:playwright/utils/openPage.ts†L1-L34】

## 5. 程式碼品質設定

- `eslint.config.js`：採 Flat Config，整合 `@typescript-eslint`、`eslint-plugin-jest`、`eslint-plugin-playwright` 規則，並禁用一般 `console`。【F:eslint.config.js†L1-L46】
- `prettier.config.cjs`：設定 100 字元換行、2 空格縮排、單引號等格式化規則。【F:prettier.config.cjs†L1-L8】
- `depcheck.config.cjs` 與 `knip.json`：客製 depcheck 與 knip 的忽略清單與特別解析器，避免部署腳本等檔案被誤判為未使用。【F:depcheck.config.cjs†L1-L19】【F:knip.json†L1-L10】
- `tsconfig.test.json` / `tsconfig.json`：採 `NodeNext` 模組解析、允許 JSON 模組與 JS 檔案，並將 Playwright、測試與 `src/utils` 納入編譯；根設定僅延伸測試專案配置。【F:tsconfig.test.json†L1-L15】【F:tsconfig.json†L1-L3】
- `eslint.config.js`、`lint-staged`（於 `package.json` 中）確保提交前執行 ESLint 與 Prettier 修正。【F:package.json†L18-L33】【F:eslint.config.js†L1-L46】

## 6. 文件與審查報告

- `docs/upgrade-plan.md`：拆解升版批次、風險評估與驗證策略，特別追蹤 puppeteer、glob、jest 等重大更新。【F:docs/upgrade-plan.md†L1-L54】
- `docs/upgrade-report.md`：總結 2025-09-30 升版結果與後續建議，包括 CI workflow 產出與測試通過情形。【F:docs/upgrade-report.md†L1-L40】
- `reports/round-0` 至 `round-5`：紀錄多輪自動化評估結果，例如 Round 0 詳列各指令狀態、缺口與下一步建議。【F:reports/round-0/summary.md†L1-L40】
- `aa01_ui_code_audit_suspicious.csv`：UI 稽核輸出，標註疑似重複或未使用的 HTML/CSS ID 以供清查。【F:aa01_ui_code_audit_suspicious.csv†L1-L4】
- `outdated.json`：`npm outdated --json` 的快照，顯示 `@google/clasp` 版本差異。【F:outdated.json†L1-L7】
- `reports/` 系列檔案為歷史修復或工具巡檢摘要，供追蹤改善進度。

## 7. 其他資產與示例

- `clasprc_base64.txt`：展示 `.clasprc.json` 以 Base64 編碼的內容樣板，輔助 GitHub Actions 還原憑證。【F:clasprc_base64.txt†L1-L7】
- `新增 文字文件.txt`：紀錄手動部署 Git 指令與 GitHub Actions 失敗 log，留存操作歷程。【F:新增 文字文件.txt†L1-L120】
- `桃園市_長照給付資料庫_v1.xlsx`：原始長照給付參考資料，對應 `DataStore.gs` 內的靜態表格。
- `aa01_ui_code_audit_suspicious.csv` 與 `reports/round-*/summary.md` 可協助查核 UI 與自動化驗證狀態。

## 8. 專案結構補充

- `node_modules/`：鎖定於 `package-lock.json`，提供 lint、測試、部署腳本所需的第三方套件。
- `package-lock.json`：保留安裝樹狀結構，確保 CI 重現性。
- `scripts/`, `playwright/`, `__tests__/`, `docs/`, `reports/` 等資料夾皆已納入上述章節；剩餘未提及的資料夾主要存放工具輸出或第三方依賴。

以上內容涵蓋儲存庫現有的所有檔案與主要用途，可作為後續維護與審查的總覽參考。
