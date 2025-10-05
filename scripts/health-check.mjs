#!/usr/bin/env node
import 'dotenv/config';
import process from 'node:process';
import { ProxyAgent } from 'undici';
import { buildTargetURL, isPlaceholderWebAppUrl, safeWriteJson } from './url-helper.mjs';

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const proxyDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

function hasProxyTunnelFailure(error) {
  let current = error;
  while (current && typeof current === 'object') {
    if (
      typeof current.message === 'string' &&
      current.message.includes('Proxy response') &&
      current.message.includes('HTTP Tunneling')
    ) {
      return true;
    }
    current = current.cause;
  }
  return false;
}

async function fetchWithProxy(targetUrl) {
  try {
    return await fetch(targetUrl, {
      redirect: 'manual',
      dispatcher: proxyDispatcher
    });
  } catch (error) {
    if (proxyDispatcher && error instanceof Error && hasProxyTunnelFailure(error)) {
      return fetch(targetUrl, { redirect: 'manual' });
    }
    throw error;
  }
}

async function main() {
  const base = process.env.GAS_WEBAPP_URL;
  if (isPlaceholderWebAppUrl(base)) {
    const summary = {
      skipped: true,
      reason: 'GAS_WEBAPP_URL not configured',
      url: (base ?? '').trim() || undefined
    };
    console.warn('HEALTH_CHECK_SKIP: GAS_WEBAPP_URL missing or placeholder.');
    safeWriteJson('artifacts/health.json', summary);
    console.info('skip');
    return;
  }

  const e2ePath = process.env.E2E_PATH;
  const target = buildTargetURL(base, e2ePath);

  console.info(`HEALTH_TARGET_URL=${target.href}`);
  safeWriteJson('artifacts/health-url.json', target);

  const summary = { url: target.href };

  try {
    const response = await fetchWithProxy(target.href);
    const bodyText = await response.text();

    summary.status = response.status;
    summary.redirected = response.redirected;
    summary.location = response.headers.get('location');
    summary.bodySnippet = bodyText.slice(0, 500);

    if (response.status === 200) {
      return;
    }
    if (response.status >= 300 && response.status < 400) {
      return;
    }
    throw new Error(`Unexpected status code: ${response.status}`);
  } catch (error) {
    if (error instanceof Error) {
      summary.error = {
        message: error.message,
        cause: error.cause && typeof error.cause === 'object' ? String(error.cause) : undefined
      };
    } else {
      summary.error = { message: String(error) };
    }
    throw error;
  } finally {
    safeWriteJson('artifacts/health.json', summary);
  }
}

main().catch(error => {
  if (error instanceof Error) {
    console.error('HEALTH_CHECK_ERROR:', error.message);
    if (error.cause) {
      console.error('HEALTH_CHECK_CAUSE:', error.cause);
    }
  } else {
    console.error('HEALTH_CHECK_ERROR:', String(error));
  }
  process.exitCode = 1;
});
