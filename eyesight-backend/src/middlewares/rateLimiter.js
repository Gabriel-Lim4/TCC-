// ─────────────────────────────────────────────────────────────
// middlewares/rateLimiter.js
//
// Rate limiting centralizado usando express-rate-limit.
// Protege endpoints críticos contra abuso e requisições
// excessivas da API do Meta Graph.
//
// ─────────────────────────────────────────────────────────────

import rateLimit from 'express-rate-limit';

const API_RATE_LIMIT = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP em 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
});

const STRICT_RATE_LIMIT = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // limite mais rigoroso para endpoints sensíveis
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Limite excedido. Tente novamente em 1 hora.' },
});

const META_RATE_LIMIT = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // requisições para endpoints Meta por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Limite de requests Meta excedido. Espere alguns momentos.' },
});

// Login, cadastro e afins: só as tentativas que falham contam. O Supabase limita por IP e, atrás do
// servidor, todos os usuários dividem o mesmo IP; sem freio aqui um cliente abusivo derruba o login de todos.
const AUTH_RATE_LIMIT = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

// Rotas que disparam e-mail (recuperar senha, reenviar confirmação, cadastro).
const EMAIL_RATE_LIMIT = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitos pedidos de e-mail. Tente novamente em 1 hora.' },
});

// Renovação de sessão tem contador próprio para não competir com as consultas do painel.
const REFRESH_RATE_LIMIT = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

export default {
  auth: AUTH_RATE_LIMIT,
  email: EMAIL_RATE_LIMIT,
  refresh: REFRESH_RATE_LIMIT,
  api: API_RATE_LIMIT,
  strict: STRICT_RATE_LIMIT,
  meta: META_RATE_LIMIT,
};