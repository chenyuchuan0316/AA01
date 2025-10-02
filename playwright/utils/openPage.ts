import path from 'node:path';
import type { Page } from '@playwright/test';

const localHtml = 'file://' + path.resolve('src/Sidebar.html');

export function isRemoteTarget(): boolean {
  return process.env.E2E_TARGET === 'remote' && Boolean(process.env.GAS_WEBAPP_URL);
}

export async function openPage(page: Page, width = 1280, height = 960) {
  await page.setViewportSize({ width, height });
  const target = isRemoteTarget() ? (process.env.GAS_WEBAPP_URL as string) : localHtml;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  if (isRemoteTarget()) {
    const currentUrl = page.url();
    if (/accounts\.google\.com/i.test(currentUrl)) {
      throw new Error('登入態過期，請重新產生 auth.json 後重試');
    }
  }
}
