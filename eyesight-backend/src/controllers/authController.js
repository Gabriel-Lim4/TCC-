// ─────────────────────────────────────────────────────────────
// controllers/authController.js
//
// Auth 100% via Supabase Auth. Os e-mails (confirmação de conta e
// redefinição de senha) são enviados PELO SUPABASE, usando o SMTP
// customizado configurado no painel (Resend). Este backend só
// dispara o envio — não monta nem envia e-mail por conta própria.
//
// POST /auth/cadastro | /auth/login | /auth/reenviar-verificacao
// POST /auth/esqueci-senha | /auth/redefinir-senha | GET /auth/me
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import { prisma }   from '../config/database.js';
import { createAuthClient } from '../config/supabase.js';
import env          from '../config/env.js';
import {
  cadastroSchema,
  loginSchema,
  redefinirSenhaSchema,
  esqueciSenhaSchema,
  atualizarPerfilSchema,
  alterarSenhaSchema,
  refreshSchema,
} from '../validators/authValidator.js';

const URL_CONFIRMACAO = `${env.frontendUrl}/verificar-email`;
const URL_REDEFINICAO = `${env.frontendUrl}/redefinir-senha`;

const eRateLimit = (error) =>
  error?.status === 429 || error?.code === 'over_email_send_rate_limit';

const SIGNUP_REPLY = {
  mensagem: 'Se o e-mail puder ser cadastrado, você receberá as instruções de confirmação.',
  requerVerificacao: true,
};

const MSG_RATE_LIMIT = 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente novamente.';

// ── POST /auth/cadastro ──────────────────────────────────────
export async function cadastro(req, res) {
  const result = cadastroSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: errors,
    });
  }

  const { nome, email, senha } = result.data;

  try {
    const { data, error } = await createAuthClient().auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: URL_CONFIRMACAO,
      },
    });

    if (error) {
      console.error('[AUTH] Erro no cadastro Supabase:');

      if (eRateLimit(error))
        return res.status(429).json({ erro: MSG_RATE_LIMIT });

      if (error.message.toLowerCase().includes('already registered'))
        return res.status(201).json(SIGNUP_REPLY);

      return res.status(400).json({ erro: error.message });
    }

    // Com confirmação de e-mail ativa, o Supabase NÃO retorna erro para e-mail
    // já cadastrado: devolve um user com identities vazio (anti-enumeração).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
      return res.status(201).json(SIGNUP_REPLY);

    // Cria o perfil na tabela local de usuários
    if (data.user) {
      try {
        await prisma.usuarios.create({
          data: {
            nome_usuario: nome,
            auth_user_id: data.user.id,
          },
        });
      } catch (err) {
        // Se já existe (race condition), ignora
        if (err.code !== 'P2002') {
          console.error('[AUTH] Erro ao criar perfil local:');
        }
      }
    }

    return res.status(201).json(SIGNUP_REPLY);
  } catch (err) {
    console.error('[AUTH] Erro no cadastro:');
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/login ─────────────────────────────────────────
export async function login(req, res) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: errors,
    });
  }

  const { email, senha } = result.data;

  try {
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error('[AUTH] Erro no login Supabase:');

      // O front já trata requerVerificacao (mostra "Reenviar e-mail")
      if (error.code === 'email_not_confirmed') {
        return res.status(403).json({
          erro: 'Confirme seu e-mail antes de entrar.',
          requerVerificacao: true,
          email,
        });
      }

      return res.status(401).json({ erro: 'Email ou senha inválidos.' });
    }

    if (!data.user || !data.session)
      return res.status(401).json({ erro: 'Não foi possível iniciar a sessão.' });

    const usuario = await prisma.usuarios.findUnique({
      where:  { auth_user_id: data.user.id },
      select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true, telefone: true, localizacao: true, preferences: true },
    });

    if (!usuario)
      return res.status(404).json({ erro: 'Perfil do usuário não encontrado.' });

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      usuario: { id: usuario.pk_id_usuario, nome: usuario.nome_usuario, email: data.user.email, preferences: usuario.preferences || {} },
    });
  } catch (err) {
    console.error('[AUTH] Erro no login:');
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/reenviar-verificacao ──────────────────────────
export async function reenviarVerificacao(req, res) {
  const result = esqueciSenhaSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  const { email } = result.data;

  // Resposta genérica para evitar enumeração de usuários
  const respostaGenerica = {
    mensagem: 'Se o e-mail estiver cadastrado e pendente, enviamos um novo link de confirmação.',
  };

  try {
    const { error } = await createAuthClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: URL_CONFIRMACAO },
    });

    if (error) {
      console.error('[AUTH] Erro ao reenviar confirmação:');
      if (eRateLimit(error)) return res.status(429).json({ erro: MSG_RATE_LIMIT });
    }

    return res.status(200).json(respostaGenerica);
  } catch (err) {
    console.error('[AUTH] Erro ao reenviar confirmação:');
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/esqueci-senha ─────────────────────────────────
export async function esqueciSenha(req, res) {
  const result = esqueciSenhaSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: errors,
    });
  }

  const { email } = result.data;

  const respostaGenerica = {
    mensagem: 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.',
  };

  try {
    const { error } = await createAuthClient().auth.resetPasswordForEmail(email, {
      redirectTo: URL_REDEFINICAO,
    });

    if (error) {
      console.error('[AUTH] Erro ao enviar redefinição:');
      if (eRateLimit(error)) return res.status(429).json({ erro: MSG_RATE_LIMIT });
    }

    return res.status(200).json(respostaGenerica);
  } catch (err) {
    console.error('[AUTH] Erro ao enviar redefinição:');
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/redefinir-senha ───────────────────────────────
// O front recebe o access_token de recuperação no hash da URL (#access_token=...)
// e o reenvia aqui junto com a nova senha.
export async function redefinirSenha(req, res) {
  const result = redefinirSenhaSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: errors,
    });
  }

  const { accessToken, novaSenha } = result.data;

  if (novaSenha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

  try {
    await axios.put(
      `${env.supabase.url}/auth/v1/user`,
      { password: novaSenha },
      {
        headers: {
          apikey:        env.supabase.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) {
    const status = err.response?.status;
    console.error('[AUTH] Erro ao redefinir senha:');

    // 400 (não 401) para o front não tratar como sessão expirada
    if (status === 401 || status === 403)
      return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite um novo.' });

    if (status === 422)
      return res.status(400).json({ erro: err.response?.data?.msg || 'Senha inválida.' });

    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── GET /auth/me ─────────────────────────────────────────────
export async function me(req, res) {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where:  { auth_user_id: req.usuario.auth_user_id },
      select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true, telefone: true, localizacao: true, preferences: true },
    });

    if (!usuario)
      return res.status(404).json({ erro: 'Perfil do usuário não encontrado.' });

    return res.status(200).json({
      usuario: {
        id:         usuario.pk_id_usuario,
        nome:       usuario.nome_usuario,
        authUserId: usuario.auth_user_id,
        email:      req.usuario.email,
        telefone: usuario.telefone || "",
        localizacao: usuario.localizacao || "",
        preferences: usuario.preferences || {},
      },
    });
  } catch (err) {
    console.error('[AUTH] Erro ao buscar usuário:');
    return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
}

// ── PUT /auth/me ─────────────────────────────────────────────
export async function atualizarPerfil(req, res) {
  const result = atualizarPerfilSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: 'Nome inválido.', detalhes: result.error.issues });
  const { nome, telefone, localizacao, preferences } = result.data;

  try {
    const current = preferences ? await prisma.usuarios.findUnique({ where: { auth_user_id: req.usuario.auth_user_id }, select: { preferences: true } }) : null;
    const usuario = await prisma.usuarios.update({
      where:  { auth_user_id: req.usuario.auth_user_id },
      data:   { nome_usuario: nome.trim(), telefone, localizacao, ...(preferences ? { preferences: { ...current?.preferences, ...preferences } } : {}) },
      select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true, telefone: true, localizacao: true, preferences: true },
    });

    return res.status(200).json({
      mensagem: 'Perfil atualizado com sucesso.',
      usuario: {
        id:         usuario.pk_id_usuario,
        nome:       usuario.nome_usuario,
        authUserId: usuario.auth_user_id,
        email:      req.usuario.email,
        telefone: usuario.telefone || "",
        localizacao: usuario.localizacao || "",
        preferences: usuario.preferences || {},
      },
    });
  } catch (err) {
    console.error('[AUTH] Erro ao atualizar perfil:');
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
}
// ── GET /auth/me/contas ────────────────────────────────────
// Retorna as plataformas vinculadas ao usuário logado.
export async function minhasContas(req, res) {
  try {
    const contas = await prisma.contas_vinculadas.findMany({
      where:  { fk_id_usuario: req.usuario.id },
      select: {
        plataforma:   true,
        account_id:   true,
        vinculado_em: true,
      },
      orderBy: { vinculado_em: 'asc' },
    });

    return res.status(200).json({ contas });
  } catch (err) {
    console.error('[AUTH] Erro ao buscar contas vinculadas:');
    return res.status(500).json({ erro: 'Erro ao buscar contas vinculadas.' });
  }
}

export async function refresh(req, res) {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: 'Token de renovação inválido.' });
  try {
    const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: result.data.refreshToken });
    if (error || !data.session) return res.status(error?.status >= 500 || error?.name === 'AuthRetryableFetchError' ? 503 : 401).json({ erro: 'Não foi possível renovar a sessão.' });
    return res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: data.session.expires_at });
  } catch {
    return res.status(503).json({ erro: 'Autenticação indisponível. Tente novamente.' });
  }
}

export async function logout(req, res) {
  try {
    const { error } = await createAuthClient().auth.admin.signOut(req.headers.authorization.slice(7), 'local');
    if (error && ![401, 403, 404].includes(error.status)) return res.status(503).json({ erro: 'Não foi possível encerrar a sessão no servidor. Tente novamente.' });
    return res.json({ mensagem: 'Sessão encerrada.' });
  } catch {
    return res.status(503).json({ erro: 'Não foi possível encerrar a sessão. Tente novamente.' });
  }
}

export async function alterarSenha(req, res) {
  const result = alterarSenhaSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: 'Informe a senha atual e uma nova senha de 8 a 256 caracteres.' });
  if (result.data.senhaAtual === result.data.novaSenha) return res.status(400).json({ erro: 'Escolha uma senha diferente da atual.' });
  const client = createAuthClient();
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: req.usuario.email, password: result.data.senhaAtual });
    if (error || data.user?.id !== req.usuario.auth_user_id) return res.status(400).json({ erro: 'Senha atual incorreta.' });
    try {
      const updated = await client.auth.updateUser({ password: result.data.novaSenha });
      if (updated.error) return res.status(400).json({ erro: 'Não foi possível alterar a senha. Verifique a política de segurança da conta.' });
      return res.json({ mensagem: 'Senha alterada. Use a nova senha no próximo acesso.' });
    } finally {
      await client.auth.signOut({ scope: 'local' });
    }
  } catch {
    return res.status(503).json({ erro: 'Não foi possível alterar a senha. Tente novamente.' });
  }
}
