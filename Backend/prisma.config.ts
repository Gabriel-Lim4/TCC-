// ─────────────────────────────────────────────────────────────
// prisma.config.ts
//
// Arquivo de configuração da CLI do Prisma.
// Usado pelos comandos: prisma migrate, prisma generate, etc.
//
// Este arquivo já era ESM (import/export) — agora está em
// harmonia com o resto do projeto.
//
// "import 'dotenv/config'" aqui é necessário porque a CLI do
// Prisma roda em processo separado e não passa pelo server.js.
// Sem isso, process.env.DATABASE_URL seria undefined ao migrar.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
