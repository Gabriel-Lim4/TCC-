// ─────────────────────────────────────────────────────────────
// config/database.js — instância única do PrismaClient
//
// Exportamos uma única instância para todo o projeto.
// Criar múltiplas instâncias abre múltiplos pools de conexão
// e pode esgotar o limite de conexões do Railway.
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Testa a conexão ao subir o servidor.
// Falha rápida: melhor saber que o banco está fora no boot
// do que descobrir quando um usuário tentar fazer login.
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('[DATABASE]  Conectado ao MySQL com sucesso.');
  } catch (err) {
    console.error('[DATABASE]  Falha na conexão:', err.message);
    process.exit(1);
  }
}
