import fs from 'node:fs';
import { axe } from 'jest-axe';

describe('AA01 Sidebar accessibility', () => {
  const sidebarHtml = fs.readFileSync(new URL('../../src/Sidebar.html', import.meta.url), 'utf8');

  beforeEach(() => {
    document.body.innerHTML = sidebarHtml;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('basic information form segment meets baseline accessibility', async () => {
    const group = document.getElementById('basicInfoGroup');
    expect(group).not.toBeNull();
    const results = await axe(group!);
    expect(results).toHaveNoViolations();
  });

  test('side navigation landmarks are accessible', async () => {
    const sideNav = document.getElementById('sideNav');
    expect(sideNav).not.toBeNull();
    const results = await axe(sideNav!);
    expect(results).toHaveNoViolations();
  });
});
