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
import { supabase } from '../config/supabase.js';
import env          from '../config/env.js';

const URL_CONFIRMACAO = `${env.frontendUrl}/verificar-email`;
const URL_REDEFINICAO = `${env.frontendUrl}/redefinir-senha`;

const eRateLimit = (error) =>
  error?.status === 429 || error?.code === 'over_email_send_rate_limit';

const MSG_RATE_LIMIT = 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente novamente.';

// ── POST /auth/cadastro ──────────────────────────────────────
export async function cadastro(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha)
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha.' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ erro: 'Formato de email inválido.' });

  if (senha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: URL_CONFIRMACAO,
      },
    });

    if (error) {
      console.error('[AUTH] Erro no cadastro Supabase:', error.code || error.message);

      if (eRateLimit(error))
        return res.status(429).json({ erro: MSG_RATE_LIMIT });

      if (error.message.toLowerCase().includes('already registered'))
        return res.status(409).json({ erro: 'Este email já está cadastrado.' });

      return res.status(400).json({ erro: error.message });
    }

    // Com confirmação de e-mail ativa, o Supabase NÃO retorna erro para e-mail
    // já cadastrado: devolve um user com identities vazio (anti-enumeração).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
      return res.status(409).json({ erro: 'Este email já está cadastrado.' });

    return res.status(201).json({
      mensagem: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.',
      requerVerificacao: true,
      usuario: { id: data.user?.id, nome, email: data.user?.email },
    });
  } catch (err) {
    console.error('[AUTH] Erro no cadastro:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/login ─────────────────────────────────────────
export async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ erro: 'Campos obrigatórios: email, senha.' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error('[AUTH] Erro no login Supabase:', error.code || error.message);

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
      select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true },
    });

    if (!usuario)
      return res.status(404).json({ erro: 'Perfil do usuário não encontrado.' });

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token: data.session.access_token,
      usuario: { id: usuario.pk_id_usuario, nome: usuario.nome_usuario, email: data.user.email },
    });
  } catch (err) {
    console.error('[AUTH] Erro no login:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/reenviar-verificacao ──────────────────────────
export async function reenviarVerificacao(req, res) {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ erro: 'Informe o e-mail para reenviar a confirmação.' });

  // Resposta genérica para evitar enumeração de usuários
  const respostaGenerica = {
    mensagem: 'Se o e-mail estiver cadastrado e pendente, enviamos um novo link de confirmação.',
  };

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: URL_CONFIRMACAO },
    });

    if (error) {
      console.error('[AUTH] Erro ao reenviar confirmação:', error.code || error.message);
      if (eRateLimit(error)) return res.status(429).json({ erro: MSG_RATE_LIMIT });
    }

    return res.status(200).json(respostaGenerica);
  } catch (err) {
    console.error('[AUTH] Erro ao reenviar confirmação:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/esqueci-senha ─────────────────────────────────
export async function esqueciSenha(req, res) {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ erro: 'Informe seu e-mail.' });

  const respostaGenerica = {
    mensagem: 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.',
  };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: URL_REDEFINICAO,
    });

    if (error) {
      console.error('[AUTH] Erro ao enviar redefinição:', error.code || error.message);
      if (eRateLimit(error)) return res.status(429).json({ erro: MSG_RATE_LIMIT });
    }

    return res.status(200).json(respostaGenerica);
  } catch (err) {
    console.error('[AUTH] Erro ao enviar redefinição:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/redefinir-senha ───────────────────────────────
// O front recebe o access_token de recuperação no hash da URL (#access_token=...)
// e o reenvia aqui junto com a nova senha.
export async function redefinirSenha(req, res) {
  const { accessToken, novaSenha } = req.body;

  if (!accessToken || !novaSenha)
    return res.status(400).json({ erro: 'Campos obrigatórios: accessToken, novaSenha.' });

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
    console.error('[AUTH] Erro ao redefinir senha:', err.response?.data?.msg || err.message);

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
      select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true },
    });

    if (!usuario)
      return res.status(404).json({ erro: 'Perfil do usuário não encontrado.' });

    return res.status(200).json({
      usuario: {
        id:         usuario.pk_id_usuario,
        nome:       usuario.nome_usuario,
        authUserId: usuario.auth_user_id,
        email:      req.usuario.email,
      },
    });
  } catch (err) {
    console.error('[AUTH] Erro ao buscar usuário:', err);
    return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
}
