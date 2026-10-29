// ─────────────────────────────────────────────────────────────
// server.js — ponto de entrada da aplicação
// ─────────────────────────────────────────────────────────────

import env            from './config/env.js';
import express        from 'express';
import cors           from 'cors';
import { corsOptions } from './config/cors.js';
import helmet         from 'helmet';
import { testConnection } from './config/database.js';
import { health } from './controllers/healthController.js';
import errorHandler, { notFoundHandler } from './error/error.js';
import authRoutes     from './routes/authRoutes.js';
import metaRoutes     from './routes/metaRoutes.js';
import googleRoutes   from './routes/googleRoutes.js';
import metricasRoutes from './routes/metricasRoutes.js';
import iaRoutes       from './routes/iaRoutes.js';
import jobsRoutes     from './routes/jobsRoutes.js';
import resumoRoutes   from './routes/resumoRoutes.js';
import instagramRoutes from './routes/instagramRoutes.js';
import { mountFront } from './staticFront.js';
import { assertTokenEncryption } from './services/tokenVault.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
// Render terminates connections at its reverse proxy. Trust only the nearest hop,
// never arbitrary client-supplied forwarding chains. Local deployments remain direct.
if (process.env.RENDER === 'true') app.set('trust proxy', 1);

app.use(cors(corsOptions()));
// Pasta do site compilado (frontend/dist). Em produção o mesmo serviço entrega site e API.
const FRONT_DIR = process.env.FRONT_DIST || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
// CSP do site: fontes do Google, estilos inline do React e animações Lottie (blob/data). Tudo o mais só do próprio domínio.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", "'wasm-unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'", 'data:', 'blob:'],
      'worker-src': ["'self'", 'blob:'],
    },
  },
}));
app.use(express.json());

app.use('/auth',       authRoutes);
app.use('/meta',       metaRoutes);
app.use('/google',     googleRoutes);
app.use('/instagram',  instagramRoutes);
app.use('/metricas',   metricasRoutes);
app.use('/ia',         iaRoutes);
app.use('/jobs',       jobsRoutes);
app.use('/resumo',     resumoRoutes);

// Health check also reaches PostgreSQL for the scheduled keepalive.
app.get('/health', health);

// Site (frontend/dist) servido pelo mesmo serviço, quando existir
const servesFront = mountFront(app, FRONT_DIR);

// 404 — rota não encontrada
app.use(notFoundHandler);

// Middleware de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

async function start() {
  await testConnection();
  assertTokenEncryption(env.app.nodeEnv);
  app.listen(env.app.port, () => {
    console.log(`\n[SERVER] ✅ Rodando em http://localhost:${env.app.port} [${env.app.nodeEnv}]`);
    console.log('[SERVER]    POST   /auth/cadastro');
    console.log('[SERVER]    POST   /auth/login');
    console.log('[SERVER]    POST   /auth/esqueci-senha');
    console.log('[SERVER]    POST   /auth/redefinir-senha');
    console.log('[SERVER]    POST   /auth/reenviar-verificacao');
    console.log('[SERVER]    GET    /auth/me');
    console.log('[SERVER]    PUT    /auth/me');
    console.log('[SERVER]    GET    /meta/conectar');
    console.log('[SERVER]    GET    /meta/callback     ← pública');
    console.log('[SERVER]    GET    /meta/status');
    console.log('[SERVER]    GET    /meta/campanhas');
    console.log('[SERVER]    GET    /meta/campanhas/:id/insights');
    console.log('[SERVER]    DELETE /meta/desconectar');
    console.log('[SERVER]    GET    /metricas/campanhas');
    console.log('[SERVER]    GET    /metricas/campanhas/:id');
    console.log('[SERVER]    GET    /metricas/geral');
    console.log('[SERVER]    GET    /metricas/exportar');
    console.log('[SERVER]    POST   /ia/analisar/:campanhaId');
    console.log('[SERVER]    GET    /ia/analises');
    console.log('[SERVER]    GET    /ia/analises/:id');
    console.log('[SERVER]    DELETE /ia/analises/:id');
    console.log('[SERVER]    GET    /health');
    console.log(servesFront ? `[SERVER]    Site: servindo ${FRONT_DIR}\n` : '[SERVER]    Site: frontend/dist não encontrado (modo só API)\n');
  });
}

start();
