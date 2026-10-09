import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_ACTION_CODES, actionKey, findCurrentAction, parsePlanAction, validateSteps } from '../services/planService.js';

const fails = (fn, status) => assert.throws(fn, { status });

test('actionKey joins code and campaign, with a dash when there is none', () => {
  assert.equal(actionKey({ code: 'campaign_over_goal', campaignId: 7 }), 'campaign_over_goal:7');
  assert.equal(actionKey({ code: 'budget_exceeded' }), 'budget_exceeded:-');
  assert.deepEqual(PLAN_ACTION_CODES, ['budget_exceeded', 'campaign_over_goal', 'campaign_low_ctr', 'campaign_without_results', 'enable_conversion_tracking']);
});

test('actionKey rejects codes without a plan and invalid campaign ids', () => {
  for (const code of ['nothing_urgent', 'refresh_data', 'x']) fails(() => actionKey({ code }), 400);
  for (const campaignId of [0, -1, 1.5, '7']) fails(() => actionKey({ code: 'campaign_low_ctr', campaignId }), 400);
});

test('parsePlanAction accepts the two shapes and nothing else', () => {
  assert.deepEqual(parsePlanAction({ code: 'budget_exceeded' }), { code: 'budget_exceeded' });
  assert.deepEqual(parsePlanAction({ code: 'campaign_low_ctr', campaignId: 3 }), { code: 'campaign_low_ctr', campaignId: 3 });
  for (const raw of [{ code: 'budget_exceeded', x: 1 }, { code: 'refresh_data' }, { code: 'campaign_low_ctr', campaignId: 0 }, { code: 'campaign_low_ctr', campaignId: '3' }, 'budget_exceeded', null, undefined, []]) {
    fails(() => parsePlanAction(raw), 400);
  }
});

test('validateSteps returns trimmed steps with sequential ids', () => {
  for (const count of [3, 4, 5]) {
    const steps = validateSteps({ passos: Array.from({ length: count }, (_, i) => `  Passo ${i + 1}  `) });
    assert.equal(steps.length, count);
    assert.deepEqual(steps[0], { id: 's1', text: 'Passo 1', done: false });
    assert.equal(steps.at(-1).id, `s${count}`);
  }
});

test('validateSteps rejects anything outside 3 to 5 short text steps with 502', () => {
  const ok = ['a', 'b', 'c'];
  for (const raw of [{ passos: ['a', 'b'] }, { passos: [...ok, 'd', 'e', 'f'] }, { passos: [...ok.slice(0, 2), '   '] }, { passos: [...ok.slice(0, 2), ''] },
    { passos: [...ok.slice(0, 2), 'x'.repeat(201)] }, { passos: [...ok.slice(0, 2), 5] }, {}, null, 'texto']) {
    fails(() => validateSteps(raw), 502);
  }
  assert.equal(validateSteps({ passos: [...ok.slice(0, 2), 'x'.repeat(200)] }).length, 3);
});

test('findCurrentAction matches code and campaign against the current verdict', () => {
  const analytics = { verdict: { actions: [{ code: 'campaign_over_goal', campaignId: 7, params: {} }, { code: 'budget_exceeded', params: {} }] } };
  assert.equal(findCurrentAction(analytics, { code: 'campaign_over_goal', campaignId: 7 }).campaignId, 7);
  assert.equal(findCurrentAction(analytics, { code: 'budget_exceeded' }).code, 'budget_exceeded');
  assert.equal(findCurrentAction(analytics, { code: 'campaign_over_goal', campaignId: 8 }), null);
  assert.equal(findCurrentAction(analytics, { code: 'campaign_low_ctr' }), null);
  assert.equal(findCurrentAction({ verdict: null }, { code: 'budget_exceeded' }), null);
});
