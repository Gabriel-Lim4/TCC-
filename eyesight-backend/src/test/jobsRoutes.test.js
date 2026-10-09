import test, { beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import env from '../config/env.js';

let release;
let routine;
const runs = [];
mock.module('../services/dailyRoutine.js', { namedExports: { runDailyRoutine: async () => { runs.push(1); return routine(); } } });
const { runDaily } = await import('../controllers/jobsController.js');
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const call = async authorization => { const res = response(); await runDaily({ headers: authorization ? { authorization } : {} }, res); return res; };

beforeEach(() => { env.jobsSecret = 'job-secret-value'; runs.length = 0; routine = async () => ({}); });

test('the job is off without a configured secret', async () => {
  env.jobsSecret = '';
  assert.equal((await call('Bearer job-secret-value')).code, 503);
  assert.equal(runs.length, 0);
});

test('missing or wrong credentials are rejected', async () => {
  for (const header of [undefined, 'Bearer wrong', 'job-secret-value', 'Basic job-secret-value', 'Bearer ']) {
    assert.equal((await call(header)).code, 401, String(header));
  }
  assert.equal(runs.length, 0);
});

test('the right secret starts the routine and answers 202 at once', async () => {
  routine = () => new Promise(resolve => { release = resolve; });
  const res = await call('Bearer job-secret-value');
  assert.equal(res.code, 202);
  assert.deepEqual(res.body, { iniciado: true });
  assert.equal(runs.length, 1);
  release({});
  await new Promise(resolve => setImmediate(resolve));
});

test('a second call while a run is in progress gets 409, and the flag is released afterwards', async () => {
  routine = () => new Promise(resolve => { release = resolve; });
  assert.equal((await call('Bearer job-secret-value')).code, 202);
  assert.equal((await call('Bearer job-secret-value')).code, 409);
  assert.equal(runs.length, 1);
  release({});
  await new Promise(resolve => setImmediate(resolve));
  routine = async () => ({});
  assert.equal((await call('Bearer job-secret-value')).code, 202);
  await new Promise(resolve => setImmediate(resolve));
});

test('an exception in the routine is contained and releases the flag', async () => {
  routine = async () => { throw new Error('boom'); };
  const spy = mock.method(console, 'error', () => {});
  try {
    assert.equal((await call('Bearer job-secret-value')).code, 202);
    await new Promise(resolve => setImmediate(resolve));
    routine = async () => ({});
    assert.equal((await call('Bearer job-secret-value')).code, 202);
  } finally { spy.mock.restore(); }
});
