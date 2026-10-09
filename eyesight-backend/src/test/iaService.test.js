import test from 'node:test';
import assert from 'node:assert/strict';
import { complete, validateAnalysis, SYSTEM_PROMPT } from '../services/iaService.js';

test('AI refuses missing configuration without a network request', async () => {
  await assert.rejects(complete([], { apiKey: '', transport: { post: () => assert.fail('network called') } }), { status: 503 });
});
test('AI validates score and text even for structured responses', () => {
  for (const score_desempenho of [-1, 101, 1.5, '50', null]) assert.throws(() => validateAnalysis({ texto: 'data', sugestao: 'test', score_desempenho }), { status: 502 });
  assert.equal(validateAnalysis({ texto: 'data', sugestao: 'test', score_desempenho: 70 }).score_desempenho, 70);
});
test('AI uses bounded structured request and never persists at provider', async () => {
  const transport = { post: async (url, body, options) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(body.model, 'gpt-4o-mini'); assert.equal(body.store, false);
    assert.equal(body.response_format.json_schema.strict, true); assert.equal(options.timeout, 40000);
    assert.ok(body.max_completion_tokens < 2000);
    return { data: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ texto: 'Evidência', sugestao: 'Teste', score_desempenho: 50 }) } }] } };
  } };
  assert.equal((await complete([], { apiKey: 'fake', transport, structured: true })).modelo, 'gpt-4o-mini');
});
test('AI rejects truncation, refusal and invalid JSON', async () => {
  for (const choice of [{ finish_reason: 'length', message: { content: '{}' } }, { finish_reason: 'stop', message: { refusal: 'refused', content: '{}' } }, { finish_reason: 'stop', message: { content: 'invalid JSON' } }]) {
    await assert.rejects(complete([], { apiKey: 'fake', structured: true, transport: { post: async () => ({ data: { choices: [choice] } }) } }), { status: 502 });
  }
});
test('AI masks provider errors and secrets', async () => {
  await assert.rejects(complete([], { apiKey: 'fake', transport: { post: async () => { throw new Error('secret provider payload'); } } }), error => error.status === 503 && !error.message.includes('secret'));
  assert.ok(SYSTEM_PROMPT.includes('não invente receita'));
});
test('system prompt keeps the AI aligned with the dashboard verdict', () => {
  assert.match(SYSTEM_PROMPT, /Veredito e metas do painel/);
  assert.match(SYSTEM_PROMPT, /nunca contradiga/i);
  assert.match(SYSTEM_PROMPT, /insufficient/);
});

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const okTransport = (content, seen = {}) => ({ post: async (url, body, options) => {
  Object.assign(seen, { url, body, options });
  return { data: { choices: [{ finish_reason: 'stop', message: { content } }] } };
} });
test('another OpenAI-compatible provider gets its own endpoint and only the parameters it understands', async () => {
  const seen = {};
  const result = await complete([{ role: 'user', content: 'oi' }], { apiKey: 'k', baseUrl: GEMINI, model: 'gemini-2.5-flash', transport: okTransport('Olá', seen) });
  assert.equal(seen.url, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
  assert.equal(seen.options.headers.Authorization, 'Bearer k');
  assert.equal(seen.body.model, 'gemini-2.5-flash');
  assert.equal('store' in seen.body, false);
  assert.equal('max_completion_tokens' in seen.body, false);
  assert.equal(seen.body.max_tokens, 4096);
  assert.deepEqual(result, { text: 'Olá', model: 'gemini-2.5-flash' });
});
test('structured requests to other providers use JSON mode with an explicit instruction and are still validated', async () => {
  const seen = {};
  const answer = JSON.stringify({ texto: 'Evidência', sugestao: 'Teste', score_desempenho: 60 });
  const result = await complete([{ role: 'system', content: 's' }, { role: 'user', content: 'u' }], { apiKey: 'k', baseUrl: GEMINI, structured: true, transport: okTransport(answer, seen) });
  assert.deepEqual(seen.body.response_format, { type: 'json_object' });
  assert.match(seen.body.messages.at(-1).content, /JSON/);
  assert.match(seen.body.messages.at(-1).content, /score_desempenho/);
  assert.equal(result.score_desempenho, 60);
  const bad = JSON.stringify({ texto: 'x', sugestao: 'y', score_desempenho: 500 });
  await assert.rejects(complete([], { apiKey: 'k', baseUrl: GEMINI, structured: true, transport: okTransport(bad) }), { status: 502 });
});
test('the provider endpoint can come from OPENAI_BASE_URL', async () => {
  const previous = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_BASE_URL = 'https://api.groq.com/openai/v1';
  try {
    const seen = {};
    await complete([], { apiKey: 'k', transport: okTransport('ok', seen) });
    assert.equal(seen.url, 'https://api.groq.com/openai/v1/chat/completions');
  } finally {
    if (previous === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = previous;
  }
});
test('an invalid provider address fails as unconfigured without any network request', async () => {
  for (const baseUrl of ['ftp://example.com', 'not a url']) {
    let called = false;
    await assert.rejects(complete([], { apiKey: 'k', baseUrl, transport: { post: async () => { called = true; return {}; } } }), { status: 503, message: /endereço/ });
    assert.equal(called, false);
  }
});
test('provider failures are logged on the server with status and reason, never with the key', async () => {
  const { mock } = await import('node:test');
  const logged = mock.method(console, 'error', () => {});
  try {
    const failing = { post: async () => { throw Object.assign(new Error('x'), { response: { status: 404, data: [{ error: { message: 'model gone' } }] } }); } };
    await assert.rejects(complete([], { apiKey: 'secret-key', transport: failing }), { status: 503 });
    const line = logged.mock.calls.map(call => call.arguments.join(' ')).join('\n');
    assert.match(line, /404/);
    assert.match(line, /model gone/);
    assert.doesNotMatch(line, /secret-key/);
  } finally { logged.mock.restore(); }
});

const PLAN_SCHEMA = { type: 'object', additionalProperties: false, properties: { passos: { type: 'array', items: { type: 'string' } } }, required: ['passos'] };
const planSpec = { name: 'action_plan', schema: PLAN_SCHEMA, instruction: 'Responda só com JSON com a chave "passos".' };
test('structured requests can carry their own schema on OpenAI and return the parsed JSON', async () => {
  const seen = {};
  const result = await complete([{ role: 'user', content: 'u' }], { apiKey: 'k', structured: planSpec, transport: okTransport(JSON.stringify({ passos: ['a', 'b', 'c'] }), seen) });
  assert.equal(seen.body.response_format.json_schema.name, 'action_plan');
  assert.deepEqual(seen.body.response_format.json_schema.schema, PLAN_SCHEMA);
  assert.equal(seen.body.response_format.json_schema.strict, true);
  assert.deepEqual(result.data, { passos: ['a', 'b', 'c'] });
  assert.equal(result.modelo, 'gpt-4o-mini');
});
test('custom schemas fall back to JSON mode with the instruction on other providers', async () => {
  const seen = {};
  const result = await complete([{ role: 'user', content: 'u' }], { apiKey: 'k', baseUrl: GEMINI, structured: planSpec, transport: okTransport(JSON.stringify({ passos: ['a'] }), seen) });
  assert.deepEqual(seen.body.response_format, { type: 'json_object' });
  assert.equal(seen.body.messages.at(-1).content, planSpec.instruction);
  assert.deepEqual(result.data, { passos: ['a'] });
  await assert.rejects(complete([], { apiKey: 'k', structured: planSpec, transport: okTransport('not json') }), { status: 502 });
});
