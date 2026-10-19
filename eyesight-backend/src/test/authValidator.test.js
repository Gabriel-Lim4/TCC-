import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cadastroSchema, loginSchema, redefinirSenhaSchema, esqueciSenhaSchema, atualizarPerfilSchema, verificacaoEmailSchema } from '../validators/authValidator.js';

describe('authValidator', () => {
  describe('cadastroSchema', () => {
    it('deve validar dados corretos', () => {
      const result = cadastroSchema.safeParse({
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '12345678',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar nome vazio', () => {
      const result = cadastroSchema.safeParse({
        nome: '',
        email: 'joao@teste.com',
        senha: '12345678',
      });
      assert.strictEqual(result.success, false);
    });

    it('deve rejeitar email inválido', () => {
      const result = cadastroSchema.safeParse({
        nome: 'João Silva',
        email: 'invalid-email',
        senha: '12345678',
      });
      assert.strictEqual(result.success, false);
    });

    it('deve rejeitar senha curta', () => {
      const result = cadastroSchema.safeParse({
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '12345',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('loginSchema', () => {
    it('deve validar dados corretos', () => {
      const result = loginSchema.safeParse({
        email: 'joao@teste.com',
        senha: '12345678',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar email inválido', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        senha: '12345678',
      });
      assert.strictEqual(result.success, false);
    });

    it('deve rejeitar senha vazia', () => {
      const result = loginSchema.safeParse({
        email: 'joao@teste.com',
        senha: '',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('redefinirSenhaSchema', () => {
    it('deve validar dados corretos', () => {
      const result = redefinirSenhaSchema.safeParse({
        accessToken: 'valid-token',
        novaSenha: '12345678',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar token vazio', () => {
      const result = redefinirSenhaSchema.safeParse({
        accessToken: '',
        novaSenha: '12345678',
      });
      assert.strictEqual(result.success, false);
    });

    it('deve rejeitar senha curta', () => {
      const result = redefinirSenhaSchema.safeParse({
        accessToken: 'valid-token',
        novaSenha: '123456',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('esqueciSenhaSchema', () => {
    it('deve validar dados corretos', () => {
      const result = esqueciSenhaSchema.safeParse({
        email: 'joao@teste.com',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar email inválido', () => {
      const result = esqueciSenhaSchema.safeParse({
        email: 'invalid',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('atualizarPerfilSchema', () => {
    it('deve validar dados corretos', () => {
      const result = atualizarPerfilSchema.safeParse({
        nome: 'João Silva',
        telefone: '11987654321',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar nome vazio', () => {
      const result = atualizarPerfilSchema.safeParse({
        nome: '',
      });
      assert.strictEqual(result.success, false);
    });

    const perfil = preferences => atualizarPerfilSchema.safeParse({ nome: 'Ana', preferences });

    it('deve aceitar preferencia de onboarding dispensado', () => {
      assert.strictEqual(perfil({ onboarding: { dismissed: true } }).success, true);
    });

    it('deve aceitar somente o tema (compatibilidade com o perfil)', () => {
      assert.strictEqual(perfil({ theme: 'light' }).success, true);
    });

    it('deve aceitar os indicadores escolhidos para o painel, na ordem enviada', () => {
      const result = perfil({ dashboardCards: ['roas', 'ctr', 'cpm'] });
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.data.preferences.dashboardCards, ['roas', 'ctr', 'cpm']);
    });

    it('deve aceitar lista vazia de indicadores (cliente ocultou todos)', () => {
      assert.strictEqual(perfil({ dashboardCards: [] }).success, true);
    });

    it('deve rejeitar indicador desconhecido, repetido ou lista grande demais', () => {
      assert.strictEqual(perfil({ dashboardCards: ['roas', 'lucro'] }).success, false);
      assert.strictEqual(perfil({ dashboardCards: ['roas', 'roas'] }).success, false);
      assert.strictEqual(perfil({ dashboardCards: new Array(11).fill('roas') }).success, false);
      assert.strictEqual(perfil({ dashboardCards: 'roas' }).success, false);
    });

    it('deve rejeitar dismissed que nao seja booleano', () => {
      assert.strictEqual(perfil({ onboarding: { dismissed: 'sim' } }).success, false);
    });

    it('deve rejeitar chaves extras em onboarding', () => {
      assert.strictEqual(perfil({ onboarding: { dismissed: true, extra: 1 } }).success, false);
    });

    it('deve rejeitar preferencias desconhecidas', () => {
      assert.strictEqual(perfil({ foo: 1 }).success, false);
    });
  });

  describe('verificacaoEmailSchema', () => {
    it('deve validar dados corretos', () => {
      const result = verificacaoEmailSchema.safeParse({
        token: 'valid-token',
      });
      assert.strictEqual(result.success, true);
    });

    it('deve rejeitar token vazio', () => {
      const result = verificacaoEmailSchema.safeParse({
        token: '',
      });
      assert.strictEqual(result.success, false);
    });
  });
});
describe('authValidator preferences.summary', () => {
  const base = { nome: 'Ana' };
  it('aceita o resumo semanal ligado ou desligado e mantém tema e onboarding', () => {
    assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { summary: { weekly: true } } }).success, true);
    assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { summary: { weekly: false } } }).success, true);
    assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { theme: 'dark', onboarding: { dismissed: true } } }).success, true);
  });
  it('rejeita valores e chaves fora do contrato', () => {
    for (const summary of [{ weekly: 'sim' }, {}, { weekly: true, extra: 1 }, 'on']) {
      assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { summary } }).success, false, JSON.stringify(summary));
    }
  });
});

describe('authValidator preferences.summary alerts', () => {
  const base = { nome: 'Ana' };
  it('accepts alerts alone or with weekly', () => {
    for (const summary of [{ alerts: true }, { alerts: false }, { weekly: true, alerts: false }]) {
      assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { summary } }).success, true, JSON.stringify(summary));
    }
  });
  it('still rejects empty, extra and non-boolean values', () => {
    for (const summary of [{}, { alerts: 'sim' }, { alerts: true, extra: 1 }]) {
      assert.strictEqual(atualizarPerfilSchema.safeParse({ ...base, preferences: { summary } }).success, false, JSON.stringify(summary));
    }
  });
});
