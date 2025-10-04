import { jest } from '@jest/globals';
import { ReadableStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

// Polyfill for undici within the Jest runtime
const globalWithUndici = globalThis as typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  ReadableStream?: typeof ReadableStream;
};

Object.assign(globalWithUndici, {
  TextEncoder,
  TextDecoder,
  ReadableStream
});

const scriptPath = '../../scripts/health-check.mjs';
const helperModulePath = '../../scripts/url-helper.mjs';

type MockResponse = {
  status: number;
  redirected: boolean;
  headers: Headers;
  text: () => Promise<string>;
};

const flushPromises = async () => new Promise(resolve => setTimeout(resolve, 0));

describe('scripts/health-check', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.exitCode = undefined;
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('writes a successful summary when the target responds with 200', async () => {
    const writes: Array<{ file: string; data: unknown }> = [];
    const target = {
      href: 'https://example.com/exec?route=health',
      base: 'https://example.com/',
      path: '?route=health'
    };
    const buildTargetURL = jest.fn(() => target);
    const safeWriteJson = jest.fn((file: string, data: unknown) => {
      writes.push({ file, data });
    });

    jest.unstable_mockModule(helperModulePath, () => ({
      buildTargetURL,
      safeWriteJson
    }));

    const fetchMock = jest.fn(
      async () =>
        ({
          status: 200,
          redirected: false,
          headers: new Headers(),
          text: async () => 'ok'
        }) satisfies MockResponse
    );
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    process.env.GAS_WEBAPP_URL = target.base;
    process.env.E2E_PATH = target.path;

    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    await import(scriptPath);
    await flushPromises();

    expect(buildTargetURL).toHaveBeenCalledWith(target.base, target.path);
    expect(fetchMock).toHaveBeenCalledWith(
      target.href,
      expect.objectContaining({ redirect: 'manual' })
    );
    expect(writes[0]).toEqual({ file: 'artifacts/health-url.json', data: target });
    expect(writes[1].file).toBe('artifacts/health.json');
    const successSummary = writes[1].data as Record<string, unknown>;
    expect(successSummary).toMatchObject({ url: target.href, status: 200, redirected: false });
    expect(infoSpy).toHaveBeenCalledWith(`HEALTH_TARGET_URL=${target.href}`);
  });

  it('captures failure metadata and marks the process as failed for non-success status codes', async () => {
    const writes: Array<{ file: string; data: unknown }> = [];
    const target = {
      href: 'https://example.com/exec?route=health',
      base: 'https://example.com/',
      path: '?route=health'
    };
    const buildTargetURL = jest.fn(() => target);
    const safeWriteJson = jest.fn((file: string, data: unknown) => {
      writes.push({ file, data });
    });

    jest.unstable_mockModule(helperModulePath, () => ({
      buildTargetURL,
      safeWriteJson
    }));

    const fetchMock = jest.fn(
      async () =>
        ({
          status: 503,
          redirected: false,
          headers: new Headers(),
          text: async () => 'maintenance window'
        }) satisfies MockResponse
    );
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    process.env.GAS_WEBAPP_URL = target.base;
    process.env.E2E_PATH = target.path;

    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await import(scriptPath);
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBe(1);
    const failureSummary = writes[1].data as Record<string, unknown>;
    expect(failureSummary).toMatchObject({
      status: 503,
      error: { message: 'Unexpected status code: 503' }
    });
    expect(errorSpy).toHaveBeenCalledWith('HEALTH_CHECK_ERROR:', 'Unexpected status code: 503');
    expect(infoSpy).toHaveBeenCalledWith(`HEALTH_TARGET_URL=${target.href}`);
  });

  it('surfaces configuration errors when GAS_WEBAPP_URL is not provided', async () => {
    const buildTargetURL = jest.fn(() => {
      throw new Error('GAS_WEBAPP_URL is required.');
    });
    const safeWriteJson = jest.fn();

    jest.unstable_mockModule(helperModulePath, () => ({
      buildTargetURL,
      safeWriteJson
    }));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env.GAS_WEBAPP_URL = '   ';
    delete process.env.E2E_PATH;

    await import(scriptPath);
    await flushPromises();

    expect(buildTargetURL).toHaveBeenCalledWith('   ', undefined);
    expect(safeWriteJson).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('HEALTH_CHECK_ERROR:', 'GAS_WEBAPP_URL is required.');
    expect(process.exitCode).toBe(1);
  });
});
