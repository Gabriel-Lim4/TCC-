// ─────────────────────────────────────────────────────────────
// server.js — ponto de entrada da aplicação
// ─────────────────────────────────────────────────────────────

import env                from './config/env.js';
import express            from 'express';
import cors               from 'cors';
import { testConnection } from './config/database.js';
import authRoutes         from './routes/authRoutes.js';
import metaRoutes         from './routes/metaRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/meta', metaRoutes);

// Health check — usado pelo Railway para saber que o serviço está vivo
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.app.nodeEnv, hora: new Date().toISOString() });
});

// 404 — rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: `Rota '${req.path}' não encontrada.` });
});

async function start() {
  await testConnection();
  app.listen(env.app.port, () => {
    console.log(`\n[SERVER] ✅ Rodando em http://localhost:${env.app.port} [${env.app.nodeEnv}]`);
    console.log('[SERVER]    POST   /auth/cadastro');
    console.log('[SERVER]    POST   /auth/login');
    console.log('[SERVER]    GET    /auth/me');
    console.log('[SERVER]    GET    /meta/conectar');
    console.log('[SERVER]    GET    /meta/callback     ← pública');
    console.log('[SERVER]    GET    /meta/status');
    console.log('[SERVER]    GET    /meta/campanhas');
    console.log('[SERVER]    GET    /meta/campanhas/:id/insights');
    console.log('[SERVER]    DELETE /meta/desconectar');
    console.log('[SERVER]    GET    /health\n');
  });
}

start();
