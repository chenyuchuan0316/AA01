import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv();

const dirname = path.dirname(fileURLToPath(import.meta.url));
const sidebarPath = path.resolve(dirname, 'src', 'Sidebar.html');
const fallbackUrl = `file://${sidebarPath}`;
const rawEnvUrl = process.env.GAS_WEBAPP_URL?.trim() ?? '';
const placeholderValues = new Set(['', 'https://example.com', '<your-gas-webapp-url>']);
const envUrl = placeholderValues.has(rawEnvUrl) ? '' : rawEnvUrl;
const targetUrl = envUrl || fallbackUrl;

process.env.AA01_TARGET_URL = targetUrl;

const isHttp = /^https?:/i.test(targetUrl);

export default defineConfig({
  testDir: './playwright',
  timeout: 60000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: isHttp ? targetUrl : undefined,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'playwright-results',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}'
});
