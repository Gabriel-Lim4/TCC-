// ─────────────────────────────────────────────────────────────
// config/env.js — configuração central do projeto
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

export default {
  app: {
    port:    process.env.PORT     || 3333,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  meta: {
    appId:       process.env.META_APP_ID,
    appSecret:   process.env.META_APP_SECRET,
    redirectUri: process.env.META_REDIRECT_URI,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
};
