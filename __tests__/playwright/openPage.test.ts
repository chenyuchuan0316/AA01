import path from 'node:path';
import { jest } from '@jest/globals';

type BuildTarget = { href: string; base: string; path: string };

const modulePath = '../../playwright/utils/openPage.ts';
const helperPath = '../../scripts/url-helper.mjs';

function createPageMock(finalUrl: string) {
  const waitFor = jest.fn(async () => undefined);
  const locatorFactory = () => ({
    waitFor,
    first: () => ({ waitFor })
  });

  return {
    setViewportSize: jest.fn(async () => undefined),
    goto: jest.fn(async () => undefined),
    waitForLoadState: jest.fn(async () => undefined),
    url: jest.fn(() => finalUrl),
    locator: jest.fn(locatorFactory),
    getByText: jest.fn(() => ({
      first: () => ({ waitFor })
    }))
  } as unknown as import('@playwright/test').Page;
}

async function loadModule(
  buildTargetURL: jest.MockedFunction<(base?: string, path?: string) => BuildTarget>
) {
  jest.resetModules();
  jest.unstable_mockModule(helperPath, () => ({
    buildTargetURL
  }));
  return import(modulePath);
}

describe('playwright/utils/openPage', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  it('opens the local sidebar when remote mode is not requested', async () => {
    const buildTargetURL = jest.fn(() => ({ href: '', base: '', path: '' }));
    const { openPage } = await loadModule(buildTargetURL);
    const page = createPageMock('file://local-sidebar');

    const result = await openPage(page);

    expect(buildTargetURL).not.toHaveBeenCalled();
    expect(page.setViewportSize).toHaveBeenCalledWith({ width: 1280, height: 960 });
    expect(page.goto).toHaveBeenCalledWith(
      expect.stringContaining(path.join('src', 'Sidebar.html')),
      { waitUntil: 'domcontentloaded' }
    );
    expect(page.waitForLoadState).toHaveBeenCalledWith('networkidle');
    expect(result.targetUrl).toMatch(/^file:\/\/.*Sidebar\.html$/);
    expect(result.finalUrl).toBe('file://local-sidebar');
  });

  it('navigates to the remote GAS endpoint and waits for sidebar hydration', async () => {
    const remoteTarget: BuildTarget = {
      href: 'https://demo.example.com/macros/s/abc123/exec?route=ui',
      base: 'https://demo.example.com/macros/s/abc123/exec',
      path: '?route=ui'
    };
    const buildTargetURL = jest.fn(() => remoteTarget);
    const { openPage } = await loadModule(buildTargetURL);

    process.env.E2E_TARGET = 'remote';
    process.env.GAS_WEBAPP_URL = remoteTarget.base;
    process.env.E2E_PATH = remoteTarget.path;

    const page = createPageMock(remoteTarget.href);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    const result = await openPage(page, 1024, 768);

    expect(buildTargetURL).toHaveBeenCalledWith(remoteTarget.base, remoteTarget.path);
    expect(page.setViewportSize).toHaveBeenCalledWith({ width: 1024, height: 768 });
    expect(page.goto).toHaveBeenCalledWith(remoteTarget.href, { waitUntil: 'domcontentloaded' });
    expect(infoSpy).toHaveBeenCalledWith('[openPage] remote target URL', remoteTarget.href);
    expect(infoSpy).toHaveBeenCalledWith('[openPage] remote final URL', remoteTarget.href);
    expect(result).toEqual({ targetUrl: remoteTarget.href, finalUrl: remoteTarget.href });
  });

  it('throws when duplicate /exec segments are detected after navigation', async () => {
    const remoteTarget: BuildTarget = {
      href: 'https://demo.example.com/macros/s/abc123/exec/exec',
      base: 'https://demo.example.com/macros/s/abc123/exec',
      path: '?route=ui'
    };
    const buildTargetURL = jest.fn(() => remoteTarget);
    const { openPage } = await loadModule(buildTargetURL);

    process.env.E2E_TARGET = 'remote';
    process.env.GAS_WEBAPP_URL = remoteTarget.base;
    process.env.E2E_PATH = remoteTarget.path;

    const page = createPageMock(remoteTarget.href);

    await expect(openPage(page)).rejects.toThrow(/duplicate \/exec detected/);
  });

  it('throws when the login screen is reached instead of the sidebar', async () => {
    const remoteTarget: BuildTarget = {
      href: 'https://demo.example.com/macros/s/abc123/exec',
      base: 'https://demo.example.com/macros/s/abc123/exec',
      path: '?route=ui'
    };
    const buildTargetURL = jest.fn(() => remoteTarget);
    const { openPage } = await loadModule(buildTargetURL);

    process.env.E2E_TARGET = 'remote';
    process.env.GAS_WEBAPP_URL = remoteTarget.base;
    process.env.E2E_PATH = remoteTarget.path;

    const page = createPageMock('https://accounts.google.com/signin');

    await expect(openPage(page)).rejects.toThrow(/登入態過期/);
  });
});
