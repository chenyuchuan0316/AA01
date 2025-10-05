import { jest } from '@jest/globals';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parseArgs,
  readJsonIfExists,
  normaliseCodes,
  matchCodes,
  buildReport,
  collectSources,
  parsePattern,
  main as runDiagnosis
} from '../../scripts/error-diagnosis.mjs';

describe('error diagnosis utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'diagnosis-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('parsePattern supports regular expression flags', () => {
    const compiled = parsePattern('/Timeout/i');
    expect(compiled.type).toBe('regex');
    const regex = compiled.type === 'regex' ? compiled.value : undefined;
    if (!(regex instanceof RegExp)) {
      throw new Error('Expected regex pattern');
    }
    expect(regex.test('timeout occurred')).toBe(true);
  });

  test('matchCodes returns evidence for matching patterns', () => {
    const codes = normaliseCodes([
      {
        id: 'E2E_PATH_QUERY_ONLY',
        title: 'Remote E2E path must use a query string',
        category: 'remote',
        patterns: ['E2E_PATH should be query-only'],
        recommendations: ['Update the configuration.']
      }
    ]);

    const sources = [
      {
        id: 'ci:remote',
        label: 'Remote E2E',
        category: 'remote',
        text: 'Remote run failed: E2E_PATH should be query-only but received /route/plan.'
      }
    ];

    const matches = matchCodes(codes, sources);
    expect(matches).toHaveLength(1);
    expect(matches[0].occurrences[0]).toMatchObject({
      source: 'Remote E2E',
      pattern: 'E2E_PATH should be query-only'
    });
  });

  test('collectSources gathers excerpts from CI telemetry', async () => {
    const resultsPath = join(tempDir, 'results.json');
    await writeFile(
      resultsPath,
      JSON.stringify(
        {
          steps: [
            {
              category: 'ui',
              label: 'UI tests',
              excerpt: 'Please run "npx playwright install" to download missing browsers.'
            }
          ]
        },
        null,
        2
      )
    );

    const sources = await collectSources({ resultsPath, logPaths: [] });
    expect(sources).toEqual([
      {
        id: 'ci:ui',
        label: 'UI tests',
        category: 'ui',
        text: expect.stringContaining('Please run')
      }
    ]);
  });

  test('buildReport summarises findings when no matches are detected', () => {
    const report = buildReport(
      [],
      [{ id: 'ci:lint', label: 'Lint', category: 'lint', text: 'All good.' }]
    );

    expect(report).toContain('No known issues matched');
    expect(report).toContain('Lint');
  });

  test('parseArgs aggregates CLI flags and log paths', () => {
    const options = parseArgs([
      '--codes',
      'codes.json',
      '--results',
      'results.json',
      '--log',
      'first.log',
      '--log',
      'second.log',
      '--output',
      'report.md',
      '--set-output',
      'gha.txt'
    ]);

    expect(options).toEqual({
      codesPath: 'codes.json',
      resultsPath: 'results.json',
      logPaths: ['first.log', 'second.log'],
      outputPath: 'report.md',
      outputFileForGithub: 'gha.txt'
    });
  });

  test('readJsonIfExists returns fallback when file is missing', async () => {
    const fallback = { ok: true };
    const result = await readJsonIfExists(join(tempDir, 'missing.json'), fallback);
    expect(result).toBe(fallback);
  });

  test('buildReport includes recommendations and references for matches', () => {
    const matches = matchCodes(
      normaliseCodes([
        {
          id: 'PLAYWRIGHT_INSTALL',
          title: 'Missing Playwright browsers',
          severity: 'high',
          category: 'e2e',
          description: 'Playwright browsers must be installed before running UI specs.',
          patterns: ['download missing browsers'],
          recommendations: ['Run `npx playwright install --with-deps`.'],
          references: ['https://playwright.dev/docs/cli']
        }
      ]),
      [
        {
          id: 'ci:ui',
          label: 'UI tests',
          category: 'ui',
          text: 'Please run "npx playwright install" to download missing browsers.'
        }
      ]
    );

    const report = buildReport(matches, [
      { id: 'ci:ui', label: 'UI tests', category: 'ui', text: 'download missing browsers' }
    ]);

    expect(report).toContain('PLAYWRIGHT_INSTALL');
    expect(report).toContain('Recommended actions');
    expect(report).toContain('https://playwright.dev/docs/cli');
  });

  test('main writes report and GitHub outputs for detected matches', async () => {
    const codesPath = join(tempDir, 'codes.json');
    const resultsPath = join(tempDir, 'results.json');
    const logPath = join(tempDir, 'run.log');
    const outputPath = join(tempDir, 'report.md');
    const ghaOutputsPath = join(tempDir, 'gha.txt');

    await Promise.all([
      writeFile(
        codesPath,
        JSON.stringify([
          {
            id: 'TYPECHECK_FAIL',
            title: 'TypeScript compilation failed',
            category: 'typecheck',
            patterns: ['/error TS[0-9]+/'],
            recommendations: ['Run `npm run typecheck` locally and fix the errors.']
          }
        ])
      ),
      writeFile(
        resultsPath,
        JSON.stringify({
          steps: [
            {
              category: 'typecheck',
              label: 'TypeScript',
              excerpt: 'error TS2304: Cannot find name "window".'
            }
          ]
        })
      ),
      writeFile(logPath, 'error TS2304: Cannot find name "window".')
    ]);

    jest.spyOn(console, 'info').mockImplementation(() => {});

    await runDiagnosis([
      '--codes',
      codesPath,
      '--results',
      resultsPath,
      '--log',
      logPath,
      '--output',
      outputPath,
      '--set-output',
      ghaOutputsPath
    ]);

    const report = await readFile(outputPath, 'utf8');
    expect(report).toContain('CI Error Diagnosis Report');
    expect(report).toContain('Analysed sources');

    const ghaOutputs = await readFile(ghaOutputsPath, 'utf8');
    expect(ghaOutputs).toContain('has_matches=');
    expect(ghaOutputs).toContain('match_count=');
  });
});
