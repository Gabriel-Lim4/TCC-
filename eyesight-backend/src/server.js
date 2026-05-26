const env = require('./config/env');

const express            = require('express');
const cors               = require('cors'); // <-- 1. Importe o CORS aqui
const { testConnection } = require('./config/database');

// ── Rotas ──────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
// Futuras rotas 
// const metricasRoutes = require('./routes/metricasRoutes');
// const iaRoutes       = require('./routes/iaRoutes');

const app = express();

// ── Middlewares globais ────────────────────────────────────────
app.use(cors()); // <--ativa o cors
app.use(express.json());

// ── Registro das rotas ─────────────────────────────────────────
app.use('/auth', authRoutes);
// app.use('/metricas', metricasRoutes);
// app.use('/analisar', iaRoutes);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        env:    env.app.nodeEnv,
        hora:   new Date().toISOString(),
    });
});

// ── Rota não encontrada ────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ erro: `Rota '${req.path}' não encontrada.` });
});

// ── Inicialização ──────────────────────────────────────────────
async function start() {
    await testConnection();

    app.listen(env.app.port, () => {
        console.log(`[SERVER] ✅ Rodando em http://localhost:${env.app.port} [${env.app.nodeEnv}]`);
        console.log(`[SERVER]    Rotas disponíveis:`);
        console.log(`[SERVER]    POST /auth/cadastro`);
        console.log(`[SERVER]    POST /auth/login`);
        console.log(`[SERVER]    GET  /auth/me`);
        console.log(`[SERVER]    GET  /health`);
    });
}

start();