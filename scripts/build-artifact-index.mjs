#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const sourcesRaw = process.env.ARTIFACT_SOURCES ?? '';
const sources = sourcesRaw
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

function collectStats(targetPath) {
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    const stack = [targetPath];
    let fileCount = 0;
    let totalSize = 0;
    const samples = [];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        const fileStat = fs.statSync(fullPath);
        fileCount += 1;
        totalSize += fileStat.size;
        if (samples.length < 10) {
          samples.push(path.relative(targetPath, fullPath) || entry.name);
        }
      }
    }
    return {
      type: 'directory',
      fileCount,
      totalSize,
      samples
    };
  }

  return {
    type: 'file',
    fileCount: 1,
    totalSize: stats.size,
    samples: [path.basename(targetPath)]
  };
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

const entries = [];
for (const source of sources) {
  const resolved = path.resolve(cwd, source);
  if (!fs.existsSync(resolved)) {
    console.warn(`[artifact-index] Skip missing path: ${source}`);
    continue;
  }

  try {
    const stats = collectStats(resolved);
    entries.push({
      source,
      absolutePath: resolved,
      relativePath: path.relative(cwd, resolved) || '.',
      ...stats
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[artifact-index] Failed to inspect ${source}: ${message}`);
  }
}

const indexData = {
  generatedAt: new Date().toISOString(),
  baseDir: cwd,
  entries
};

const outputPath = process.env.ARTIFACT_INDEX_PATH
  ? path.resolve(cwd, process.env.ARTIFACT_INDEX_PATH)
  : path.resolve(cwd, 'artifacts', 'index.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2));
console.info(`[artifact-index] Wrote ${entries.length} entries to ${outputPath}`);

let markdown = '_No artifacts detected._';
if (entries.length > 0) {
  markdown = entries
    .map(entry => {
      const header = `- **${entry.source}** (${entry.type}, ${entry.fileCount} file(s), ${formatBytes(entry.totalSize)})`;
      if (!entry.samples.length) {
        return header;
      }
      const sampleLines = entry.samples.map(sample => `  - ${sample}`).join('\n');
      return `${header}\n${sampleLines}`;
    })
    .join('\n');
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `markdown<<EOF\n${markdown}\nEOF\n`);
}
