import fs from 'node:fs';
import path from 'node:path';
import { axe } from 'jest-axe';

describe('AA01 Sidebar accessibility', () => {
  const sidebarHtml = fs.readFileSync(path.resolve(__dirname, '../../src/Sidebar.html'), 'utf8');

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
