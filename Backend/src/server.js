// ─────────────────────────────────────────────────────────────
// server.js — ponto de entrada da aplicação
//
// Ordem de imports importa:
//   1. env.js primeiro — carrega o .env antes de tudo
//   2. database.js — usa as variáveis carregadas pelo env
//   3. Express e middlewares
//   4. Rotas
//
// Por que env precisa ser o primeiro import?
// Em ESM, os imports são resolvidos em ordem estática antes
// de qualquer código executar. Mas o "import 'dotenv/config'"
// dentro do env.js executa ao ser importado, garantindo que
// process.env está populado antes dos outros módulos lerem dele.
// ─────────────────────────────────────────────────────────────

import env                from './config/env.js';
import express            from 'express';
import cors               from 'cors';
import { testConnection } from './config/database.js';

// Rotas
import authRoutes         from './routes/authRoutes.js';
// import metricasRoutes  from './routes/metricasRoutes.js'; // ativa quando implementar
// import iaRoutes        from './routes/iaRoutes.js';       // ativa quando implementar

const app = express();

// ── Middlewares globais ──────────────────────────────────────
// cors() — permite que o frontend (origem diferente) acesse a API.
// Em desenvolvimento, '*' está ok.
// Em produção, restrinja: { origin: 'https://seudominio.com' }
app.use(cors());

// express.json() — faz o parse do body das requisições com
// Content-Type: application/json. Sem isso, req.body é undefined.
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────
app.use('/auth', authRoutes);
// app.use('/metricas', metricasRoutes);
// app.use('/analisar', iaRoutes);

// ── Health check ─────────────────────────────────────────────
// Rota simples para verificar se o servidor está vivo.
// Útil para monitoramento e para o Railway saber que o deploy deu certo.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env:    env.app.nodeEnv,
    hora:   new Date().toISOString(),
  });
});

// ── 404 — rota não encontrada ────────────────────────────────
// Este middleware SÓ é executado se nenhuma rota acima respondeu.
// No Express, a ordem dos middlewares define quem responde primeiro.
app.use((req, res) => {
  res.status(404).json({ erro: `Rota '${req.path}' não encontrada.` });
});

// ── Inicialização ─────────────────────────────────────────────
// Async para aguardar a conexão com o banco antes de abrir
// o servidor para requisições. Se o banco falhar, process.exit(1)
// é chamado dentro de testConnection() e o servidor não sobe.
async function start() {
  await testConnection();

  app.listen(env.app.port, () => {
    console.log(`[SERVER] ✅ Rodando em http://localhost:${env.app.port} [${env.app.nodeEnv}]`);
    console.log(`[SERVER]    POST /auth/cadastro`);
    console.log(`[SERVER]    POST /auth/login`);
    console.log(`[SERVER]    GET  /auth/me`);
    console.log(`[SERVER]    GET  /health`);
  });
}

start();
