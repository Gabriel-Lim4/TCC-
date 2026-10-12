import { prisma } from '../config/database.js';
import { resolveDateRange } from './dateRange.js';
import { latestMetrics } from './metricsSummary.js';
import { aggregateValues, metricChanges } from './analyticsMath.js';
import { buildVerdict } from './verdictService.js';
import { explainCostChange } from './changeExplainer.js';

const dateKey = value => new Date(value).toISOString().slice(0, 10);
const accountCurrency = campaign => campaign.conta.currency || 'UNKNOWN';

export async function getAnalytics(userId, query = {}) {
  const period = resolveDateRange(query);
  const allCampaigns = await prisma.campanhas.findMany({
    where: { conta: { fk_id_usuario: userId, ...(query.platform && query.platform !== 'all' ? { plataforma: query.platform } : {}) } },
    include: { conta: { select: { plataforma: true, currency: true, account_id: true, account_name: true } } },
    orderBy: { nome_campanha: 'asc' },
  });
  if (query.campaignId && !allCampaigns.some(campaign => campaign.pk_id_campanha === Number(query.campaignId))) {
    throw Object.assign(new Error('Campanha não encontrada.'), { statusCode: 404 });
  }
  const currencies = [...new Set(allCampaigns.map(accountCurrency))].sort();
  const target = allCampaigns.find(campaign => campaign.pk_id_campanha === Number(query.campaignId));
  const currency = query.currency || (target ? accountCurrency(target) : currencies.includes('BRL') ? 'BRL' : currencies[0]) || 'BRL';
  const selected = allCampaigns.filter(campaign => accountCurrency(campaign) === currency && (!query.campaignId || campaign.pk_id_campanha === Number(query.campaignId)));
  const rows = selected.length ? await prisma.campaign_daily_metrics.findMany({
    where: { campaign_id: { in: selected.map(campaign => campaign.pk_id_campanha) }, date: { gte: new Date(`${period.previousSince}T00:00:00Z`), lte: new Date(`${period.until}T00:00:00Z`) } },
    orderBy: { date: 'asc' },
  }) : [];
  const current = rows.filter(row => dateKey(row.date) >= period.since);
  const previous = rows.filter(row => dateKey(row.date) <= period.previousUntil);
  const warnings = [];
  let source = current.length ? 'daily' : 'empty';
  let snapshots = [];
  if (!current.length && selected.length && !period.period.startsWith('custom:')) {
    snapshots = latestMetrics(await prisma.metricas.findMany({
      where: { fk_id_campanha: { in: selected.map(campaign => campaign.pk_id_campanha) }, periodo_metrica: period.period },
      orderBy: [{ coletado_em: 'desc' }, { pk_id_metrica: 'desc' }],
    }));
    if (snapshots.length) {
      source = 'snapshot';
      warnings.push('Resumo anterior disponível. Sincronize o período para obter o histórico diário e a comparação.');
    }
  }
  const campaigns = selected.map(campaign => {
    const daily = current.filter(row => row.campaign_id === campaign.pk_id_campanha);
    const historical = previous.filter(row => row.campaign_id === campaign.pk_id_campanha);
    const legacy = snapshots.filter(row => row.fk_id_campanha === campaign.pk_id_campanha);
    const values = source === 'snapshot' && legacy.length ? [Object.fromEntries(legacy.map(row => [row.tipo_metrica, Number(row.valor_metrica)]))] : daily.map(row => row.values);
    return { id: campaign.pk_id_campanha, externalId: campaign.id_externo, name: campaign.nome_campanha,
      platform: campaign.conta.plataforma, status: campaign.status_campanha, currency,
      lastSyncedAt: campaign.sincronizado_em,
      metrics: aggregateValues(values), previousMetrics: historical.length ? aggregateValues(historical.map(row => row.values)) : null,
      hasData: values.length > 0, complete: daily.length === period.days,
    };
  });
  const totals = aggregateValues(source === 'snapshot' ? campaigns.filter(campaign => campaign.hasData).map(campaign => campaign.metrics) : current.map(row => row.values));
  const currentComplete = selected.length > 0 && current.length === selected.length * period.days;
  const previousComplete = selected.length > 0 && previous.length === selected.length * period.days;
  const previousTotals = previousComplete ? aggregateValues(previous.map(row => row.values)) : null;
  if (source === 'daily' && !currentComplete) warnings.push('Coleta parcial: nem todas as campanhas têm dados para todos os dias. Sincronize antes de avaliar os totais.');
  const daily = [];
  if (source === 'daily') {
    for (let date = new Date(`${period.since}T00:00:00Z`); date <= new Date(`${period.until}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) {
      const key = dateKey(date);
      const records = current.filter(row => dateKey(row.date) === key);
      daily.push({ date: key, hasData: records.length > 0, complete: records.length === selected.length, ...aggregateValues(records.map(row => row.values)) });
    }
    if (daily.some(day => !day.hasData)) warnings.push('Existem dias sem coleta. Sincronize o período; lacunas no gráfico não significam resultado zero.');
    if (!previousTotals) warnings.push('O período anterior ainda não possui dados para comparação.');
  }
  if (currencies.length > 1) warnings.push('Contas em moedas diferentes são exibidas separadamente. Selecione a moeda desejada.');
  if (currency === 'UNKNOWN') warnings.push('A moeda desta conta ainda não foi identificada. Sincronize a integração antes de interpretar valores monetários.');
  if (totals.revenue != null) warnings.push('Valor de conversões e ROAS seguem a atribuição configurada na plataforma; não representam lucro líquido.');
  const platforms = [...new Set(campaigns.map(campaign => campaign.platform))].map(platform => ({
    platform, metrics: aggregateValues(campaigns.filter(campaign => campaign.platform === platform && campaign.hasData).map(campaign => campaign.metrics)),
  }));
  const user = await prisma.usuarios.findUnique({ where: { pk_id_usuario: userId }, select: { preferences: true } });
  const settings = user?.preferences?.alerts || {};
  const alerts = [];
  for (const campaign of campaigns.filter(campaign => campaign.hasData)) {
    const { metrics } = campaign;
    if (Number(settings.ctrMin) > 0 && metrics.impressions >= 100 && metrics.ctr < Number(settings.ctrMin)) alerts.push({ campaignId: campaign.id, campaign: campaign.name, type: 'ctr', message: `CTR de ${metrics.ctr.toFixed(2)}% abaixo da meta de ${Number(settings.ctrMin).toFixed(2)}%.` });
    if (Number(settings.cpaMax) > 0 && metrics.cpa != null && metrics.cpa > Number(settings.cpaMax)) alerts.push({ campaignId: campaign.id, campaign: campaign.name, type: 'cpa', message: `CPA acima do limite de ${settings.cpaMax} ${currency}.` });
    if (Number(settings.budgetMax) > 0 && metrics.spend > Number(settings.budgetMax)) alerts.push({ campaignId: campaign.id, campaign: campaign.name, type: 'budget', message: `Investimento do período ultrapassou ${settings.budgetMax} ${currency}.` });
  }
  const timestamps = campaigns.map(campaign => campaign.lastSyncedAt).filter(Boolean).map(value => new Date(value).getTime());
  const result = { period, currency, currencies, totals, previousTotals, changes: previousTotals ? metricChanges(totals, previousTotals) : {},
    campaigns, daily, platforms, warnings, alerts, alertSettings: settings,
    availableCampaigns: allCampaigns.filter(campaign => accountCurrency(campaign) === currency).map(campaign => ({ id: campaign.pk_id_campanha, name: campaign.nome_campanha, platform: campaign.conta.plataforma })),
    source, currentComplete, previousComplete, hasData: campaigns.some(campaign => campaign.hasData), lastSyncedAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  };
  // O veredito é um resumo opcional: se falhar, o restante da resposta continua válido.
  let verdict = null;
  try { verdict = buildVerdict(result); } catch { verdict = null; }
  // Idem para "por que mudou?": só existe com os dois períodos completos e fatores medidos.
  let changeExplanation = null;
  try {
    if (verdict && currentComplete && previousComplete) changeExplanation = explainCostChange(totals, previousTotals, verdict.indicator);
  } catch { changeExplanation = null; }
  return { ...result, verdict, changeExplanation };
}
