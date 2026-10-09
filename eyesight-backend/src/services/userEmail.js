import { prisma } from '../config/database.js';

// O e-mail fica no Supabase Auth (auth.users), não em `usuarios`; é lido na hora do envio para nunca ficar desatualizado.
export async function findUserEmail(authUserId) {
  if (!authUserId) return null;
  const rows = await prisma.$queryRaw`SELECT email FROM auth.users WHERE id = ${authUserId}::uuid`;
  return rows[0]?.email ?? null;
}
