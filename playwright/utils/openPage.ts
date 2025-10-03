import path from 'node:path';
import type { Page } from '@playwright/test';
import { buildTargetURL } from '../../scripts/url-helper.mjs';

const localHtml = 'file://' + path.resolve('src/Sidebar.html');

export function isRemoteTarget(): boolean {
  return process.env.E2E_TARGET === 'remote';
}

export async function openPage(page: Page, width = 1280, height = 960) {
  await page.setViewportSize({ width, height });

  const remote = isRemoteTarget();
  let targetUrl = localHtml;

  if (remote) {
    const remoteUrl = buildTargetURL(process.env.GAS_WEBAPP_URL, process.env.E2E_PATH);
    targetUrl = remoteUrl.href;
    console.info('[openPage] remote target URL', targetUrl);
  }

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();

  if (remote) {
    console.info('[openPage] remote final URL', currentUrl);
    if (/\/exec\/exec/i.test(currentUrl) || /\/exec\/exec/i.test(targetUrl)) {
      throw new Error(`duplicate /exec detected in remote URL: ${currentUrl}`);
    }
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
  return { targetUrl, finalUrl: currentUrl };
}
