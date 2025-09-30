#!/usr/bin/env node
import process from 'node:process';

const { TEST_DEPLOYMENT_ID } = process.env;

if (!TEST_DEPLOYMENT_ID) {
  console.warn('Skipping health check because TEST_DEPLOYMENT_ID is not set.');
  process.exit(0);
}

const url = `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec?route=health`;

(async () => {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    const { status } = response;

    if (status === 200) {
      console.log(`Health check succeeded with HTTP ${status} for ${url}`);
      process.exit(0);
    }

    if ([302, 303, 307, 308].includes(status)) {
      console.log(`Health check redirected with HTTP ${status} for ${url}`);
      process.exit(0);
    }

    console.error(`Health check failed with unexpected HTTP ${status} for ${url}`);
    process.exit(2);
  } catch (error) {
    console.error('Health check request failed:', error);
    process.exit(2);
  }
})();
