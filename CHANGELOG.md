# Changelog

## 2025-09-30

### Added
- 新增 `npm outdated` 與 `npm auto upgrade` 兩個 GitHub Actions workflow，每週產生過時清單並支援 safe / major 升版策略。
- 建立 `/docs/upgrade-plan.md` 與 `/docs/upgrade-report.md`，紀錄升版計畫、驗證流程與後續建議。
- 新增 `.github/dependabot.yml`，每週追蹤 npm 依賴並分組 `glob`、`puppeteer`。

### Changed
- 將 `jest` 升級至 `30.2.0`、`puppeteer` 升級至 `24.22.3`，並透過 npm overrides 更新 `glob@10`、`google-auth-library@9`、`gtoken@7` 等關鍵相依以移除 `inflight` 與 `google-p12-pem`。
- `gas-deploy.mjs` 新增對 Service Account JSON / OIDC 的支援，可自動偵測 `GAS_SERVICE_ACCOUNT_JSON` 或 Application Default Credentials，並保留原有 OAuth refresh token 流程。
- `README.md` 補充開發環境需求、測試指令與金鑰設定建議，明確標示 P12 憑證已淘汰。

### Removed
- 透過相依升級移除棄用套件 `google-p12-pem` 與 `inflight`。
