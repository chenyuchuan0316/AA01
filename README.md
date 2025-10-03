# AA01 計畫助手

AA01 是一套以 Google Apps Script 打造的 Google 文件附加功能。長照個管師可在計畫書公版文件中開啟「計畫助手」側欄，填入個案資訊後，由程式自動：

1. 依照命名規則複製公版文件到指定雲端硬碟資料夾。
2. 將側欄輸入內容寫入新文件的各個段落。
3. 回傳新檔資訊並自動開啟，節省大量手動編修時間。

本文說明整體架構、環境需求、運作流程以及每個檔案的角色，協助開發者或使用者快速了解系統。

> 更新日期：2025-10-21

## Environments

- **TEST**: `https://script.google.com/macros/s/AKfycbw1-3KBUwTLymBMK6pzNrvvaW9bxfNOGKPSNhsscssDwc9buXAJ3sUTbhljLiHcEDrh/exec?route=health`
- **PROD**: `https://script.google.com/macros/s/AKfycbyDt6M-PYyU-ANWU2fQrLF4w_9T_f1ADZLFNNInG0_orf4LhmnLHt8peBen8v2mTY-c/exec?route=health`

## 快速開始（Quickstart）

1. **複製專案檔案**：在目標 Google 文件中開啟 `Extensions → Apps Script`，將本儲存庫的 `.gs` 與 `Sidebar.html` 內容貼入新建專案。
2. **設定資源識別碼**：於 `Constants.gs` 填入模板文件、輸出資料夾與名單試算表的 ID，並確認這些資源已與執行帳號共享。
3. **授權並驗證**：從文件功能表執行「計畫助手 → 顯示側欄」，依畫面授權 Apps Script；以測試資料提交一次，確認新文件正確產出。

## 部署 Web App（GAS Web App 發佈流程）

以下步驟將協助你把同一套程式部署成 Google Apps Script Web App，並取得可重複使用的網址：

1. **建立 OAuth 憑證與 Script ID**
   - 在 Apps Script 編輯器「專案設定」頁面複製 `Script ID`。
   - 於 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 為同一專案建立 _桌面應用程式_ OAuth Client（Client ID / Client Secret）。
   - 於「OAuth 同意畫面」加入 `https://www.googleapis.com/auth/script.projects` 與 `https://www.googleapis.com/auth/script.deployments` 權限範圍。
2. **取得 refresh_token（僅需一次）**
   - 設定環境變數：
     ```bash
     export GAS_CLIENT_ID="<你的 Client ID>"
     export GAS_CLIENT_SECRET="<你的 Client Secret>"
     ```
   - 在本機執行 `npm run oauth:token`（或 `node get-refresh-token.mjs`），依指示於瀏覽器授權後回到終端機，複製輸出的 `refresh_token`。
3. **設定部署環境變數**  
   將下列變數填入 CI/CD 平台或本機終端機：
   ```bash
   export SCRIPT_ID="<Apps Script 的 Script ID>"
   export GAS_CLIENT_ID="<桌面 OAuth Client ID>"
   export GAS_CLIENT_SECRET="<桌面 OAuth Client Secret>"
   export GAS_OAUTH_REFRESH_TOKEN="<剛取得的 refresh_token>"
   ```

### CLASPRC_JSON Secret 管理

- GitHub Actions 的 `CLASPRC_JSON` Secret 必須維持為 **完整的 `.clasprc.json`**，可以直接貼上 JSON 文字，或先轉為 Base64 字串後存入 Secret。請選擇一種格式並保持一致，避免混淆。
- CI 工作流程會自動判斷 Secret 為 JSON 還是 Base64 並寫入 `~/.clasprc.json`；若需轉換格式，請同步更新文件與團隊說明，避免部署期間同時存在兩種版本。
- 若提供 Base64 字串，請確保沒有多餘換行；若提供 JSON 文字，請確認內容與本機 `.clasprc.json` 完整一致（含 `token` / `tokens.default` 欄位）。
- 憑證過期時請使用 `clasp login --no-localhost` 重新取得新的 `.clasprc.json`，並立即更新 Secret。建議於每次部署失敗出現 `invalid_grant` 時優先檢查這項設定。
- 在更新 Secret 後，可本地或於 CI 中執行 `npx clasp auth status`（或 `clasp whoami`）確認登入狀態正常，確保部署流程不會因憑證過期中斷。

4. **同步程式並建立 Web App Deployment**
   - 於專案根目錄執行 `npm install`（首次使用時）。
   - 以 `npm run deploy:web` 觸發 `gas-deploy.mjs`：此指令會依序呼叫 `projects.updateContent`、建立版本並更新（或建立）部署。成功後終端機會顯示最新的 Web App URL。
   - 若要指定部署說明，可額外設定 `VERSION_DESC`、`DEPLOY_DESC` 環境變數；如需覆寫既有 deployment，提供 `DEPLOYMENT_ID` 即可。
5. **後續更新**
   - 程式碼變更後重複步驟 4 重新部署。Web App URL 不變，可直接分享給使用者作業。
   - 建議將以上指令整合進 GitHub Actions，讓主分支合併時自動部署。

## 開發環境需求

- Node.js ≥ 18.20.0（CI 目前使用 18.20.8）
- npm ≥ 10.8.0（CI 目前使用 10.8.2）
- 安裝依賴：`npm install`
- 單元測試：`npm test -- --runInBand`（Jest 30 需要 Node 18）
- Playwright（本地 UI）：`npm run e2e:ui`（預設載入 `src/Sidebar.html`，不需登入即可執行）
- Playwright（遠端部署）：`npm run e2e:remote`（需存在 `auth.json` 與 `GAS_WEBAPP_URL`；缺少任一條件時測試自動 skip）
- 健康檢查：`npm run health`（`GAS_WEBAPP_URL` 未設定或為 placeholder 時輸出 `skip` 並以 0 結束）
- 設定 `.env`（可參考 `.env.example`）並提供 `GAS_WEBAPP_URL`，自動化驗收會引用該網址進行健康檢查、Playwright 與 pa11y-ci 掃描；若保留預設值，指令會自動改用本地 `src/Sidebar.html` 進行驗證。

### Playwright 登入態管理（auth.json）

- 第一次執行遠端 E2E 前，請先安裝瀏覽器：`npx playwright install`
- 以部署網址登入並儲存 storage state：`npx playwright open --save-storage=auth.json <GAS_WEBAPP_URL>`
- `auth.json` 僅供本地或 CI 使用，請勿提交至版本控制；建議每 30–60 天重新產生一次以避免登入態過期。
- 若需要於 CI 還原，可將 `auth.json` 內容以 `base64` 編碼後寫入 `PLAYWRIGHT_AUTH_STATE` Secret。

### 本地驗收一鍵指令

執行 `npm run predeploy` 可一次完成下列檢查：

1. `npm run lint` – ESLint 規範與格式化檢查。
2. `npm run test` – Jest 單元測試與 jest-axe 無障礙斷言。
3. `npm run e2e` – Playwright UI 驗證。
4. `npm run test:a11y:pa11y` – 以 pa11y-ci 掃描部署頁面。
5. `npm run test:a11y:jest` – 關鍵區塊的無障礙回歸測試。
6. `npm run health` – Web App 健康檢查（接受 200 / 302）。

所有指令必須成功才可推送或開 Draft PR，若其中一項失敗，請先修正後再重跑。

### 手動驗證流程

```bash
npm run e2e:ui         # 本地 UI 規格（不需登入）
npm run e2e:remote     # 遠端部署；需 auth.json 與 GAS_WEBAPP_URL，缺少條件會自動 skip
npm run health         # 健康檢查；200/302 視為成功，未設或 placeholder 會輸出 skip
```

### CI 驗證需求

- `PLAYWRIGHT_AUTH_STATE`：`auth.json` 的 Base64 字串（缺少時遠端 E2E 會跳過，但流程仍為綠燈）。
- `GAS_WEBAPP_URL`：部署 URL，提供遠端 E2E 與健康檢查使用。
- workflow 會自動還原 `auth.json`、安裝 Playwright 瀏覽器、執行 `npm run e2e:ui`、`npm run e2e:remote`（條件式）、`npm run health`，並於無論成功或失敗時上傳 `playwright-report`。

### CI/工作流程產出

- `coverage/`：Jest 產生的覆蓋率報告，已標記為 workflow artifact 供審查。
- `playwright-report/`：Playwright HTML 報告，同樣會於 CI 步驟上傳，協助追蹤 UI 變動。

## npm 套件維護與自動升版

- `npm-outdated` workflow：每週一 01:30 UTC 產出過時套件清單、Summary 與 `outdated.json`。可從 Actions 介面手動觸發以建立升版規劃。
- `npm auto upgrade` workflow：支援 `safe`（預設）與 `major` 兩種策略。Safe 策略會執行 `npm update`，Major 策略則以 `npm-check-updates` 調整 range 後重新安裝。
- 分支命名遵循 `chore/npm-upgrade/<YYYYMMDD>-safe` 或 `chore/npm-upgrade/<YYYYMMDD>-major`，PR 標題固定為 `chore(deps): npm <strategy> upgrade`，內文包含 Before / After 過時表格。
- 若預設的 `GITHUB_TOKEN` 因組織權限受到限制，可在 Repo Secrets 建立 `NPM_UPGRADE_TOKEN`，內容為擁有 `contents:write`、`pull_requests:write` 權限的 Fine-grained PAT。工作流程會自動優先使用該 Token 以避免 `403` 推送錯誤。

## 金鑰與憑證設定（Service Account / OIDC）

- **首選 OIDC / Workload Identity Federation**：在 GitHub Actions 設定 `GAS_USE_ADC=true` 並配置 GCP 提供的 `GOOGLE_WORKLOAD_IDENTITY_PROVIDER`、`GOOGLE_SERVICE_ACCOUNT` Secrets，`google-auth-library` 會自動為 `gas-deploy.mjs` 取得短期憑證。
- **Service Account JSON**：提供 `GAS_SERVICE_ACCOUNT_JSON`（支援 JSON 文字或 Base64 字串）或設定 `GOOGLE_APPLICATION_CREDENTIALS` 指向 JSON 檔案，腳本會自動套用 Script API 所需 scopes。
- **End-User OAuth**：仍可維持舊流程，使用 `GAS_CLIENT_ID`、`GAS_CLIENT_SECRET` 與 `GAS_OAUTH_REFRESH_TOKEN`。建議僅在需要代表真人帳號部署時使用。
- P12 憑證已淘汰：請改用 Service Account JSON 或 OIDC，並透過 Secrets 管理憑證。

> 小提醒：`get-refresh-token.mjs` 預設使用 `http://localhost:53682/oauth2callback` 監聽授權回呼，如遇埠號被佔用可改以 `GAS_OAUTH_REDIRECT_PORT=XXXX node get-refresh-token.mjs` 指定其他埠號。

## Troubleshooting（常見問題排除）

| 狀況                          | 可能原因                                                                        | 建議處理                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 側欄無法載入名單              | `MANAGERS_SHEET_ID` 或 `CONSULTANTS_BOOK_ID` 設定錯誤，或試算表未與執行帳號共享 | 檢查 `Constants.gs` 的 ID 與工作表名稱，並再次分享試算表給 Apps Script 執行帳號               |
| 授權畫面重複出現              | 帳號尚未核准 Docs/Drive/Sheets 權限，或切換了不同的 Google 帳號                 | 重新登入正確帳號並授權全部權限，必要時於 Apps Script IDE 的 `Triggers` 頁面移除舊授權         |
| 產出檔案命名重複或覆寫        | 同一位個案與個管師組合已有既有檔案                                              | 於輸出資料夾確認既有版本，必要時在 `Constants.gs` 調整命名規則或清除測試檔案                  |
| 健康檢查返回 302 / 401        | Web App 啟用網域保護或僅允許特定帳號                                            | 於 `.env` / CI Secrets 設定具備存取權的部署網址，或於健康檢查前以 `route=health` 允許匿名訪問 |
| Playwright/pa11y 無法載入頁面 | `GAS_WEBAPP_URL` 未設定、設定錯誤，或部署頁面需登入                             | 確認 `.env` 與 CI Secrets 已填入公開可讀取的 Web App URL，必要時建立測試用無限制部署          |
| 下拉選單沒有 optgroup         | GAS 後端回傳的選單資料失敗或未完成載入                                          | 點擊欄位旁的「重新載入」按鈕重新取得資料，若持續失敗請檢查 `DataStore.gs` 與相關試算表        |

## 權限與資料保護注意事項

- 僅分享模板文件、輸出資料夾與名單試算表給需要的帳號，維持最小存取權限。
- 在 `DataStore.gs` 或試算表中儲存測試資料時，使用匿名化或假資料，避免提交真實個人識別資訊。
- 如需回報錯誤或提供截圖，請移除個案姓名、身分證號等敏感資訊後再分享。

## 近期更新重點

- 版面採 Mobile-first，僅保留 1280px 斷點並在行動裝置改以抽屜顯示側欄。
- 字級選項調整為標準與大字兩檔，統一沿用既有 CSS 變數控制。
- 建立快速開始與 Troubleshooting 指引，協助新進同仁快速上手並排查常見狀況。
- 整理權限設定與資料保護注意事項，確保部署過程符合資安需求。
- 新增授權與貢獻指南，說明 Issue／PR 期待內容並連結開發規範。

## 計畫書標題規格（HEADING_SCHEMA）

AA01 的所有段落寫入函式都必須符合下列標題規格。此結構同時對應前端表單的章節配置與輸出文件的標題階層；調整任一段落時，請先比對 `HEADING_SCHEMA_VERSION` 是否需要升版，並確保所有 `applyH1_*`、模板字典以及側欄 UI 仍完整覆蓋每一個節點。為避免未來維護時誤刪標題，請在程式碼審查中逐項核對此表列，並確認回歸測試的輸出文件不缺漏任何標題。

```javascript
/* ===== 完整版 HEADING_SCHEMA（for CODEX 指令直接覆蓋） ===== */
const HEADING_SCHEMA_VERSION = '2025-10-01';

const HEADING_SCHEMA = Object.freeze([
  {
    id: 'h1-basic',
    tag: 'h1',
    label: '基本資訊',
    page: 'basic',
    dom: { selector: '#basicInfoGroup .titlebar .h1', mode: 'replace', className: 'h1' },
    children: [
      {
        id: 'h2-basic-unit-code',
        tag: 'h2',
        label: '單位代碼',
        dom: {
          selector: '#basicInfoGroup label[for="unitCode"]',
          mode: 'labelHeading',
          className: 'h2'
        }
      },
      {
        id: 'h2-basic-case-manager',
        tag: 'h2',
        label: '個案管理師',
        dom: {
          selector: '#basicInfoGroup label[for="caseManagerName"]',
          mode: 'labelHeading',
          className: 'h2'
        }
      },
      {
        id: 'h2-basic-case-name',
        tag: 'h2',
        label: '個案姓名',
        dom: {
          selector: '#basicInfoGroup label[for="caseName"]',
          mode: 'labelHeading',
          className: 'h2'
        }
      },
      {
        id: 'h2-basic-consultant-name',
        tag: 'h2',
        label: '照專姓名',
        dom: {
          selector: '#basicInfoGroup label[for="consultName"]',
          mode: 'labelHeading',
          className: 'h2'
        }
      },
      {
        id: 'h2-basic-cms-level',
        tag: 'h2',
        label: 'CMS 等級',
        dom: {
          selector: '.cms-level-row > label[for="cmsLevelValue"]',
          mode: 'labelHeading',
          className: 'h2'
        }
      }
    ]
  },
  {
    id: 'h1-goals',
    tag: 'h1',
    label: '計畫目標',
    page: 'goals',
    dom: { selector: '#contactVisitGroup .titlebar .h1', mode: 'replace', className: 'h1' },
    children: [
      {
        id: 'h2-goals-call',
        tag: 'h2',
        label: '一、電聯日期',
        dom: {
          selector: '#contactVisitGroup .contact-visit-card[data-card="call"] .titlebar .h2',
          mode: 'replace',
          className: 'h2'
        },
        children: [
          {
            id: 'h3-goals-call-date',
            tag: 'h3',
            label: '電聯日期',
            dom: {
              selector: '#contactVisitGroup label[for="callDate"]',
              mode: 'labelHeading',
              className: 'h3'
            }
          },
          {
            id: 'h3-goals-call-consult',
            tag: 'h3',
            label: '照顧專員約訪',
            dom: {
              selector:
                '#contactVisitGroup .contact-visit-card[data-card="call"] label.inline-checkbox',
              mode: 'labelHeading',
              className: 'h3'
            }
          }
        ]
      },
      {
        id: 'h2-goals-homevisit',
        tag: 'h2',
        label: '二、家訪日期',
        dom: {
          selector: '#contactVisitGroup .contact-visit-card[data-card="visit"] .titlebar .h2',
          mode: 'replace',
          className: 'h2'
        },
        children: [
          {
            id: 'h3-goals-homevisit-date',
            tag: 'h3',
            label: '家訪日期',
            dom: {
              selector: '#contactVisitGroup label[for="visitDate"]',
              mode: 'labelHeading',
              className: 'h3'
            }
          },
          {
            id: 'h3-goals-prep-date',
            tag: 'h3',
            label: '出院日期',
            dom: {
              selector: '#dischargeBox label[for="dischargeDate"]',
              mode: 'labelHeading',
              className: 'h3'
            }
          }
        ]
      },
      {
        id: 'h2-goals-companions',
        tag: 'h2',
        label: '三、偕同訪視者',
        dom: { selector: '#visitPartnersCard .titlebar .h2', mode: 'replace', className: 'h2' },
        children: [
          {
            id: 'h3-goals-primary-rel',
            tag: 'h3',
            label: '主要照顧者關係',
            dom: {
              selector: '#visitPartnersCard label[for="primaryRel"]',
              mode: 'labelHeading',
              className: 'h3'
            }
          },
          {
            id: 'h3-goals-primary-name',
            tag: 'h3',
            label: '主要照顧者姓名',
            dom: {
              selector: '#visitPartnersCard label[for="primaryName"]',
              mode: 'labelHeading',
              className: 'h3'
            }
          },
          { id: 'h3-goals-extra-rel', tag: 'h3', label: '其他參與者關係' },
          { id: 'h3-goals-extra-name', tag: 'h3', label: '其他參與者姓名' }
        ]
      },
      {
        id: 'h2-goals-overview',
        tag: 'h2',
        label: '四、個案概況',
        dom: {
          selector: '#caseOverviewGroup .titlebar .h2',
          mode: 'replace',
          className: 'h2 heading-tier heading-tier--primary'
        },
        children: [
          {
            id: 'h3-goals-s1',
            tag: 'h3',
            label: '（一）身心概況',
            dom: {
              selector: '#section1_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-s2',
            tag: 'h3',
            label: '（二）經濟收入',
            dom: {
              selector: '#section2_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-s3',
            tag: 'h3',
            label: '（三）居住環境',
            dom: {
              selector: '#section3_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-s4',
            tag: 'h3',
            label: '（四）社會支持',
            dom: {
              selector: '#section4_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-s5',
            tag: 'h3',
            label: '（五）其他',
            dom: {
              selector: '#section5_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-s6',
            tag: 'h3',
            label: '（六）複評評值',
            dom: {
              selector: '#section6_block > .titlebar label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          }
        ]
      },
      {
        id: 'h2-goals-targets',
        tag: 'h2',
        label: '五、照顧目標',
        dom: { selector: '#careGoalsGroup .titlebar .h2', mode: 'replace', className: 'h2' },
        children: [
          {
            id: 'h3-goals-targets-problems',
            tag: 'h3',
            label: '（一）照顧問題',
            dom: {
              selector: '#careGoals_block > .titlebar:nth-of-type(1) label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-targets-short',
            tag: 'h3',
            label: '（二）短期目標（0–3 個月）',
            dom: {
              selector: '#careGoals_block > .titlebar:nth-of-type(2) label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-targets-mid',
            tag: 'h3',
            label: '（三）中期目標（3–4 個月）',
            dom: {
              selector: '#careGoals_block > .titlebar:nth-of-type(3) label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          },
          {
            id: 'h3-goals-targets-long',
            tag: 'h3',
            label: '（四）長期目標（4–6 個月）',
            dom: {
              selector: '#careGoals_block > .titlebar:nth-of-type(4) label',
              mode: 'replace',
              className: 'h3 heading-tier heading-tier--primary'
            }
          }
        ]
      },
      {
        id: 'h2-goals-mismatch',
        tag: 'h2',
        label: '六、與照專建議服務項目、問題清單不一致原因說明及未來規劃、後續追蹤計劃',
        dom: { selector: '#mismatchPlanGroup .titlebar .h2', mode: 'replace', className: 'h2' },
        children: [
          {
            id: 'h3-goals-mismatch-1',
            tag: 'h3',
            label: '（一）目標達成的狀況以及未達成的差距',
            dom: {
              selector: '#mismatchPlanGroup textarea#reason1',
              mode: 'previousLabelHeading',
              className: 'h3'
            }
          },
          {
            id: 'h3-goals-mismatch-2',
            tag: 'h3',
            label: '（二）資源的變動情形',
            dom: {
              selector: '#mismatchPlanGroup textarea#reason2',
              mode: 'previousLabelHeading',
              className: 'h3'
            }
          },
          {
            id: 'h3-goals-mismatch-3',
            tag: 'h3',
            label: '（三）未使用的替代方案或是可能的影響',
            dom: {
              selector: '#mismatchPlanGroup textarea#reason3',
              mode: 'previousLabelHeading',
              className: 'h3'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'h1-exec',
    tag: 'h1',
    label: '計畫執行規劃',
    page: 'execution',
    dom: {
      selector: '.page-section[data-page="execution"] .group > .group-header .titlebar .h1',
      mode: 'replace',
      className: 'h1'
    },
    children: [
      {
        id: 'h2-exec-services',
        tag: 'h2',
        label: '一、長照服務核定項目、頻率',
        dom: { selector: '#planExecutionCard .titlebar label', mode: 'replace', className: 'h2' },
        children: [
          {
            id: 'h3-exec-b',
            tag: 'h3',
            label: '（一）B碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="B"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-c',
            tag: 'h3',
            label: '（二）C碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="C"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-d',
            tag: 'h3',
            label: '（三）D碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="D"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-ef',
            tag: 'h3',
            label: '（四）E.F碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="EF"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-g',
            tag: 'h3',
            label: '（五）G碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="G"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-sc',
            tag: 'h3',
            label: '（六）SC碼',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="SC"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-nutrition',
            tag: 'h3',
            label: '（七）營養餐飲服務',
            dom: {
              selector:
                '#planEditor .plan-category[data-plan-category="MEAL"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          },
          {
            id: 'h3-exec-emergency',
            tag: 'h3',
            label: '（八）緊急救援服務',
            dom: {
              selector:
                '#planExecutionCard .plan-category[data-plan-category="EMERGENCY"] .plan-category-heading h3',
              mode: 'replace',
              className: 'h3'
            }
          }
        ]
      },
      {
        id: 'h2-exec-referral',
        tag: 'h2',
        label: '二、轉介其他服務資源',
        dom: { selector: '#planReferralCard .titlebar label', mode: 'replace', className: 'h2' }
      },
      { id: 'h2-exec-station', tag: 'h2', label: '三、巷弄長照站資訊與意願' },
      { id: 'h2-exec-emergency-note', tag: 'h2', label: '四、緊急救援服務說明' },
      { id: 'h2-exec-attachment2', tag: 'h2', label: '附件二（服務計畫明細）預覽' },
      { id: 'h2-exec-attachment1', tag: 'h2', label: '附件一：計畫執行規劃預覽' }
    ]
  },
  {
    id: 'h1-notes',
    tag: 'h1',
    label: '其他備註',
    page: 'notes',
    dom: { selector: '#planOtherGroup .titlebar .h1', mode: 'replace', className: 'h1' },
    children: [
      {
        id: 'h2-notes-other',
        tag: 'h2',
        label: '其他（個案特殊狀況或其他未盡事宜可備註於此）',
        dom: {
          selector:
            '#planOtherGroup .section-card .titlebar .h2, #planOtherGroup .section-card .titlebar span.h2',
          mode: 'replace',
          className: 'h2'
        }
      }
    ]
  }
]);
```

### 檢核與維護流程

1. **程式碼變更審查**：任何會影響標題輸出的 PR，都必須附上以此規格為基準的檢查結果，逐一列出新增、刪除或改動的節點並說明調整理由。
2. **回歸測試**：執行 `applyAndSave(form)` 產生最新文件，確認輸出段落的標題階層與 `HEADING_SCHEMA` 完全一致，避免因模板或程式重構遺漏節點。
3. **版本同步**：若 `HEADING_SCHEMA` 有變動，請同步更新 `HEADING_SCHEMA_VERSION`，並在提交訊息與 `AGENTS.md` 的規範段落註記此次修改內容，方便後續追蹤。

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

- **前端 (Sidebar.html)**：使用原生 HTML/CSS/JavaScript 建立表單介面，並在提交前負責資料整理、文字重組、欄位驗證。
- **後端 (`*.gs`)**：在 Apps Script Runtime 中執行。主要負責複製模板文件、依段落更新內容、查詢 Google 試算表等。

---

## 關鍵檔案與模組

| 檔案           | 內容摘要                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`    | 專案維護指南與開發原則。                                                                                                                                                |
| `AppCore.gs`   | 入口流程、文件寫入、通用工具與人員名單查詢皆集中於此；`applyH1_*` 會透過 `renderSimpleTemplate` 套用模板字典輸出段落。亦提供 `getServiceCatalog()` 給前端取得服務資料。 |
| `DataStore.gs` | 外部資源 ID、桃園市長照給付資料庫靜態表，以及 H1 段落所需的模板與詞彙表，供 `AppCore.gs` 與前端查詢。                                                                   |
| `Sidebar.html` | 側欄 UI 與邏輯。負責收集使用者輸入、產生描述文字、基本驗證與呼叫後端函式。                                                                                              |

---

## 執行環境與外部資源

AA01 需在 Google Workspace 環境執行，並取得下列服務權限：

- Google Docs API (`DocumentApp`)：讀寫公版文件內容。
- Google Drive API (`DriveApp`)：複製模板並寫入指定資料夾。
- Google Sheets API (`SpreadsheetApp`)：讀取個管師及照專名單。

部署前請在 `DataStore.gs` 調整以下常數為自己環境的 ID：

| 常數                                            | 用途                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `TEMPLATE_DOC_ID`                               | 計畫書公版 Google 文件 ID。                                      |
| `OUTPUT_FOLDER_ID`                              | 輸出文件的雲端硬碟資料夾 ID。                                    |
| `MANAGERS_SHEET_ID` / `MANAGERS_SHEET_NAME`     | 存放個管師名單的試算表與工作表名稱（B 欄=員工編號、H 欄=姓名）。 |
| `CONSULTANTS_BOOK_ID` / `CONSULTANTS_BOOK_NAME` | 照專名單試算表資訊（A 欄=單位代碼、B 欄=姓名、C 欄=狀態）。      |

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

- 側欄頂端提供「基本資訊／計畫目標／計畫執行規劃／其他備註」四個分頁與字級切換（A／A＋／A＋＋，對應 20px／約 24px／約 26px）。系統會記住使用者選擇並自動重新計算黏附元件與間距；螢幕高度小於 640px 時亦會自動壓縮 padding/gap 約 5–10%，避免畫面塞不下。完成「基本資訊」頁籤的必填欄位後，介面會自動帶入下一頁的「計畫目標」，縮短手動切換步驟。
- 每個段落標題列提供「只看未填」「顯示進階」「全部收合」三種控制。切換結果會寫入 `localStorage`，重新整理或返回表單後仍維持上一個選擇；行動端首次開啟預設啟用「只看未填」，減少滑動距離。
- **基本資訊 H1**：欄位改以 H2 標題呈現（單位代碼、個案管理師、個案姓名、照專姓名、CMS 等級），單位代碼仍決定個管師與照專名單。
- **計畫目標 H1**：電聯日期、家訪日期、偕同訪視者皆以 H2 區塊呈現，內層使用 H3 欄位；同頁的「四、個案概況」維持 H3 標題，方便捲動導覽。
- **（一）身心概況**：
  - H4/H5 重新分組：基本資料（年齡、性別、認知溝通、意識狀態）、感官功能（視力補充／眼鏡依從性、聽力狀態／助聽依從性）、吞嚥與飲食（吞嚥等級、症狀、飲食質地、管灌方式）、口腔／牙齒、疼痛與皮膚、移動功能、排泄與輔具、ADL、IADL、情緒與行為、醫療與用藥、睡眠與日間活動、管路／裝置、身障資訊（唯讀）、建議措施與補充。
  - 內建多層邏輯（視力、聽力、疼痛、皮膚病灶、ADL、睡眠等），透過即時組句產生段落。
  - 預覽區改為分段卡片，每段提供「回到來源欄位」捷徑，並可切換「只看變更」比較上一版內容。
  - `FORM_RULES` 描述跨欄位關係（例如夜間集尿袋與夜尿次數互斥、吞嚥與飲食質地矛盾），可隱藏欄位、清空輸入、顯示警告或阻擋提交。
  - `buildSection1Text_v2` 會根據輸入組成各段落文本並提供 diff 資訊給預覽卡片。
- **（二）~（四）**：經濟收入、居住環境、社會支持皆維持既有表單邏輯並組句；經濟收入段落同步設定身障等級／類別並回寫至「身心概況」的唯讀資訊。
- **(五)(六)**：其他與複評評值提供自由文字欄位，使用者可直接輸入或貼上內容。
- **正式資源（B 服務）**：日間照顧與 BD03 交通車會依 CMS 等級及桃園市給付額度自動推估每週/每月可使用次數、耗用點數與剩餘額度，並將建議文字同步至服務計畫與附件摘要。所有服務代碼在加入計畫時，側欄亦會套用對應的「使用方式」範本，讓填寫者僅需視個案微調敘述。月單位欄位新增 +1／+5／+10 以及清除快捷按鈕，行動裝置也能快速設定用量；在計畫執行規劃分頁中改以「服務類別」聚合卡呈現（如居家服務 B/C、專業服務 D…），同類型服務會自動合併於同一張卡片，方便一次檢視多個代碼。
- **照顧目標**：支援問題清單（最多 5 項）及短/中/長期目標；長期目標會彙整短中期欄位。
- **不一致原因與追蹤計畫**：常用快捷語句可勾選後自動附加在第三欄。
- **附件預覽（其他備註分頁）**：顯示計畫執行規劃文字及服務明細表，與輸出附件同步更新。服務明細會依類別聚合並依承接/指定單位合併列，同時提供「複製表格」與「複製為純文字」兩種按鈕，可直接貼到試算表或 Word；自費總額、動態 padding 與浮動按鈕高度也會隨視窗更新。
- **其他備註**：第三頁新增「其他備註」大欄位，可補充個案特殊狀況；內容會寫入附件三，未填寫時則在文件顯示「（未填寫備註）」提醒。
- **產出按鈕**：送出前進行欄位驗證並組成 `form` 物件，若樣式檢查器偵測到半形標點或異常空白會以提醒 Toast 阻擋提交。

### 預覽卡片、規則引擎與樣式檢查

- **分段預覽與差異比對**：`SECTION1_PREVIEW_META` 定義卡片順序與錨點。最新預覽結果儲存在 `section1PreviewState.segments`，成功送出後會序列化成 map 寫入 `localStorage`（key：`AA01.section1.previousSegments`），供「只看變更」模式比較上一版內容。若卡片僅顯示變更，可點右上角按鈕跳回對應欄位調整。
- **宣告式跨欄位規則**：`FORM_RULES` 位於 `Sidebar.html`，每條規則包含 `if` 條件陣列與 `then` 動作陣列。動作支援 `hide`（暫時隱藏）、`clear`（清空值）、`fix`（自動修正）、`warn`（顯示提醒 Toast）、`block`（標記為錯誤並阻擋提交）。`runSection1Rules()` 每次組句時執行，並在 UI 顯示警告或可點選的錯誤清單，新增規則時只需擴充 `FORM_RULES`。
- **樣式檢查器工作流程**：`STYLE_CHECK_FIELDS` 指定需檢查的輸出欄位；`runStyleChecker()` 會檢測連續空白、半形標點與標點前空格，一旦偵測會為欄位加上 `input-invalid` 標記並以 Toast 顯示提示。送出成功後 `clearStyleCheckerMarks()` 會移除標記，避免殘留紅框。

## 給付與防呆規則整理

以下依政策條文彙整服務代碼的額度、互斥與頻次限制，括號為來源頁碼，方便對照原始文件。

### 一、全域防呆規則（跨所有碼別）

- 額度不可互相流用：個人長照服務的 B/C（照顧與專業）與 D（交通）、E/F（輔具與居家無障礙）、G（喘息）額度彼此獨立，不得互挪；同屬第一款（B/C）下各目額度也不得互挪。（第 7 條、附表二、三；p.3、p.9–10）
- 發給週期與結餘：B/C、D 按月給付，未滿月比例計，結餘可自照顧計畫核定月起 6 個月內保留，期滿歸零；E/F 每三年給付一次；G 每年給付一次，且使用期間不得依其他法令申請相同性質補助。（p.5）
- 聘僱外籍看護之家戶限制：B/C 額度僅給付 30%，且原則限用 C 碼；例外放行到宅沐浴車 BA09/BA09a 以及社區式交通 BD03，仍受 30% 總額度限制。（p.4、p.20–21、p.35）
- 喘息服務（G 碼）排除條件：無家庭照顧者或已有其他法令補助臨時／短期照顧者，不得給付喘息額度。（p.4–5）
- 可臨時提供之 BA 碼：BA01、BA07、BA12、BA14、BA17a、BA17b、BA17c、BA17d1、BA17d2、BA23、BA24 可先行服務後補核；BA22 不得臨時提供。（p.7、p.27）
- 同時段不可重複申報原則：多數互斥指同一時段不得併報，或同日／同月限申報次數，詳各碼別條款。

### 二、AA 碼（照顧管理／政策加計）—互斥／上限

- AA01 與 AA02 同月不得併計；專任個管同月 120 組為準，可超額至 150 組但超額每組減付 10%。不扣額度、免部分負擔。（p.11–12）
- AA03：每一個 C 碼專業服務（不含 CC01）僅能申請一次，且該時段需同時提供限定 BA 碼之一。不扣額度、免部分負擔。（p.12–13）
- AA04：臨終日前後指定時點僅限申請一次。不扣額度、免部分負擔。（p.13）
- AA05：同服務單位對同個案每日限加計一次（不得加計於 BA16）。不扣額度、免部分負擔。（p.13–14）
- AA06：每日限一次，限搭配 BA01／BA07／BA12 指定情形。不扣額度、免部分負擔。（p.14–15）
- AA07：每月申請一次，限等級四級（含）以上並符合家庭條件。不扣額度、免部分負擔。（p.15）
- AA08 與 AA09：同日不得同時申請；同服務單位同個案一日限加計一次。不扣額度、免部分負擔。（p.15）
- AA10：夜間緊急服務一日為一給付單位。不扣額度、免部分負擔。（p.15）
- AA11：同一領有身障證明之對象每日只限申請一次（居家式與社區式可分別計一次）。不扣額度、免部分負擔。（p.16）
- AA12：每年上限二次（每 6 個月一次）。不扣額度、免部分負擔。（p.16–17）

### 三、BA 碼（居家照顧）—互斥／上限

- BA01：原則每日 1 組，必要時早晚各 1 組；同一時段不得與 BA07、BA23 併報。可臨時提供。（p.17）
- BA02：每 30 分鐘 1 單位，單日上限 3 小時；不得與其他組合併用。（p.17–18）
- BA03：不得僅作為他項服務前後之觀察；無日上限明文。（p.18）
- BA04：每餐 1 組。（p.18）
- BA05：在家備餐每次 1 組；一日管灌備餐 1 組；同住個案共用時僅擇一人扣 B/C 額度與部分負擔。（p.18–19）
- BA07：同時段不得與 BA01、BA23 併報；可臨時提供。（p.19）
- BA08：無頻次上限明文；提供者需符合資格限制。（p.19–20）
- BA09／BA09a：外籍看護之家戶與中低收特照津貼對象可使用（例外於第 10 條），並有團隊規模要求。（p.20–21）
- BA10：完整一次為一單位。（p.21）
- BA11：完整一次為一單位。（p.21）
- BA12：不得用於電梯／爬梯機／樓梯升降椅；問題清單須含「移位」或「上下樓梯」；可臨時提供。（p.21–22）
- BA13：每 30 分鐘 1 單位；符合 BA12 條件時得併用。（p.22）
- BA14：不適用於定期復健或透析；出門起 1.5 小時內用本碼，逾 1.5 小時改依實際時數用 BA13；可臨時提供。（p.22–23）
- BA15：每 30 分鐘 1 單位；共用區域僅給付 50%，其餘自付；同住多個案住同一臥室僅擇一人扣額度；獨居定義明確。（p.23–24）
- BA16：距離 5 公里內適用；含家人物品則僅給付 50%；超距離費用自付。（p.24）
- BA17a：每日上限 3 組，可與 BA17b 同時加計；可臨時提供。（p.24–25）
- BA17b：每日上限 3 組；可臨時提供。（p.25）
- BA17c：每週上限 7 組；可臨時提供。（p.25–26）
- BA17d1：每日上限 1 組；可臨時提供。（p.26）
- BA17d2：每週上限 3 組，特殊情況得專案增次；可臨時提供。（p.26）
- BA17e：每週上限 1 組。（p.26）
- BA18：不得與任何其他組合同時段使用（可接續）。（p.26）
- BA20：不得與任何其他組合同時段使用（可接續）。（p.27）
- BA22：不得搭配其他照顧組合；服務時段 06:00–20:00 至少三次；非此時段依審核得加計 AA08；不得臨時提供。（p.27）
- BA23：同時段不得與 BA01、BA07 併報；可臨時提供。（p.27–28）
- BA24：若在 BA01／BA07 過程中執行，不得另計；可臨時提供。（p.28）

### 四、BB（日間照顧）與 BC（家庭托顧）—互斥／上限

- 全日（BB01/03/05/07/09/11/13；BC01/03/05/07/09/11/13）：一日為一單位；交通另計（D 碼或 BD03）。（p.28–34）
- 半日（BB02/04/06/08/10/12/14；BC02/04/06/08/10/12/14）：半日為一單位，同日不得申請兩次；交通另計。（p.28–34）

### 五、BD 碼（社區式補充）

- BD03：住家與機構距離 ≤10 公里方適用（超距離自付）；每趟 1 單位；須職業駕照駕駛；外籍看護之家戶可使用。（p.34–35）
- BD01／BD02：未見額外互斥或頻次上限明文。（p.34）

### 六、C 碼（專業服務）—互斥／上限

- CA07：3 次（含評估）= 1 單位。（p.35–38）
- CA08：4 次（含評估與 ISP 擬定）= 1 單位。（p.35–38）
- CB01：4 次（含評估）= 1 單位；CB02：6 次；CB03：3 次；CB04：6 次。（p.35–38）
- CC01：2 次（含評估）= 1 單位；所需輔具／空間修繕另依 E／F 碼計。（p.35–38）
- CD02：3 次（含評估）+ 1 次評值 = 1 單位。（p.35–38）

### 七、D 碼（交通接送）

- DA01：每次 1 單位；就醫轉乘／接駁經地方政府核認後，起迄任一端不必限於居家或院所；支付價格由所在地主管機關公告；駕駛須職業駕照。（p.38–39、p.7、p.19）

### 八、G 碼（喘息服務）

- GA09 居家喘息：2 小時 = 1 單位；單日上限 10 小時；如有陪同就醫可加計 BA14。（p.40）
- GA03／GA04／GA05／GA06／GA07：單位別（全日、半日、夜間、每小時）含交通接送；GA05（機構住宿式）1 日（24 小時）= 1 單位；GA06 夜間定義 18:00–翌日 08:00。另依第 11 條排除條件執行互斥。（p.39–40、p.4–5）

### 九、E 碼（輔具）—互斥／上限（租賃單位／最低使用年限／擇一／依附關係）

- 整體額度：每三年一次；與身障輔具補助互斥，相同項目且未達最低使用年限者不得重複申請。（第 10 條第 2 項、p.4–5、p.41–60）
- 通則：可租賃者皆以 1 月為租賃單位（未滿月比例計）；EG01/EG02、EC03 等註明「免部分負擔」；各碼頁列出最低使用年限（多為 2–10 年）。（各碼頁）
- EA01：限購置，最低使用年限 3 年。（p.41）
- EB01／EB02：單支柺杖限購置，可核給雙側，年限 5／3 年。（p.41）
- EB03：助行器限購置，年限 3 年。（p.41）
- EB04：助步車可租賃或購置，租賃以月計，年限 3 年。（p.41–42）
- EC01／EC02／EC03：輪椅 A/B/C 三擇一；EC02 可租賃（月租），EC03 免部分負擔，年限 3 年。（p.42–43）
- EC04～EC06：輪椅附加功能 A/B/C 可租賃（月租），必須搭配 EC02 或 EC03 同時申請，年限 3 年。（p.43–44）
- EC07～EC10：擺位系統 A–D 限購置；EC07 與 EC08 擇一；單支側支撐架補助減半；年限 3 年。（p.44–45）
- EC11／EC12：電動輪椅與電動代步車二擇一，皆限租賃（月租）。（p.45–46）
- ED01～ED06：移位腰帶／板／吊帶／滑墊／轉盤限購置，年限 3–5 年。（p.46–48）
- ED07：移位機可租賃（月租）或購置，年限 10 年，含吊帶。ED08 吊帶限購置，僅適用於購置 ED07 滿 3 年之更換，年限 3 年。（p.48–49）
- EE01～EE05：電話擴音、閃光／震動警示、火警、門鈴等限購置，年限 5 年。（p.49）
- EF01～EF03：衣著／生活／飲食用輔具限購置，年限 3 年。（p.49–50）
- EG01／EG02：氣墊床 A/B 可租賃或購置，免部分負擔，年限 3 年。（p.50–51）
- EG03～EG09：輪椅座墊 A–G 限購置，多數免部分負擔，年限 2–5 年。（p.51–52）
- EH01：居家用照顧床可租賃或購置，年限 5 年。EH02／EH03 附加功能需搭配 EH01 同時申請；EH04／EH05 為爬梯機（每趟或月租）。（p.52–54）

### 十、F 碼（居家無障礙環境改善）—互斥／上限

- 整體額度：每三年一次；多屬限購置，常以單處或尺寸計價；最低使用年限多為 10 年（少數 3 年）。（p.5、p.54–60）
- FA01：扶手每 10 公分補助 150 元，年限 10 年。（p.54–55）
- FA02：可動式扶手按單支計價，年限 10 年。（p.55）
- FA03～FA05：非固定式斜坡板 A/B/C，年限 10 年。（p.55）
- FA06：固定式斜坡道，年限 10 年。（p.55–56）
- FA07：架高式和式地板拆除，年限 10 年。（p.56）
- FA08：反光貼條或消光／止滑，單處計價，年限 3 年。（p.56）
- FA09：隔間每平方公尺 600 元，年限 10 年。（p.57）
- FA10：防滑措施，單處計價，年限 10 年。（p.57）
- FA11／FA12：同一處門改善僅能擇一款（A 或 B），年限 10 年。（p.57–58）
- FA13：水龍頭，單處計價，年限 10 年。（p.58）
- FA14～FA21：浴缸、洗臉台、馬桶、壁掛式淋浴椅、流理台、抽油煙機位置、特殊洗槽／浴槽等，單處計價，年限 10 年。（p.58–60）

### 十一、常見「同時段互斥／疊代」對照（程式必設的衝突集）

- 同時段互斥組合：
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

- 時間衝突檢核：
  - 建立「同時段互斥集合」包含 (BA01,BA07)、(BA01,BA23)、(BA07,BA23)、BA18 全互斥、BA20 全互斥、BA22 全互斥、AA08 與 AA09 同日互斥。若有重疊區間則擋案。
- 日／週／月上限：
  - BA02 ≤ 3 小時／日；BA17a ≤ 3 組／日；BA17b ≤ 3 組／日；BA17c ≤ 7 組／週；BA17d1 ≤ 1／日；BA17d2 ≤ 3／週（可專案放寬）；BA17e ≤ 1／週；GA09 ≤ 10 小時／日，超過即退件。
- 事件型上限：
  - BA01 原則 1 組／日（可早晚各 1）；BA04 每餐 1 組；BA05 在家備餐每次 1 組／一日管灌備餐 1 組；BA10/11 完整一次 1 單位；BB/BC 半日同日不得二次；GA05 1 日為 1 單位。
- 條件式開關：
  - BA12 需問題清單含「移位」或「上下樓梯」，且未使用電梯／爬梯機／樓梯升降椅。
  - BA14 超過 1.5 小時自動改以 BA13 補差；復健／透析請改走 D 碼與 BA13 等其他代碼。
  - BA15 共用區域自動 50% 給付；BA16 超 5 公里自付差額。
- AA 加計互斥與次數：
  - AA01/AA02 同月互斥；AA08 與 AA09 同日互斥且每日限加計一次；AA07 每月一次；AA11 每日一次（居家式與社區式各計）。
- 聘僱外籍看護自動限縮：
  - B/C 總額度上限 30%；預設僅允許 C 碼，但放行 BA09/BA09a、BD03 例外；結帳時阻擋其他 BA 碼。
- 喘息（G）排他：
  - 若無家庭照顧者或已領受他法同質臨托／短期照顧，阻擋 G 碼。
- 額度週期與結餘：
  - B/C、D 月度結餘保留 6 個月；E/F 三年一次；G 一年一次。期滿自動歸零；複評升／降等依第 13 條從優生效日處理結餘。
- 輔具互斥與依附：
  - EC01/02/03 三擇一；EC11/EC12 二擇一；EC07/EC08 二擇一；EC04～EC06 必須搭配 EC02 或 EC03；EH02/EH03 必須搭配 EH01。
  - 與身障輔具補助重疊檢核：相同項目且未達最低使用年限則阻擋。

---

## 常見維護與擴充建議

- 新增段落：在 `AppCore.gs` 中新增對應的 `applyH1_NewSection(body, form)`，並於 `DOCUMENT_WRITERS` 中按段落順序呼叫。
- 調整輸出格式：優先修改 `AppCore.gs` 內對應的 `applyH1_*` 段落，必要時更新同檔案中的共用工具函式；若涉及固定句構或詞彙，請同步調整 `DataStore.gs` 的 `H1_*` 模板字典後再套用。
- 新增欄位：
  1. 在 `Sidebar.html` 新增 UI 與資料整合邏輯。
  2. 調整 `applyAndSave` 的 `form` 組裝。
  3. 在 `AppCore.gs` 中對應的 `applyH1_*` 函式使用新欄位。
- 更新給付資料：若桃園市長照給付標準調整，請同步更新 `桃園市_長照給付資料庫_v1.xlsx` 並重新產出 `DataStore.gs` 中的 `TAOYUAN_LTC_DATA` 段落，同時檢視 `Sidebar.html` 內的服務代碼敘述是否對應。
- 即時欄位驗證：若新增欄位需依條件顯示錯誤提示，請於 `Sidebar.html` 的 `validateSection1` 或相關段落驗證函式補強，維持與 UI 提示一致。

---

## 測試建議

因專案沒有自動化測試，建議在每次修改後手動進行：

1. 於測試文件中開啟側欄，完成一份最小案例（僅必填欄位），確保能產生文件且內容完整。
2. 嘗試含有全部欄位的完整案例，確認段落組句格式正確（包含多重選項、快捷語句）。
3. 測試外部資源失敗情境（如撤除試算表權限），確認錯誤訊息清楚易懂。

---

## 版本控管

- 目前程式碼以平面檔案管理，適合直接複製到 Apps Script IDE。
- 建議在雲端端開啟 `File → Manage Versions`，將穩定版標記版本，以便回復。
- 若與多名開發者協作，建議採用 Git 儲存庫（如本專案）搭配 `clasp` 同步程式碼。

---

## 授權與貢獻指南

- **授權條款**：建議使用 MIT License。若儲存庫尚未附上 `LICENSE`，請於建立正式版本時補齊，以利外部使用者清楚了解授權範圍。
- **Issue 申請**：請依 `.github/ISSUE_TEMPLATE/bug_report.md` 或 `feature_request.md` 的欄位填寫（若尚未建立模板，可依「摘要／重現步驟／預期結果／實際結果／影響範圍」結構描述），並標註受影響的段落或檔案。
- **分支與 PR 流程**：依 GitHub Flow 建立 `feature/<summary>` 或 `fix/<summary>` 分支，完成後提交 PR，於描述中附上測試結果、截圖或輸出文件差異，並連結相關 Issue。
- **程式碼規範**：提交前請遵循 `AGENTS.md` 的最新程式碼風格、提交檢查與測試策略，避免將個資或私有連結寫入版本控管。
- **聯絡方式**：若需同步討論流程或設定，可於 Issue 中標記維護者，或透過團隊既定通訊管道（如 Slack/Teams）取得協助。

## 支援與回饋

若使用者或同仁發現：

- 字典/下拉選項需更新。
- 新段落文字格式與政策調整。
- 產出文件內容有誤或漏填。

請更新 Issues 或直接修改程式後提交 PR，並確保 README 與 `Constants.gs` 的說明保持同步。

祝開發順利！
