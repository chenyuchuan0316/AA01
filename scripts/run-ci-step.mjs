#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_RESULTS_PATH = 'reports/ci-step-results.json';

function parseArgs(argv) {
  const options = {
    category: undefined,
    label: undefined,
    resultsPath: DEFAULT_RESULTS_PATH,
    nonBlocking: false,
    skipReason: undefined
  };

  const doubleDashIndex = argv.indexOf('--');
  const optionArgs = doubleDashIndex === -1 ? argv : argv.slice(0, doubleDashIndex);
  const commandArgs = doubleDashIndex === -1 ? [] : argv.slice(doubleDashIndex + 1);

  for (let i = 0; i < optionArgs.length; i += 1) {
    const key = optionArgs[i];
    switch (key) {
      case '--category':
        options.category = optionArgs[++i];
        break;
      case '--label':
        options.label = optionArgs[++i];
        break;
      case '--results':
        options.resultsPath = optionArgs[++i];
        break;
      case '--non-blocking':
        options.nonBlocking = true;
        break;
      case '--skip':
        options.skipReason = optionArgs[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  }

  if (!options.category) {
    throw new Error('Missing required --category.');
  }

  if (!options.label) {
    options.label = options.category;
  }

  return { options, commandArgs };
}

async function ensureResultsFile(path) {
  try {
    await fs.access(path);
  } catch {
    await fs.mkdir(dirname(path), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      steps: []
    };
    await fs.writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
  }
}

async function readResults(path) {
  await ensureResultsFile(path);
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function writeResults(path, update) {
  const current = await readResults(path);
  const filtered = current.steps.filter(entry => entry.category !== update.category);
  filtered.push(update);
  const payload = {
    ...current,
    generatedAt: new Date().toISOString(),
    steps: filtered
  };
  await fs.writeFile(path, JSON.stringify(payload, null, 2), 'utf8');
}

function extractExcerpt(text, limit = 20) {
  if (!text) return '';
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= limit) {
    return lines.join('\n');
  }
  return lines.slice(-limit).join('\n');
}

async function recordSkip({ category, label, resultsPath, skipReason }) {
  const entry = {
    category,
    label,
    status: 'skipped',
    skipReason: skipReason || 'No explicit reason provided.',
    recordedAt: new Date().toISOString()
  };
  await writeResults(resultsPath, entry);
}

async function runCommand(commandArgs) {
  const command = commandArgs.join(' ');
  const start = performance.now();
  let combined = '';

  const child = spawn(command, {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env
  });

  child.stdout.on('data', chunk => {
    const value = chunk.toString();
    process.stdout.write(value);
    combined += value;
  });

  child.stderr.on('data', chunk => {
    const value = chunk.toString();
    process.stderr.write(value);
    combined += value;
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  const durationMs = Math.round(performance.now() - start);

  return { command, exitCode, combined, durationMs };
}

async function main() {
  const { options, commandArgs } = parseArgs(process.argv.slice(2));

  if (options.skipReason) {
    await recordSkip(options);
    return;
  }

  if (!commandArgs.length) {
    throw new Error('No command provided after -- delimiter.');
  }

  const { command, exitCode, combined, durationMs } = await runCommand(commandArgs);

  const status = exitCode === 0 ? 'passed' : 'failed';
  const entry = {
    category: options.category,
    label: options.label,
    status,
    command,
    durationMs,
    nonBlocking: options.nonBlocking,
    recordedAt: new Date().toISOString()
  };

  if (status === 'failed') {
    entry.summary = extractExcerpt(combined, 5).split('\n').slice(-1)[0] || 'Command failed.';
    entry.excerpt = extractExcerpt(combined, 50);
  }

  await writeResults(options.resultsPath, entry);

  if (status !== 'passed' && !options.nonBlocking) {
    process.exit(exitCode || 1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
