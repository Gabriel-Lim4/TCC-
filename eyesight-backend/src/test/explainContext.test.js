import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFocus, buildExplainContext, EXPLAIN_MAX_CHARS } from '../services/explainContext.js';
import { LIMITS } from '../services/verdictService.js';

const verdict = overrides => ({
  status: 'attention', basis: 'goal', indicator: 'cpa', insufficientReason: null,
  reasons: [{ code: 'cost_above_goal', params: { value: 80, goal: 50 } }, { code: 'ctr_below_min', params: { ctr: 0.5, min: 1 } }],
  highlights: [
    { key: 'spend', value: 1000, change: 2, trend: 'neutral', available: true },
    { key: 'clicks', value: 500, change: 10, trend: 'better', available: true },
    { key: 'conversions', value: 12, change: -5, trend: 'worse', available: true },
    { key: 'cost', value: 80, change: 20, trend: 'worse', available: true },
  ],
  actions: [{ code: 'campaign_over_goal', params: { campaign: 'Promo', value: 90, goal: 50 }, campaignId: 7 }, { code: 'refresh_data', params: { lastSyncedAt: null } }],
  ...overrides,
});
const analytics = overrides => ({
  campaigns: [{ id: 7, name: 'Promo' }], alertSettings: { ctrMin: 1, cpaMax: 50, budgetMax: 2000 }, verdict: verdict(), ...overrides,
});
const invalid = value => assert.throws(() => parseFocus(value), { status: 400 });

test('parseFocus accepts the four shapes and treats absence as null', () => {
  assert.equal(parseFocus(undefined), null);
  assert.equal(parseFocus(null), null);
  assert.deepEqual(parseFocus({ kind: 'verdict' }), { kind: 'verdict' });
  assert.deepEqual(parseFocus({ kind: 'card', key: 'cost' }), { kind: 'card', key: 'cost' });
  assert.deepEqual(parseFocus({ kind: 'reason', code: 'cost_better' }), { kind: 'reason', code: 'cost_better' });
  assert.deepEqual(parseFocus({ kind: 'action', code: 'campaign_low_ctr', campaignId: 3 }), { kind: 'action', code: 'campaign_low_ctr', campaignId: 3 });
});

test('parseFocus rejects extra keys, unknown values and bad ids with 400', () => {
  [{ kind: 'verdict', x: 1 }, { kind: 'nope' }, { kind: 'card', key: 'roas' }, { kind: 'reason', code: 'made_up' },
    { kind: 'action', code: 'made_up' }, { kind: 'action', code: 'refresh_data', campaignId: 0 },
    { kind: 'action', code: 'refresh_data', campaignId: -1 }, { kind: 'action', code: 'refresh_data', campaignId: 1.5 },
    { kind: 'action', code: 'refresh_data', campaignId: '7' }, 'verdict', 5, []].forEach(invalid);
});

test('verdict focus carries status, reasons, actions and goals', () => {
  const result = buildExplainContext(analytics(), { kind: 'verdict' });
  assert.equal(result.verdict.status, 'attention');
  assert.equal(result.verdict.basis, 'goal');
  assert.deepEqual(result.verdict.reasons.map(reason => reason.code), ['cost_above_goal', 'ctr_below_min']);
  assert.equal(result.verdict.actions.length, 2);
  assert.deepEqual(result.goals, { ctrMin: 1, cpaMax: 50, budgetMax: 2000 });
  assert.deepEqual(result.focus, { kind: 'verdict' });
});

test('missing goals come through as null', () => {
  assert.deepEqual(buildExplainContext(analytics({ alertSettings: undefined }), null).goals, { ctrMin: null, cpaMax: null, budgetMax: null });
});

test('card focus resolves the matching highlight', () => {
  assert.deepEqual(buildExplainContext(analytics(), { kind: 'card', key: 'cost' }).focus,
    { kind: 'card', key: 'cost', value: 80, change: 20, trend: 'worse', available: true });
});

test('reason focus resolves only codes present in the current verdict', () => {
  assert.deepEqual(buildExplainContext(analytics(), { kind: 'reason', code: 'ctr_below_min' }).focus,
    { kind: 'reason', code: 'ctr_below_min', params: { ctr: 0.5, min: 1 } });
  assert.equal(buildExplainContext(analytics(), { kind: 'reason', code: 'cost_better' }).focus, null);
});

test('action focus checks the code and the campaign against the current scope', () => {
  assert.equal(buildExplainContext(analytics(), { kind: 'action', code: 'campaign_over_goal', campaignId: 7 }).focus.code, 'campaign_over_goal');
  assert.equal(buildExplainContext(analytics(), { kind: 'action', code: 'campaign_over_goal', campaignId: 999 }).focus, null);
  assert.equal(buildExplainContext(analytics(), { kind: 'action', code: 'refresh_data' }).focus.code, 'refresh_data');
  assert.equal(buildExplainContext(analytics(), { kind: 'action', code: 'nothing_urgent' }).focus, null);
});

test('a missing verdict yields a null verdict and keeps the goals', () => {
  const result = buildExplainContext(analytics({ verdict: null }), { kind: 'verdict' });
  assert.equal(result.verdict, null);
  assert.equal(result.focus, null);
  assert.equal(result.goals.cpaMax, 50);
});

test('an insufficient verdict reports why', () => {
  const result = buildExplainContext(analytics({ verdict: verdict({ status: 'insufficient', basis: 'none', insufficientReason: 'low_volume', reasons: [] }) }), { kind: 'verdict' });
  assert.equal(result.verdict.status, 'insufficient');
  assert.equal(result.verdict.insufficientReason, 'low_volume');
});

test('worst-case input stays bounded and campaign names are cut', () => {
  const long = 'x'.repeat(5000);
  const big = verdict({
    reasons: Array.from({ length: 30 }, () => ({ code: 'cost_above_goal', params: { value: 1, goal: 2, note: long } })),
    actions: Array.from({ length: 30 }, () => ({ code: 'campaign_over_goal', params: { campaign: long, value: 1, goal: 2 }, campaignId: 7 })),
  });
  const result = buildExplainContext(analytics({ verdict: big }), { kind: 'action', code: 'campaign_over_goal', campaignId: 7 });
  assert.ok(JSON.stringify(result).length <= EXPLAIN_MAX_CHARS);
  assert.equal(result.focus.params.campaign.length, LIMITS.NAME_MAX);
});
