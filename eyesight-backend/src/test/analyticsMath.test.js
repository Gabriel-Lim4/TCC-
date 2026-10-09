import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateValues, metricChanges, csvCell } from '../services/analyticsMath.js';
import { resolveDateRange } from '../services/dateRange.js';

test('ratios use weighted totals and do not average campaign rates', () => {
  const result = aggregateValues([
    { impressions: 100, clicks: 10, spend: 20, conversions: 2, revenue: 100 },
    { impressions: 900, clicks: 9, spend: 180, conversions: 8, revenue: 300 },
  ]);
  assert.equal(result.ctr, 1.9);
  assert.equal(result.cpc, 200 / 19);
  assert.equal(result.cpm, 200);
  assert.equal(result.cpa, 20);
  assert.equal(result.roas, 2);
});

test('unknown conversion values propagate rather than become zero', () => {
  const result = aggregateValues([{ spend: 2, conversions: 1, revenue: 4 }, { spend: 3 }]);
  assert.equal(result.conversions, null);
  assert.equal(result.revenue, null);
  assert.equal(result.roas, null);
  assert.equal(aggregateValues([]).cpc, null);
  assert.deepEqual(metricChanges({ spend: 10, cpc: null }, { spend: 0, cpc: 1 }), { spend: null, cpc: null });
});

test('CSV neutralizes formulas, quotes embedded separators/newlines safely', () => {
  for (const value of ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', ' \t=HYPERLINK("x")']) {
    assert.ok(csvCell(value).startsWith('"\''));
  }
  assert.equal(csvCell('Campanha "A";\nB'), '"Campanha ""A"";\nB"');
  assert.equal(csvCell(null), '""');
});

test('date ranges reject impossible/inverted/future dates and compare equal length', () => {
  const now = new Date('2026-10-04T01:00:00Z');
  const result = resolveDateRange({ periodo: 'last_7d' }, now);
  assert.equal(result.until, '2026-10-03');
  assert.equal(result.since, '2026-09-27');
  assert.equal(result.previousSince, '2026-09-20');
  assert.equal(result.previousUntil, '2026-09-26');
  for (const [startDate, endDate] of [['2026-02-30', '2026-03-02'], ['2026-10-02', '2026-10-01'], ['2026-10-01', '2026-10-05']]) {
    assert.throws(() => resolveDateRange({ startDate, endDate }, now), { statusCode: 400 });
  }
  assert.throws(() => resolveDateRange({ periodo: 'all_time' }, now));
  assert.equal(resolveDateRange({ startDate: '2024-02-29', endDate: '2024-02-29' }, now).days, 1);
});
