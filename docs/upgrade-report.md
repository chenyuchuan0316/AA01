# 升版報告（2025-09-30）

## 套件總覽

| 套件 | 升級前 | 升級後 | 備註 |
| --- | --- | --- | --- |
| jest | 29.7.0 | 30.2.0 | 搭配 `glob@10`，落實 Node 18 需求。 |
| puppeteer | 22.15.0 | 24.22.3 | 預設 headless 行為調整，未直接引用但已記錄使用注意事項。 |
| glob（transitive） | 7.x | 10.4.x | 經由 Jest 更新，移除 `inflight`。 |
| google-auth-library | 7.14.1 | 9.15.1（override） | 改採 `gtoken@7`，完全移除 `google-p12-pem`。 |
| gtoken | 5.3.x | 7.0.1（override） | 與 `google-auth-library` 相容，支援 ADC/OIDC。 |
| googleapis / googleapis-common | 84.x / 6.x | 148.x / 7.2.x（override） | Script API discovery 更新，部署腳本仍相容。 |

## 高風險修復摘要

- **Puppeteer 24.x**：更新升版計畫與 README，提醒後續若導入 UI smoke test 必須顯式設定 `headless: true` 並依據新版 API 調整等待策略。
- **Glob 10.x**：藉由升級 Jest，改用 Promise 介面的 `glob`，同時移除棄用的 `inflight`。現有測試配置無需變更。
- **Google Auth 系列**：`gas-deploy.mjs` 新增 Service Account JSON 與 Application Default Credentials 支援，可透過 `GAS_SERVICE_ACCOUNT_JSON`、`GAS_USE_ADC` 或 `GOOGLE_APPLICATION_CREDENTIALS` 直接取得授權，完全淘汰 P12 憑證路徑並保留舊有 refresh token 流程作為備援。

## 測試與 CI

- `npm test -- --runInBand`：Jest 30 單元測試通過。
- `npm run e2e`：健康檢查腳本在未設定 `TEST_DEPLOYMENT_ID` 時會記錄「Skipping」並以 0 結束，維持 302 redirect 視為成功的既有邏輯。
- GitHub Actions：新增 `npm-outdated.yml` 與 `npm-auto-upgrade.yml`，可手動觸發並於每週排程執行，產出 Before/After 清單並自動開 PR（含 `dependencies`、`automated-pr` 標籤）。

## 後續建議

1. 將新的 auto-upgrade workflow 實際在 GitHub Actions 上手動跑一次，確認 PR 內容與 Summary 皆符合預期。
2. 觀察 `@google/clasp` 後續正式版（目前最新為 3.0.6-alpha），待穩定版釋出後再規劃升級並驗證 CLI 行為。
3. 若要導入 Puppeteer smoke test，建議在 workflow 中加裝 `libnss3` 與常用字型，並覆寫 `puppeteer.launch({ headless: true })` 以降低 flakiness。
4. 定期檢視 `docs/upgrade-plan.md`，將完成的 high risk 項目勾消並追蹤後續套件（例如 `googleapis-common` 8.x）的相容性評估。
