// ─────────────────────────────────────────────────────────────
// middlewares/authMiddleware.js
//
// Valida o token do Supabase Auth e injeta req.usuario
// para os controllers.
//
// Fluxo:
//   Bearer Token
//        ↓
//   Supabase Auth
//        ↓
//   auth.users.id
//        ↓
//   public.usuarios.auth_user_id
//        ↓
//   req.usuario
// ─────────────────────────────────────────────────────────────

import { prisma } from '../config/database.js';
import { supabase } from '../config/supabase.js';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      erro: 'Token não fornecido. Faça login para continuar.'
    });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({
      erro: 'Token não fornecido. Faça login para continuar.'
    });
  }

  try {
    // Valida o token diretamente pelo Supabase Auth.
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error?.status >= 500 || error?.name === 'AuthRetryableFetchError') {
      return res.status(503).json({ erro: 'Autenticação temporariamente indisponível. Tente novamente.' });
    }
    if (error || !user) {
      return res.status(401).json({
        erro: 'Token inválido ou expirado.'
      });
    }

    // Confirma que o perfil correspondente ainda existe
    // na tabela pública de usuários.
    const selecao = { pk_id_usuario: true, nome_usuario: true, auth_user_id: true };
    let usuario = await prisma.usuarios.findUnique({
      where: {
        auth_user_id: user.id
      },
      select: selecao
    });

    // Se o perfil não foi criado no cadastro (falha passageira do banco), cria agora para a conta não ficar inutilizável.
    if (!usuario) {
      const nome = String(user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário').trim().slice(0, 100);
      try {
        usuario = await prisma.usuarios.create({ data: { nome_usuario: nome, auth_user_id: user.id }, select: selecao });
      } catch (err) {
        if (err.code !== 'P2002') throw err;
        usuario = await prisma.usuarios.findUnique({ where: { auth_user_id: user.id }, select: selecao });
      }
    }

    if (!usuario) {
      return res.status(401).json({
        erro: 'Perfil do usuário não encontrado.'
      });
    }

    // Injeta o usuário autenticado na requisição.
   req.usuario = {
  id: usuario.pk_id_usuario,
  nome: usuario.nome_usuario,
  email: user.email,
  auth_user_id: usuario.auth_user_id
};

    next();

  } catch (err) {
    console.error('[Auth] Falha ao validar sessão.');

    return res.status(500).json({
      erro: 'Erro interno na autenticação. Tente novamente.'
    });
  }
};