import { prisma } from '../config/database.js';

export async function health(_req, res) {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', database: 'ok', hora: new Date().toISOString() });
  } catch {
    return res.status(503).json({ status: 'unavailable', database: 'unavailable', hora: new Date().toISOString() });
  }
}
