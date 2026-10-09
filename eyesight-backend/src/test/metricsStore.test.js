import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

const rows = [];
let queue = Promise.resolve();
const tx = {
  campanhas: { update: async () => ({}) },
  metricas: {
    findFirst: async ({ where }) => rows.find(row => Object.entries(where).every(([key, value]) => row[key] === value)),
    create: async ({ data }) => { rows.push({ pk_id_metrica: rows.length + 1, ...data }); },
    update: async ({ where, data }) => { Object.assign(rows.find(row => row.pk_id_metrica === where.pk_id_metrica), data); },
  },
};
mock.module('../config/database.js', { namedExports: { prisma: {
  $transaction: fn => { const next = queue.then(() => fn(tx)); queue = next.catch(() => {}); return next; },
} } });
const { saveMetrics } = await import('../services/metricsStore.js');

test('repeated syncs update a snapshot, preserve other periods and store zeros', async () => {
  await saveMetrics(1, 'last_30d', { spend: '100', clicks: '5', date_start: '2026-01-01' });
  await Promise.all([
    saveMetrics(1, 'last_30d', { spend: '100', clicks: '5' }),
    saveMetrics(1, 'last_30d', { spend: '100', clicks: '5' }),
  ]);
  assert.equal(rows.length, 2);
  await saveMetrics(1, 'today', { spend: 10 });
  await saveMetrics(1, 'last_30d', { spend: 0, clicks: 0 });
  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => row.periodo_metrica === 'today').valor_metrica, 10);
  assert.equal(rows.find(row => row.tipo_metrica === 'spend' && row.periodo_metrica === 'last_30d').valor_metrica, 0);
});
