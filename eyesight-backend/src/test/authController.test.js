import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module('../config/database.js', { namedExports: { prisma: {} } });
mock.module('../config/supabase.js', { namedExports: { createAuthClient: () => { throw new Error('Invalid input must not call Supabase'); } } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'http://localhost', supabase: {} } });
const { login, cadastro, esqueciSenha, redefinirSenha, atualizarPerfil, reenviarVerificacao } = await import('../controllers/authController.js');

for (const [name, handler, body] of [
  ['login', login, { email: 'invalid', senha: '' }],
  ['cadastro', cadastro, { nome: ' ', email: 'invalid', senha: '1' }],
  ['esqueciSenha', esqueciSenha, { email: 'invalid' }],
  ['redefinirSenha', redefinirSenha, { accessToken: '', novaSenha: '1' }],
  ['atualizarPerfil', atualizarPerfil, { nome: 123 }],
  ['reenviarVerificacao', reenviarVerificacao, { email: 'invalid' }],
]) {
  test(`${name} rejects invalid data with 400 instead of throwing`, async () => {
    const res = { status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    await handler({ body }, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.erro);
  });
}
