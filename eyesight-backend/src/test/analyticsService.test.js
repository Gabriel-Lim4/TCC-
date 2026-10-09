import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
const queries = [];
let campaigns = [];
let dailyRows = [];
let snapshots = [];
mock.module('../config/database.js', { namedExports: { prisma: {
  campanhas: { findMany: async query => { queries.push(['campaigns', query]); return campaigns; } },
  campaign_daily_metrics: { findMany: async query => { queries.push(['daily', query]); return dailyRows.filter(row => query.where.campaign_id.in.includes(row.campaign_id)); } },
  metricas: { findMany: async query => { queries.push(['snapshots', query]); return snapshots; } },
  usuarios: { findUnique: async query => { queries.push(['user', query]); return { preferences: {} }; } },
} } });
const { getAnalytics } = await import('../services/analyticsService.js');
const makeCampaign = (id, currency = 'BRL') => ({ pk_id_campanha: id, id_externo: String(id), nome_campanha: `Campaign ${id}`, conta: { plataforma: 'meta', currency } });
const query = { startDate: '2026-09-01', endDate: '2026-09-02' };

test('analytics isolates owner/platform and never mixes currencies', async () => {
  queries.length = 0;
  campaigns = [makeCampaign(1), makeCampaign(2, 'USD')];
  dailyRows = [
    { campaign_id: 1, date: '2026-09-01', values: { spend: 10 } },
    { campaign_id: 2, date: '2026-09-01', values: { spend: 100 } },
  ];
  const result = await getAnalytics(55, { ...query, platform: 'meta' });
  assert.equal(result.totals.spend, 10);
  assert.deepEqual(result.currencies, ['BRL', 'USD']);
  assert.deepEqual(queries.find(([type]) => type === 'campaigns')[1].where, { conta: { fk_id_usuario: 55, plataforma: 'meta' } });
  assert.deepEqual(queries.find(([type]) => type === 'daily')[1].where.campaign_id.in, [1]);
  assert.equal(queries.find(([type]) => type === 'user')[1].where.pk_id_usuario, 55);
  assert.equal(result.daily[1].hasData, false);
  assert.ok(result.warnings.some(message => message.includes('sem coleta')));
  await assert.rejects(getAnalytics(55, { ...query, campaignId: '99' }), { statusCode: 404 });
});

test('unknown currency is explicit and previous periods are separated', async () => {
  campaigns = [makeCampaign(1, null)];
  dailyRows = [
    { campaign_id: 1, date: '2026-08-31', values: { spend: 4 } },
    { campaign_id: 1, date: '2026-09-01', values: { spend: 10 } },
  ];
  const result = await getAnalytics(55, query);
  assert.equal(result.currency, 'UNKNOWN');
  assert.equal(result.totals.spend, 10);
  assert.equal(result.previousTotals, null);
  assert.deepEqual(result.changes, {});
  assert.equal(result.previousComplete, false);
});

test('legacy duplicate snapshots select latest value and never fabricate daily history', async () => {
  campaigns = [makeCampaign(1)]; dailyRows = [];
  snapshots = [
    { fk_id_campanha: 1, periodo_metrica: 'last_30d', tipo_metrica: 'spend', valor_metrica: 20, coletado_em: new Date('2026-09-02'), pk_id_metrica: 2 },
    { fk_id_campanha: 1, periodo_metrica: 'last_30d', tipo_metrica: 'spend', valor_metrica: 10, coletado_em: new Date('2026-09-01'), pk_id_metrica: 1 },
  ];
  const result = await getAnalytics(55, { periodo: 'last_30d' });
  assert.equal(result.source, 'snapshot');
  assert.equal(result.totals.spend, 20);
  assert.deepEqual(result.daily, []);
  assert.equal(result.previousTotals, null);
  snapshots = [];
});


test('a collected campaign does not hide another campaign missing the same day', async () => {
  campaigns = [makeCampaign(1), makeCampaign(2)];
  dailyRows = [
    { campaign_id: 1, date: '2026-09-01', values: { spend: 10 } },
    { campaign_id: 1, date: '2026-09-02', values: { spend: 20 } },
  ];
  const result = await getAnalytics(55, query);
  assert.equal(result.currentComplete, false);
  assert.equal(result.daily[0].hasData, true);
  assert.equal(result.daily[0].complete, false);
  assert.equal(result.campaigns[0].complete, true);
  assert.equal(result.campaigns[1].complete, false);
});

test('complete adjacent periods provide a comparable percentage change', async () => {
  campaigns = [makeCampaign(1)];
  dailyRows = [
    { campaign_id: 1, date: '2026-08-30', values: { spend: 5 } },
    { campaign_id: 1, date: '2026-08-31', values: { spend: 5 } },
    { campaign_id: 1, date: '2026-09-01', values: { spend: 10 } },
    { campaign_id: 1, date: '2026-09-02', values: { spend: 20 } },
  ];
  const result = await getAnalytics(55, query);
  assert.equal(result.currentComplete, true);
  assert.equal(result.previousComplete, true);
  assert.equal(result.previousTotals.spend, 10);
  assert.equal(result.changes.spend, 200);
});

test('analytics adds a verdict without changing the existing fields', async () => {
  campaigns = [makeCampaign(1)];
  const day = (date, spend) => ({ campaign_id: 1, date, values: { impressions: 5000, clicks: 100, spend, conversions: 5 } });
  dailyRows = [day('2026-08-30', 200), day('2026-08-31', 200), day('2026-09-01', 150), day('2026-09-02', 150)];
  const result = await getAnalytics(55, query);
  assert.equal(result.currentComplete, true);
  assert.equal(result.previousComplete, true);
  assert.equal(result.totals.spend, 300);
  assert.equal(result.verdict.status, 'good');
  assert.equal(result.verdict.basis, 'comparison');
  assert.deepEqual(result.verdict.highlights.map(item => item.key), ['spend', 'clicks', 'conversions', 'cost']);
  assert.ok(Array.isArray(result.verdict.actions) && result.verdict.actions.length >= 1);
  for (const field of ['period', 'currency', 'totals', 'previousTotals', 'changes', 'campaigns', 'daily', 'alerts', 'alertSettings', 'warnings']) {
    assert.ok(field in result, `${field} must still be present`);
  }
});
