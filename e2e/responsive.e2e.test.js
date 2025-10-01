#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const { TEST_DEPLOYMENT_ID } = process.env;

if (!TEST_DEPLOYMENT_ID) {
  console.warn('Skipping responsive screenshots because TEST_DEPLOYMENT_ID is not set.');
  process.exit(0);
}

const baseUrl = `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`;
const screenshotDir = path.resolve('artifacts', 'screenshots');
const viewports = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'tablet', width: 1024, height: 768 },
  { label: 'mobile', width: 393, height: 852 }
];

(async () => {
  await fs.promises.mkdir(screenshotDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height });

      try {
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (error) {
        console.warn(`Navigation warning for ${viewport.label}:`, error.message);
      }

      await page.waitForTimeout(2000);

      const fileName = `responsive-${viewport.label}-${viewport.width}x${viewport.height}.png`;
      const filePath = path.join(screenshotDir, fileName);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved screenshot for ${viewport.label} viewport to ${filePath}`);

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log('Responsive E2E screenshots complete for', baseUrl);
})();
