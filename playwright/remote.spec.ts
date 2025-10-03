import { test, expect, type Page } from '@playwright/test';
import { openPage } from './utils/openPage.js';

const HAS_AUTH = process.env.HAS_AUTH === 'true';
const DESKTOP_VIEWPORT = { width: 1280, height: 900 } as const;
const TABLET_VIEWPORT = { width: 1024, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

async function openRemoteSidebar(page: Page, viewport: { width: number; height: number }) {
  await openPage(page, viewport.width, viewport.height);
  const toggle = page.getByTestId('side-nav-toggle').first();
  const sideNav = page.getByTestId('side-nav').first();
  return { toggle, sideNav };
}

test.describe('AA01 remote sidebar RWD smoke (@remote)', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(
    !HAS_AUTH,
    'HAS_AUTH false → 跳過遠端測試；請提供 PLAYWRIGHT_AUTH_STATE 與 GAS_WEBAPP_URL'
  );

  test('desktop (>=1280): static sidebar; no toggle present', async ({ page }) => {
    await openPage(page, DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const toggle = page.getByTestId('side-nav-toggle');
    await expect(toggle).toHaveCount(0); // 桌機通常沒有 toggle
    await expect(page.getByTestId('side-nav').first()).toBeVisible();
  });

  test('remote target URL is normalized', async ({ page }) => {
    const { targetUrl, finalUrl } = await openPage(page);
    expect(targetUrl).not.toMatch(/\/exec\/exec/i);
    expect(finalUrl).not.toMatch(/\/exec\/exec/i);
  });

  test('tablet (640–1279): toggle exists, nav opens/closes', async ({ page }) => {
    const { toggle, sideNav } = await openRemoteSidebar(page, TABLET_VIEWPORT);

    await expect(toggle).toBeVisible();
    await expect(sideNav).toBeHidden({ timeout: 0 });

    await toggle.click();
    await expect(sideNav).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', /\btrue\b/i);

    await toggle.click();
    await expect(sideNav).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', /\bfalse\b/i);
  });

  test('mobile (<640): toggle exists, overlay behavior holds', async ({ page }) => {
    const { toggle, sideNav } = await openRemoteSidebar(page, MOBILE_VIEWPORT);

    await expect(toggle).toBeVisible();
    await expect(sideNav).toBeHidden({ timeout: 0 });

    await toggle.click();
    await expect(sideNav).toBeVisible();
  });

  test('contact visit grid renders', async ({ page }) => {
    await openPage(page);
    const grid = page.getByTestId('contact-visit-grid').first();
    await expect(grid).toBeVisible();
  });
});
