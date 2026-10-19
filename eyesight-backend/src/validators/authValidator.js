import { z } from 'zod';

// ── Schemas de cadastro/login ────────────────────────────────
export const cadastroSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

// ── Schema para redefinição de senha ──────────────────────────
export const redefinirSenhaSchema = z.object({
  accessToken: z.string().nonempty('Token de acesso é obrigatório'),
  novaSenha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

// ── Schema para e-mail de recuperação ─────────────────────────
export const esqueciSenhaSchema = z.object({
  email: z.string().trim().email('Email inválido'),
});

// Chaves dos indicadores do painel (mesmas de src/utils/kpiCatalog.js no front).
export const DASHBOARD_CARD_KEYS = ['roas', 'ctr', 'cpa', 'cpc', 'cpm', 'spend', 'revenue', 'conversions', 'clicks', 'impressions'];

// ── Schema para atualização de perfil ─────────────────────────
export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  telefone: z.string().trim().max(30).optional(),
  localizacao: z.string().trim().max(150).optional(),
  preferences: z.object({
    theme: z.enum(["light", "dark"]).optional(),
    onboarding: z.object({ dismissed: z.boolean() }).strict().optional(),
    // Indicadores que o cliente deixa à mostra no painel, na ordem escolhida (lista vazia = nenhum).
    dashboardCards: z.array(z.enum(DASHBOARD_CARD_KEYS)).max(DASHBOARD_CARD_KEYS.length)
      .refine(cards => new Set(cards).size === cards.length, { message: 'Indicador repetido.' }).optional(),
    summary: z.object({ weekly: z.boolean().optional(), alerts: z.boolean().optional() }).strict()
      .refine(summary => Object.keys(summary).length > 0, { message: 'Informe ao menos uma opção.' }).optional(),
  }).strict().optional(),
});

// ── Schema para validação de e-mail ───────────────────────────
export const verificacaoEmailSchema = z.object({
  token: z.string().nonempty('Token é obrigatório'),
});
export const alterarSenhaSchema = z.object({ senhaAtual: z.string().min(1).max(256), novaSenha: z.string().min(8).max(256) });
export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(4096) });
