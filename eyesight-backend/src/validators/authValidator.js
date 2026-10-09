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

// ── Schema para atualização de perfil ─────────────────────────
export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  telefone: z.string().trim().max(30).optional(),
  localizacao: z.string().trim().max(150).optional(),
  preferences: z.object({
    theme: z.enum(["light", "dark"]).optional(),
    onboarding: z.object({ dismissed: z.boolean() }).strict().optional(),
    summary: z.object({ weekly: z.boolean() }).strict().optional(),
  }).strict().optional(),
});

// ── Schema para validação de e-mail ───────────────────────────
export const verificacaoEmailSchema = z.object({
  token: z.string().nonempty('Token é obrigatório'),
});
export const alterarSenhaSchema = z.object({ senhaAtual: z.string().min(1).max(256), novaSenha: z.string().min(8).max(256) });
export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(4096) });
