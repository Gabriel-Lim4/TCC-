import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const updates = [];
let stored = { theme: 'dark', summary: { weekly: true, alerts: true } };
mock.module('../config/database.js', { namedExports: { prisma: { usuarios: {
  findUnique: async () => ({ preferences: stored }),
  update: async args => { updates.push(args.data); return { pk_id_usuario: 1, nome_usuario: 'Ana', auth_user_id: 'a', telefone: '', localizacao: '', preferences: args.data.preferences ?? stored }; },
} } } });
mock.module('../config/supabase.js', { namedExports: { createAuthClient: () => ({}) } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'http://localhost', supabase: {} } });
const { atualizarPerfil } = await import('../controllers/authController.js');

const run = async body => {
  const res = { status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
  await atualizarPerfil({ body, usuario: { auth_user_id: 'a' } }, res);
  return res;
};

test('changing one summary option keeps the other and the remaining preferences', async () => {
  updates.length = 0;
  const res = await run({ nome: 'Ana', preferences: { summary: { alerts: false } } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(updates[0].preferences, { theme: 'dark', summary: { weekly: true, alerts: false } });
});
