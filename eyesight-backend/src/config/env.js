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
    redirectUri: process.env.META_REDIRECT_URI?.trim(),
    graphVersion: process.env.META_GRAPH_VERSION || 'v25.0',
  },
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  databaseUrl: process.env.DATABASE_URL,

  supabase: {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
},

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from:   process.env.EMAIL_FROM || 'Eyesight <onboarding@resend.dev>',
  },
  emailVerification: {
    expiresInHours: Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || 24),
  },
};
