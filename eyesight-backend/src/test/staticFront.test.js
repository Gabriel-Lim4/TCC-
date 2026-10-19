import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mountFront } from '../staticFront.js';

describe('staticFront', () => {
  let server, base, dir;
  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'front-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<div id="root">site</div>');
    fs.writeFileSync(path.join(dir, 'assets', 'app-abc123.js'), 'console.log(1)');
    const app = express();
    app.get('/health', (req, res) => res.json({ ok: true }));
    assert.strictEqual(mountFront(app, dir), true);
    app.use((req, res) => res.status(404).json({ erro: 'rota não encontrada' }));
    await new Promise(resolve => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it('entrega o index.html na raiz e nas rotas do React', async () => {
    for (const route of ['/', '/login', '/app/google', '/app/dashboard']) {
      const res = await fetch(base + route);
      assert.strictEqual(res.status, 200, route);
      assert.match(await res.text(), /id="root"/, route);
    }
  });

  it('mantém a API respondendo e o 404 em JSON para rotas de API desconhecidas', async () => {
    assert.deepStrictEqual(await (await fetch(`${base}/health`)).json(), { ok: true });
    const res = await fetch(`${base}/metricas/nao-existe`);
    assert.strictEqual(res.status, 404);
    assert.deepStrictEqual(await res.json(), { erro: 'rota não encontrada' });
  });

  it('arquivos com hash têm cache longo e o index nunca fica em cache', async () => {
    const asset = await fetch(`${base}/assets/app-abc123.js`);
    assert.match(asset.headers.get('cache-control'), /immutable/);
    assert.strictEqual((await fetch(base + '/')).headers.get('cache-control'), 'no-cache');
  });

  it('arquivo estático que não existe dá 404 (não devolve o site no lugar)', async () => {
    assert.strictEqual((await fetch(`${base}/assets/sumiu.js`)).status, 404);
  });

  it('sem a pasta compilada (desenvolvimento), não monta nada', () => {
    assert.strictEqual(mountFront(express(), path.join(dir, 'nao-existe')), false);
  });
});
