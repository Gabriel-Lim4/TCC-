// Token assinado para cancelar o resumo sem login. Contém só o id do usuário e a validade.
import crypto from 'node:crypto';
import env from '../config/env.js';

const VERSION = 'v1';
const TTL_DAYS = 400;
const b64 = value => Buffer.from(value).toString('base64url');
const sign = (secret, userId, exp) => crypto.createHmac('sha256', secret).update(`unsubscribe:${VERSION}:${userId}.${exp}`).digest('base64url');

export function createUnsubscribeToken(userId, { now = new Date(), secret = env.unsubscribeSecret } = {}) {
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET não configurada.');
  const exp = Math.floor(now.getTime() / 1000) + TTL_DAYS * 86400;
  return `${VERSION}.${b64(`${userId}.${exp}`)}.${sign(secret, userId, exp)}`;
}

export function verifyUnsubscribeToken(token, { now = new Date(), secret = env.unsubscribeSecret } = {}) {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
  const match = /^(\d+)\.(\d+)$/.exec(decoded);
  if (!match) return null;
  const [userId, exp] = [Number(match[1]), Number(match[2])];
  if (!Number.isSafeInteger(userId) || userId < 1) return null;
  const expected = Buffer.from(sign(secret, userId, exp));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return exp * 1000 > now.getTime() ? userId : null;
}
