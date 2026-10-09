import { parseDate } from './dateRange.js';
import { prisma } from '../config/database.js';

export async function saveMetrics(campaignId, period, insights) {
  const values = Object.entries(insights)
    .filter(([type, value]) => !['date_start', 'date_stop'].includes(type) && Number.isFinite(Number(value)));
  await prisma.$transaction(async tx => {
    // Updating the campaign serializes concurrent syncs for the same campaign.
    await tx.campanhas.update({ where: { pk_id_campanha: campaignId }, data: { sincronizado_em: new Date() } });
    const collectedAt = new Date();
    for (const [type, value] of values) {
      const previous = await tx.metricas.findFirst({
        where: { fk_id_campanha: campaignId, periodo_metrica: period, tipo_metrica: type },
        orderBy: [{ coletado_em: 'desc' }, { pk_id_metrica: 'desc' }],
        select: { pk_id_metrica: true },
      });
      const data = { valor_metrica: Number(value), coletado_em: collectedAt };
      if (previous) {
        await tx.metricas.update({ where: { pk_id_metrica: previous.pk_id_metrica }, data });
      } else {
        await tx.metricas.create({ data: { ...data, fk_id_campanha: campaignId, periodo_metrica: period, tipo_metrica: type } });
      }
    }
  }, { maxWait: 10000, timeout: 15000 });
}

export async function saveDailyMetrics(campaignId, rows, { since, until }) {
  const start = parseDate(since);
  const end = parseDate(until);
  if (start > end) throw new Error('Intervalo de sincronização inválido.');
  const byDate = new Map();
  for (const row of rows) {
    const date = parseDate(row.date);
    if (!Number.isFinite(date.getTime()) || date < start || date > end) throw new Error('Data da métrica fora do período sincronizado.');
    const values = {};
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'date' && value != null && Number.isFinite(Number(value))) values[key] = Number(value);
    }
    if (byDate.has(row.date)) throw new Error('A API retornou mais de um total para o mesmo dia e campanha.');
    byDate.set(row.date, { campaign_id: campaignId, date, values, synced_at: new Date() });
  }
  // A complete API response with no row for a day means no activity, not missing collection.
  for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, { campaign_id: campaignId, date: new Date(date), values: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }, synced_at: new Date() });
  }
  await prisma.$transaction(async tx => {
    await tx.campanhas.update({ where: { pk_id_campanha: campaignId }, data: { sincronizado_em: new Date() } });
    await tx.campaign_daily_metrics.deleteMany({ where: { campaign_id: campaignId, date: { gte: start, lte: end } } });
    if (byDate.size) await tx.campaign_daily_metrics.createMany({ data: [...byDate.values()] });
  }, { maxWait: 10000, timeout: 20000 });
}
