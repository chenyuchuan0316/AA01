# npm 升版待辦（2025-09-30）

為了清除 CI 上出現的棄用套件（`puppeteer < 24.10.2`、`glob < 9`、`inflight`、`google-p12-pem`）並建立自動化升版流程，我們先盤點當前的 npm 依賴狀態，並依風險劃分為兩個批次。

## 過時套件盤點

| Package | Current | Wanted | Latest |
| --- | --- | --- | --- |
| @google/clasp | 2.5.0 | 2.5.0 | 3.0.6-alpha |
| jest | 29.7.0 | 29.7.0 | 30.2.0 |
| puppeteer | 22.15.0 | 22.15.0 | 24.22.3 |

> 來源：`npm outdated --json` 產出的 `outdated.json`。

## 批次 A（safe）

目前所有過時套件皆需要 major 升版才能達成安全需求，因此本批次暫無待辦。Workflow `npm-auto-upgrade.yml` 的 `safe` 策略仍會保留，用於後續例行性的 patch/minor 更新。

## 批次 B（major / high risk）

| 套件 | 現行 → 目標 | 風險等級 | 變更摘要 | 可能影響檔案 / API | 驗證策略 |
| --- | --- | --- | --- | --- | --- |
| puppeteer | 22.15.0 → ≥24.22.3 | high | 24.x 系列改採 `browser.download` 設定管理 Chromium；`puppeteer.launch()` 預設不再等同舊版 headless，需要明確指定 `headless: true`；部分 `page.waitFor*` API 轉向 `waitForSelector` 等新方法。 | 未直接引用，但 CI 端若新增 smoke 測試腳本將需調整 `launch` 選項與等待邏輯。 | 單元測試 + `npm run e2e`；如後續新增 Puppeteer smoke 測試，需確認 302 redirect 視為通過。 |
| glob（透過 Jest） | 7.x → 10.4.x | high | `glob@10` 改為 Promise/async API，CLI 預設遵循現代 ignore/dot 行為，並去除 `inflight` 相依。 | `jest.config.js` 解析測試檔案的行為；任何以 glob pattern 搜尋檔案的自訂指令需確認 Node 18 行為一致。 | `npm test`，檢查測試發現器是否仍能鎖定 `__tests__/*.test.js`。 |
| jest | 29.7.0 → 30.2.0 | medium | 要求 Node ≥18；整合 `glob@10`、新的 CLI signal 處理，預設使用 `jest-circus` 並更新 watch 模式依賴。 | `jest.config.js`、所有單元測試。 | `npm test -- --runInBand`。 |
| google-auth-library（透過 clasp） | 7.14.1 → 9.15.1（override） | high | 9.x 改採 `gtoken@7`，完全移除 `google-p12-pem`；最低 Node 14；OAuth 流程改強制使用 JSON 憑證或 OIDC。 | `gas-deploy.mjs` 中的 OAuth 2 client；任何手動匯入 p12 金鑰的文件需改用 Service Account JSON。 | `npm run e2e`（確認 health check 對 302 邏輯仍正常）、於 staging 測試 `gas-deploy.mjs`。 |
| gtoken | 5.3.x → 7.0.1（override） | medium | 移除 `google-p12-pem`；改依賴 `gaxios@6`，支援更完整的 ADC/OIDC 流程。 | `gas-deploy.mjs` 透過 `google-auth-library` 取得 access token。 | 同上，另需在 README 補充 JSON 金鑰／OIDC 指南。 |
| googleapis / googleapis-common | 84.x → 148.x / 7.2.x（override） | medium | 封裝的 discovery 定義更新，對 v1 Script API 沒有 breaking changes，但 `Auth.plus` 相關 helper 已改為以 Promise 回傳。 | `gas-deploy.mjs` 使用的 `google.script` client。 | smoke 測試部署腳本（於 CI / staging），確認 `projects.updateContent`、`deployments.update` 仍成功。 |

### 高風險注意事項
- **Puppeteer**：若後續加入自動化 UI 測試，需固定 `headless: true`，並於 CI 安裝 `libnss3`/字型（Ubuntu 24.04 預設已附）。等待邏輯應改用 `page.waitForSelector` 等條件式 API。
- **Glob**：`glob@10` 預設不再支援 callback。若我們未來導入以 glob 搜尋檔案的自動化腳本，必須改用 Promise 介面或同步 API。
- **google-auth-library / gtoken**：已完全移除 `google-p12-pem` 路徑，所有舊的 P12 憑證需轉換為 Service Account JSON，或在 CI 中改走 OIDC。

## 驗證與回滾策略
- 每個批次升版需建立獨立分支與 PR，PR 內附 Before/After 的 `npm outdated` 表格與測試結果。
- CI 需跑 `npm test` 與 `npm run e2e`（後者若 `TEST_DEPLOYMENT_ID` 未設定會自動跳過並標記為成功）。
- 若合併後 24 小時內出現回歸，可使用 GitHub 的 `Revert` 功能回滾該 PR，並開 Issue 記錄失敗案例。 
