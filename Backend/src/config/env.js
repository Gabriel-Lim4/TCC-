// ─────────────────────────────────────────────────────────────
// config/env.js
//
// Ponto central de configuração do projeto.
// Todos os valores sensíveis vêm do .env — nunca hardcoded.
//
// "import 'dotenv/config'" é o equivalente ESM de:
//   require('dotenv').config()
// Ele lê o .env e injeta as variáveis em process.env.
// Precisa ser importado ANTES de qualquer acesso a process.env,
// por isso fica no primeiro arquivo carregado (server.js importa env.js).
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

  databaseUrl: process.env.DATABASE_URL,
  META_APP_ID=seu_app_id,//colcoar a chave
META_APP_SECRET=seu_app_secret,//colcoar a chave
META_REDIRECT_URI=https //seu-dominio.railway.app/meta/callback
};
