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
  const baseUrl = new URL(base);
  const baseString = baseUrl.toString();
  const isGasWebApp =
    baseUrl.hostname === 'script.google.com' &&
    /\/macros\/s\/[^/]+\/exec\/?$/.test(baseUrl.pathname);

  if (!normalizedPath) {
    return { href: baseString, base: baseString, path: '' };
  }

  if (isGasWebApp && /^\/exec(\/|\?|$)/.test(normalizedPath) && !normalizedPath.startsWith('?')) {
    throw new Error(
      'E2E_PATH should be query-only (e.g. "?route=...") when GAS_WEBAPP_URL already ends with /exec.'
    );
  }

  if (normalizedPath.startsWith('?')) {
    baseUrl.search = normalizedPath.slice(1);
    return { href: baseUrl.toString(), base: baseString, path: normalizedPath };
  }

  if (isGasWebApp && normalizedPath.startsWith('/')) {
    const queryIndex = normalizedPath.indexOf('?');
    const query = queryIndex >= 0 ? normalizedPath.slice(queryIndex + 1) : '';
    if (query) {
      baseUrl.search = query;
      return { href: baseUrl.toString(), base: baseString, path: `?${query}` };
    }
    return { href: baseString, base: baseString, path: '' };
  }

  const url = new URL(normalizedPath, base);
  return {
    href: url.toString(),
    base: baseString,
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
