import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestMetrics, summarizeMetrics } from '../services/metricsSummary.js';

function row(id, campaign, type, value, time = '2026-01-02') {
  return { pk_id_metrica: id, fk_id_campanha: campaign, tipo_metrica: type, valor_metrica: value, periodo_metrica: 'last_30d', coletado_em: time };
}

test('repeated syncs use the newest snapshot, including zero values', () => {
  const rows = [row(1, 1, 'spend', '100', '2026-01-01'), row(2, 1, 'spend', '0'), row(3, 2, 'spend', '25')];
  assert.equal(summarizeMetrics(rows).spend, 25);
  assert.equal(latestMetrics(rows).length, 2);
  assert.equal(summarizeMetrics([...rows].reverse()).spend, 25);
});

test('same timestamp uses the newest metric ID', () => {
  assert.equal(summarizeMetrics([row(2, 1, 'spend', 15), row(1, 1, 'spend', 30)]).spend, 15);
});

test('CTR, CPC and CPM use weighted totals, never sums or simple averages', () => {
  const rows = [
    row(1, 1, 'impressions', 100), row(2, 1, 'clicks', 10), row(3, 1, 'spend', 20), row(4, 1, 'ctr', 10),
    row(5, 2, 'impressions', 900), row(6, 2, 'clicks', 9), row(7, 2, 'spend', 80), row(8, 2, 'ctr', 1),
  ];
  const totals = summarizeMetrics(rows);
  assert.equal(totals.ctr, 1.9);
  assert.equal(totals.cpc, 100 / 19);
  assert.equal(totals.cpm, 100);
  assert.equal(totals.revenue, undefined);
  assert.equal(totals.conversions, undefined);
});

test('empty metrics do not produce NaN or Infinity', () => {
  assert.deepEqual(summarizeMetrics([]), { ctr: 0, cpc: 0, cpm: 0, frequency: 0, cpa: 0 });
});
