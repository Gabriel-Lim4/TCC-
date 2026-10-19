import { prisma } from '../config/database.js';
import { getAnalytics } from '../services/analyticsService.js';
import { resolveDateRange } from '../services/dateRange.js';
import { csvCell } from '../services/analyticsMath.js';
import { syncMetaAccount, syncGoogleAccount } from '../services/platformSyncService.js';
import { analyzeSyncedCampaigns } from '../services/aiWorkflow.js';
import { analyticsQuerySchema, alertSettingsSchema } from '../validators/metricasValidator.js';

const syncing = new Set();
const parse = input => {
  const result = analyticsQuerySchema.safeParse(input);
  if (!result.success) throw Object.assign(new Error('Filtros inválidos. Verifique as datas e a campanha.'), { statusCode: 400 });
  return result.data;
};
const fail = (res, error) => res.status(error.statusCode || 500).json({ erro: error.statusCode ? error.message : 'Não foi possível carregar os dados. Tente novamente.' });

export async function analytics(req, res) {
  try { return res.json(await getAnalytics(req.usuario.id, parse(req.query))); }
  catch (error) { return fail(res, error); }
}

export async function syncAnalytics(req, res) {
  const userId = req.usuario.id;
  if (syncing.has(userId)) return res.status(409).json({ erro: 'Já existe uma sincronização em andamento. Aguarde.' });
  let ownsLock = false;
  try {
    const query = parse(req.body || {});
    const range = resolveDateRange(query);
    syncing.add(userId);
    ownsLock = true;
    const accounts = await prisma.contas_vinculadas.findMany({
      where: { fk_id_usuario: userId, ...(query.platform !== 'all' ? { plataforma: query.platform } : {}) }, select: { plataforma: true },
    });
    if (!accounts.length) return res.status(400).json({ erro: 'Conecte uma conta de anúncios antes de sincronizar.' });
    const results = [];
    for (const account of accounts) {
      try {
        const sync = account.plataforma === 'meta' ? syncMetaAccount : syncGoogleAccount;
        const result = await sync(userId, { ...range, since: range.previousSince });
        results.push({ platform: account.plataforma, success: true, ...result });
      } catch (error) {
        const reconnect = error.code === 'RECONNECT_REQUIRED' || error.code === 'TOKEN_DECRYPT_FAILED' || error.response?.status === 401;
        results.push({ platform: account.plataforma, success: false, error: reconnect ? 'Reconecte sua conta para continuar.' : 'Não foi possível sincronizar esta plataforma. Confira a conexão e tente novamente.' });
      }
    }
    const campaignIds = results.filter(result => result.success).flatMap(result => result.campaignIds || []);
    if (campaignIds.length) {
      void analyzeSyncedCampaigns(userId, campaignIds, range.period).catch(() => console.error('[IA] Análise automática indisponível após sincronização.'));
    }
    return res.status(results.some(result => result.success) ? 200 : 502).json({
      mensagem: results.every(result => result.success) ? 'Período atual e anterior sincronizados.' : 'Confira o resultado de cada plataforma.',
      results, syncedAt: new Date().toISOString(),
    });
  } catch (error) { return fail(res, error); }
  finally { if (ownsLock) syncing.delete(userId); }
}

export async function exportAnalytics(req, res) {
  try {
    const result = await getAnalytics(req.usuario.id, parse(req.query));
    if (!result.hasData) return res.status(404).json({ erro: 'Não há métricas neste período para exportar.' });
    const columns = ['Campanha', 'Plataforma', 'Moeda', 'Início', 'Fim', 'Impressões', 'Cliques', 'Investimento', 'CTR (%)', 'CPC', 'CPM', 'Conversões', 'Valor de conversões', 'CPA', 'ROAS'];
    const rows = result.campaigns.filter(campaign => campaign.hasData).map(campaign => {
      const m = campaign.metrics;
      return [campaign.name, campaign.platform, result.currency, result.period.since, result.period.until, m.impressions, m.clicks, m.spend, m.ctr, m.cpc, m.cpm, m.conversions, m.revenue, m.cpa, m.roas];
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="eyesight_${result.period.since}_${result.period.until}.csv"`);
    return res.send('\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n'));
  } catch (error) { return fail(res, error); }
}

export async function saveAlertSettings(req, res) {
  const result = alertSettingsSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: 'Informe limites válidos e não negativos.' });
  try {
    await prisma.$executeRaw`
      UPDATE usuarios
      SET preferences = COALESCE(preferences, '{}'::jsonb) || jsonb_build_object('alerts', ${JSON.stringify(result.data)}::text::jsonb)
      WHERE pk_id_usuario = ${req.usuario.id}`;
    return res.json({ mensagem: 'Limites salvos. Os alertas aparecem no painel ao consultar as métricas.', alerts: result.data });
  } catch (error) { return fail(res, error); }
}
