import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
const saved = [];
const account = { pk_id_conta: 1, account_id: 'act_1', acess_token: 'token', currency: 'BRL' };
mock.module('../config/database.js', { namedExports: { prisma: {
  contas_vinculadas: { findFirst: async () => account, update: async () => account },
  campanhas: {
    findMany: async () => [{ pk_id_campanha: 10, id_externo: 'old' }],
    upsert: async () => ({ pk_id_campanha: 20, id_externo: 'new' }),
  },
} } });
mock.module('../services/metricsStore.js', { namedExports: { saveDailyMetrics: async (...args) => saved.push(args) } });
mock.module('../services/metaService.js', { namedExports: {
  buscarContaMeta: async () => ({ currency: 'BRL', name: 'Test', timezone_name: 'America/Sao_Paulo' }),
  buscarCampanhas: async () => [{ id: 'new', name: 'New', status: 'ACTIVE' }],
  buscarInsightsDiarios: async () => [{ campaignId: 'new', date: '2026-10-01', spend: 2, clicks: 1 }],
} });
mock.module('../services/googleService.js', { namedExports: {} });
const { syncMetaAccount, getGoogleAccessToken } = await import('../services/platformSyncService.js');

test('daily sync clears known empty campaigns in range and writes only daily rows', async () => {
  const range = { since: '2026-09-01', until: '2026-10-01', period: 'last_30d' };
  const result = await syncMetaAccount(1, range);
  assert.deepEqual(result.campaignIds, [10, 20]);
  assert.equal(result.currency, 'BRL');
  assert.deepEqual(saved[0], [10, [], range]);
  assert.equal(saved[1][1][0].campaignId, undefined);
  assert.equal(saved[1][1][0].spend, 2);
});

test('Google missing renewable credentials requests reconnect before a network call', async () => {
  await assert.rejects(getGoogleAccessToken(account), { code: 'RECONNECT_REQUIRED' });
});

test('with encryption on, the stored Google token is opened before use and the renewed one is stored sealed', async () => {
  const { sealToken } = await import('../services/tokenVault.js');
  process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString('base64');
  try {
    const sealed = sealToken('google-access');
    assert.match(sealed, /^enc:v1:/);
    const fresh = { ...account, acess_token: sealed, token_expires_at: new Date(Date.now() + 3600000) };
    assert.equal(await getGoogleAccessToken(fresh), 'google-access');
    // um token antigo em texto continua funcionando com a chave ligada
    assert.equal(await getGoogleAccessToken({ ...fresh, acess_token: 'legacy-plain' }), 'legacy-plain');
  } finally { delete process.env.TOKEN_ENCRYPTION_KEY; }
});
