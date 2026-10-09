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

export default {
  api: API_RATE_LIMIT,
  strict: STRICT_RATE_LIMIT,
  meta: META_RATE_LIMIT,
};