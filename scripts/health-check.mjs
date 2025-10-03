#!/usr/bin/env node
import 'dotenv/config';
import process from 'node:process';
import { ProxyAgent } from 'undici';
import { buildTargetURL, safeWriteJson } from './url-helper.mjs';

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
  const e2ePath = process.env.E2E_PATH;
  const target = buildTargetURL(base, e2ePath);

  console.info(`HEALTH_TARGET_URL=${target.href}`);
  safeWriteJson('artifacts/health-url.json', target);

  const response = await fetchWithProxy(target.href);
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
