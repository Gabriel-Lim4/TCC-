// Criptografia em repouso dos tokens das contas de anúncio (AES-256-GCM).
// - Sem TOKEN_ENCRYPTION_KEY, nada muda: os valores continuam em texto (compatível com o que já está no banco).
// - Com a chave, `sealToken` grava `enc:v1:<iv>:<tag>:<texto cifrado>`; `openToken` abre os cifrados e devolve os antigos como estão.
// - Chave de 32 bytes em base64 ou em hexadecimal (64 caracteres). Perder a chave obriga a reconectar as contas.
import crypto from 'node:crypto';

const PREFIX = 'enc:v1:';

const fail = (code, message, status = 500) => Object.assign(new Error(message), { code, status });
// Só vale como "já cifrado" o formato completo: prefixo + iv (12 bytes) + tag (16 bytes) + corpo, todos em base64url.
const SEALED = /^enc:v1:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$/;
const isSealed = value => SEALED.test(String(value));

function readKey() {
  const raw = String(process.env.TOKEN_ENCRYPTION_KEY ?? '').trim();
  if (!raw) return null;
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw fail('TOKEN_KEY_INVALID', 'TOKEN_ENCRYPTION_KEY deve ter 32 bytes (base64) ou 64 caracteres hexadecimais.');
  return key;
}

export const tokenEncryptionEnabled = () => Boolean(readKey());

export function sealToken(value) {
  if (!value || isSealed(value)) return value;
  const key = readKey();
  if (!key) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `${PREFIX}${[iv, cipher.getAuthTag(), body].map(part => part.toString('base64url')).join(':')}`;
}

export function openToken(value) {
  // Qualquer coisa com o prefixo é tratada como cifrada: mal formada falha em vez de seguir como se fosse um token.
  if (!value || !String(value).startsWith(PREFIX)) return value;
  const key = readKey();
  if (!key) throw fail('TOKEN_KEY_MISSING', 'O token está cifrado, mas TOKEN_ENCRYPTION_KEY não está configurada.');
  try {
    const [iv, tag, body] = String(value).slice(PREFIX.length).split(':').map(part => Buffer.from(part, 'base64url'));
    if (iv.length !== 12 || tag.length !== 16) throw new Error('formato');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch {
    throw fail('TOKEN_DECRYPT_FAILED', 'Não foi possível abrir o token salvo. Reconecte a conta.', 409);
  }
}
