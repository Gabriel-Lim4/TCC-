import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import rateLimiter from '../middlewares/rateLimiter.js';

async function withServer(run) {
  const app = express();
  app.use((req, _res, next) => { req.usuario = { id: Number(req.headers['x-user']) }; next(); });
  app.post('/chat', rateLimiter.ai, (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  try { await run(`http://127.0.0.1:${server.address().port}/chat`); } finally { server.close(); }
}
const post = (url, user) => fetch(url, { method: 'POST', headers: { 'x-user': String(user) } });

test('AI limiter is per user: one user hits the cap, another is unaffected', async () => {
  await withServer(async url => {
    for (let i = 0; i < 30; i++) assert.equal((await post(url, 1)).status, 200);
    const blocked = await post(url, 1);
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).erro, /IA/);
    assert.equal((await post(url, 2)).status, 200);
  });
});
