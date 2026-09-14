// ─────────────────────────────────────────────────────────────
// controllers/authController.js
// POST /auth/cadastro | POST /auth/login | GET /auth/me
// GET /auth/verificar-email | POST /auth/reenviar-verificacao
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { prisma } from '../config/database.js';
import bcrypt     from 'bcrypt';
import jwt        from 'jsonwebtoken';
import env        from '../config/env.js';
import { enviarEmailVerificacao } from '../services/emailService.js';
import { supabase } from '../config/supabase.js';

const SALT_ROUNDS = 10;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.pk_id_usuario, email: usuario.email_usuario },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function gerarTokenVerificacao() {
  return crypto.randomBytes(32).toString('hex');
}

function calcularExpiracaoToken() {
  const horas = env.emailVerification.expiresInHours;
  return new Date(Date.now() + horas * 60 * 60 * 1000);
}

async function criarOuAtualizarTokenVerificacao(usuario) {
  const tokenVerificacao = gerarTokenVerificacao();
  const tokenExpiraEm    = calcularExpiracaoToken();

  await prisma.usuarios.update({
    where: { pk_id_usuario: usuario.pk_id_usuario },
    data: {
      token_verificacao: tokenVerificacao,
      token_expira_em:   tokenExpiraEm,
    },
  });

  return tokenVerificacao;
}

// ── POST /auth/cadastro ──────────────────────────────────────
export async function cadastro(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: nome, email, senha.'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      erro: 'Formato de email inválido.'
    });
  }

  if (senha.length < 6) {
    return res.status(400).json({
      erro: 'A senha deve ter no mínimo 6 caracteres.'
    });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome
        }
      }
    });

    if (error) {
      console.error('[AUTH] Erro no cadastro Supabase:', error.message);

      if (error.message.toLowerCase().includes('already registered')) {
        return res.status(409).json({
          erro: 'Este email já está cadastrado.'
        });
      }

      return res.status(400).json({
        erro: error.message
      });
    }

    return res.status(201).json({
      mensagem: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.',
      requerVerificacao: true,
      usuario: {
        id: data.user?.id,
        nome,
        email: data.user?.email
      }
    });

  } catch (err) {
    console.error('[AUTH] Erro no cadastro:', err.message);

    return res.status(500).json({
      erro: 'Erro interno no servidor.'
    });
  }
}

// ── POST /auth/login ─────────────────────────────────────// ── POST /auth/login ─────────────────────────────────────────
export async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: email, senha.'
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      console.error('[AUTH] Erro no login Supabase:', error.message);

      return res.status(401).json({
        erro: 'Email ou senha inválidos.'
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({
        erro: 'Não foi possível iniciar a sessão.'
      });
    }

    // Busca o perfil correspondente na tabela public.usuarios
    const usuario = await prisma.usuarios.findUnique({
      where: {
        auth_user_id: data.user.id,
      },
      select: {
        pk_id_usuario: true,
        nome_usuario: true,
        auth_user_id: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        erro: 'Perfil do usuário não encontrado.'
      });
    }

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token: data.session.access_token,
      usuario: {
        id: usuario.pk_id_usuario,
        nome: usuario.nome_usuario,
        email: data.user.email,
      },
    });

  } catch (err) {
    console.error('[AUTH] Erro no login:', err.message);

    return res.status(500).json({
      erro: 'Erro interno no servidor.'
    });
  }
}

// ── GET /auth/verificar-email ────────────────────────────────
export async function verificarEmail(req, res) {
  const { token } = req.query;

  if (!token)
    return res.status(400).json({ erro: 'Token de verificação ausente.' });

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { token_verificacao: String(token) },
    });

    if (!usuario)
      return res.status(400).json({ erro: 'Token inválido ou já utilizado.' });

    if (usuario.email_verificado) {
      return res.status(200).json({ mensagem: 'E-mail já confirmado. Você já pode entrar.' });
    }

    if (!usuario.token_expira_em || usuario.token_expira_em < new Date()) {
      return res.status(400).json({
        erro: 'Token expirado. Solicite um novo e-mail de confirmação.',
        tokenExpirado: true,
        email: usuario.email_usuario,
      });
    }

    await prisma.usuarios.update({
      where: { pk_id_usuario: usuario.pk_id_usuario },
      data: {
        email_verificado:  true,
        token_verificacao: null,
        token_expira_em:   null,
      },
    });

    return res.status(200).json({ mensagem: 'E-mail confirmado com sucesso. Você já pode entrar.' });
  } catch (err) {
    console.error('[AUTH] Erro na verificação de e-mail:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/reenviar-verificacao ──────────────────────────
export async function reenviarVerificacao(req, res) {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ erro: 'Informe o e-mail para reenviar a confirmação.' });

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { email_usuario: email } });

    // Resposta genérica para evitar enumeração de usuários
    const respostaGenerica = {
      mensagem: 'Se o e-mail estiver cadastrado e pendente, enviamos um novo link de confirmação.',
    };

    if (!usuario || usuario.email_verificado)
      return res.status(200).json(respostaGenerica);

    const tokenVerificacao = await criarOuAtualizarTokenVerificacao(usuario);

    await enviarEmailVerificacao({
      email: usuario.email_usuario,
      nome:  usuario.nome_usuario,
      token: tokenVerificacao,
    });

    return res.status(200).json(respostaGenerica);
  } catch (err) {
    console.error('[AUTH] Erro ao reenviar verificação:', err.message);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── GET /auth/me ─────────────────────────────────────────────
// ── GET /auth/me ─────────────────────────────────────────────

export async function me(req, res) {

  try {

    const usuario = await prisma.usuarios.findUnique({

      where: {
        auth_user_id: req.usuario.auth_user_id
      },

      select: {
        pk_id_usuario: true,
        nome_usuario: true,
        auth_user_id: true
      },

    });

    if (!usuario) {
      return res.status(404).json({
        erro: 'Perfil do usuário não encontrado.'
      });
    }

    return res.status(200).json({

      usuario: {
        id: usuario.pk_id_usuario,
        nome: usuario.nome_usuario,
        authUserId: usuario.auth_user_id,
        email: req.usuario.email
      }

    });

  } catch (err) {

    console.error('[AUTH] Erro ao buscar usuário:', err);

    return res.status(500).json({
      erro: 'Erro ao buscar usuário.'
    });

  }

}