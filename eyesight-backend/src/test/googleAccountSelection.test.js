import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
const config = { apiVersion: 'v23', customerId: '123-456', developerToken: 'test' };
let result = {};
let failure;
const calls = [];
mock.module('../config/env.js', { defaultExport: { google: config } });
mock.module('axios', { defaultExport: {
  post: async (...args) => { calls.push(args); if (failure) throw failure; return { data: result }; },
  get: async () => { throw new Error('Explicit selection must not list or fall back to other accounts.'); },
} });
const { buscarClienteGoogle } = await import('../services/googleService.js');

test('explicit Google customer is accepted only after an authorized customer query', async () => {
  result = { results: [{ customer: { id: '123456', manager: false } }] };
  assert.equal(await buscarClienteGoogle('test-access'), '123456');
  assert.match(calls[0][0], /customers\/123456\/googleAds:search$/);
  assert.equal(calls[0][2].headers.Authorization, 'Bearer test-access');
});

test('denied explicit Google customer does not fall back to another account', async () => {
  failure = Object.assign(new Error('permission denied'), { response: { status: 403 } });
  await assert.rejects(buscarClienteGoogle('test-access'), { message: 'permission denied' });
  failure = undefined;
  result = { results: [{ customer: { id: '123456', manager: true } }] };
  await assert.rejects(buscarClienteGoogle('test-access'), { code: 'SEM_CONTA' });
  result = { results: [] };
  await assert.rejects(buscarClienteGoogle('test-access'), { code: 'SEM_CONTA' });
});
