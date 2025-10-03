import path from 'node:path';
import type { Page } from '@playwright/test';

const localHtml = 'file://' + path.resolve('src/Sidebar.html');

function joinUrl(base: string, extra?: string) {
  if (!extra) return base;
  if (/^[?#]/.test(extra)) return base + extra;
  if (extra.startsWith('/')) return base.replace(/\/+$/, '') + extra;
  return base.replace(/\/+$/, '') + '/' + extra.replace(/^\/+/, '');
}

export function isRemoteTarget(): boolean {
  return process.env.E2E_TARGET === 'remote' && Boolean(process.env.GAS_WEBAPP_URL);
}

export async function openPage(page: Page, width = 1280, height = 960) {
  await page.setViewportSize({ width, height });
  const base = process.env.GAS_WEBAPP_URL || '';
  const extra = process.env.E2E_PATH || '';
  const target = isRemoteTarget() ? joinUrl(base, extra) : localHtml;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');

  if (isRemoteTarget()) {
    const currentUrl = page.url();
    if (/accounts\.google\.com/i.test(currentUrl)) {
      throw new Error('登入態過期，請重新產生 auth.json 後重試');
    }
    const nav = page.locator('[data-testid=side-nav]');
    const navToggle = page.locator('[data-testid=side-nav-toggle]');
    const basicInfoGroup = page.locator('#basicInfoGroup');
    const basicInfoText = page.getByText('基本資訊');
    await Promise.race([
      nav.first().waitFor({ state: 'visible', timeout: 10000 }),
      navToggle.first().waitFor({ state: 'visible', timeout: 10000 }),
      basicInfoGroup.waitFor({ state: 'visible', timeout: 10000 }),
      basicInfoText.first().waitFor({ state: 'visible', timeout: 10000 })
    ]);
  }
}
