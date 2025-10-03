import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { buildTargetURL } from './scripts/url-helper.mjs';

const hasAuthState = process.env.HAS_AUTH === 'true';
const isRemote = process.env.E2E_TARGET === 'remote';
const parsedTimeout = Number.parseInt(process.env.E2E_TIMEOUT ?? '30000', 10);
const baseTimeout = Number.isFinite(parsedTimeout) ? parsedTimeout : 30000;

let baseURL = process.env.LOCAL_BASE_URL || 'http://127.0.0.1:3000/';

if (isRemote) {
  const target = buildTargetURL(process.env.GAS_WEBAPP_URL, process.env.E2E_PATH);
  baseURL = target.href;
  console.info(`PLAYWRIGHT_BASEURL(remote)=${target.href}`);
}

export default defineConfig({
  testDir: './playwright',
  timeout: baseTimeout + 10000,
  expect: { timeout: baseTimeout },
  retries: 1,
  reporter: [['line'], ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }]],
  outputDir: 'artifacts/playwright-results',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: {
    storageState: hasAuthState ? 'auth.json' : undefined,
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: baseTimeout,
    actionTimeout: baseTimeout
  },
  projects: [
    {
      name: 'Desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Mini'] }
    },
    {
      name: 'Mobile',
      use: { ...devices['iPhone 12'] }
    }
  ]
});
