import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let buildFilesFromRepoRoot: (typeof import('../../gas-deploy.mjs'))['buildFilesFromRepoRoot'];

describe('gas-deploy buildFilesFromRepoRoot', () => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };

  let originalScriptId: string | undefined;

  beforeAll(async () => {
    originalScriptId = process.env.SCRIPT_ID;
    process.env.SCRIPT_ID = 'script-id';
    ({ buildFilesFromRepoRoot } = await import('../../gas-deploy.mjs'));
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    process.env.SCRIPT_ID = 'script-id';
  });

  afterAll(() => {
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    if (originalScriptId === undefined) {
      delete process.env.SCRIPT_ID;
    } else {
      process.env.SCRIPT_ID = originalScriptId;
    }
  });

  test('throws when manifest is missing', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'gas-deploy-missing-'));
    try {
      process.chdir(tempDir);
      expect(() => buildFilesFromRepoRoot()).toThrow('找不到 appsscript.json');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('throws when Sidebar.html is not discovered', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'gas-deploy-sidebar-'));
    try {
      process.chdir(tempDir);
      await writeFile(
        join(tempDir, 'appsscript.json'),
        JSON.stringify({ timeZone: 'Asia/Taipei' }),
        'utf8'
      );
      expect(() => buildFilesFromRepoRoot()).toThrow('找不到 Sidebar.html');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('collects manifest and source files from clasp root directory', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'gas-deploy-success-'));
    try {
      process.chdir(tempDir);
      await writeFile(
        join(tempDir, '.clasp.json'),
        JSON.stringify({ rootDir: 'dist' }, null, 2),
        'utf8'
      );
      await mkdir(join(tempDir, 'dist'), { recursive: true });
      await writeFile(
        join(tempDir, 'dist', 'appsscript.json'),
        JSON.stringify({ timeZone: 'Asia/Taipei' }),
        'utf8'
      );
      await writeFile(join(tempDir, 'dist', 'Sidebar.html'), '<div>sidebar</div>', 'utf8');
      await writeFile(join(tempDir, 'dist', 'Code.gs'), 'function onOpen() {}', 'utf8');

      const files = buildFilesFromRepoRoot();
      expect(files).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'appsscript', type: 'JSON' }),
          expect.objectContaining({ name: 'Sidebar', type: 'HTML' }),
          expect.objectContaining({ name: 'Code', type: 'SERVER_JS' })
        ])
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
