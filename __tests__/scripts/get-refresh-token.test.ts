import { jest } from '@jest/globals';

describe('get-refresh-token CLI flow', () => {
  const originalEnv = { ...process.env };
  let originalSigintListeners: Array<(...args: unknown[]) => void>;

  beforeEach(() => {
    jest.resetModules();
    originalSigintListeners = process.listeners('SIGINT');
    process.env.GAS_CLIENT_ID = 'client-id';
    process.env.GAS_CLIENT_SECRET = 'client-secret';
    process.env.GAS_OAUTH_SCOPES = 'scope.one scope.two';
    process.env.GAS_OAUTH_REDIRECT_PORT = '7777';
  });

  afterEach(() => {
    for (const listener of process.listeners('SIGINT')) {
      if (!originalSigintListeners.includes(listener)) {
        process.removeListener('SIGINT', listener);
      }
    }
    jest.restoreAllMocks();
    jest.resetModules();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  test('prints authorization URL and handles successful callback', async () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    let capturedHandler:
      | ((
          req: { url?: string | null },
          res: { writeHead: jest.Mock; end: jest.Mock }
        ) => Promise<void> | void)
      | null = null;
    const listenMock = jest.fn((_port: number, cb: () => void) => cb());
    const closeMock = jest.fn((cb?: () => void) => cb?.());

    await jest.unstable_mockModule('node:http', () => ({
      __esModule: true,
      default: {
        createServer: jest.fn((handler: unknown) => {
          capturedHandler = handler as typeof capturedHandler;
          return { listen: listenMock, close: closeMock };
        })
      }
    }));

    const generateAuthUrl = jest.fn(() => 'https://example.com/auth');
    const getToken = jest.fn(async () => ({ tokens: { refresh_token: 'refresh-token-123' } }));

    await jest.unstable_mockModule('googleapis', () => ({
      __esModule: true,
      google: {
        auth: {
          OAuth2: class {
            constructor(
              public clientId: string,
              public clientSecret: string,
              public redirect: string
            ) {}
            generateAuthUrl = generateAuthUrl;
            getToken = getToken;
          }
        }
      }
    }));

    await import('../../get-refresh-token.mjs');
    expect(listenMock).toHaveBeenCalledWith(7777, expect.any(Function));
    expect(generateAuthUrl).toHaveBeenCalledWith({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['scope.one', 'scope.two'],
      state: '4fzzzxjylr'
    });

    if (!capturedHandler) {
      throw new Error('Expected HTTP handler to be registered');
    }

    const writeHead = jest.fn();
    const end = jest.fn();
    await capturedHandler(
      { url: '/oauth2callback?state=4fzzzxjylr&code=auth-code' },
      { writeHead, end }
    );

    expect(getToken).toHaveBeenCalledWith('auth-code');
    expect(writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    expect(end).toHaveBeenCalledWith('Authorization complete. You may close this tab.');
    expect(closeMock).toHaveBeenCalled();
    expect(logs.join('\n')).toContain('refresh-token-123');

    randomSpy.mockRestore();
  });

  test('exits early when redirect port is invalid', async () => {
    process.env.GAS_OAUTH_REDIRECT_PORT = '-1';
    const exitMock = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(import('../../get-refresh-token.mjs')).rejects.toThrow('exit');
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
