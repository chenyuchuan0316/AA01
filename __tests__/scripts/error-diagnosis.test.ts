import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  normaliseCodes,
  matchCodes,
  buildReport,
  collectSources,
  parsePattern
} from '../../scripts/error-diagnosis.mjs';

describe('error diagnosis utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'diagnosis-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
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
});
