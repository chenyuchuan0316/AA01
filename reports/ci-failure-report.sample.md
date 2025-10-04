# CI Failure Report (sample)

Generated at 2025-01-15T02:34:12.000Z

| Category | Step               | Status  | Duration | Notes                                        |
| -------- | ------------------ | ------- | -------- | -------------------------------------------- |
| lint     | Lint               | failed  | 41s      | src/components/Card.vue                      |
| unit     | Unit tests         | passed  | 95s      | —                                            |
| ui       | UI file-mode E2E   | failed  | 183s     | Please run "npx playwright install"          |
| health   | Health check       | skipped | —        | Missing GAS_WEBAPP_URL secret.               |
| a11y     | Accessibility scan | passed  | 22s      | —                                            |
| remote   | Remote E2E         | skipped | —        | Remote run skipped: missing required secrets |

---

## Failure breakdown

### Lint

- **Category:** lint
- **Status:** failed
- **Command:** \
  `npm run lint`

#### Failure excerpt

```
error: Parsing error: Unexpected token <
    at src/components/Card.vue:15:7
```

#### Suggested next steps

- 確認 ESLint 設定與原始檔語法，必要時執行 `npm run lint -- --fix`。

### UI file-mode E2E

- **Category:** ui
- **Status:** failed
- **Command:** \
  `npm run e2e:ui`

#### Failure excerpt

```
Error: Please run "npx playwright install"
    at node_modules/@playwright/test/lib/runner/host.js:144:11
```

#### Suggested next steps

- 在 CI 之前加入 `npx playwright install --with-deps` 或確認瀏覽器快取。
