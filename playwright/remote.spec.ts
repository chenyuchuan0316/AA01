import { expect, test } from '@playwright/test';
import { isRemoteTarget, openPage } from './utils/openPage';

const hasAuthState = process.env.HAS_AUTH === 'true';
const gasUrl = process.env.GAS_WEBAPP_URL ?? '';
const skipReason = !isRemoteTarget()
  ? 'remote target not enabled'
  : !gasUrl
    ? 'GAS_WEBAPP_URL not set'
    : !hasAuthState
      ? 'HAS_AUTH flag not enabled for remote tests'
      : '';

test.describe('@remote GAS sidebar smoke checks', () => {
  if (skipReason) {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(true, skipReason);
  }

  test('@remote sidebar renders navigation for authenticated session', async ({ page }) => {
    await openPage(page);
    const toggleButton = page.locator('#sideNavToggleButton');
    const sideNav = page.locator('nav#sideNav');

    await expect(toggleButton).toBeVisible();
    await expect(sideNav).toBeHidden({ timeout: 0 });

    await toggleButton.click();
    await expect(sideNav).toBeVisible();
  });
});
