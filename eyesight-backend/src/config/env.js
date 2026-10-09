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
  jobsSecret: process.env.JOBS_SECRET,
  unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET,
  backendUrl: (process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '') || undefined,
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  databaseUrl: process.env.DATABASE_URL,

  google: {
    clientId:      process.env.GOOGLE_CLIENT_ID,
    clientSecret:  process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:   process.env.GOOGLE_REDIRECT_URI?.trim(),
    developerToken: process.env.GOOGLE_DEVELOPER_TOKEN,
    apiVersion: process.env.GOOGLE_ADS_API_VERSION || 'v23',
    loginCustomerId: process.env.GOOGLE_LOGIN_CUSTOMER_ID,
    customerId: process.env.GOOGLE_CUSTOMER_ID,
  },


  supabase: {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
},

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    autoAnalysis: process.env.OPENAI_AUTO_ANALYSIS === 'true',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from:   process.env.EMAIL_FROM || 'Eyesight <onboarding@resend.dev>',
  },
  emailVerification: {
    expiresInHours: Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || 24),
  },
};
