const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Testa a conexão com o banco ao iniciar o servidor ─────────
async function testConnection() {
    try {
        await prisma.$connect();
        console.log('[DATABASE]  Conectado ao MySQL com sucesso.');
    } catch (err) {
        console.error('[DATABASE]  Falha na conexão:', err.message);
        process.exit(1); // Encerra o servidor se o banco não conectar
    }
}

module.exports = { prisma, testConnection };