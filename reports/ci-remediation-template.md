# CI Remediation Template

映射常見錯誤訊息與對應的修復建議。收斂器會讀取此表格來推薦下一步行動。

| Category | Pattern                               | Suggested remediation                                                    |
| -------- | ------------------------------------- | ------------------------------------------------------------------------ |
| lint     | "Parsing error"                       | 確認 ESLint 設定與原始檔語法，必要時執行 `npm run lint -- --fix`。       |
| lint     | "No files matching"                   | 檢查 lint 腳本的檔案路徑設定是否正確或是否遺失必要檔案。                 |
| unit     | "Test Suites: Failed"                 | 執行 `npm test -- --runInBand` 並修正失敗的測試或更新快照。              |
| unit     | "ReferenceError"                      | 確認測試環境的模擬依賴與匯入路徑是否正確。                               |
| ui       | "Please run \"npx playwright install" | 在 CI 之前加入 `npx playwright install --with-deps` 或確認瀏覽器快取。   |
| ui       | "Timeout of"                          | 檢查測試等待條件與伺服器回應時間，適度放寬 `E2E_TIMEOUT`。               |
| a11y     | "pa11y"                               | 使用 `npm run test:a11y:pa11y` 在本地重現並確認掃描目標可正確載入。      |
| health   | "ECONNREFUSED"                        | 確認 `GAS_WEBAPP_URL` 設定與部署環境可連線，必要時重新部署。             |
| remote   | "Missing PLAYWRIGHT_AUTH_STATE"       | 於 Repository secrets 新增 `PLAYWRIGHT_AUTH_STATE`，或將遠端測試條件化。 |
| remote   | "Missing GAS_WEBAPP_URL"              | 於 Repository secrets 新增 `GAS_WEBAPP_URL`，或在 CI 中跳過遠端測試。    |
| remote   | "Timeout"                             | 確認遠端環境可存取並適度提升 `E2E_TIMEOUT`。                             |
