import { jest } from '@jest/globals';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as collectModule from '../../scripts/collect-ci-failures.mjs';

const {
  parseArgs,
  parseTemplate,
  matchesPattern,
  findSuggestion,
  formatDuration,
  buildSummaryTable,
  buildSection,
  main: collectFailures
} = collectModule;

describe('collect-ci-failures utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'collect-ci-'));
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T03:04:05Z'));
  });

  afterEach(async () => {
    jest.useRealTimers();
    await rm(tempDir, { recursive: true, force: true });
  });

  test('parseArgs supports overrides', () => {
    const options = parseArgs([
      '--results',
      'steps.json',
      '--report',
      'report.md',
      '--template',
      'template.md',
      '--set-output',
      'summary.txt'
    ]);

    expect(options).toEqual({
      resultsPath: 'steps.json',
      reportPath: 'report.md',
      templatePath: 'template.md',
      outputPath: 'summary.txt'
    });
  });

  test('parseTemplate handles csv-like table rows', async () => {
    const templatePath = join(tempDir, 'template.md');
    await writeFile(
      templatePath,
      [
        '| Category | Pattern | Suggestion |',
        '| --- | --- | --- |',
        '| lint | ESLint | Fix lint |',
        '| * | /timeout/ | Retry |'
      ].join('\n'),
      'utf8'
    );

    const entries = await parseTemplate(templatePath);
    expect(entries).toEqual([
      { category: 'lint', pattern: 'ESLint', suggestion: 'Fix lint' },
      { category: '*', pattern: '/timeout/', suggestion: 'Retry' }
    ]);
  });

  test('matchesPattern supports regex and substring', () => {
    expect(matchesPattern('Lint failed: ESLint error', 'ESLint')).toBe(true);
    expect(matchesPattern('Timeout waiting', '/timeout/')).toBe(true);
    expect(matchesPattern('Success', 'error')).toBe(false);
  });

  test('findSuggestion returns fallback when no match', () => {
    const suggestion = findSuggestion({ category: 'unit', label: 'Tests', summary: 'All green' }, [
      { category: 'lint', pattern: 'error', suggestion: 'Fix' }
    ]);
    expect(suggestion).toContain('Review the Tests logs');
  });

  test('formatDuration produces minutes and seconds', () => {
    expect(formatDuration(30_000)).toBe('30s');
    expect(formatDuration(125_000)).toBe('2m 5s');
    expect(formatDuration(Number.NaN)).toBe('—');
  });

  test('buildSummaryTable renders markdown rows', () => {
    const table = buildSummaryTable([
      { category: 'lint', label: 'Lint', status: 'failed', durationMs: 1000, summary: 'oops' },
      { category: 'unit', label: 'Tests', status: 'passed', durationMs: 2000 }
    ]);

    expect(table).toContain('| Category | Step | Status | Duration | Notes |');
    expect(table).toContain('| lint | Lint | failed | 1s | oops |');
  });

  test('buildSection formats failure sections with suggestions', () => {
    const section = buildSection(
      {
        category: 'lint',
        label: 'Lint',
        status: 'failed',
        command: 'npm run lint',
        excerpt: 'Lint output'
      },
      'Check ESLint output'
    );

    expect(section).toContain('### Lint');
    expect(section).toContain('```');
    expect(section).toContain('Check ESLint output');
  });

  test('main writes markdown report and appends outputs', async () => {
    const resultsPath = join(tempDir, 'results.json');
    const reportPath = join(tempDir, 'report.md');
    const templatePath = join(tempDir, 'template.md');
    const outputPath = join(tempDir, 'summary.txt');

    const results = {
      generatedAt: '2024-01-02T03:00:00Z',
      steps: [
        {
          category: 'lint',
          label: 'Lint',
          status: 'failed',
          command: 'npm run lint',
          durationMs: 5000,
          summary: 'ESLint found issues',
          excerpt: 'Error: Unexpected console.log',
          recordedAt: '2024-01-02T03:00:05Z'
        },
        {
          category: 'health',
          label: 'Health',
          status: 'failed',
          command: 'node scripts/health-check.mjs',
          durationMs: 8000,
          nonBlocking: true,
          summary: 'Timeout waiting for 200',
          excerpt: 'Timeout after 30s',
          recordedAt: '2024-01-02T03:00:10Z'
        },
        {
          category: 'remote',
          label: 'Remote',
          status: 'skipped',
          skipReason: 'Secrets missing',
          recordedAt: '2024-01-02T03:00:15Z'
        }
      ]
    };

    const template = [
      '| Category | Pattern | Suggestion |',
      '| --- | --- | --- |',
      '| lint | ESLint | Run npm run lint locally |',
      '| * | /timeout/ | Re-run with increased timeout |'
    ].join('\n');

    await Promise.all([
      writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf8'),
      writeFile(templatePath, template, 'utf8')
    ]);

    const logger = { info: jest.fn() };
    await collectFailures(
      [
        '--results',
        resultsPath,
        '--report',
        reportPath,
        '--template',
        templatePath,
        '--set-output',
        outputPath
      ],
      { logger }
    );

    const report = await readFile(reportPath, 'utf8');
    expect(report).toContain('# CI Failure Report');
    expect(report).toContain('| lint | Lint | failed |');
    expect(report).toContain('## Failure breakdown');
    expect(report).toContain('Run npm run lint locally');
    expect(report).toContain('Secrets missing');

    const output = await readFile(outputPath, 'utf8');
    expect(output).toContain('has_failures=true');
    expect(output).toContain('has_blocking_failures=true');

    expect(logger.info).toHaveBeenCalledWith('Recorded 2 failure(s).');
  });
});
