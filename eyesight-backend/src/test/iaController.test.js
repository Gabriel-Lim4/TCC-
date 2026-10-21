import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
const queries = [];
const realIa = await import('../services/iaService.js');
let analyticsImpl = async () => { throw new Error('unexpected analytics'); };
const analyticsCalls = [];
const completeCalls = [];
mock.module('../config/database.js', { namedExports: { prisma: {
  assistant_conversations: { findFirst: async query => { queries.push(query); return null; }, create: async ({ data }) => ({ id: 'c1', ...data }), deleteMany: async query => { queries.push(query); return { count: 0 }; } },
  analises_ia: { deleteMany: async query => { queries.push(query); return { count: 0 }; } },
} } });
mock.module('../services/analyticsService.js', { namedExports: { getAnalytics: async (userId, query) => { analyticsCalls.push(query); return analyticsImpl(userId, query); } } });
mock.module('../services/iaService.js', { namedExports: { ...realIa, complete: async messages => { completeCalls.push(messages); return { text: 'Resposta', model: 'm' }; },
  streamComplete: async (messages, { onDelta }) => { completeCalls.push(messages); onDelta('Resp'); onDelta('osta'); return { text: 'Resposta', model: 'm' }; } } });
mock.module('../services/aiWorkflow.js', { namedExports: { withAiLimit: async (_id, action) => action(), campaignAnalysis: async () => ({}) } });
const controller = await import('../controllers/iaController.js');
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('chat rejects invalid text and period before querying metrics or paid provider', async () => {
  for (const body of [{ message: '' }, { message: 'a'.repeat(2001) }, { message: 'test', periodo: 'not-a-period' }]) {
    const res = response(); await controller.chat({ body, usuario: { id: 7 } }, res); assert.equal(res.code, 400);
  }
});
test('conversation lookup scopes to authenticated user', async () => {
  const res = response(); await controller.detalharConversa({ params: { id: '00000000-0000-4000-8000-000000000001' }, usuario: { id: 7 } }, res);
  assert.equal(res.code, 404); assert.equal(queries.at(-1).where.user_id, 7);
});
test('deletions enforce ownership and do not disclose missing foreign records', async () => {
  const res = response(); await controller.deletarAnalise({ params: { id: '23' }, usuario: { id: 7 } }, res);
  assert.equal(res.code, 404); assert.deepEqual(queries.at(-1).where, { pk_id_analise: 23, fk_id_usuario: 7 });
});
test('legacy question bypass no longer accepts invalid campaign ID', async () => {
  const res = response(); await controller.analisarCampanha({ params: { campanhaId: 'invalid' }, body: { pergunta: 'test' }, usuario: { id: 7 } }, res);
  assert.equal(res.code, 400);
});

const analytics = overrides => ({ period: { period: 'last_30d', days: 30 }, currency: 'BRL', totals: {}, campaigns: [{ id: 7, name: 'Promo', metrics: {} }], daily: [],
  alertSettings: { cpaMax: 50 }, verdict: { status: 'attention', basis: 'goal', indicator: 'cpa', insufficientReason: null, reasons: [], highlights: [], actions: [] }, ...overrides });
const ask = async body => { const res = response(); await controller.chat({ body: { message: 'Por quê?', ...body }, usuario: { id: 7 } }, res); return res; };
const contexts = () => completeCalls.at(-1).filter(m => m.role === 'user' && /^Veredito e metas/.test(m.content));
test('chat without focus sends exactly the messages it sent before', async () => {
  analyticsImpl = async () => analytics(); analyticsCalls.length = 0;
  const res = await ask({});
  assert.equal(res.code, undefined);
  assert.equal(completeCalls.at(-1).length, 3);
  assert.equal(contexts().length, 0);
  assert.deepEqual(analyticsCalls.at(-1), { periodo: 'last_30d' });
});
test('chat with focus adds the verdict and goals block after the analytics context', async () => {
  analyticsImpl = async () => analytics();
  await ask({ focus: { kind: 'verdict' } });
  const sent = completeCalls.at(-1);
  assert.equal(sent.length, 4);
  assert.match(sent[2].content, /^Veredito e metas/);
  assert.match(sent[2].content, /"status":"attention"/);
  assert.match(sent[2].content, /"cpaMax":50/);
});
test('chat forwards the screen scope to analytics', async () => {
  analyticsImpl = async () => analytics();
  await ask({ periodo: 'last_7d', platform: 'meta', campaignId: '7', currency: 'BRL' });
  assert.deepEqual(analyticsCalls.at(-1), { periodo: 'last_7d', platform: 'meta', campaignId: '7', currency: 'BRL' });
  await ask({ periodo: 'custom', startDate: '2026-09-01', endDate: '2026-09-10' });
  assert.deepEqual(analyticsCalls.at(-1), { periodo: 'custom', startDate: '2026-09-01', endDate: '2026-09-10' });
});
test('chat rejects bad scope or focus with 400 before querying metrics', async () => {
  analyticsImpl = async () => { throw new Error('unexpected analytics'); };
  const before = analyticsCalls.length;
  for (const body of [{ periodo: 'custom' }, { focus: { kind: 'verdict', x: 1 } }, { platform: 'tiktok' }, { campaignId: 'abc' }, { currency: 'brl; DROP' }]) {
    assert.equal((await ask(body)).code, 400, JSON.stringify(body));
  }
  assert.equal(analyticsCalls.length, before);
});
test('chat still answers when the verdict is missing', async () => {
  analyticsImpl = async () => analytics({ verdict: null });
  const res = await ask({ focus: { kind: 'verdict' } });
  assert.equal(res.code, undefined);
  assert.match(contexts()[0].content, /"verdict":null/);
});

function streamResponse() {
  return { chunks: [], headers: {}, ended: false, headersSent: false,
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; }, flushHeaders() { this.headersSent = true; },
    write(text) { this.chunks.push(text); return true; }, end() { this.ended = true; } };
}
const events = res => res.chunks.join('').split('\n\n').filter(Boolean).map(block => ({ name: /^event: (.+)$/m.exec(block)[1], data: JSON.parse(/^data: (.+)$/m.exec(block)[1]) }));
test('chat with stream=true answers as server-sent events and saves the conversation at the end', async () => {
  analyticsImpl = async () => analytics();
  const res = streamResponse();
  await controller.chat({ body: { message: 'Por quê?', stream: true }, usuario: { id: 7 }, on() {} }, res);
  assert.equal(res.headers['Content-Type'], 'text/event-stream; charset=utf-8');
  const list = events(res);
  assert.deepEqual(list.slice(0, 2).map(event => [event.name, event.data.text]), [['delta', 'Resp'], ['delta', 'osta']]);
  assert.equal(list.at(-1).name, 'done');
  assert.equal(list.at(-1).data.conversation.messages.at(-1).content, 'Resposta');
  assert.equal(res.ended, true);
});
test('chat with stream=true still rejects bad input with a normal JSON error before streaming', async () => {
  const res = streamResponse();
  await controller.chat({ body: { message: '', stream: true }, usuario: { id: 7 }, on() {} }, res);
  assert.equal(res.code, 400); assert.equal(res.headersSent, false); assert.equal(res.chunks.length, 0);
});
