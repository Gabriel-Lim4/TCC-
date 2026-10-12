import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_USERS, SUMMARY_BUDGET_MS, SYNC_BUDGET_MS, runDailyRoutine } from '../services/dailyRoutine.js';
import { verifyUnsubscribeToken } from '../services/unsubscribeToken.js';

const SECRET = 's'.repeat(32);
const MONDAY = new Date('2026-10-05T12:00:00Z');
const THURSDAY = new Date('2026-10-08T12:00:00Z');
const analytics = (extra = {}) => ({ hasData: true, currency: 'BRL', currentComplete: true, previousComplete: true,
  period: { period: 'last_7d', days: 7, since: '2026-09-28', until: '2026-10-04' },
  verdict: { status: 'good', basis: 'comparison', indicator: 'cpa', insufficientReason: null, reasons: [], actions: [{ code: 'nothing_urgent', params: {} }],
    highlights: [{ key: 'spend', value: 10, change: null, trend: 'neutral', available: true }, { key: 'clicks', value: 5, change: null, trend: 'unknown', available: true },
      { key: 'conversions', value: 1, change: null, trend: 'unknown', available: true }, { key: 'cost', value: 10, change: null, trend: 'unknown', available: true }] }, ...extra });

function makeDeps(overrides = {}) {
  const calls = { sync: [], claim: [], release: [], sent: [], analytics: [], listLimit: [] };
  let clock = 0;
  const users = [{ id: 1, name: 'Ana', authUserId: 'u1' }, { id: 2, name: 'Bia', authUserId: 'u2' }];
  const deps = {
    nowMs: () => clock,
    advance: ms => { clock += ms; },
    listUsersToSync: async limit => { calls.listLimit.push(limit); return [{ id: 1, platforms: ['meta', 'google'] }, { id: 2, platforms: ['meta'] }]; },
    syncAccount: async (userId, platform, range) => { calls.sync.push([userId, platform, range]); },
    listOptedInUsers: async () => users,
    claim: async (userId, kind, key) => { calls.claim.push([userId, kind, key]); return true; },
    release: async (userId, kind, key) => { calls.release.push([userId, kind, key]); },
    getAnalytics: async (userId, query) => { calls.analytics.push([userId, query]); return analytics(); },
    findEmail: async authUserId => `${authUserId}@example.com`,
    send: async message => { calls.sent.push(message); },
    listAlertUsers: async () => [],
    lastState: async () => null,
    lastAlertAt: async () => null,
    unsubscribeSecret: SECRET, frontendUrl: 'https://app.example.com', backendUrl: 'https://api.example.com',
    ...overrides,
  };
  return { deps, calls };
}

test('syncs every connected account over the last 30 days, in the order given, and limits the batch', async () => {
  const { deps, calls } = makeDeps();
  const result = await runDailyRoutine({ now: THURSDAY, deps });
  assert.deepEqual(calls.listLimit, [MAX_USERS]);
  assert.equal(MAX_USERS, 50);
  assert.deepEqual(calls.sync.map(([id, platform]) => `${id}:${platform}`), ['1:meta', '1:google', '2:meta']);
  assert.equal(calls.sync[0][2].period, 'last_30d');
  assert.equal(result.synced, 3);
});

test('a failing account does not stop the run', async () => {
  const { deps, calls } = makeDeps({ syncAccount: async (userId, platform) => { if (platform === 'google') throw Object.assign(new Error('reconnect secret-token'), { status: 409 }); calls.sync.push([userId, platform]); } });
  const result = await runDailyRoutine({ now: THURSDAY, deps });
  assert.deepEqual(calls.sync.map(([id, platform]) => `${id}:${platform}`), ['1:meta', '2:meta']);
  assert.equal(result.errors, 1);
  assert.equal(result.synced, 2);
});

test('stops syncing when the time budget is spent', async () => {
  const { deps, calls } = makeDeps();
  deps.syncAccount = async (userId, platform) => { calls.sync.push([userId, platform]); deps.advance(SYNC_BUDGET_MS); };
  await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sync.length, 1);
});

test('does not send summaries outside Monday to Wednesday', async () => {
  const { deps, calls } = makeDeps();
  await runDailyRoutine({ now: THURSDAY, deps });
  await runDailyRoutine({ now: new Date('2026-10-10T12:00:00Z'), deps });
  assert.equal(calls.sent.length, 0);
  assert.equal(calls.claim.length, 0);
});

test('sends the summary to opted-in users on Monday, Tuesday and Wednesday', async () => {
  for (const day of ['2026-10-05', '2026-10-06', '2026-10-07']) {
    const { deps, calls } = makeDeps();
    const result = await runDailyRoutine({ now: new Date(`${day}T12:00:00Z`), deps });
    assert.equal(calls.sent.length, 2, day);
    assert.equal(result.sent, 2);
  }
});

test('the Brazilian week and weekday decide, not UTC', async () => {
  const { deps, calls } = makeDeps();
  await runDailyRoutine({ now: new Date('2026-10-05T02:00:00Z'), deps });
  assert.equal(calls.sent.length, 0);
  const second = makeDeps();
  await runDailyRoutine({ now: MONDAY, deps: second.deps });
  assert.deepEqual(second.calls.claim[0], [1, 'weekly_summary', '2026-W41']);
});

test('builds the message from the 7-day verdict with a working unsubscribe link', async () => {
  const { deps, calls } = makeDeps();
  await runDailyRoutine({ now: MONDAY, deps });
  assert.deepEqual(calls.analytics[0], [1, { periodo: 'last_7d' }]);
  const message = calls.sent[0];
  assert.equal(message.to, 'u1@example.com');
  assert.ok(message.html.includes('Olá, Ana'));
  const token = new URL(message.unsubscribeUrl).searchParams.get('t');
  assert.equal(message.unsubscribeUrl.startsWith('https://app.example.com/cancelar-resumo?t='), true);
  assert.equal(verifyUnsubscribeToken(token, { now: MONDAY, secret: SECRET }), 1);
  assert.equal(message.unsubscribePostUrl, `https://api.example.com/resumo/cancelar?t=${token}`);
});

test('does not send twice when the week was already claimed', async () => {
  const { deps, calls } = makeDeps({ claim: async () => false });
  const result = await runDailyRoutine({ now: MONDAY, deps });
  assert.equal(calls.sent.length, 0);
  assert.equal(result.skipped, 2);
});

test('releases the claim and keeps going when sending fails', async () => {
  const { deps, calls } = makeDeps();
  let first = true;
  deps.send = async message => { if (first) { first = false; throw new Error('boom ana@example.com'); } calls.sent.push(message); };
  const result = await runDailyRoutine({ now: MONDAY, deps });
  assert.deepEqual(calls.release, [[1, 'weekly_summary', '2026-W41']]);
  assert.equal(calls.sent.length, 1);
  assert.equal(result.errors, 1);
  assert.equal(result.sent, 1);
});

test('skips and releases users without e-mail, data or verdict', async () => {
  const cases = [
    { findEmail: async () => null },
    { getAnalytics: async () => analytics({ hasData: false }) },
    { getAnalytics: async () => analytics({ verdict: null }) },
  ];
  for (const override of cases) {
    const { deps, calls } = makeDeps(override);
    const result = await runDailyRoutine({ now: MONDAY, deps });
    assert.equal(calls.sent.length, 0);
    assert.equal(calls.release.length, 2);
    assert.equal(result.skipped, 2);
  }
});

test('sends nothing without the unsubscribe secret', async () => {
  const { deps, calls } = makeDeps({ unsubscribeSecret: '' });
  const result = await runDailyRoutine({ now: MONDAY, deps });
  assert.equal(calls.sent.length, 0);
  assert.equal(calls.claim.length, 0);
  assert.equal(result.skipped, 2);
});

test('logs never contain e-mails, names or tokens', async () => {
  const lines = [];
  const spies = ['log', 'warn', 'error'].map(level => mock.method(console, level, (...args) => { lines.push(args.map(String).join(' ')); }));
  try {
    const { deps } = makeDeps({ syncAccount: async () => { throw new Error('token abc ana@example.com'); }, send: async () => { throw new Error('ana@example.com'); } });
    await runDailyRoutine({ now: MONDAY, deps });
  } finally { spies.forEach(spy => spy.mock.restore()); }
  const text = lines.join('\n');
  assert.ok(text.length > 0);
  for (const secret of ['example.com', 'Ana', 'Bia', 'abc', SECRET]) assert.ok(!text.includes(secret), secret);
});

test('a sync that spends its whole budget still leaves time to send the summaries', async () => {
  const { deps, calls } = makeDeps();
  deps.syncAccount = async (userId, platform) => { calls.sync.push([userId, platform]); deps.advance(SYNC_BUDGET_MS); };
  const result = await runDailyRoutine({ now: MONDAY, deps });
  assert.equal(calls.sync.length, 1);
  assert.equal(calls.sent.length, 2);
  assert.equal(result.sent, 2);
});

test('the summary phase has its own time budget and reports who was left for the next run', async () => {
  const lines = [];
  const spy = mock.method(console, 'warn', (...args) => { lines.push(args.map(String).join(' ')); });
  try {
    const { deps, calls } = makeDeps();
    deps.send = async message => { calls.sent.push(message); deps.advance(SUMMARY_BUDGET_MS); };
    const result = await runDailyRoutine({ now: MONDAY, deps });
    assert.equal(calls.sent.length, 1);
    assert.equal(result.sent, 1);
    assert.ok(lines.some(line => line.includes('1')), lines.join('|'));
  } finally { spy.mock.restore(); }
});

// ---- alertas por mudança de estado (etapa 2) ----
const attention = () => analytics({ verdict: { ...analytics().verdict, status: 'attention', actions: [{ code: 'nothing_urgent', params: {} }] } });
const DAY_MS = 86400000;

function alertDeps({ prev = { state: 'ok' }, lastAlert = null, getAnalytics = async () => attention(), ...rest } = {}) {
  const base = makeDeps({
    listAlertUsers: async () => [{ id: 1, name: 'Ana', authUserId: 'u1' }],
    lastState: async () => prev,
    lastAlertAt: async () => lastAlert,
    getAnalytics,
    listOptedInUsers: async () => [],
    ...rest,
  });
  return base;
}

test('alert: sends once when the state changes from ok to attention, with the alert variant', async () => {
  const { deps, calls } = alertDeps();
  const result = await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sent.length, 1);
  assert.equal(result.alerts, 1);
  assert.deepEqual(calls.claim.map(([, kind]) => kind), ['alert_attention', 'state_attention']);
  assert.equal(calls.claim[0][2], '2026-10-08');
  assert.match(calls.sent[0].subject, /passaram a pedir atenção/);
  assert.ok(new URL(calls.sent[0].unsubscribeUrl).searchParams.get('e') === 'alertas');
  assert.ok(calls.sent[0].unsubscribePostUrl.endsWith('&e=alertas'));
});

test('alert: no e-mail when attention continues, ok continues or attention recovers', async () => {
  for (const [prev, getAnalytics] of [[{ state: 'attention' }, async () => attention()], [{ state: 'ok' }, async () => analytics()], [{ state: 'attention' }, async () => analytics()]]) {
    const { deps, calls } = alertDeps({ prev, getAnalytics });
    await runDailyRoutine({ now: THURSDAY, deps });
    assert.equal(calls.sent.length, 0);
    assert.equal(calls.claim.length, 1);
  }
});

test('alert: the first observation only records the state', async () => {
  const { deps, calls } = alertDeps({ prev: null });
  await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sent.length, 0);
  assert.deepEqual(calls.claim.map(([, kind]) => kind), ['state_attention']);
});

test('alert: waits at least 3 days after the previous alert', async () => {
  const recent = alertDeps({ lastAlert: new Date(THURSDAY.getTime() - 2 * DAY_MS) });
  await runDailyRoutine({ now: THURSDAY, deps: recent.deps });
  assert.equal(recent.calls.sent.length, 0);
  const old = alertDeps({ lastAlert: new Date(THURSDAY.getTime() - 3 * DAY_MS) });
  await runDailyRoutine({ now: THURSDAY, deps: old.deps });
  assert.equal(old.calls.sent.length, 1);
});

test('alert: runs only once a day (state already recorded today)', async () => {
  const { deps, calls } = alertDeps({ claim: async (...args) => { calls.claim.push(args); return false; } });
  await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sent.length, 0);
});

test('alert: skips users without data, verdict or an assessable state, recording nothing', async () => {
  const insufficient = analytics({ verdict: { ...analytics().verdict, status: 'insufficient', insufficientReason: 'no_data' } });
  for (const getAnalytics of [async () => analytics({ hasData: false }), async () => analytics({ verdict: null }), async () => insufficient]) {
    const { deps, calls } = alertDeps({ getAnalytics });
    await runDailyRoutine({ now: THURSDAY, deps });
    assert.equal(calls.sent.length, 0);
    assert.equal(calls.claim.length, 0);
  }
});

test('alert: a failed send releases the alert and never records the state, and the run continues', async () => {
  const { deps, calls } = alertDeps({ listAlertUsers: async () => [{ id: 1, name: 'Ana', authUserId: 'u1' }, { id: 2, name: 'Bia', authUserId: 'u2' }] });
  let first = true;
  deps.send = async message => { if (first) { first = false; throw new Error('boom'); } calls.sent.push(message); };
  const result = await runDailyRoutine({ now: THURSDAY, deps });
  assert.deepEqual(calls.release, [[1, 'alert_attention', '2026-10-08']]);
  assert.ok(!calls.claim.some(([id, kind]) => id === 1 && kind === 'state_attention'));
  assert.equal(calls.sent.length, 1);
  assert.equal(result.errors, 1);
});

test('alert: skipped when the weekly summary was just sent to the same user', async () => {
  const { deps, calls } = alertDeps({ listOptedInUsers: async () => [{ id: 1, name: 'Ana', authUserId: 'u1' }] });
  const result = await runDailyRoutine({ now: MONDAY, deps });
  assert.equal(calls.sent.length, 1);
  assert.match(calls.sent[0].subject, /resumo|semana/i);
  assert.equal(result.alerts, 0);
  assert.ok(calls.claim.some(([, kind]) => kind === 'state_attention'));
});

test('alert: no e-mail and no state without the unsubscribe secret', async () => {
  const { deps, calls } = alertDeps({ unsubscribeSecret: '' });
  await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sent.length, 0);
  assert.equal(calls.claim.length, 0);
});

test('alert: a state older than 7 days is not a baseline (re-enabling after a long pause only records)', async () => {
  const { deps, calls } = alertDeps({ prev: { state: 'ok', at: new Date(THURSDAY.getTime() - 60 * DAY_MS) } });
  await runDailyRoutine({ now: THURSDAY, deps });
  assert.equal(calls.sent.length, 0);
  assert.deepEqual(calls.claim.map(([, kind]) => kind), ['state_attention']);
  const fresh = alertDeps({ prev: { state: 'ok', at: new Date(THURSDAY.getTime() - 1 * DAY_MS) } });
  await runDailyRoutine({ now: THURSDAY, deps: fresh.deps });
  assert.equal(fresh.calls.sent.length, 1);
});

test('alert: a release that fails is logged, not silent', async () => {
  const { deps } = alertDeps({ release: async () => { throw new Error('db down'); } });
  deps.send = async () => { throw new Error('boom'); };
  const logged = [];
  const spy = mock.method(console, 'error', (...args) => { logged.push(args.join(' ')); });
  await runDailyRoutine({ now: THURSDAY, deps });
  spy.mock.restore();
  assert.ok(logged.some(line => /liberar/.test(line)));
});
