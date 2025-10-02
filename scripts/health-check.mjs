#!/usr/bin/env node
import process from 'node:process';

const rawUrl = process.env.GAS_WEBAPP_URL?.trim() ?? '';
const placeholderValues = new Set(['', 'https://example.com', '<your-gas-webapp-url>']);
const isPlaceholder = placeholderValues.has(rawUrl) || /__PLACEHOLDER__/i.test(rawUrl);

if (!rawUrl || isPlaceholder) {
  console.info('skip');
  process.exit(0);
}

try {
  const response = await fetch(rawUrl, { redirect: 'manual' });
  const { status } = response;
  console.info(`health: status = ${status}`);
  if (status === 200 || status === 302) {
    process.exit(0);
  }
  console.error(`health: fail with status = ${status}`);
  process.exit(1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('health: network error:', message);
  process.exit(1);
}
