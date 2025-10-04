# CI 使用說明與 FAQ

本文件說明 `CI` GitHub Actions workflow 的執行方式、輸出位置與常見疑問。搭配 `README.md` 的環境需求章節，可協助新進成員快速理解自動化驗收與排錯流程。

## Workflow 概覽

| 項目          | 說明                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| 觸發條件      | Pull Request 事件（自動）、`workflow_dispatch`（手動）                                                      |
| 主要目的      | 維持 lint、單元測試、UI/A11y 驗收與健康檢查綠燈，並在失敗時產生彙整報告                                     |
| 遠端 E2E 條件 | `PLAYWRIGHT_AUTH_STATE` 與 `GAS_WEBAPP_URL` 兩個 Secrets 同時存在                                           |
| 失敗報告      | `scripts/collect-ci-failures.mjs` 生成 `reports/ci-failure-report.md`，附加在 Workflow Summary 與 Artifacts |

## 執行步驟與指令

Workflow 會照下列順序執行，步驟之間共用快取並在失敗時提前結束（Health 例外為非阻斷）：

1. **Install deps** – `npm ci`
2. **Lint** – `npm run lint`
3. **Unit (Jest)** – `npm test -- --runInBand`
4. **Install Playwright browsers** – `npx playwright install --with-deps`
5. **UI 檔案模式 E2E** – `npm run e2e:ui`
6. **Health** – `npm run health`（上傳 `artifacts/health*.json`，即使失敗也不會使 job 變紅）
7. **A11y (pa11y)** – `npm run test:a11y:pa11y`（若缺 URL 會 fallback 至 `test/a11y-fallback.html`）
8. **Remote E2E** – 僅在 Secrets 齊備時執行；否則標示 Skip 並說明原因
9. **Failure Report** – 收斂各步驟的 stdout/stderr，彙製 Markdown 報告並以 artifact 保存

> 建議開發者在本地以 `npm run predeploy` 快速重現上述流程，以降低 PR CI 失敗的機率。

## Secrets 與環境變數

| 名稱                                                           | 作用                                  | 是否必填     | 備註                                      |
| -------------------------------------------------------------- | ------------------------------------- | ------------ | ----------------------------------------- |
| `GAS_WEBAPP_URL`                                               | 健康檢查、pa11y 與遠端 E2E 的目標網址 | 遠端測試必填 | 缺少時健康檢查與遠端 E2E 會輸出 Skip 理由 |
| `PLAYWRIGHT_AUTH_STATE`                                        | 遠端 E2E 登入態（Base64 編碼）        | 遠端測試必填 | 建議每 30–60 天更新一次以避免過期         |
| `CLASPRC_JSON`                                                 | clasp 部署憑證                        | 部署任務使用 | CI 會自動判斷 JSON 或 Base64              |
| `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` / `GOOGLE_SERVICE_ACCOUNT` | OIDC 設定                             | 選填         | 與 `GAS_SERVICE_ACCOUNT_JSON` 擇一即可    |
| `GAS_SERVICE_ACCOUNT_JSON`                                     | Service Account JSON                  | 選填         | JSON 或 Base64 皆可                       |

`README.md` 的〈Secrets 與環境變數〉章節提供了設定細節與網址組合的防呆規則，設定前務必先閱讀。

## 失敗報告與 artifacts

- `reports/ci-failure-report.md`：列出失敗分類（lint/unit/ui/a11y/health/remote）、最近錯誤訊息與建議處置。
- `artifacts/playwright-report/`：Playwright 產出的 HTML 報告。
- `artifacts/playwright-results/`：包含 trace、影片與截圖。
- `artifacts/health*.json`：健康檢查的網址、HTTP 狀態碼與回應片段。

下載方式：於 GitHub Actions 頁面選擇對應工作，於 `Artifacts` 區塊下載壓縮檔即可。

## FAQ

### Q1. 為什麼 Remote E2E 被標示為 Skipped？

- 任一必需 Secrets（`GAS_WEBAPP_URL` 或 `PLAYWRIGHT_AUTH_STATE`）缺漏。
- Secrets 存在但內容為空字串或 Base64 解碼失敗，`collect-ci-failures.mjs` 會在報告中提示。
- Workflow 以手動 `workflow_dispatch` 觸發但設定 `HAS_AUTH=false`、`HAS_URL=false` 用於純本地驗證情境。

請在 PR 摘要中註明跳過原因，以利審查者確認預期行為。

### Q2. Health 步驟失敗會導致整個 CI 失敗嗎？

不會。Health 步驟為非阻斷，無論結果如何都會上傳 `artifacts/health*.json`。建議檢查 HTTP 狀態碼與回應內容，以排除憑證或部署網址問題。

### Q3. 如何更新 pa11y 的 fallback HTML？

當 UI 元件變更導致 pa11y 偵測不到預期元素時，請同步調整 `test/a11y-fallback.html`，並在 PR 內附上調整原因。完成後記得執行 `npm run test:a11y:pa11y` 確認綠燈。

### Q4. 我要如何重現 CI 產生的失敗報告？

在本地執行與 CI 相同的 `npm` 指令即可。若要檢視相同格式的報告，可於本地執行 `node scripts/collect-ci-failures.mjs --from artifacts`，將步驟輸出的 JSON/Log 指向報告器。

### Q5. CI 卡在安裝 Playwright 瀏覽器怎麼辦？

檢查 Runner 是否有可用的磁碟空間，並確認 `PLAYWRIGHT_BROWSERS_PATH` 未被覆寫到唯讀目錄。必要時可以在自訂 Runner 先行快取 `~/.cache/ms-playwright`。

---

如需補充更多問答，請於 PR 中同步更新此文件並在 `README.md` 的「常見紅燈處置」章節引用。
