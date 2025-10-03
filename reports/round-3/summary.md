# Round 3 - Dependency and tooling cleanup

## Objectives

- Remove legacy puppeteer/e2e scripts and prune unused devDependencies.
- Add missing runtime dependencies for deployment scripts and configure depcheck/knip baselines.
- Document updated E2E behavior in upgrade docs.

## Results

| Command                                     | Status | Notes                                                                |
| ------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `npm run lint`                              | ✅     | Scripts/config updates lint cleanly.                                 |
| `npm run typecheck`                         | ✅     | Type definitions intact after dependency churn.                      |
| `npx depcheck --config depcheck.config.cjs` | ✅     | No unused/missing dependencies after ignore list and removals.       |
| `git ls-files \| npx knip`                  | ✅     | Manual CLI scripts and binaries ignored via config; no unused files. |

## Key Changes

- Added `tsconfig.json`, `.jscpd.json`, `depcheck.config.cjs`, and `knip.json` to stabilize tooling.
- Removed unused `e2e/` puppeteer scripts and obsolete `scripts/build-artifact-index.mjs`.
- Dropped unused devDependencies (`@eslint/eslintrc`, `@google/clasp`, `pa11y-ci`, `ts-node`, `puppeteer`, `jsdom`) while adding required ones (`@jest/globals`, `googleapis`, `undici`, `depcheck`).
- Updated upgrade docs to reflect Playwright-only smoke coverage and credential gating.
