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

test('keeps GAS exec base while converting /exec query into query-only path', () => {
  const base = 'https://script.google.com/macros/s/AKID/exec';
  const result = buildTargetURL(base, '/exec?route=AA01');
  assert.equal(result.href, 'https://script.google.com/macros/s/AKID/exec?route=AA01');
  assert.equal(result.path, '?route=AA01');
});

test('throws when attempting to override GAS exec path without query', () => {
  const base = 'https://script.google.com/macros/s/AKID/exec';
  assert.throws(() => buildTargetURL(base, '/exec'), /query-only/);
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
