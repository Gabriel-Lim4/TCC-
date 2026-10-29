// ─────────────────────────────────────────────────────────────
// config/cors.js — origens autorizadas a chamar a API pelo navegador
//
// Permitidas: o site (FRONTEND_URL) e as listadas em CORS_ORIGINS (separadas por vírgula).
// Chamadas sem cabeçalho Origin (mesmo domínio, curl, pg_cron) não passam por CORS e seguem normalmente.
// ─────────────────────────────────────────────────────────────

import env from './env.js';

const normalize = origin => String(origin).trim().replace(/\/$/, '');

export function allowedOrigins(config = env, extra = process.env.CORS_ORIGINS) {
  const list = [config.frontendUrl, ...String(extra ?? '').split(',')].map(normalize).filter(Boolean);
  return new Set(list);
}

export function corsOptions(config = env, extra = process.env.CORS_ORIGINS) {
  const allowed = allowedOrigins(config, extra);
  return {
    origin(origin, callback) {
      callback(null, !origin || allowed.has(normalize(origin)));
    },
    maxAge: 600,
  };
}
