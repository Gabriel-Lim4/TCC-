import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
const calls = [];
let responses = [];
mock.module('axios', { defaultExport: {
  get: async (...args) => { calls.push(args); return { data: responses.shift() }; },
  post: async (...args) => { calls.push(args); return { data: responses.shift() }; },
} });
mock.module('../config/env.js', { defaultExport: { meta: { graphVersion: 'v25.0' }, google: { apiVersion: 'v23', developerToken: 'test' } } });
const meta = await import('../services/metaService.js');
const google = await import('../services/googleService.js');

test('Meta purchase aliases do not double-count conversions or value', () => {
  const row = meta.normalizeMetaInsight({ spend: '12.5', actions: [
    { action_type: 'omni_purchase', value: '2' }, { action_type: 'purchase', value: '2' },
    { action_type: 'lead', value: '20' },
  ], action_values: [{ action_type: 'purchase', value: '40' }] });
  assert.equal(row.conversions, 2);
  assert.equal(row.revenue, 40);
  assert.equal(row.spend, 12.5);
});

test('Meta pagination uses cursors against original host, daily reports retain dates', async () => {
  calls.length = 0;
  responses = [{ data: [{ campaign_id: '1', date_start: '2026-10-01', spend: '2' }], paging: { next: 'https://untrusted.invalid', cursors: { after: 'page2' } } },
    { data: [{ campaign_id: '2', date_start: '2026-10-02', spend: '3' }] }];
  const rows = await meta.buscarInsightsDiarios('act_1', 'token', { since: '2026-10-01', until: '2026-10-02' });
  assert.equal(rows.length, 2);
  assert.equal(rows[1].date, '2026-10-02');
  assert.equal(calls[1][1].params.after, 'page2');
  assert.match(calls[1][0], /^https:\/\/graph.facebook.com\//);
});

test('Google paginates, converts micros and requests selected date range', async () => {
  calls.length = 0;
  const row = { campaign: { id: '9' }, segments: { date: '2026-10-01' }, metrics: { costMicros: '2500000', conversions: '1.5', conversionsValue: '8' } };
  responses = [{ results: [row], nextPageToken: 'second' }, { results: [] }];
  const rows = await google.buscarInsightsDiariosGoogle('123-456', 'token', { since: '2026-10-01', until: '2026-10-02' });
  assert.equal(rows[0].spend, 2.5);
  assert.equal(rows[0].conversions, 1.5);
  assert.equal(rows[0].revenue, 8);
  assert.equal(calls[1][1].pageToken, 'second');
  assert.match(calls[0][1].query, /BETWEEN '2026-10-01' AND '2026-10-02'/);
  await assert.rejects(google.buscarInsightsDiariosGoogle('123', 'token', { since: '2026-10-01', until: '2026-10-02' }, '1 OR 1=1'));
  assert.equal(calls.length, 2);
});
