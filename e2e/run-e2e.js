#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tests = [
  { label: 'health', file: './health.e2e.js' },
  { label: 'responsive', file: './responsive.e2e.test.js' }
];

const resolveTestPath = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const run = async () => {
  for (const test of tests) {
    const scriptPath = resolveTestPath(test.file);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath], {
        stdio: 'inherit'
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `${test.label} E2E test failed with exit code ${code}`
          )
        );
      });
    });
  }
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
