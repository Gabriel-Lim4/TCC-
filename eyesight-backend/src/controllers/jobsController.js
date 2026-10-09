import crypto from 'node:crypto';
import env from '../config/env.js';
import { runDailyRoutine } from '../services/dailyRoutine.js';

let running = false;

// Compara os hashes para que valores de tamanhos diferentes também levem tempo constante.
const sameSecret = (given, expected) => {
  const hash = value => crypto.createHash('sha256').update(String(value)).digest();
  return crypto.timingSafeEqual(hash(given), hash(expected));
};

export async function runDaily(req, res) {
  if (!env.jobsSecret) return res.status(503).json({ erro: 'A rotina diária não está configurada.' });
  const [scheme, token = ''] = String(req.headers?.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !sameSecret(token, env.jobsSecret)) return res.status(401).json({ erro: 'Não autorizado.' });
  if (running) return res.status(409).json({ erro: 'Já existe uma rodada em andamento.' });
  running = true;
  runDailyRoutine()
    .catch(err => console.error('[JOB] rotina falhou', err?.name))
    .finally(() => { running = false; });
  return res.status(202).json({ iniciado: true });
}
