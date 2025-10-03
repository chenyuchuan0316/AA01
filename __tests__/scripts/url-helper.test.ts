import fs from 'node:fs';
import { jest } from '@jest/globals';
import * as helpers from '../../scripts/url-helper.mjs';

describe('buildTargetURL', () => {
  it('throws when GAS_WEBAPP_URL is missing', () => {
    expect(() => helpers.buildTargetURL('', '/')).toThrow(/GAS_WEBAPP_URL is required/);
  });

  it('returns normalized base url when path is empty', () => {
    const result = helpers.buildTargetURL('https://example.com', '');
    expect(result.href).toBe('https://example.com/');
    expect(result.path).toBe('');
  });

  it('handles query-only paths correctly', () => {
    const result = helpers.buildTargetURL('https://example.com/exec', '?route=health');
    expect(result.href).toBe('https://example.com/exec?route=health');
    expect(result.path).toBe('?route=health');
  });

  it('throws when GAS exec base receives /exec with query syntax', () => {
    const base = 'https://script.google.com/macros/s/AKID/exec';
    expect(() => helpers.buildTargetURL(base, '/exec?route=AA01')).toThrow(/query-only/);
  });

  it('throws when attempting to override GAS exec path without query', () => {
    const base = 'https://script.google.com/macros/s/AKID/exec';
    expect(() => helpers.buildTargetURL(base, '/exec')).toThrow(/query-only/);
  });

  it('retains GAS exec base when given trailing slash', () => {
    const base = 'https://script.google.com/macros/s/AKID/exec';
    const result = helpers.buildTargetURL(base, '/');
    expect(result.href).toBe('https://script.google.com/macros/s/AKID/exec');
    expect(result.path).toBe('');
  });

  it('normalizes multi-slash and dot segments', () => {
    const result = helpers.buildTargetURL('https://example.com', '/foo//bar/../baz');
    expect(result.href).toBe('https://example.com/foo/baz');
  });
});

describe('assertHttpBase', () => {
  it('rejects non-http bases', () => {
    expect(() => helpers.assertHttpBase('ftp://example.com')).toThrow(/http\/https/);
    expect(() => helpers.assertHttpBase('example.com')).toThrow(/http\/https/);
  });
});

describe('normalizePath', () => {
  it('retains query prefixes and ensures leading slash', () => {
    expect(helpers.normalizePath('?foo=bar')).toBe('?foo=bar');
    expect(helpers.normalizePath('foo/bar')).toBe('/foo/bar');
  });
});

describe('safeWriteJson', () => {
  it('throws descriptive errors when artifact write fails', () => {
    const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('EACCES');
    });

    try {
      expect(() => helpers.safeWriteJson('/no-permission/output.json', { foo: 'bar' })).toThrow(
        /Artifact write failed/
      );
    } finally {
      spy.mockRestore();
    }
  });
});
