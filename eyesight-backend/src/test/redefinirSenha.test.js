import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

let putCalls = 0;
mock.module('axios', { defaultExport: { put: async () => { putCalls++; return {}; } } });
mock.module('../config/database.js', { namedExports: { prisma: {} } });
mock.module('../config/supabase.js', { namedExports: { createAuthClient: () => ({}) } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'http://localhost', supabase: { url: 'http://s', anonKey: 'k' } } });
const { redefinirSenha } = await import('../controllers/authController.js');

const jwt = amr => `h.${Buffer.from(JSON.stringify({ amr })).toString('base64url')}.s`;
const run = async accessToken => {
  const res = { status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
  await redefinirSenha({ body: { accessToken, novaSenha: 'SenhaForte123' } }, res);
  return res;
};

test('a normal login session token cannot reset the password', async () => {
  putCalls = 0;
  const res = await run(jwt([{ method: 'password', timestamp: 1 }]));
  assert.equal(res.statusCode, 400);
  assert.equal(putCalls, 0);
});

test('a recovery token resets the password', async () => {
  putCalls = 0;
  for (const method of ['recovery', 'otp']) {
    const res = await run(jwt([{ method, timestamp: 1 }]));
    assert.equal(res.statusCode, 200);
  }
  assert.equal(putCalls, 2);
});

test('malformed tokens are rejected', async () => {
  putCalls = 0;
  assert.equal((await run('lixo')).statusCode, 400);
  assert.equal(putCalls, 0);
});
