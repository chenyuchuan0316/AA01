import { jest } from '@jest/globals';

import { main as runAutoRepair, parseArgs } from '../../scripts/auto-repair.mjs';

describe('auto-repair script', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('parseArgs extracts CLI options', () => {
    const parsed = parseArgs([
      '--run',
      'npm test',
      '--verify',
      'npm lint',
      '--max',
      '5',
      '--backoff',
      '10'
    ]);
    expect(parsed).toEqual({ run: 'npm test', verify: 'npm lint', max: 5, backoff: 10 });
  });

  test('retries failing command and succeeds with backoff delay', async () => {
    const responses = [
      { command: 'echo fail', code: 1 },
      { command: 'echo fail', code: 0 }
    ];
    const spawnMock = jest.fn((command: string) => {
      const outcome = responses.shift();
      if (!outcome) {
        throw new Error(`Unexpected command invocation: ${command}`);
      }
      expect(command).toBe(outcome.command);
      return {
        on: (event: string, handler: (code: number) => void) => {
          if (event === 'exit') {
            setTimeout(() => handler(outcome.code), 0);
          }
        }
      };
    });

    const exitMock = jest.fn();
    const delayMock = jest.fn(async () => undefined);

    await runAutoRepair(['--run', 'echo fail', '--max', '3', '--backoff', '1'], {
      spawnFn: spawnMock as unknown as typeof import('node:child_process').spawn,
      delayFn: delayMock,
      exit: exitMock as unknown as (code?: number) => never
    });

    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(delayMock).toHaveBeenCalledTimes(1);
    expect(delayMock).toHaveBeenCalledWith(1000);
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('stop-loss triggers when signature repeats despite retries', async () => {
    const responses = [
      { command: 'echo fail', code: 1 },
      { command: 'echo verify', code: 1 },
      { command: 'echo fail', code: 1 },
      { command: 'echo verify', code: 1 }
    ];
    const spawnMock = jest.fn((command: string) => {
      const outcome = responses.shift();
      if (!outcome) {
        throw new Error(`Unexpected command invocation: ${command}`);
      }
      expect(command).toBe(outcome.command);
      return {
        on: (event: string, handler: (code: number) => void) => {
          if (event === 'exit') {
            setTimeout(() => handler(outcome.code), 0);
          }
        }
      };
    });

    const exitMock = jest.fn();
    const delayMock = jest.fn(async () => undefined);

    await runAutoRepair(
      ['--run', 'echo fail', '--verify', 'echo verify', '--max', '5', '--backoff', '2'],
      {
        spawnFn: spawnMock as unknown as typeof import('node:child_process').spawn,
        delayFn: delayMock,
        exit: exitMock as unknown as (code?: number) => never
      }
    );

    expect(spawnMock).toHaveBeenCalledTimes(4);
    expect(delayMock).toHaveBeenCalledTimes(1);
    expect(delayMock).toHaveBeenCalledWith(2000);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  test('exits with code 2 when run command is missing', async () => {
    const exitMock = jest.fn();
    await runAutoRepair([], { exit: exitMock as unknown as (code?: number) => never });
    expect(exitMock).toHaveBeenCalledWith(2);
  });
});
