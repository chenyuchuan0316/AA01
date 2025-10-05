import ts from 'typescript';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  collectInfo,
  resolveScriptKind,
  TARGET_EXTENSIONS,
  generateInventory,
  main as runInventory
} from '../../scripts/generate-inventory.mjs';

describe('generate-inventory utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'inventory-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test('collectInfo detects exported functions and variables', () => {
    const source = `
      export function loadData() {}
      function internal() {}
      export const handler = () => {};
      const helper = () => {};
      export { helper };
      export default function main() {}
    `;

    const info = collectInfo('/repo/src/example.ts', source);
    expect(info.functions).toEqual(['handler', 'helper', 'internal', 'loadData', 'main']);
    expect(info.exports).toEqual(['handler', 'helper', 'loadData', 'main']);
  });

  test('collectInfo ignores non-target extensions', () => {
    const info = collectInfo('/repo/README.md', 'export const foo = 1;');
    expect(info).toEqual({ functions: [], exports: [] });
  });

  test('resolveScriptKind matches file extension', () => {
    expect(resolveScriptKind('example.ts')).toBe(ts.ScriptKind.TS);
    expect(resolveScriptKind('component.tsx')).toBe(ts.ScriptKind.TSX);
    expect(resolveScriptKind('script.mjs')).toBe(ts.ScriptKind.JS);
  });

  test('target extensions set contains Apps Script and module types', () => {
    expect(TARGET_EXTENSIONS.has('.gs')).toBe(true);
    expect(TARGET_EXTENSIONS.has('.mjs')).toBe(true);
    expect(TARGET_EXTENSIONS.has('.json')).toBe(false);
  });

  test('generateInventory enumerates relative files within a directory', async () => {
    await mkdir(join(tempDir, 'src'), { recursive: true });
    await writeFile(join(tempDir, 'src', 'Code.gs'), 'function onOpen() {}', 'utf8');
    await writeFile(join(tempDir, 'script.mjs'), 'export const value = 1;', 'utf8');

    const inventory = await generateInventory(tempDir);
    expect(inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: 'src/Code.gs',
          functions: expect.arrayContaining(['onOpen'])
        }),
        expect.objectContaining({ file: 'script.mjs', exports: expect.arrayContaining(['value']) })
      ])
    );
  });

  test('main writes inventory JSON to the requested output directory', async () => {
    await writeFile(join(tempDir, 'Utils.gs'), 'function util() {}', 'utf8');
    const outputDir = join(tempDir, 'reports');
    const { outputPath } = await runInventory({
      rootDir: tempDir,
      outputDir,
      fileName: 'inventory.json'
    });
    const contents = JSON.parse(await readFile(outputPath, 'utf8')) as Array<{ file: string }>;
    expect(contents.some(entry => entry.file === 'Utils.gs')).toBe(true);
  });
});
