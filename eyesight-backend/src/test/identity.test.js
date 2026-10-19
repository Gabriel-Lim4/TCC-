import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const auth = { refreshSession: mock.fn(), signInWithPassword: mock.fn(), updateUser: mock.fn(), signOut: mock.fn(), admin: { signOut: mock.fn() } };
const users = { findUnique: mock.fn(), update: mock.fn() };
const executeRaw = mock.fn(async () => 1);
mock.module('../config/database.js', { namedExports: { prisma: { usuarios: users, $executeRaw: executeRaw } } });
mock.module('../config/supabase.js', { namedExports: { createAuthClient: () => ({ auth }) } });
mock.module('../config/env.js', { defaultExport: { frontendUrl: 'http://localhost', supabase: {} } });
const { atualizarPerfil, alterarSenha, refresh, logout } = await import('../controllers/authController.js');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } });
const usuario = { id: 7, auth_user_id: 'auth-7', email: 'a@example.com' };
beforeEach(() => { for (const item of [...Object.values(auth), ...Object.values(users), auth.admin.signOut]) item.mock?.resetCalls(); });
test('profile persists contact fields and merges preferences in the database', async () => {
  users.update.mock.mockImplementation(async ({ data }) => ({ ...data, pk_id_usuario: 7, auth_user_id: 'auth-7' }));
  executeRaw.mock.resetCalls();
  const res = response();
  await atualizarPerfil({ usuario, body: { nome: ' Ana ', telefone: '1234', localizacao: 'Recife', preferences: { theme: 'light' } } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(executeRaw.mock.callCount(), 1);
  assert.deepEqual(JSON.parse(executeRaw.mock.calls[0].arguments[1]), { theme: 'light' });
  assert.deepEqual(users.update.mock.calls[0].arguments[0].data, { nome_usuario: 'Ana', telefone: '1234', localizacao: 'Recife' });
  assert.equal(res.body.usuario.telefone, '1234');
});
test('onboarding dismissal is sent as a database merge, leaving other preferences untouched', async () => {
  users.update.mock.mockImplementation(async ({ data }) => ({ ...data, pk_id_usuario: 7, auth_user_id: 'auth-7' }));
  executeRaw.mock.resetCalls();
  const res = response();
  await atualizarPerfil({ usuario, body: { nome: 'Ana', preferences: { onboarding: { dismissed: true } } } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(executeRaw.mock.calls[0].arguments[1]), { onboarding: { dismissed: true } });
});
test('incorrect current password never updates password', async () => {
  auth.signInWithPassword.mock.mockImplementation(async () => ({ data: {}, error: { status: 400 } }));
  const res = response(); await alterarSenha({ usuario, body: { senhaAtual: 'bad', novaSenha: 'newpassword12' } }, res);
  assert.equal(res.statusCode, 400); assert.equal(auth.updateUser.mock.callCount(), 0);
});
test('password update cleans up temporary verification session', async () => {
  auth.signInWithPassword.mock.mockImplementation(async () => ({ data: { user: { id: 'auth-7' } }, error: null }));
  auth.updateUser.mock.mockImplementation(async () => ({ error: null }));
  auth.signOut.mock.mockImplementation(async () => ({ error: null }));
  const res = response(); await alterarSenha({ usuario, body: { senhaAtual: 'oldpassword12', novaSenha: 'newpassword12' } }, res);
  assert.equal(res.statusCode, 200); assert.deepEqual(auth.signOut.mock.calls[0].arguments[0], { scope: 'local' });
});
test('refresh returns rotated credentials and rejects invalid token', async () => {
  auth.refreshSession.mock.mockImplementation(async () => ({ data: { session: { access_token: 'new', refresh_token: 'rotated', expires_at: 123 } }, error: null }));
  const res = response(); await refresh({ body: { refreshToken: 'old' } }, res);
  assert.deepEqual(res.body, { token: 'new', refreshToken: 'rotated', expiresAt: 123 });
  auth.refreshSession.mock.mockImplementation(async () => ({ data: {}, error: { status: 400 } }));
  const failed = response(); await refresh({ body: { refreshToken: 'bad' } }, failed); assert.equal(failed.statusCode, 401);
});
test('logout revokes only the current session using the validated JWT', async () => {
  auth.admin.signOut.mock.mockImplementation(async () => ({ error: null }));
  const res = response(); await logout({ headers: { authorization: 'Bearer current-jwt' } }, res);
  assert.equal(res.statusCode, 200); assert.deepEqual(auth.admin.signOut.mock.calls[0].arguments, ['current-jwt', 'local']);
});
