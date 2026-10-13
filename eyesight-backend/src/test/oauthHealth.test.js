import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
let existing = null;
let updates = [];
let purpose = 'meta-oauth';
let databaseError = false;
let healthQueries = 0;
mock.module('../config/database.js', { namedExports: { prisma: {
  contas_vinculadas: {
    findFirst: async () => existing,
    upsert: async data => { updates.push(data); return {}; },
  },
  $queryRaw: async () => { healthQueries++; if (databaseError) throw new Error('SECRET_DATABASE_URL'); return [{ '?column?': 1 }]; },
} } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'https://eyesight.test', jwt: { secret: 'test' }, meta: {}, google: {} } });
mock.module('jsonwebtoken', { defaultExport: { verify: () => ({ finalidade: purpose, userId: 42 }) } });
mock.module('../services/metaService.js', { namedExports: {
  trocarCodePorToken: async () => ({ access_token: 'short-token' }),
  trocarPorTokenLongo: async () => ({ access_token: 'private-token', expiraEm: new Date('2027-01-01') }),
  buscarAdAccountId: async () => 'act_new',
} });
mock.module('../services/googleService.js', { namedExports: {
  trocarCodePorTokenGoogle: async () => ({ access_token: 'private-token', refresh_token: 'private-refresh', expires_in: 3600 }),
  buscarClienteGoogle: async () => 'new',
} });
mock.module('../services/platformSyncService.js', { namedExports: { getGoogleAccessToken: async () => 'private-token' } });
mock.module('../services/metricsStore.js', { namedExports: { saveMetrics: async () => {} } });
const { callback } = await import('../controllers/metaController.js');
const { callbackGoogle } = await import('../controllers/googleController.js');
const { health } = await import('../controllers/healthController.js');
const response = () => ({ statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, set(name, value) { this.headers[name] = value; return this; }, json(value) { this.body = value; return this; }, redirect(url) { this.url = url; return this; } });

test('Meta and Google reject changing linked account without writing or deleting records', async () => {
  existing = { account_id: 'old' }; updates = [];
  const metaResponse = response(); purpose = 'meta-oauth';
  await callback({ query: { code: 'code', state: 'state' } }, metaResponse);
  assert.equal(metaResponse.url, 'https://eyesight.test/app/meta?meta=troca-bloqueada');
  const googleResponse = response(); purpose = 'google-oauth';
  await callbackGoogle({ query: { code: 'code', state: 'state' } }, googleResponse);
  assert.match(googleResponse.url, /google=troca-bloqueada$/);
  assert.equal(updates.length, 0);
});

test('renewing same OAuth account preserves link and permits token rotation', async () => {
  existing = { account_id: 'act_new' }; updates = []; purpose = 'meta-oauth';
  const res = response();
  await callback({ query: { code: 'code', state: 'state' } }, res);
  assert.equal(res.url, 'https://eyesight.test/app?meta=conectado');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].update.account_id, 'act_new');
  assert.equal(updates[0].where.fk_id_usuario_plataforma.fk_id_usuario, 42);
});

// /app/meta é a tela que lê ?meta=; /app/account é estática e ignoraria o retorno.
test('Meta callback failures return to the Meta screen', async () => {
  for (const query of [{}, { error: 'access_denied' }]) {
    const res = response();
    await callback({ query }, res);
    assert.match(res.url, /^https:\/\/eyesight\.test\/app\/meta\?meta=(erro|negado)$/);
  }
});

test('health pings database and reports sanitized outage without exposing internals', async () => {
  databaseError = false;
  let res = response(); await health({}, res);
  assert.equal(res.body.database, 'ok');
  assert.equal(res.headers['Cache-Control'], 'no-store');
  databaseError = true;
  res = response(); await health({}, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.database, 'unavailable');
  assert.equal(JSON.stringify(res.body).includes('SECRET'), false);
  assert.equal(healthQueries, 2);
});
