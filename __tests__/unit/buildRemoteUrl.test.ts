import { buildRemoteUrl } from '../../src/utils/buildRemoteUrl.js';

describe('buildRemoteUrl', () => {
  const BASE = 'https://host/exec';
  const BASE_WITH_QUERY = 'https://host/exec?baseline=1';
  const LOCAL = 'http://127.0.0.1:3000';

  it('returns the base URL when E2E_PATH is empty', () => {
    const url = buildRemoteUrl(BASE, '');
    expect(url.toString()).toBe('https://host/exec');
  });

  it('merges query parameters when path is only a query string', () => {
    const url = buildRemoteUrl(BASE, '?foo=bar');
    expect(url.pathname).toBe('/exec');
    expect(url.searchParams.get('foo')).toBe('bar');
  });

  it('throws when base and path would create a duplicate /exec', () => {
    expect(() => buildRemoteUrl(BASE, '/exec?x=1')).toThrow(/Duplicate \/exec/);
  });

  it('retains base query parameters and merges new ones', () => {
    const url = buildRemoteUrl(BASE_WITH_QUERY, '?foo=bar');
    expect(url.pathname).toBe('/exec');
    expect(url.searchParams.get('baseline')).toBe('1');
    expect(url.searchParams.get('foo')).toBe('bar');
  });

  it('normalizes general paths by ensuring a leading slash', () => {
    const url = buildRemoteUrl('https://host', 'aa/bb');
    expect(url.pathname).toBe('/aa/bb');
    expect(url.toString()).toBe('https://host/aa/bb');
  });

  it('collapses extra slashes and resolves dot segments via URL semantics', () => {
    const url = buildRemoteUrl('https://host/app/', '///aa///../bb');
    expect(url.pathname).toBe('/app/bb');
  });

  it('throws when GAS_WEBAPP_URL is missing and fallback is disabled', () => {
    expect(() => buildRemoteUrl(undefined, '/')).toThrow(/GAS_WEBAPP_URL is required/);
  });

  it('falls back to the local base when allowed', () => {
    const url = buildRemoteUrl(undefined, '/', { allowLocalFallback: true, localBase: LOCAL });
    expect(url.toString()).toBe(`${LOCAL}/`);
  });
});
