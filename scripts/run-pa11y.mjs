#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';
import pa11y from 'pa11y';
import { isPlaceholderWebAppUrl } from './url-helper.mjs';

const projectRoot = process.cwd();
const envFile = path.resolve(projectRoot, '.env');
if (fs.existsSync(envFile)) {
  loadEnv({ path: envFile });
} else {
  loadEnv();
}

const rawUrl = process.env.GAS_WEBAPP_URL ?? '';
const fallbackFixture = `file://${path.resolve(projectRoot, 'test', 'a11y-fallback.html')}`;
const hasRemoteTarget = !isPlaceholderWebAppUrl(rawUrl);
const targetUrl = hasRemoteTarget ? rawUrl : fallbackFixture;

if (!hasRemoteTarget) {
  console.info(`pa11y fallback target: ${targetUrl}`);
}

try {
  const results = await pa11y(targetUrl, {
    standard: 'WCAG2AA',
    timeout: 20000,
    actions: ['wait for element #appMain to be visible'],
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  if (results.issues.length > 0) {
    console.error(`pa11y found ${results.issues.length} issue(s) at ${targetUrl}`);
    for (const issue of results.issues) {
      console.error(`- [${issue.type}] ${issue.message} (${issue.selector})`);
    }
    process.exit(1);
  }

  console.info(`pa11y scan passed for ${targetUrl}`);
  process.exit(0);
} catch (error) {
  console.error('pa11y scan failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
