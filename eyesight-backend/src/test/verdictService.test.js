import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, buildVerdict } from '../services/verdictService.js';

const NOW = new Date('2026-10-08T12:00:00Z');
const HOUR = 3600000;
function analytics(overrides = {}) {
  const { totals, changes, alertSettings, campaigns, ...rest } = overrides;
  return {
    hasData: true, currentComplete: true, previousComplete: true, currency: 'BRL',
    period: { period: 'last_30d', days: 30 },
    totals: { spend: 1000, clicks: 500, impressions: 50000, ctr: 1, conversions: 25, cpa: 40, cpc: 2, revenue: null, ...totals },
    changes: { cpa: -15, cpc: 0, clicks: 10, conversions: 5, spend: 2, ...changes },
    campaigns: campaigns || [],
    alertSettings: alertSettings || {},
    lastSyncedAt: new Date(NOW - HOUR).toISOString(),
    ...rest,
  };
}
const build = (overrides, now = NOW) => buildVerdict(analytics(overrides), { now });
const codes = verdict => verdict.reasons.map(reason => reason.code);

describe('constants', () => {
  it('exposes the documented limits', () => {
    assert.deepEqual(LIMITS, {
      STABLE_BAND_PCT: 5, MIN_CLICKS: 30, MIN_IMPRESSIONS_FOR_CTR: 100, BUDGET_NEAR_RATIO: 0.8,
      WASTED_SPEND_SHARE: 0.2, STALE_HOURS: 24, MAX_ACTIONS: 3, NAME_MAX: 80,
    });
  });
});

describe('comparison basis', () => {
  it('rates a cheaper cost per result as good', () => {
    const verdict = build();
    assert.equal(verdict.status, 'good');
    assert.equal(verdict.basis, 'comparison');
    assert.equal(verdict.indicator, 'cpa');
    assert.equal(verdict.insufficientReason, null);
    assert.deepEqual(verdict.reasons[0], { code: 'cost_better', params: { indicator: 'cpa', change: -15, value: 40 } });
  });

  for (const [change, status, code] of [[-5, 'good', 'cost_better'], [-4.99, 'stable', 'cost_stable'], [4.99, 'stable', 'cost_stable'], [5, 'attention', 'cost_worse']]) {
    it(`maps a ${change}% change to ${status}`, () => {
      const verdict = build({ changes: { cpa: change } });
      assert.equal(verdict.status, status);
      assert.equal(verdict.basis, 'comparison');
      assert.equal(verdict.reasons[0].code, code);
    });
  }
});

describe('goal basis', () => {
  it('is good when the cost per result is within the goal', () => {
    const verdict = build({ alertSettings: { cpaMax: 50 } });
    assert.equal(verdict.status, 'good');
    assert.equal(verdict.basis, 'goal');
    assert.deepEqual(verdict.reasons[0], { code: 'cost_within_goal', params: { value: 40, goal: 50 } });
    assert.ok(codes(verdict).includes('cost_better'), 'comparison stays as supporting reason');
  });

  it('is attention when above the goal even if the comparison improved', () => {
    const verdict = build({ alertSettings: { cpaMax: 30 } });
    assert.equal(verdict.status, 'attention');
    assert.equal(verdict.basis, 'goal');
    assert.deepEqual(verdict.reasons[0], { code: 'cost_above_goal', params: { value: 40, goal: 30 } });
    assert.ok(codes(verdict).includes('cost_better'));
  });

  it('still evaluates the goal when there is no previous period', () => {
    const verdict = build({ previousComplete: false, changes: {}, alertSettings: { cpaMax: 50 } });
    assert.equal(verdict.status, 'good');
    assert.equal(verdict.basis, 'goal');
  });

  it('ignores money goals when the currency is unknown and falls back to comparison', () => {
    const verdict = build({ currency: 'UNKNOWN', alertSettings: { cpaMax: 30 } });
    assert.equal(verdict.status, 'good');
    assert.equal(verdict.basis, 'comparison');
  });
});

describe('cost per click fallback', () => {
  it('judges by cost per click when conversions are not tracked', () => {
    const verdict = build({ totals: { conversions: null, cpa: null }, changes: { cpc: 10 } });
    assert.equal(verdict.indicator, 'cpc');
    assert.ok(codes(verdict).includes('no_conversion_tracking'));
    assert.equal(verdict.status, 'attention');
    assert.equal(verdict.reasons.find(reason => reason.code === 'cost_worse').params.indicator, 'cpc');
  });

  it('tells apart tracked-but-zero conversions', () => {
    const verdict = build({ totals: { conversions: 0, cpa: null } });
    assert.equal(verdict.indicator, 'cpc');
    assert.ok(codes(verdict).includes('no_results_yet'));
    assert.ok(!codes(verdict).includes('no_conversion_tracking'));
  });

  it('never applies the cost-per-result goal to cost per click', () => {
    const verdict = build({ totals: { conversions: null, cpa: null }, changes: { cpc: 0 }, alertSettings: { cpaMax: 1 } });
    assert.equal(verdict.basis, 'comparison');
    assert.equal(verdict.status, 'stable');
  });
});

describe('insufficient data', () => {
  const cases = [
    ['no_data', { hasData: false }],
    ['incomplete_period', { currentComplete: false }],
    ['zero_spend', { totals: { spend: 0 } }],
    ['low_volume', { totals: { clicks: 29 } }],
    ['no_baseline', { previousComplete: false, changes: {} }],
  ];
  for (const [reason, overrides] of cases) {
    it(`reports ${reason}`, () => {
      const verdict = build(overrides);
      assert.equal(verdict.status, 'insufficient');
      assert.equal(verdict.basis, 'none');
      assert.equal(verdict.insufficientReason, reason);
    });
  }

  it('evaluates normally with exactly 30 clicks', () => {
    assert.notEqual(build({ totals: { clicks: 30 } }).status, 'insufficient');
  });
});

describe('budget and click-through signals', () => {
  it('flags an exceeded budget even with very few clicks', () => {
    const verdict = build({ totals: { clicks: 10 }, alertSettings: { budgetMax: 900 } });
    assert.equal(verdict.status, 'attention');
    assert.deepEqual(verdict.reasons[0], { code: 'budget_exceeded', params: { spend: 1000, limit: 900 } });
  });

  it('warns at 80% of the budget without changing the status', () => {
    const verdict = build({ alertSettings: { budgetMax: 1250 } });
    assert.equal(verdict.status, 'good');
    assert.deepEqual(verdict.reasons.find(reason => reason.code === 'budget_near'), { code: 'budget_near', params: { spend: 1000, limit: 1250, percent: 80 } });
  });

  it('does not warn below 80%', () => {
    assert.ok(!codes(build({ alertSettings: { budgetMax: 1260 } })).includes('budget_near'));
  });

  it('ignores the budget when the currency is unknown', () => {
    const verdict = build({ currency: 'UNKNOWN', alertSettings: { budgetMax: 900 } });
    assert.ok(!codes(verdict).includes('budget_exceeded'));
  });

  it('flags a click-through rate below the minimum', () => {
    const verdict = build({ alertSettings: { ctrMin: 2 } });
    assert.equal(verdict.status, 'attention');
    assert.ok(verdict.reasons.some(reason => reason.code === 'ctr_below_min' && reason.params.ctr === 1 && reason.params.min === 2));
  });

  it('ignores the click-through rate with fewer than 100 impressions', () => {
    const verdict = build({ totals: { impressions: 99 }, alertSettings: { ctrMin: 2 } });
    assert.ok(!codes(verdict).includes('ctr_below_min'));
  });

  it('lets the worst signal win and lists attention reasons first', () => {
    const verdict = build({ alertSettings: { ctrMin: 2 } });
    assert.equal(verdict.status, 'attention');
    assert.equal(verdict.reasons[0].code, 'ctr_below_min');
    assert.ok(codes(verdict).includes('cost_better'));
  });
});

describe('malformed input', () => {
  it('throws instead of inventing a verdict', () => {
    assert.throws(() => buildVerdict({}, { now: NOW }));
    assert.throws(() => buildVerdict(null, { now: NOW }));
  });
});

describe('highlights', () => {
  const trendOf = (key, overrides) => build(overrides).highlights.find(item => item.key === key).trend;

  it('always returns the four cards in order', () => {
    const verdict = build();
    assert.deepEqual(verdict.highlights.map(item => item.key), ['spend', 'clicks', 'conversions', 'cost']);
    assert.deepEqual(verdict.highlights[0], { key: 'spend', value: 1000, change: 2, trend: 'neutral', available: true });
  });

  it('keeps spend neutral whatever the change', () => {
    assert.equal(trendOf('spend', { changes: { spend: 80 } }), 'neutral');
    assert.equal(trendOf('spend', { changes: { spend: -80 } }), 'neutral');
  });

  it('maps changes to trends by direction', () => {
    assert.equal(trendOf('clicks', { changes: { clicks: 10 } }), 'better');
    assert.equal(trendOf('clicks', { changes: { clicks: -10 } }), 'worse');
    assert.equal(trendOf('conversions', { changes: { conversions: 10 } }), 'better');
    assert.equal(trendOf('conversions', { changes: { conversions: -10 } }), 'worse');
    assert.equal(trendOf('cost', { changes: { cpa: -15 } }), 'better');
    assert.equal(trendOf('cost', { changes: { cpa: 15 } }), 'worse');
    assert.equal(trendOf('clicks', { changes: { clicks: 4.99 } }), 'stable');
    assert.equal(trendOf('cost', { changes: { cpa: -4.99 } }), 'stable');
  });

  it('is unknown when there is no change to compare', () => {
    const verdict = buildVerdict({ ...analytics({ previousComplete: false }), changes: {} }, { now: NOW });
    assert.ok(verdict.highlights.every(item => item.key === 'spend' ? item.trend === 'neutral' : item.trend === 'unknown'));
    assert.equal(verdict.highlights[1].change, null);
  });

  it('shows no trend on a partial current period, even if the API sent changes', () => {
    const verdict = build({ currentComplete: false });
    assert.ok(verdict.highlights.every(item => item.change === null), 'every change is hidden');
    assert.ok(verdict.highlights.filter(item => item.key !== 'spend').every(item => item.trend === 'unknown'));
    assert.equal(verdict.highlights[0].trend, 'neutral');
  });

  it('shows no trend when the previous period is incomplete', () => {
    const verdict = build({ previousComplete: false });
    assert.ok(verdict.highlights.every(item => item.change === null));
    assert.ok(verdict.highlights.filter(item => item.key !== 'spend').every(item => item.trend === 'unknown'));
  });

  it('marks conversions unavailable only when they are not tracked', () => {
    assert.equal(build().highlights[2].available, true);
    assert.equal(build({ totals: { conversions: null, cpa: null } }).highlights[2].available, false);
    assert.equal(build({ totals: { conversions: 0, cpa: null } }).highlights[2].available, true);
  });

  it('uses the chosen indicator for the cost card', () => {
    assert.equal(build().highlights[3].value, 40);
    const cpc = build({ totals: { conversions: null, cpa: null }, changes: { cpc: -20 } }).highlights[3];
    assert.deepEqual(cpc, { key: 'cost', value: 2, change: -20, trend: 'better', available: true });
  });
});

describe('actions', () => {
  const camp = (id, name, metrics) => ({ id, name, metrics: { spend: 100, impressions: 5000, clicks: 50, ctr: 1, conversions: 5, cpa: 20, ...metrics } });
  const actionCodes = overrides => build(overrides).actions.map(action => action.code);

  it('says nothing is urgent when nothing applies, so the list is never empty', () => {
    assert.deepEqual(build().actions, [{ code: 'nothing_urgent', params: {} }]);
  });

  it('puts an exceeded budget first', () => {
    const [first] = build({ alertSettings: { budgetMax: 900 } }).actions;
    assert.deepEqual(first, { code: 'budget_exceeded', params: { spend: 1000, limit: 900 } });
  });

  it('picks the campaign with the worst cost against the goal', () => {
    const campaigns = [camp(1, 'A', { cpa: 45 }), camp(2, 'B', { cpa: 60 }), camp(3, 'C', { cpa: 20 })];
    const action = build({ campaigns, alertSettings: { cpaMax: 30 } }).actions.find(item => item.code === 'campaign_over_goal');
    assert.deepEqual(action, { code: 'campaign_over_goal', params: { campaign: 'B', value: 60, goal: 30 }, campaignId: 2 });
  });

  it('picks the lowest click-through rate and ignores campaigns with few impressions', () => {
    const campaigns = [camp(1, 'X', { ctr: 1.5 }), camp(2, 'Y', { ctr: 0.5 }), camp(3, 'Z', { ctr: 0.1, impressions: 50 })];
    const action = build({ campaigns, alertSettings: { ctrMin: 2 } }).actions.find(item => item.code === 'campaign_low_ctr');
    assert.deepEqual(action, { code: 'campaign_low_ctr', params: { campaign: 'Y', ctr: 0.5, min: 2 }, campaignId: 2 });
  });

  it('flags the biggest campaign that spends a fifth of the total without results', () => {
    const campaigns = [camp(1, 'W', { conversions: 0, spend: 300 }), camp(2, 'V', { conversions: 0, spend: 250 }), camp(3, 'U', { conversions: 0, spend: 100 })];
    const action = build({ campaigns }).actions.find(item => item.code === 'campaign_without_results');
    assert.deepEqual(action, { code: 'campaign_without_results', params: { campaign: 'W', spend: 300 }, campaignId: 1 });
    assert.ok(!actionCodes({ campaigns: [camp(3, 'U', { conversions: 0, spend: 100 })] }).includes('campaign_without_results'));
  });

  it('does not flag campaigns without results when conversions are not tracked', () => {
    const campaigns = [camp(1, 'W', { conversions: 0, spend: 300 })];
    assert.ok(!actionCodes({ campaigns, totals: { conversions: null, cpa: null } }).includes('campaign_without_results'));
  });

  it('asks to enable conversion tracking only on a complete period', () => {
    assert.ok(actionCodes({ totals: { conversions: null, cpa: null } }).includes('enable_conversion_tracking'));
    assert.ok(!actionCodes({ totals: { conversions: null, cpa: null }, currentComplete: false }).includes('enable_conversion_tracking'));
  });

  it('asks to refresh stale data relative to the injected clock', () => {
    const at = hours => new Date(NOW - hours * HOUR).toISOString();
    const stale = build({ lastSyncedAt: at(25) }).actions;
    assert.deepEqual(stale, [{ code: 'refresh_data', params: { lastSyncedAt: at(25) } }]);
    assert.ok(!build({ lastSyncedAt: at(23) }).actions.some(action => action.code === 'refresh_data'));
    assert.ok(build({ lastSyncedAt: null }).actions.some(action => action.code === 'refresh_data'));
  });

  it('keeps only the three highest priorities, in order', () => {
    const campaigns = [camp(1, 'A', { cpa: 60, ctr: 0.5, conversions: 0, spend: 400 })];
    const actions = build({
      campaigns, lastSyncedAt: new Date(NOW - 30 * HOUR).toISOString(), totals: { conversions: 25 },
      alertSettings: { budgetMax: 900, cpaMax: 30, ctrMin: 2 },
    }).actions;
    assert.deepEqual(actions.map(action => action.code), ['budget_exceeded', 'campaign_over_goal', 'campaign_low_ctr']);
  });

  it('drops money-based actions when the currency is unknown but keeps the rest', () => {
    const campaigns = [camp(1, 'A', { cpa: 60, conversions: 0, spend: 400 })];
    const codes = actionCodes({ campaigns, currency: 'UNKNOWN', alertSettings: { budgetMax: 900, cpaMax: 30 } });
    assert.ok(!codes.includes('budget_exceeded') && !codes.includes('campaign_over_goal'));
    assert.ok(codes.includes('campaign_without_results'));
  });

  it('cuts long campaign names to 80 characters and keeps markup as raw text', () => {
    const long = 'x'.repeat(120);
    const html = '<img src=x onerror=alert(1)>';
    const campaigns = [camp(1, long, { conversions: 0, spend: 300 }), camp(2, html, { cpa: 99 })];
    const actions = build({ campaigns, alertSettings: { cpaMax: 30 } }).actions;
    assert.equal(actions.find(action => action.code === 'campaign_without_results').params.campaign.length, 80);
    assert.equal(actions.find(action => action.code === 'campaign_over_goal').params.campaign, html);
  });
});

describe('spend without results', () => {
  const none = { conversions: 0, cpa: null };
  const goal = { alertSettings: { cpaMax: 40 } };
  const spending = (spend, extra = {}) => build({ totals: { ...none, spend }, ...goal, ...extra });

  it('flags attention when conversions are tracked, zero, and spend is at least twice the goal', () => {
    const verdict = spending(80);
    assert.equal(verdict.status, 'attention');
    assert.deepEqual(verdict.reasons.find(reason => reason.code === 'spend_without_results'), { code: 'spend_without_results', params: { spend: 80, goal: 40 } });
    assert.deepEqual(verdict.actions.find(action => action.code === 'spend_without_results'), { code: 'spend_without_results', params: { spend: 80, goal: 40 } });
  });

  it('puts it ahead of the softer reasons', () => {
    assert.equal(spending(500).reasons[0].code, 'spend_without_results');
  });

  it('stays quiet below twice the goal', () => {
    const verdict = spending(79.99);
    assert.ok(!codes(verdict).includes('spend_without_results'));
    assert.ok(!verdict.actions.some(action => action.code === 'spend_without_results'));
  });

  it('needs a goal, a known currency, a complete period and tracked conversions', () => {
    assert.ok(!codes(build({ totals: { ...none, spend: 900 } })).includes('spend_without_results'));
    assert.ok(!codes(spending(900, { currency: 'UNKNOWN' })).includes('spend_without_results'));
    assert.ok(!codes(spending(900, { currentComplete: false })).includes('spend_without_results'));
    assert.ok(!codes(build({ totals: { spend: 900, conversions: null, cpa: null }, ...goal })).includes('spend_without_results'));
    assert.ok(!codes(build({ totals: { spend: 900, conversions: 3, cpa: 300 }, ...goal })).includes('spend_without_results'));
  });
});
