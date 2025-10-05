#!/usr/bin/env node
import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const result = { run: null, verify: null, max: null, backoff: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--run' && i + 1 < argv.length) {
      result.run = argv[++i];
      continue;
    }
    if (token === '--verify' && i + 1 < argv.length) {
      result.verify = argv[++i];
      continue;
    }
    if (token === '--max' && i + 1 < argv.length) {
      result.max = Number.parseInt(argv[++i], 10);
      continue;
    }
    if (token === '--backoff' && i + 1 < argv.length) {
      result.backoff = Number.parseInt(argv[++i], 10);
      continue;
    }
  }
  return result;
}

async function runCommand(command, label, spawnFn = spawn) {
  return new Promise(resolve => {
    const child = spawnFn(command, { shell: true, stdio: 'inherit' });
    child.on('exit', (code, signal) => {
      const exitCode = typeof code === 'number' ? code : 1;
      const signature = signal ? `${exitCode}:${signal}` : `${exitCode}`;
      console.info(
        `[auto-repair] ${label} exited with code=${exitCode}${signal ? ` signal=${signal}` : ''}`
      );
      resolve({ exitCode, signal, signature });
    });
  });
}

async function main(
  argv = process.argv.slice(2),
  {
    spawnFn = spawn,
    delayFn = delay,
    exit = code => {
      process.exit(code);
    }
  } = {}
) {
  const args = parseArgs(argv);
  const runCommandText = args.run || process.env.AUTO_REPAIR_COMMAND;
  const verifyCommandText = args.verify || process.env.AUTO_REPAIR_VERIFY || null;
  const maxAttempts = Number.isInteger(args.max)
    ? Math.max(1, args.max)
    : Math.max(1, Number.parseInt(process.env.AUTO_REPAIR_MAX_ATTEMPTS ?? '3', 10));
  const backoffSeconds = Number.isInteger(args.backoff)
    ? Math.max(0, args.backoff)
    : Math.max(0, Number.parseInt(process.env.AUTO_REPAIR_BACKOFF_SECONDS ?? '5', 10));

  if (!runCommandText) {
    console.error(
      '[auto-repair] Missing --run command or AUTO_REPAIR_COMMAND environment variable.'
    );
    exit(2);
    return;
  }

  console.info(`[auto-repair] Target command: ${runCommandText}`);
  if (verifyCommandText) {
    console.info(`[auto-repair] Verify command: ${verifyCommandText}`);
  } else {
    console.info(
      '[auto-repair] Verify command not configured; will retry based on main command status only.'
    );
  }
  console.info(`[auto-repair] Max attempts: ${maxAttempts} (backoff ${backoffSeconds}s)`);

  let attempt = 0;
  let previousSignature = null;
  let lastExitCode = 1;
  let lastVerifyExit = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    console.info(`[auto-repair] Attempt ${attempt} of ${maxAttempts}`);
    const runResult = await runCommand(runCommandText, 'run', spawnFn);
    lastExitCode = runResult.exitCode;

    if (runResult.exitCode === 0) {
      console.info(`[auto-repair] Command succeeded on attempt ${attempt}.`);
      exit(0);
      return;
    }

    let verifySignature = 'no-verify';
    if (verifyCommandText) {
      console.info('[auto-repair] Running verify command after failure…');
      const verifyResult = await runCommand(verifyCommandText, 'verify', spawnFn);
      lastVerifyExit = verifyResult.exitCode;
      verifySignature = verifyResult.signature;
    }

    const failureSignature = `${runResult.signature}|${verifySignature}`;
    console.info(`[auto-repair] Failure signature: ${failureSignature}`);

    if (previousSignature && previousSignature === failureSignature) {
      console.error(
        '[auto-repair] Stop-loss triggered: repeated failure signature with no improvement.'
      );
      break;
    }
    previousSignature = failureSignature;

    if (attempt >= maxAttempts) {
      break;
    }

    if (backoffSeconds > 0) {
      console.info(`[auto-repair] Waiting ${backoffSeconds}s before retry…`);
      await delayFn(backoffSeconds * 1000);
    }
  }

  console.error(
    `[auto-repair] Exhausted attempts. lastExit=${lastExitCode}, lastVerify=${lastVerifyExit ?? 'n/a'}`
  );
  exit(lastExitCode || 1);
}

function createCliRunner() {
  return main().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[auto-repair] Unexpected error:', message);
    if (error && typeof error.stack === 'string') {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

export { parseArgs, runCommand, main, createCliRunner };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createCliRunner();
}
