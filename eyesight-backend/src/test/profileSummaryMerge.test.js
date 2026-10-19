import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const updates = [];
const raws = [];
mock.module('../config/database.js', { namedExports: { prisma: {
  $executeRaw: async (strings, ...values) => { raws.push({ sql: strings.join('?'), values }); return 1; },
  usuarios: {
    update: async args => { updates.push(args.data); return { pk_id_usuario: 1, nome_usuario: 'Ana', auth_user_id: 'a', telefone: '', localizacao: '', preferences: {} }; },
  },
} } });
mock.module('../config/supabase.js', { namedExports: { createAuthClient: () => ({}) } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'http://localhost', supabase: {} } });
const { atualizarPerfil } = await import('../controllers/authController.js');

const run = async body => {
  const res = { status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
  await atualizarPerfil({ body, usuario: { auth_user_id: 'a' } }, res);
  return res;
};

test('preferences are merged by one atomic UPDATE in the database, not read-then-overwrite', async () => {
  updates.length = 0; raws.length = 0;
  const res = await run({ nome: 'Ana', preferences: { theme: 'dark', summary: { alerts: false } } });
  assert.equal(res.statusCode, 200);
  assert.equal(raws.length, 1);
  assert.match(raws[0].sql, /\|\|\s*\?::text::jsonb/);
  assert.deepEqual(JSON.parse(raws[0].values[0]), { theme: 'dark' });
  assert.deepEqual(JSON.parse(raws[0].values[2]), { alerts: false });
  assert.equal('preferences' in updates[0], false);
});

test('profile update without preferences does not touch the preferences column', async () => {
  updates.length = 0; raws.length = 0;
  await run({ nome: 'Ana' });
  assert.equal(raws.length, 0);
});
