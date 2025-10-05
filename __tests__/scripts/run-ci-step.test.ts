import { jest } from '@jest/globals';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as runCiStepModule from '../../scripts/run-ci-step.mjs';

const {
  parseArgs,
  ensureResultsFile,
  readResults,
  writeResults,
  recordSkip,
  extractExcerpt,
  main: runCiStep
} = runCiStepModule;

describe('run-ci-step utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ci-step-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  function resultsPath(name = 'results.json') {
    return join(tempDir, name);
  }

  test('parseArgs extracts options and command arguments', () => {
    const { options, commandArgs } = parseArgs([
      '--category',
      'lint',
      '--label',
      'ESLint',
      '--results',
      'custom.json',
      '--non-blocking',
      '--',
      'npm',
      'run',
      'lint'
    ]);

    expect(options).toEqual({
      category: 'lint',
      label: 'ESLint',
      resultsPath: 'custom.json',
      nonBlocking: true,
      skipReason: undefined
    });
    expect(commandArgs).toEqual(['npm', 'run', 'lint']);
  });

  test('parseArgs defaults label to category and throws for missing category', () => {
    const parsed = parseArgs(['--category', 'unit', '--', 'npm', 'test']);
    expect(parsed.options.label).toBe('unit');

    expect(() => parseArgs(['--label', 'OnlyLabel'])).toThrow('Missing required --category.');
  });

  test('ensureResultsFile creates default payload and writeResults replaces entry per category', async () => {
    const file = resultsPath();
    await ensureResultsFile(file);
    const initial = JSON.parse(await readFile(file, 'utf8'));
    expect(initial).toMatchObject({ generatedAt: expect.any(String), steps: [] });

    const firstEntry = {
      category: 'unit',
      label: 'Jest',
      status: 'passed',
      command: 'npm test',
      durationMs: 1200,
      nonBlocking: false,
      recordedAt: '2024-01-01T00:00:10.000Z'
    };

    const secondEntry = { ...firstEntry, status: 'failed', recordedAt: '2024-01-01T00:01:00.000Z' };

    await writeResults(file, firstEntry);
    await writeResults(file, secondEntry);
    const updated = await readResults(file);
    expect(updated.steps).toHaveLength(1);
    expect(updated.steps[0]).toMatchObject({ status: 'failed', command: 'npm test' });
    expect(updated.generatedAt).toEqual(expect.any(String));
  });

  test('recordSkip stores skipped entry with reason', async () => {
    const file = resultsPath();
    await ensureResultsFile(file);

    await recordSkip({
      category: 'remote',
      label: 'Remote E2E',
      resultsPath: file,
      skipReason: 'Secrets missing'
    });

    const results = await readResults(file);
    expect(results.steps[0]).toMatchObject({
      category: 'remote',
      status: 'skipped',
      skipReason: 'Secrets missing'
    });
  });

  test('extractExcerpt limits lines to last n entries', () => {
    const text = Array.from({ length: 10 }, (_, index) => `line-${index + 1}`).join('\n');
    expect(extractExcerpt(text, 3)).toBe('line-8\nline-9\nline-10');
    expect(extractExcerpt('single line')).toBe('single line');
  });

  test('main records skip without invoking exit', async () => {
    const file = resultsPath();
    const exit = jest.fn();

    await runCiStep(['--category', 'health', '--skip', 'No URL provided', '--results', file], {
      exit: exit as unknown as (code?: string | number) => never
    });

    expect(exit).not.toHaveBeenCalled();
    const results = await readResults(file);
    expect(results.steps[0]).toMatchObject({ status: 'skipped', label: 'health' });
  });

  test('main records failure for non-blocking command without exiting', async () => {
    const file = resultsPath();
    const exit = jest.fn();

    const scriptPath = join(tempDir, 'fail.mjs');
    await writeFile(scriptPath, 'console.error("a11y failure"); process.exit(1);', 'utf8');

    await runCiStep(
      [
        '--category',
        'a11y',
        '--label',
        'Pa11y',
        '--non-blocking',
        '--results',
        file,
        '--',
        'node',
        scriptPath
      ],
      { exit: exit as unknown as (code?: string | number) => never }
    );

    expect(exit).not.toHaveBeenCalled();
    const results = await readResults(file);
    expect(results.steps[0].status).toBe('failed');
    expect(results.steps[0].command).toContain('node');
    expect(results.steps[0].excerpt).toContain('a11y failure');
  });
});
