import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
let rows = [];
let transactions = 0;
const tx = {
  campanhas: { update: async () => ({}) },
  campaign_daily_metrics: {
    deleteMany: async ({ where }) => { rows = rows.filter(row => !(row.campaign_id === where.campaign_id && row.date >= where.date.gte && row.date <= where.date.lte)); },
    createMany: async ({ data }) => { rows.push(...data); },
  },
};
mock.module('../config/database.js', { namedExports: { prisma: { $transaction: async fn => { transactions++; return fn(tx); } } } });
const { saveDailyMetrics } = await import('../services/metricsStore.js');
const range = { since: '2026-09-01', until: '2026-09-03' };

test('daily sync replaces only selected campaign/range and pads confirmed zero days', async () => {
  rows = [
    { campaign_id: 1, date: new Date('2026-08-31'), values: { spend: 99 } },
    { campaign_id: 2, date: new Date('2026-09-01'), values: { spend: 77 } },
  ];
  for (let i = 0; i < 2; i++) await saveDailyMetrics(1, [{ date: '2026-09-01', spend: 5, revenue: null }], range);
  assert.equal(rows.length, 5);
  assert.equal(rows.find(row => row.campaign_id === 2).values.spend, 77);
  const updated = rows.find(row => row.campaign_id === 1 && row.date.toISOString().startsWith('2026-09-01'));
  assert.equal(updated.values.spend, 5);
  assert.equal(updated.values.revenue, undefined);
  await saveDailyMetrics(1, [], range);
  assert.equal(rows.filter(row => row.campaign_id === 1 && row.date >= new Date('2026-09-01')).every(row => row.values.spend === 0), true);
});

test('invalid API dates and duplicate campaign/day totals fail before mutation', async () => {
  const before = transactions;
  await assert.rejects(saveDailyMetrics(1, [{ date: '2026-02-30', spend: 1 }], { since: '2026-02-01', until: '2026-03-05' }));
  await assert.rejects(saveDailyMetrics(1, [{ date: '2026-09-01' }, { date: '2026-09-01' }], range));
  await assert.rejects(saveDailyMetrics(1, [{ date: '2026-10-01' }], range));
  await assert.rejects(saveDailyMetrics(1, [], { since: 'invalid', until: '2026-09-03' }));
  await assert.rejects(saveDailyMetrics(1, [], { since: '2026-09-03', until: '2026-09-01' }));
  assert.equal(transactions, before);
});
