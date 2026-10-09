import test, { beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

const realIa = await import('../services/iaService.js');
const store = { plans: [], calls: [], lockRows: true };
let analyticsImpl;
let limitImpl;
let stepsImpl;
const analyticsCalls = [];
const aiCalls = [];
const DAY = 86400000;
const match = (plan, where) => plan.user_id === where.user_id && (!where.action_key || (where.action_key.in ? where.action_key.in.includes(plan.action_key) : where.action_key === plan.action_key));
const prisma = {
  planos_acao: {
    findMany: async ({ where }) => store.plans.filter(plan => match(plan, where)),
    findUnique: async ({ where }) => store.plans.find(plan => (where.id ? plan.id === where.id : plan.user_id === where.user_id_action_key.user_id && plan.action_key === where.user_id_action_key.action_key)) ?? null,
    updateMany: async ({ where, data }) => { store.calls.push(['updateMany', where, data]); store.plans.filter(plan => plan.user_id === where.user_id && where.id.in.includes(plan.id)).forEach(plan => Object.assign(plan, data)); return { count: 1 }; },
    deleteMany: async ({ where }) => { store.calls.push(['deleteMany', where]); return { count: 0 }; },
    upsert: async ({ where, create, update }) => {
      store.calls.push(['upsert', where, create, update]);
      const found = store.plans.find(plan => plan.user_id === where.user_id_action_key.user_id && plan.action_key === where.user_id_action_key.action_key);
      if (found) return Object.assign(found, update);
      const plan = { id: '11111111-1111-4111-8111-111111111111', generated_at: new Date(), last_seen_at: new Date(), ...create };
      store.plans.push(plan);
      return plan;
    },
    update: async ({ where, data }) => { store.calls.push(['update', where, data]); const plan = store.plans.find(item => item.id === where.id); return Object.assign(plan, data); },
  },
  $queryRaw: async (...args) => { store.calls.push(['lock']); const plan = store.plans.find(item => item.id === args[1] && item.user_id === args[2]); return plan ? [{ id: plan.id }] : []; },
  $transaction: async fn => fn(prisma),
};
mock.module('../config/database.js', { namedExports: { prisma } });
mock.module('../services/analyticsService.js', { namedExports: { getAnalytics: async (userId, query) => { analyticsCalls.push(query); return analyticsImpl(userId, query); } } });
mock.module('../services/iaService.js', { namedExports: { ...realIa, gerarPassos: async args => { aiCalls.push(args); return stepsImpl(args); } } });
mock.module('../services/aiWorkflow.js', { namedExports: { withAiLimit: (id, action) => limitImpl(id, action), campaignAnalysis: async () => ({}) } });
const controller = await import('../controllers/iaController.js');

const ID = '11111111-1111-4111-8111-111111111111';
const verdict = () => ({ status: 'attention', basis: 'goal', indicator: 'cpa', insufficientReason: null, reasons: [], highlights: [],
  actions: [{ code: 'campaign_over_goal', params: { campaign: 'Promo', value: 90, goal: 50 }, campaignId: 7 }, { code: 'refresh_data', params: { lastSyncedAt: null } }] });
const analytics = overrides => ({ campaigns: [{ id: 7, name: 'Promo' }], alertSettings: { cpaMax: 50 }, verdict: verdict(), ...overrides });
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const run = async (handler, req) => { const res = response(); await handler({ usuario: { id: 7 }, body: {}, query: {}, params: {}, ...req }, res); return res; };
const ACTION = { code: 'campaign_over_goal', campaignId: 7 };
const plan = overrides => ({ id: ID, user_id: 7, action_key: 'campaign_over_goal:7', action_code: 'campaign_over_goal', campaign_id: 7, steps: [{ id: 's1', text: 'Um', done: false }, { id: 's2', text: 'Dois', done: false }, { id: 's3', text: 'Três', done: false }], generated_at: new Date(), last_seen_at: new Date(), ...overrides });

beforeEach(() => {
  store.plans = []; store.calls = []; analyticsCalls.length = 0; aiCalls.length = 0;
  analyticsImpl = async () => analytics();
  limitImpl = async (_id, action) => action();
  stepsImpl = async () => ({ passos: ['Abra o gerenciador', 'Reduza o orçamento', 'Revise o público'] });
});

test('POST creates a plan from the current verdict action', async () => {
  const res = await run(controller.gerarPlano, { body: { action: ACTION, periodo: 'last_7d' } });
  assert.equal(res.code, 201);
  assert.equal(res.body.plano.actionKey, 'campaign_over_goal:7');
  assert.deepEqual(res.body.plano.steps.map(step => step.id), ['s1', 's2', 's3']);
  assert.equal(aiCalls.length, 1);
  assert.equal(aiCalls[0].context.focus.code, 'campaign_over_goal');
  const upsert = store.calls.find(call => call[0] === 'upsert');
  assert.equal(upsert[2].user_id, 7);
  assert.equal(upsert[2].action_key, 'campaign_over_goal:7');
  assert.deepEqual(analyticsCalls.at(-1), { periodo: 'last_7d' });
});

test('POST re-reads inside the limiter and returns a plan saved meanwhile instead of overwriting it', async () => {
  const original = prisma.planos_acao.findUnique;
  let reads = 0;
  prisma.planos_acao.findUnique = async args => { reads++; return reads === 1 ? null : plan({ steps: [{ id: 's1', text: 'Salvo', done: true }, { id: 's2', text: 'Dois', done: false }, { id: 's3', text: 'Três', done: false }] }); };
  try {
    const res = await run(controller.gerarPlano, { body: { action: ACTION } });
    assert.equal(res.code, 200);
    assert.equal(res.body.plano.steps[0].done, true);
    assert.equal(aiCalls.length, 0);
    assert.equal(store.calls.some(call => call[0] === 'upsert'), false);
  } finally { prisma.planos_acao.findUnique = original; }
});

test('POST returns the existing plan without calling the AI', async () => {
  store.plans.push(plan());
  const res = await run(controller.gerarPlano, { body: { action: ACTION } });
  assert.equal(res.code, undefined);
  assert.equal(res.body.plano.id, ID);
  assert.equal(aiCalls.length, 0);
});

test('POST with regenerate replaces the steps and clears the done marks', async () => {
  store.plans.push(plan({ steps: [{ id: 's1', text: 'Velho', done: true }, { id: 's2', text: 'Velho', done: true }, { id: 's3', text: 'Velho', done: true }] }));
  const res = await run(controller.gerarPlano, { body: { action: ACTION, regenerate: true } });
  assert.equal(aiCalls.length, 1);
  assert.deepEqual(res.body.plano.steps.map(step => step.done), [false, false, false]);
  assert.equal(res.body.plano.steps[0].text, 'Abra o gerenciador');
});

test('POST rejects an action that is no longer in the verdict, without calling the AI', async () => {
  const res = await run(controller.gerarPlano, { body: { action: { code: 'campaign_low_ctr', campaignId: 7 } } });
  assert.equal(res.code, 404);
  assert.match(res.body.erro, /não está mais no painel/);
  assert.equal(aiCalls.length, 0);
});

test('POST validates input before querying metrics', async () => {
  for (const body of [{ action: { code: 'refresh_data' } }, { action: { code: 'nothing_urgent' } }, {}, { action: { code: 'campaign_over_goal', campaignId: '7' } },
    { action: ACTION, platform: 'tiktok' }, { action: ACTION, regenerate: 'yes' }]) {
    assert.equal((await run(controller.gerarPlano, { body })).code, 400, JSON.stringify(body));
  }
  assert.equal(analyticsCalls.length, 0);
});

test('POST stores nothing when the AI returns invalid steps', async () => {
  stepsImpl = async () => ({ passos: ['só um'] });
  const res = await run(controller.gerarPlano, { body: { action: ACTION } });
  assert.equal(res.code, 502);
  assert.equal(store.calls.some(call => call[0] === 'upsert'), false);
  assert.equal(store.plans.length, 0);
});

test('POST passes the AI limit error through', async () => {
  limitImpl = async () => { throw realIa.aiError('Limite de 20 solicitações de IA por hora atingido. Tente novamente mais tarde.', 429); };
  const res = await run(controller.gerarPlano, { body: { action: ACTION } });
  assert.equal(res.code, 429);
  assert.equal(store.plans.length, 0);
});

test('GET returns only plans of current eligible actions, refreshes them and prunes old ones', async () => {
  store.plans.push(plan(), plan({ id: '22222222-2222-4222-8222-222222222222', action_key: 'campaign_low_ctr:7', action_code: 'campaign_low_ctr' }), plan({ id: '33333333-3333-4333-8333-333333333333', user_id: 99 }));
  const res = await run(controller.listarPlanos, { query: { periodo: 'last_30d', platform: 'meta' } });
  assert.deepEqual(res.body.planos.map(item => item.id), [ID]);
  const touched = store.calls.find(call => call[0] === 'updateMany');
  assert.deepEqual(touched[1].id.in, [ID]);
  assert.equal(touched[1].user_id, 7);
  const pruned = store.calls.find(call => call[0] === 'deleteMany');
  assert.equal(pruned[1].user_id, 7);
  assert.ok(Math.abs(pruned[1].last_seen_at.lt.getTime() - (Date.now() - 30 * DAY)) < 5000);
  assert.deepEqual(analyticsCalls.at(-1), { periodo: 'last_30d', platform: 'meta' });
  assert.equal(aiCalls.length, 0);
});

test('GET returns an empty list without a verdict', async () => {
  analyticsImpl = async () => analytics({ verdict: null });
  store.plans.push(plan());
  assert.deepEqual((await run(controller.listarPlanos, {})).body, { planos: [] });
});

test('PATCH toggles one step inside a locked transaction', async () => {
  store.plans.push(plan());
  const res = await run(controller.marcarPasso, { params: { id: ID, stepId: 's2' }, body: { done: true } });
  assert.deepEqual(res.body.plano.steps.map(step => step.done), [false, true, false]);
  assert.deepEqual(store.calls.map(call => call[0]), ['lock', 'update']);
  const back = await run(controller.marcarPasso, { params: { id: ID, stepId: 's2' }, body: { done: false } });
  assert.deepEqual(back.body.plano.steps.map(step => step.done), [false, false, false]);
});

test('PATCH answers 404 for foreign plans, bad ids and unknown steps, and 400 for a non-boolean', async () => {
  store.plans.push(plan({ user_id: 99 }));
  assert.equal((await run(controller.marcarPasso, { params: { id: ID, stepId: 's1' }, body: { done: true } })).code, 404);
  store.plans = [plan()];
  assert.equal((await run(controller.marcarPasso, { params: { id: 'not-a-uuid', stepId: 's1' }, body: { done: true } })).code, 404);
  assert.equal((await run(controller.marcarPasso, { params: { id: ID, stepId: 's9' }, body: { done: true } })).code, 404);
  assert.equal((await run(controller.marcarPasso, { params: { id: ID, stepId: 's1' }, body: { done: 'sim' } })).code, 400);
});
