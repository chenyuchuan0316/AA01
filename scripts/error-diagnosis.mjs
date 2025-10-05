#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CODES_PATH = 'scripts/error-codes.json';
const DEFAULT_RESULTS_PATH = 'reports/ci-step-results.json';

function parseArgs(argv) {
  const options = {
    codesPath: DEFAULT_CODES_PATH,
    resultsPath: DEFAULT_RESULTS_PATH,
    logPaths: [],
    outputPath: undefined,
    outputFileForGithub: undefined
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    switch (key) {
      case '--codes':
        options.codesPath = argv[++i];
        break;
      case '--results':
        options.resultsPath = argv[++i];
        break;
      case '--log':
        options.logPaths.push(argv[++i]);
        break;
      case '--output':
        options.outputPath = argv[++i];
        break;
      case '--set-output':
        options.outputFileForGithub = argv[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  }

  return options;
}

async function readJsonIfExists(path, fallback = null) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

function parsePattern(pattern) {
  if (typeof pattern !== 'string' || !pattern) {
    return { type: 'substring', value: '' };
  }
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const lastSlash = pattern.lastIndexOf('/');
    const body = pattern.slice(1, lastSlash);
    const flags = pattern.slice(lastSlash + 1) || 'i';
    try {
      const regex = new RegExp(body, flags);
      return { type: 'regex', value: regex };
    } catch {
      // fall through to substring matching when regex cannot be constructed
    }
  }
  return { type: 'substring', value: pattern.toLowerCase() };
}

function extractSnippet(text, matcher) {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (matcher(lines[i])) {
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 2);
      return lines.slice(start, end).join('\n').trim();
    }
  }
  return lines.slice(0, 3).join('\n').trim();
}

function createMatcher(compiledPattern) {
  if (compiledPattern.type === 'regex') {
    const { value } = compiledPattern;
    return line => value.test(line);
  }
  const expected = compiledPattern.value;
  if (!expected) {
    return () => false;
  }
  return line => line.toLowerCase().includes(expected);
}

function testPattern(text, compiledPattern) {
  if (!text) return { matched: false };
  if (compiledPattern.type === 'regex') {
    const { value } = compiledPattern;
    const match = value.exec(text);
    if (match) {
      return { matched: true, snippet: extractSnippet(text, line => value.test(line)) };
    }
    return { matched: false };
  }
  const lowered = text.toLowerCase();
  if (lowered.includes(compiledPattern.value)) {
    return { matched: true, snippet: extractSnippet(text, createMatcher(compiledPattern)) };
  }
  return { matched: false };
}

function normaliseCodes(rawCodes) {
  if (!Array.isArray(rawCodes)) return [];
  return rawCodes
    .map(code => ({
      id: code.id || 'UNKNOWN',
      title: code.title || code.id || 'Unlabelled issue',
      category: code.category || 'general',
      severity: code.severity || 'medium',
      description: code.description || '',
      patterns: Array.isArray(code.patterns) ? code.patterns : [code.patterns].filter(Boolean),
      recommendations: Array.isArray(code.recommendations)
        ? code.recommendations
        : [code.recommendations].filter(Boolean),
      references: Array.isArray(code.references)
        ? code.references
        : [code.references].filter(Boolean)
    }))
    .filter(code => code.patterns.length > 0);
}

async function readTextFile(path) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return raw;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

async function collectSources({ resultsPath, logPaths }) {
  const sources = [];
  const results = await readJsonIfExists(resultsPath, { steps: [] });
  if (results && Array.isArray(results.steps)) {
    for (const step of results.steps) {
      if (!step) continue;
      const text = step.excerpt || step.summary || '';
      if (!text) continue;
      sources.push({
        id: `ci:${step.category || 'unknown'}`,
        label: step.label || step.category || 'CI step',
        category: step.category || 'general',
        text
      });
    }
  }
  for (const path of logPaths) {
    const text = await readTextFile(path);
    if (text) {
      sources.push({ id: `log:${path}`, label: path, category: 'log', text });
    }
  }
  return sources;
}

function matchCodes(codes, sources) {
  const matches = [];
  for (const code of codes) {
    const compiledPatterns = code.patterns.map(parsePattern);
    const codeMatches = [];
    for (const source of sources) {
      for (let index = 0; index < compiledPatterns.length; index += 1) {
        const pattern = compiledPatterns[index];
        const outcome = testPattern(source.text, pattern);
        if (outcome.matched) {
          codeMatches.push({
            source: source.label,
            snippet: outcome.snippet,
            pattern: code.patterns[index]
          });
          break;
        }
      }
    }
    if (codeMatches.length) {
      matches.push({ code, occurrences: codeMatches });
    }
  }
  return matches;
}

function buildReport(matches, sources) {
  const lines = [];
  lines.push('# CI Error Diagnosis Report');
  lines.push('');
  lines.push(`Generated at ${new Date().toISOString()}`);
  lines.push('');
  if (!sources.length) {
    lines.push('No CI logs or telemetry were available for analysis.');
    return lines.join('\n');
  }
  lines.push('## Analysed sources');
  lines.push('');
  for (const source of sources) {
    lines.push(`- ${source.label}`);
  }
  lines.push('');

  if (!matches.length) {
    lines.push(
      'No known issues matched the captured output. Review the raw logs for more details.'
    );
    return lines.join('\n');
  }

  lines.push('## Detected issues');
  lines.push('');
  for (const entry of matches) {
    const { code, occurrences } = entry;
    lines.push(`### ${code.id}: ${code.title}`);
    lines.push('');
    lines.push(`- **Category:** ${code.category}`);
    lines.push(`- **Severity:** ${code.severity}`);
    if (code.description) {
      lines.push('');
      lines.push(code.description);
      lines.push('');
    }
    lines.push('#### Evidence');
    lines.push('');
    for (const occurrence of occurrences) {
      lines.push(`- Source: ${occurrence.source}`);
      lines.push('');
      if (occurrence.snippet) {
        lines.push('```');
        lines.push(occurrence.snippet);
        lines.push('```');
        lines.push('');
      }
      lines.push(`  Pattern: ${occurrence.pattern}`);
      lines.push('');
    }
    if (code.recommendations.length) {
      lines.push('#### Recommended actions');
      lines.push('');
      for (const recommendation of code.recommendations) {
        lines.push(`- ${recommendation}`);
      }
      lines.push('');
    }
    if (code.references.length) {
      lines.push('#### References');
      lines.push('');
      for (const reference of code.references) {
        lines.push(`- ${reference}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function writeFileIfRequested(path, content) {
  if (!path) return;
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, content, 'utf8');
}

async function setGithubOutputs(path, { matchCount, matchedCodes }) {
  if (!path) return;
  const lines = [
    `has_matches=${matchCount > 0}`,
    `match_count=${matchCount}`,
    `matched_codes=${matchedCodes.join(',')}`
  ];
  await fs.appendFile(path, `${lines.join('\n')}\n`);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const [rawCodes, sources] = await Promise.all([
    readJsonIfExists(options.codesPath, []),
    collectSources(options)
  ]);
  const codes = normaliseCodes(rawCodes);
  const matches = matchCodes(codes, sources);
  const report = buildReport(matches, sources);
  await writeFileIfRequested(options.outputPath, report);
  console.info(report);
  await setGithubOutputs(options.outputFileForGithub, {
    matchCount: matches.length,
    matchedCodes: matches.map(entry => entry.code.id)
  });
}

export {
  DEFAULT_CODES_PATH,
  DEFAULT_RESULTS_PATH,
  parseArgs,
  readJsonIfExists,
  parsePattern,
  matchCodes,
  buildReport,
  collectSources,
  normaliseCodes,
  main
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
