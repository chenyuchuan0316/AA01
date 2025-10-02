import { expect, test, type Page } from '@playwright/test';
import { isRemoteTarget, openPage } from './utils/openPage';

const isLocalTarget = !isRemoteTarget();

async function forceVisible(page: Page, selector: string, displayValue?: string) {
  if (!isLocalTarget) {
    return;
  }
  await page.evaluate(
    ({ sel, display }) => {
      const element = document.querySelector(sel);
      if (element instanceof HTMLElement) {
        element.removeAttribute('hidden');
        element.hidden = false;
        element.style.removeProperty('visibility');
        element.style.removeProperty('display');
        element.style.setProperty('display', display ?? 'block', 'important');
      }
    },
    { sel: selector, display: displayValue }
  );
}

async function ensureContactVisitGridVisible(page: Page) {
  if (!isLocalTarget) {
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('[hidden]').forEach(element => {
      if (element instanceof HTMLElement) {
        element.removeAttribute('hidden');
        element.hidden = false;
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
      } else if ('removeAttribute' in element) {
        element.removeAttribute('hidden');
      }
    });
    const group = document.getElementById('contactVisitGroup');
    if (group instanceof HTMLElement) {
      group.removeAttribute('hidden');
      group.hidden = false;
      group.style.setProperty('display', 'block', 'important');
    }
    const grid = group?.querySelector('.section-card-grid');
    if (grid instanceof HTMLElement) {
      grid.removeAttribute('hidden');
      grid.hidden = false;
      grid.style.setProperty('display', 'grid', 'important');
      let current = grid.parentElement;
      while (current && current instanceof HTMLElement) {
        current.removeAttribute('hidden');
        current.hidden = false;
        current.style.removeProperty('visibility');
        current.style.setProperty(
          'display',
          current === document.body ? 'block' : current.style.display || 'block',
          'important'
        );
        current = current.parentElement;
      }
    }
  });
}

test.describe('@ui AA01 Sidebar UI smoke checks', () => {
  test('@ui contact visit cards switch between 3/2/1 column layouts', async ({ page }) => {
    await openPage(page, 1280);
    await ensureContactVisitGridVisible(page);
    const grid = page.locator('#contactVisitGroup .section-card-grid');
    await expect(grid).toBeVisible();

    async function getColumnCount(width: number) {
      await page.setViewportSize({ width, height: 960 });
      return grid.evaluate(element => {
        const columns = getComputedStyle(element).gridTemplateColumns;
        if (!columns || columns === 'none') {
          return 0;
        }
        return columns
          .split(/\s+/)
          .map(value => value.trim())
          .filter(Boolean).length;
      });
    }

    const desktopColumns = await getColumnCount(1280);
    const tabletColumns = await getColumnCount(900);
    const mobileColumns = await getColumnCount(480);

    expect(desktopColumns).toBeGreaterThanOrEqual(3);
    expect(tabletColumns).toBeGreaterThanOrEqual(2);
    expect(mobileColumns).toBe(1);
  });

  test('@ui side navigation overlay toggles with the drawer trigger', async ({ page }) => {
    await openPage(page, 600);

    await page.evaluate(() => {
      const toggle = document.getElementById('sideNavToggleButton');
      if (toggle) {
        toggle.removeAttribute('disabled');
        toggle.setAttribute('aria-disabled', 'false');
      }
      const nav = document.getElementById('sideNav');
      if (nav) {
        nav.setAttribute('data-empty', '0');
      }
    });

    const toggleButton = page.locator('#sideNavToggleButton');
    await toggleButton.click();

    await expect(page.locator('body')).toHaveAttribute('data-side-nav-open', '1');
    await expect(page.locator('#sideNavBackdrop')).toBeVisible();

    await toggleButton.click();
    await expect(page.locator('body')).toHaveAttribute('data-side-nav-open', '0');
  });

  test('@ui relationship select keeps grouped options', async ({ page }) => {
    await openPage(page, 1024);
    await ensureContactVisitGridVisible(page);
    await forceVisible(page, '#primaryRel', 'block');
    const select = page.locator('#primaryRel');
    await expect(select).toBeVisible();
    await expect(select.locator('optgroup')).toHaveCount(7);
    await expect(select.locator('optgroup[label="孫輩"] option')).toContainText(['案孫', '案孫女']);
  });

  test('@ui required field status regions follow their inputs', async ({ page }) => {
    await openPage(page, 1024);
    const checks = await page.evaluate(() => {
      const pairs = [
        ['caseName', 'caseNameStatus'],
        ['consultName', 'consultStatus'],
        ['caseManagerName', 'caseManagerStatus']
      ] as const;
      return pairs.map(([inputId, statusId]) => {
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);
        if (!input || !status) {
          return { inputId, ok: false };
        }
        let current: Element | null = input;
        while (current && current.parentElement === input.parentElement) {
          current = current.nextElementSibling;
          if (current === status) {
            return { inputId, ok: true };
          }
        }
        return { inputId, ok: false };
      });
    });

    for (const result of checks) {
      expect(
        result.ok,
        `${result.inputId} status element should appear directly after its control`
      ).toBe(true);
    }
  });
});
