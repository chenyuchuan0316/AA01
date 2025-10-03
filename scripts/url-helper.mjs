import fs from 'node:fs';
import path from 'node:path';

export function assertHttpBase(baseRaw) {
  const base = (baseRaw ?? '').trim();
  if (!base) {
    throw new Error('GAS_WEBAPP_URL is required.');
  }
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`GAS_WEBAPP_URL must start with http/https, got: ${base}`);
  }
  return new URL(base).toString();
}

export function normalizePath(e2ePathRaw) {
  const raw = (e2ePathRaw ?? '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('?')) {
    return raw;
  }
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.replace(/\/{2,}/g, '/');
}

export function buildTargetURL(baseRaw, e2ePathRaw) {
  const base = assertHttpBase(baseRaw);
  const normalizedPath = normalizePath(e2ePathRaw);

  if (!normalizedPath) {
    const url = new URL(base);
    return { href: url.toString(), base: url.toString(), path: '' };
  }

  const url = new URL(normalizedPath, base);
  return {
    href: url.toString(),
    base: new URL(base).toString(),
    path: normalizedPath
  };
}

export function safeWriteJson(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Artifact write failed: ${filePath} - ${message}`);
  }
}
