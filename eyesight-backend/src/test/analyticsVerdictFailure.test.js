import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

mock.module('../config/database.js', { namedExports: { prisma: {
  campanhas: { findMany: async () => [{ pk_id_campanha: 1, id_externo: '1', nome_campanha: 'Campaign 1', conta: { plataforma: 'meta', currency: 'BRL' } }] },
  campaign_daily_metrics: { findMany: async () => [{ campaign_id: 1, date: '2026-09-01', values: { spend: 10 } }] },
  metricas: { findMany: async () => [] },
  usuarios: { findUnique: async () => ({ preferences: {} }) },
} } });
mock.module('../services/verdictService.js', { namedExports: { buildVerdict: () => { throw new Error('boom'); } } });
const { getAnalytics } = await import('../services/analyticsService.js');

test('a failing verdict never breaks the analytics response', async () => {
  const result = await getAnalytics(55, { startDate: '2026-09-01', endDate: '2026-09-02' });
  assert.equal(result.verdict, null);
  assert.equal(result.totals.spend, 10);
  assert.equal(result.currency, 'BRL');
  assert.equal(result.campaigns.length, 1);
});
