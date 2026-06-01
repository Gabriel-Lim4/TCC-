// ─────────────────────────────────────────────────────────────
// config/database.js
//
// Instância única do PrismaClient — exportada e reutilizada
// em todo o projeto.
//
// Por que uma instância única?
// O PrismaClient abre um pool de conexões com o banco.
// Se cada arquivo criasse seu próprio "new PrismaClient()",
// você teria múltiplos pools abertos simultaneamente,
// consumindo conexões desnecessariamente e podendo esgotar
// o limite do banco (Railway tem limite de conexões).
//
// Padrão: cria uma vez aqui, importa { prisma } onde precisar.
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// ── Testa a conexão ao iniciar o servidor ────────────────────
// $connect() força o Prisma a abrir a conexão imediatamente.
// Sem isso, ele só conectaria na primeira query — e um erro
// de banco só apareceria quando um usuário tentasse fazer login.
// Melhor falhar rápido na inicialização do que na produção.
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('[DATABASE]  Conectado ao MySQL com sucesso.');
  } catch (err) {
    console.error('[DATABASE]  Falha na conexão:', err.message);
    // process.exit(1) encerra o processo Node com código de erro.
    // Isso faz com que o Railway (ou qualquer orquestrador) saiba
    // que o serviço falhou e pode reiniciar automaticamente.
    process.exit(1);
  }
}
