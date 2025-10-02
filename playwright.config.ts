import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

const hasAuthState = fs.existsSync('auth.json');

export default defineConfig({
  testDir: './playwright',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'playwright-results',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  use: {
    storageState: hasAuthState ? 'auth.json' : undefined,
    baseURL: process.env.GAS_WEBAPP_URL || undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
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
