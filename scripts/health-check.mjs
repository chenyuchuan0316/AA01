#!/usr/bin/env node
import 'dotenv/config';
import process from 'node:process';
import { buildTargetURL, safeWriteJson } from './url-helper.mjs';

async function main() {
  const base = process.env.GAS_WEBAPP_URL;
  const e2ePath = process.env.E2E_PATH;
  const target = buildTargetURL(base, e2ePath);

  console.info(`HEALTH_TARGET_URL=${target.href}`);
  safeWriteJson('artifacts/health-url.json', target);

  const response = await fetch(target.href, { redirect: 'manual' });
  const bodyText = await response.text();

  const summary = {
    url: target.href,
    status: response.status,
    redirected: response.redirected,
    location: response.headers.get('location'),
    bodySnippet: bodyText.slice(0, 500)
  };

  safeWriteJson('artifacts/health.json', summary);

  if (response.status === 200) {
    return;
  }
  if (response.status >= 300 && response.status < 400) {
    return;
  }
  throw new Error(`Unexpected status code: ${response.status}`);
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('HEALTH_CHECK_ERROR:', message);
  process.exitCode = 1;
});
