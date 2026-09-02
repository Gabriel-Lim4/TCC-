// ─────────────────────────────────────────────────────────────
// middlewares/authMiddleware.js
//
// Valida o JWT e injeta req.usuario para os controllers.
// Try/catch duplo:
//   - Interno: erros esperados do JWT (expirado, inválido)
//   - Externo: erros inesperados (banco fora, bug do Prisma)
// ─────────────────────────────────────────────────────────────

import jwt        from 'jsonwebtoken';
import env        from '../config/env.js';
import { prisma } from '../config/database.js';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login para continuar.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Try interno: só erros do JWT
    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (jwtErr) {
      const mensagem = jwtErr.name === 'TokenExpiredError'
        ? 'Token expirado. Faça login novamente.'
        : 'Token inválido.';
      return res.status(401).json({ erro: mensagem });
    }

    // Confirma que o usuário ainda existe no banco
    // (cobre caso de conta deletada com token ainda válido)
    const usuario = await prisma.usuarios.findUnique({
      where:  { pk_id_usuario: payload.id },
      select: {
        pk_id_usuario: true,
        nome_usuario:  true,
        email_usuario: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado. Token inválido.' });
    }

    // Injeta na req para os controllers usarem sem decodificar o token de novo
    req.usuario = {
      id:    usuario.pk_id_usuario,
      nome:  usuario.nome_usuario,
      email: usuario.email_usuario,
    };

    next();

  } catch (err) {
    // Erro inesperado — não expõe detalhes ao cliente
    console.error('[AUTH MIDDLEWARE] Erro inesperado:', err);
    return res.status(500).json({ erro: 'Erro interno na autenticação. Tente novamente.' });
  }
};
