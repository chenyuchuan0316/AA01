#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { config as loadEnv } from 'dotenv';

const projectRoot = process.cwd();
const envFile = path.resolve(projectRoot, '.env');
if (fs.existsSync(envFile)) {
  loadEnv({ path: envFile });
} else {
  loadEnv();
}

const placeholderValues = new Set(['', 'https://example.com', '<your-gas-webapp-url>']);
const rawUrl = process.env.GAS_WEBAPP_URL;
if (!rawUrl) {
  console.error('GAS_WEBAPP_URL is not defined. Please set it in .env or CI secrets.');
  process.exit(1);
}

const targetSource = placeholderValues.has(rawUrl.trim())
  ? `file://${path.resolve(projectRoot, 'src', 'Sidebar.html')}`
  : rawUrl;

let parsedUrl;
try {
  parsedUrl = new URL(targetSource);
} catch (error) {
  console.error('Invalid GAS_WEBAPP_URL value:', error instanceof Error ? error.message : error);
  process.exit(1);
}

if (parsedUrl.protocol === 'file:') {
  const filePath = decodeURIComponent(parsedUrl.pathname);
  if (fs.existsSync(filePath)) {
    console.info(`Health check skipped for local file target: ${filePath}`);
    process.exit(0);
  }
  console.error(`Health check failed. Local file not found: ${filePath}`);
  process.exit(2);
}

if (!parsedUrl.searchParams.has('route')) {
  parsedUrl.searchParams.set('route', 'health');
}

const targetUrl = parsedUrl.toString();

try {
  const response = await fetch(targetUrl, { redirect: 'manual' });
  const { status } = response;
  if (status === 200 || status === 302) {
    console.info(`Health check succeeded with HTTP ${status} for ${targetUrl}`);
    process.exit(0);
  }
  console.error(`Health check failed with HTTP ${status} for ${targetUrl}`);
  process.exit(2);
} catch (error) {
  console.error('Health check request failed:', error instanceof Error ? error.message : error);
  process.exit(2);
}
