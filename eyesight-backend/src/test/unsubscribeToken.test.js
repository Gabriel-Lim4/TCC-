import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnsubscribeToken, verifyUnsubscribeToken } from '../services/unsubscribeToken.js';

const secret = 'a'.repeat(32);
const now = new Date('2026-10-05T12:00:00Z');
const later = days => new Date(now.getTime() + days * 86400000);

test('a token round-trips to the user id', () => {
  const token = createUnsubscribeToken(42, { now, secret });
  assert.match(token, /^v1\.[\w-]+\.[\w-]+$/);
  assert.equal(verifyUnsubscribeToken(token, { now, secret }), 42);
  assert.equal(verifyUnsubscribeToken(token, { now: later(399), secret }), 42);
});

test('expired tokens are rejected', () => {
  const token = createUnsubscribeToken(42, { now, secret });
  assert.equal(verifyUnsubscribeToken(token, { now: later(401), secret }), null);
});

test('tampered, malformed or foreign tokens are rejected', () => {
  const token = createUnsubscribeToken(42, { now, secret });
  const [version, payload, signature] = token.split('.');
  const flip = text => (text[0] === 'A' ? 'B' : 'A') + text.slice(1);
  const forged = createUnsubscribeToken(43, { now, secret: 'b'.repeat(32) });
  for (const bad of [`${version}.${payload}.${flip(signature)}`, `${version}.${flip(payload)}.${signature}`, `v2.${payload}.${signature}`,
    `${version}.${payload}`, `${token}.x`, '', 'abc', null, undefined, 42, {}, forged]) {
    assert.equal(verifyUnsubscribeToken(bad, { now, secret }), null, String(bad));
  }
  assert.equal(verifyUnsubscribeToken(token, { now, secret: 'c'.repeat(32) }), null);
});

test('creating or verifying without a secret fails closed', () => {
  assert.throws(() => createUnsubscribeToken(1, { now, secret: '' }));
  const token = createUnsubscribeToken(1, { now, secret });
  assert.equal(verifyUnsubscribeToken(token, { now, secret: '' }), null);
});
