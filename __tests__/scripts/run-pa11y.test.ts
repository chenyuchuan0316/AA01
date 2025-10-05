import path from 'node:path';
import { jest } from '@jest/globals';

const scriptPath = '../../scripts/run-pa11y.mjs';

const ORIGINAL_ENV = { ...process.env };

async function executeScript({
  env = {},
  pa11yImplementation
}: {
  env?: Record<string, string | undefined>;
  pa11yImplementation?: () => Promise<{
    issues: Array<{ type: string; message: string; selector: string }>;
  }>;
} = {}) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...env };

  const infoLogs: string[] = [];
  const errorLogs: string[] = [];
  const exitCalls: Array<number | string> = [];

  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {
    exitCalls.push(typeof code === 'number' ? code : Number(code ?? 0));
    return undefined as never;
  });
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(message => {
    infoLogs.push(String(message));
  });
  const errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    errorLogs.push(args.map(value => String(value)).join(' '));
  });

  const pa11yMock = jest.fn(
    pa11yImplementation ??
      (() =>
        Promise.resolve({
          issues: []
        }))
  );

  jest.unstable_mockModule('pa11y', () => ({
    default: pa11yMock
  }));

  await import(scriptPath);

  exitSpy.mockRestore();
  infoSpy.mockRestore();
  errorSpy.mockRestore();
  jest.resetModules();

  return { exitCalls, infoLogs, errorLogs, pa11yMock };
}

describe('scripts/run-pa11y', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('falls back to the local fixture when GAS_WEBAPP_URL is missing', async () => {
    const fallbackTarget = `file://${path.resolve(process.cwd(), 'test', 'a11y-fallback.html')}`;
    const { exitCalls, infoLogs, pa11yMock } = await executeScript({
      env: { GAS_WEBAPP_URL: '  ' }
    });

    expect(exitCalls).toEqual([0]);
    expect(infoLogs.some(log => log.includes('pa11y fallback target'))).toBe(true);
    expect(pa11yMock).toHaveBeenCalledWith(
      fallbackTarget,
      expect.objectContaining({
        standard: 'WCAG2AA',
        timeout: 20000
      })
    );
  });

  it('targets the remote GAS URL when provided', async () => {
    const gasUrl = 'https://demo.example.com/macros/s/abc123/exec';
    const { exitCalls, infoLogs, pa11yMock } = await executeScript({
      env: { GAS_WEBAPP_URL: gasUrl }
    });

    expect(exitCalls).toEqual([0]);
    expect(infoLogs).toContain(`pa11y scan passed for ${gasUrl}`);
    expect(pa11yMock).toHaveBeenCalledWith(
      gasUrl,
      expect.objectContaining({ actions: ['wait for element #appMain to be visible'] })
    );
  });

  it('prints a remediation-friendly report when issues are detected', async () => {
    const gasUrl = 'https://demo.example.com/macros/s/abc123/exec';
    const { exitCalls, errorLogs } = await executeScript({
      env: { GAS_WEBAPP_URL: gasUrl },
      pa11yImplementation: () =>
        Promise.resolve({
          issues: [
            { type: 'error', message: 'Missing accessible name', selector: '#primary-action' },
            { type: 'warning', message: 'Color contrast', selector: '.button-secondary' }
          ]
        })
    });

    expect(exitCalls[0]).toBe(1);
    expect(errorLogs[0]).toContain('pa11y found 2 issue(s)');
    expect(errorLogs).toEqual(
      expect.arrayContaining([
        expect.stringContaining('- [error] Missing accessible name (#primary-action)'),
        expect.stringContaining('- [warning] Color contrast (.button-secondary)')
      ])
    );
  });
});
