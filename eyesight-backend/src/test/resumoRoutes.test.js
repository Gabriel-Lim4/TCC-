import test, { beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import env from '../config/env.js';

const SECRET = 'r'.repeat(32);
const writes = [];
const sent = [];
let analyticsImpl;
let sendImpl;
const analyticsCalls = [];
mock.module('../config/database.js', { namedExports: { prisma: { $executeRaw: async (strings, ...values) => { writes.push({ sql: strings.join('?'), values }); return 1; } } } });
mock.module('../services/analyticsService.js', { namedExports: { getAnalytics: async (userId, query) => { analyticsCalls.push([userId, query]); return analyticsImpl(); } } });
mock.module('../services/emailService.js', { namedExports: { enviarResumoSemanal: async message => { sent.push(message); return sendImpl(message); }, enviarEmailVerificacao: async () => {} } });
const fakeAuth = (_req, _res, next) => next();
mock.module('../middlewares/authMiddleware.js', { defaultExport: fakeAuth });
const { enviarTeste, cancelar } = await import('../controllers/resumoController.js');
const { default: router } = await import('../routes/resumoRoutes.js');
const { createUnsubscribeToken } = await import('../services/unsubscribeToken.js');

const analytics = (extra = {}) => ({ hasData: true, currency: 'BRL', currentComplete: true, previousComplete: true, period: { period: 'last_7d', days: 7, since: '2026-09-28', until: '2026-10-04' },
  verdict: { status: 'stable', basis: 'comparison', indicator: 'cpa', insufficientReason: null, reasons: [], actions: [{ code: 'nothing_urgent', params: {} }],
    highlights: [{ key: 'spend', value: 10, change: null, trend: 'neutral', available: true }, { key: 'clicks', value: 5, change: null, trend: 'unknown', available: true },
      { key: 'conversions', value: 1, change: null, trend: 'unknown', available: true }, { key: 'cost', value: 10, change: null, trend: 'unknown', available: true }] }, ...extra });
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const run = async (handler, req) => { const res = response(); await handler(req, res); return res; };
const asUser = { usuario: { id: 7, nome: 'Ana', email: 'ana@example.com' }, body: {}, query: {} };

beforeEach(() => {
  env.unsubscribeSecret = SECRET; env.backendUrl = 'https://api.example.com';
  writes.length = 0; sent.length = 0; analyticsCalls.length = 0;
  analyticsImpl = async () => analytics();
  sendImpl = async () => {};
});

test('the example goes only to the signed-in user, from the 7-day verdict', async () => {
  const res = await run(enviarTeste, asUser);
  assert.equal(res.code, undefined);
  assert.match(res.body.mensagem, /Enviamos um exemplo/);
  assert.deepEqual(analyticsCalls, [[7, { periodo: 'last_7d' }]]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'ana@example.com');
  assert.ok(sent[0].html.includes('Olá, Ana'));
  assert.ok(sent[0].unsubscribeUrl.includes('/cancelar-resumo?t='));
  assert.equal(writes.length, 0);
});

test('the example answers 409 without data or verdict and 409 without an account e-mail', async () => {
  analyticsImpl = async () => analytics({ hasData: false });
  assert.equal((await run(enviarTeste, asUser)).code, 409);
  analyticsImpl = async () => analytics({ verdict: null });
  assert.equal((await run(enviarTeste, asUser)).code, 409);
  analyticsImpl = async () => analytics();
  assert.equal((await run(enviarTeste, { ...asUser, usuario: { ...asUser.usuario, email: '' } })).code, 409);
  assert.equal(sent.length, 0);
});

test('the example answers 503 when e-mail is not configured and 502 when sending fails', async () => {
  env.unsubscribeSecret = '';
  assert.equal((await run(enviarTeste, asUser)).code, 503);
  env.unsubscribeSecret = SECRET;
  sendImpl = async () => { throw new Error('RESEND_API_KEY não configurada.'); };
  assert.equal((await run(enviarTeste, asUser)).code, 503);
  sendImpl = async () => { throw new Error('domain not verified ana@example.com'); };
  const failed = await run(enviarTeste, asUser);
  assert.equal(failed.code, 502);
  assert.ok(!JSON.stringify(failed.body).includes('domain'));
});

test('a valid token turns off only that user\'s summary and keeps the other preferences', async () => {
  const token = createUnsubscribeToken(7, { secret: SECRET });
  const res = await run(cancelar, { body: { token }, query: {} });
  assert.equal(res.code, undefined);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].values, [7]);
  assert.match(writes[0].sql, /UPDATE usuarios SET preferences = COALESCE\(preferences, '\{\}'::jsonb\) \|\| jsonb_build_object\('summary', jsonb_build_object\('weekly', false\)\) WHERE pk_id_usuario = \?/);
});

test('the token may also arrive in the query (one-click header), and cancelling twice is harmless', async () => {
  const token = createUnsubscribeToken(8, { secret: SECRET });
  assert.equal((await run(cancelar, { query: { t: token } })).code, undefined);
  assert.equal((await run(cancelar, { body: undefined, query: { t: token } })).code, undefined);
  assert.deepEqual(writes.map(write => write.values[0]), [8, 8]);
});

test('invalid, expired, missing or foreign tokens never write', async () => {
  const good = createUnsubscribeToken(7, { secret: SECRET });
  const expired = createUnsubscribeToken(7, { secret: SECRET, now: new Date('2024-01-01T00:00:00Z') });
  const foreign = createUnsubscribeToken(7, { secret: 'x'.repeat(32) });
  for (const token of [good.slice(0, -2) + 'zz', expired, foreign, '', undefined, 7, { a: 1 }]) {
    const res = await run(cancelar, { body: { token }, query: {} });
    assert.equal(res.code, 400, String(token));
  }
  assert.equal((await run(cancelar, { body: {}, query: {} })).code, 400);
  assert.equal(writes.length, 0);
});

test('only the test route needs a session; cancelling is public; both are rate limited', () => {
  const routes = Object.fromEntries(router.stack.filter(layer => layer.route).map(layer => [layer.route.path, layer.route.stack.map(item => item.handle)]));
  assert.ok(routes['/teste'].includes(fakeAuth));
  assert.ok(!routes['/cancelar'].includes(fakeAuth));
  assert.equal(routes['/teste'].length, 3);
  assert.equal(routes['/cancelar'].length, 2);
});
