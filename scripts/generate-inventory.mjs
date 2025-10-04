import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.gs', '.mts']);

function resolveScriptKind(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.ts':
      return ts.ScriptKind.TS;
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
    case '.cjs':
    case '.mjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.JS;
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function collectInfo(filePath, text) {
  const info = { functions: [], exports: [] };
  if (!TARGET_EXTENSIONS.has(path.extname(filePath))) {
    return info;
  }
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    resolveScriptKind(filePath)
  );

  function recordExport(name) {
    if (name && !info.exports.includes(name)) {
      info.exports.push(name);
    }
  }

  function recordFunction(name) {
    if (name && !info.functions.includes(name)) {
      info.functions.push(name);
    }
  }

  function visit(node) {
    if (ts.isFunctionDeclaration(node)) {
      const name = node.name?.getText(sourceFile) ?? 'default';
      recordFunction(name);
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        recordExport(name);
      }
    } else if (ts.isClassDeclaration(node)) {
      const name = node.name?.getText(sourceFile) ?? 'default';
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        recordExport(name);
      }
    } else if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const decl of node.declarationList.declarations) {
        const name = decl.name.getText(sourceFile);
        if (isExported) {
          recordExport(name);
        }
        const initializer = decl.initializer;
        if (
          initializer &&
          (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        ) {
          recordFunction(name);
          if (isExported) recordExport(name);
        }
      }
    } else if (ts.isExportAssignment(node)) {
      recordExport('default');
    } else if (ts.isExportDeclaration(node)) {
      const clause = node.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          recordExport(element.name.getText(sourceFile));
        }
      } else if (!clause) {
        recordExport('*');
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  info.functions.sort();
  info.exports.sort();
  return info;
}

async function main() {
  const inventory = [];
  for await (const filePath of walk(REPO_ROOT)) {
    const rel = path.relative(REPO_ROOT, filePath);
    if (!TARGET_EXTENSIONS.has(path.extname(rel))) continue;
    const text = await fs.readFile(filePath, 'utf8');
    const info = collectInfo(filePath, text);
    inventory.push({ file: rel, ...info });
  }
  inventory.sort((a, b) => a.file.localeCompare(b.file));
  const outputDir = path.join(REPO_ROOT, 'reports', 'baseline');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'repo-inventory.json');
  await fs.writeFile(outputPath, JSON.stringify(inventory, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
