import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertHttpBase,
  buildTargetURL,
  normalizePath,
  safeWriteJson
} from '../scripts/url-helper.mjs';

test('throws when GAS_WEBAPP_URL is missing', () => {
  assert.throws(() => buildTargetURL('', '/'), /GAS_WEBAPP_URL is required/);
});

test('returns normalized base url when path is empty', () => {
  const result = buildTargetURL('https://example.com', '');
  assert.equal(result.href, 'https://example.com/');
  assert.equal(result.path, '');
});

test('handles query-only paths correctly', () => {
  const result = buildTargetURL('https://example.com/exec', '?route=health');
  assert.equal(result.href, 'https://example.com/exec?route=health');
  assert.equal(result.path, '?route=health');
});

test('normalizes multi-slash and dot segments', () => {
  const result = buildTargetURL('https://example.com', '/foo//bar/../baz');
  assert.equal(result.href, 'https://example.com/foo/baz');
});

test('rejects non-http bases', () => {
  assert.throws(() => assertHttpBase('ftp://example.com'), /http\/https/);
  assert.throws(() => assertHttpBase('example.com'), /http\/https/);
});

test('normalizePath retains query prefixes and ensures leading slash', () => {
  assert.equal(normalizePath('?foo=bar'), '?foo=bar');
  assert.equal(normalizePath('foo/bar'), '/foo/bar');
});

test('throws descriptive errors when artifact write fails', () => {
  const original = fs.writeFileSync;
  fs.writeFileSync = () => {
    throw new Error('EACCES');
  };
  try {
    assert.throws(
      () => safeWriteJson('/no-permission/output.json', { foo: 'bar' }),
      /Artifact write failed/
    );
  } finally {
    fs.writeFileSync = original;
  }
});
