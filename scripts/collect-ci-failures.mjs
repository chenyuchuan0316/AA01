#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_RESULTS_PATH = 'reports/ci-step-results.json';
const DEFAULT_REPORT_PATH = 'reports/ci-failure-report.md';
const DEFAULT_TEMPLATE_PATH = 'reports/ci-remediation-template.md';
const GATING_CATEGORIES = new Set(['lint', 'unit', 'ui', 'a11y', 'remote']);

function parseArgs(argv) {
  const options = {
    resultsPath: DEFAULT_RESULTS_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    templatePath: DEFAULT_TEMPLATE_PATH,
    outputPath: undefined
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    switch (key) {
      case '--results':
        options.resultsPath = argv[++i];
        break;
      case '--report':
        options.reportPath = argv[++i];
        break;
      case '--template':
        options.templatePath = argv[++i];
        break;
      case '--set-output':
        options.outputPath = argv[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  }

  return options;
}

async function readJson(path) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { steps: [] };
    }
    throw error;
  }
}

function normaliseCell(value) {
  return value.trim().replace(/^"|"$/g, '');
}

async function parseTemplate(path) {
  try {
    const raw = await fs.readFile(path, 'utf8');
    const lines = raw.split(/\r?\n/).filter(line => line.startsWith('|'));
    if (lines.length < 3) {
      return [];
    }
    const entries = [];
    for (let i = 2; i < lines.length; i += 1) {
      const cells = lines[i]
        .split('|')
        .slice(1, -1)
        .map(cell => normaliseCell(cell));
      if (cells.length < 3) continue;
      const [category, pattern, suggestion] = cells;
      if (!pattern || !suggestion) continue;
      entries.push({ category: category || '*', pattern, suggestion });
    }
    return entries;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function matchesPattern(text, pattern) {
  if (!text) return false;
  const trimmed = pattern.trim();
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    const body = trimmed.slice(1, -1);
    const regex = new RegExp(body, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(trimmed.toLowerCase());
}

function findSuggestion(step, templates) {
  const { category, summary = '', excerpt = '' } = step;
  const haystack = `${summary}\n${excerpt}`;
  for (const entry of templates) {
    if (entry.category !== '*' && entry.category !== category) {
      continue;
    }
    if (matchesPattern(haystack, entry.pattern)) {
      return entry.suggestion;
    }
  }
  return `Review the ${step.label} logs for more detail.`;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function buildSummaryTable(steps) {
  const header = ['Category', 'Step', 'Status', 'Duration', 'Notes'];
  const rows = steps.map(step => {
    let notes = '';
    if (step.status === 'failed') {
      notes = step.summary || 'Command failed.';
    } else if (step.status === 'skipped') {
      notes = step.skipReason || 'Skipped.';
    }
    return [step.category, step.label, step.status, formatDuration(step.durationMs), notes];
  });
  const table = [header, ...rows];
  return table.map(row => `| ${row.map(cell => cell || '—').join(' | ')} |`).join('\n');
}

function buildSection(step, suggestion) {
  const lines = [];
  lines.push(`### ${step.label}`);
  lines.push('');
  lines.push(`- **Category:** ${step.category}`);
  lines.push(`- **Status:** ${step.status}`);
  lines.push(`- **Command:** \
\`${step.command || 'n/a'}\``);
  if (step.status === 'skipped') {
    lines.push(`- **Reason:** ${step.skipReason || 'Skipped'}`);
  }
  if (step.status === 'failed') {
    lines.push('');
    lines.push('#### Failure excerpt');
    lines.push('');
    lines.push('```');
    lines.push(step.excerpt || 'No output captured.');
    lines.push('```');
    lines.push('');
    lines.push('#### Suggested next steps');
    lines.push('');
    lines.push(`- ${suggestion}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function writeReport(path, content) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, content, 'utf8');
}

async function main(argv = process.argv.slice(2), { logger = console } = {}) {
  const options = parseArgs(argv);
  const [results, templates] = await Promise.all([
    readJson(options.resultsPath),
    parseTemplate(options.templatePath)
  ]);

  const steps = Array.isArray(results.steps) ? results.steps : [];
  const sortedSteps = steps.slice().sort((a, b) => {
    if (!a.recordedAt || !b.recordedAt) return 0;
    return a.recordedAt.localeCompare(b.recordedAt);
  });

  const summaryLines = [];
  summaryLines.push('# CI Failure Report');
  summaryLines.push('');
  summaryLines.push(`Generated at ${new Date().toISOString()}`);
  summaryLines.push('');

  if (!sortedSteps.length) {
    summaryLines.push('No CI step telemetry was recorded for this run.');
  } else {
    summaryLines.push(buildSummaryTable(sortedSteps));
    summaryLines.push('');
  }

  const failureSteps = sortedSteps.filter(step => step.status === 'failed');
  const blockingFailures = failureSteps.filter(
    step => !step.nonBlocking && GATING_CATEGORIES.has(step.category)
  );
  const nonBlockingFailures = failureSteps.filter(
    step => step.nonBlocking || !GATING_CATEGORIES.has(step.category)
  );

  if (failureSteps.length) {
    summaryLines.push('---');
    summaryLines.push('');
    summaryLines.push('## Failure breakdown');
    summaryLines.push('');
    for (const step of failureSteps) {
      const suggestion = findSuggestion(step, templates);
      summaryLines.push(buildSection(step, suggestion));
    }
  } else {
    summaryLines.push('All monitored CI gates passed for this run.');
  }

  if (nonBlockingFailures.length && !blockingFailures.length) {
    summaryLines.push('');
    summaryLines.push(
      '> Note: Failures above were recorded for non-blocking checks; CI remains green.'
    );
  }

  await writeReport(options.reportPath, summaryLines.join('\n'));

  const hasFailures = failureSteps.length > 0;
  const hasBlockingFailures = blockingFailures.length > 0;

  if (options.outputPath) {
    const lines = [`has_failures=${hasFailures}`, `has_blocking_failures=${hasBlockingFailures}`];
    await fs.appendFile(options.outputPath, `${lines.join('\n')}\n`);
  }

  if (hasFailures) {
    logger.info(`Recorded ${failureSteps.length} failure(s).`);
  } else {
    logger.info('No failures detected in monitored steps.');
  }
}

export {
  DEFAULT_RESULTS_PATH,
  DEFAULT_REPORT_PATH,
  DEFAULT_TEMPLATE_PATH,
  parseArgs,
  readJson,
  normaliseCell,
  parseTemplate,
  matchesPattern,
  findSuggestion,
  formatDuration,
  buildSummaryTable,
  buildSection,
  writeReport,
  main
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
