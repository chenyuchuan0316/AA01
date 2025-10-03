export type BuildUrlOptions = {
  allowLocalFallback?: boolean;
  localBase?: string;
};

const EXEC_SEGMENT = '/exec';

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/u, '');
}

function ensureLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`;
}

function isOnlyQuery(value: string) {
  return Boolean(value) && value.startsWith('?');
}

function cloneUrl(url: URL) {
  return new URL(url.toString());
}

export function buildRemoteUrl(
  gasWebappUrl: string | undefined,
  e2ePath: string | undefined,
  options: BuildUrlOptions = {}
): URL {
  const { allowLocalFallback = false, localBase = 'http://127.0.0.1:3000' } = options;

  const baseRaw = (gasWebappUrl ?? '').trim();
  const pathRaw = (e2ePath ?? '').trim();

  if (!baseRaw) {
    if (allowLocalFallback) {
      return buildRemoteUrl(localBase, pathRaw, {
        allowLocalFallback: false,
        localBase
      });
    }
    throw new Error('GAS_WEBAPP_URL is required for remote E2E (missing or empty).');
  }

  const baseUrl = new URL(baseRaw);
  const result = cloneUrl(baseUrl);

  const basePathname = baseUrl.pathname || '/';
  const normalizedBasePathname = basePathname === '' ? '/' : basePathname;

  let normalizedPathname = '';
  let queryFragment = '';

  if (!pathRaw) {
    normalizedPathname = '';
  } else if (isOnlyQuery(pathRaw)) {
    queryFragment = pathRaw.slice(1);
  } else {
    const [rawPathSegment, rawQuerySegment] = pathRaw.split('?');
    normalizedPathname = ensureLeadingSlash(rawPathSegment).replace(/\/{2,}/g, '/');
    queryFragment = rawQuerySegment ?? '';
  }

  const baseEndsWithExec = stripTrailingSlash(normalizedBasePathname).endsWith(EXEC_SEGMENT);
  const pathStartsWithExec = normalizedPathname.startsWith(EXEC_SEGMENT);

  if (normalizedPathname && baseEndsWithExec && pathStartsWithExec) {
    throw new Error('Duplicate /exec detected between GAS_WEBAPP_URL and E2E_PATH.');
  }

  let finalPathname = normalizedBasePathname;

  if (normalizedPathname) {
    const basePrefix = stripTrailingSlash(normalizedBasePathname);
    if (pathStartsWithExec) {
      finalPathname = normalizedPathname;
    } else if (basePrefix) {
      finalPathname = `${basePrefix}${normalizedPathname}`;
    } else {
      finalPathname = normalizedPathname;
    }
  }

  result.pathname = finalPathname || '/';

  if (queryFragment) {
    const params = new URLSearchParams(queryFragment);
    for (const [key, value] of params.entries()) {
      result.searchParams.set(key, value);
    }
  }

  if (/\/exec\/exec(\/?|$)/i.test(result.pathname)) {
    throw new Error('Duplicate /exec detected in final URL.');
  }

  return result;
}
