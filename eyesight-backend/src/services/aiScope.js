// Recorte da tela (período, plataforma, campanha, moeda) enviado ao assistente, validado antes de consultar métricas.
import { resolveDateRange } from './dateRange.js';
import { aiError } from './iaService.js';

const PLATFORMS = ['all', 'meta', 'google'];

export const numericId = value => {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw aiError('Identificador inválido.');
  return Number(value);
};

export function analyticsQuery(body) {
  const query = { periodo: body?.periodo || 'last_30d' };
  for (const key of ['startDate', 'endDate']) {
    if (body?.[key] === undefined) continue;
    if (typeof body[key] !== 'string') throw aiError('Período inválido.');
    query[key] = body[key];
  }
  if (body?.platform !== undefined) {
    if (!PLATFORMS.includes(body.platform)) throw aiError('Plataforma inválida.');
    query.platform = body.platform;
  }
  if (body?.campaignId !== undefined) query.campaignId = String(numericId(body.campaignId));
  if (body?.currency !== undefined) {
    if (typeof body.currency !== 'string' || !/^[A-Z]{3,7}$/.test(body.currency)) throw aiError('Moeda inválida.');
    query.currency = body.currency;
  }
  resolveDateRange(query);
  return query;
}
