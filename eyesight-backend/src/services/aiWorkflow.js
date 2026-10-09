import { prisma } from '../config/database.js';
import { getAnalytics } from './analyticsService.js';
import { aiError, gerarAnalise, compactAnalytics } from './iaService.js';

const busyUsers = new Set();
const usage = new Map();
export async function withAiLimit(userId, action) {
  if (busyUsers.has(userId)) throw aiError('Uma solicitação de IA já está em andamento. Aguarde.', 429);
  const now = Date.now();
  for (const [id, entry] of usage) if (entry.until < now) usage.delete(id);
  const window = usage.get(userId) || { count: 0, until: now + 3600000 };
  if (window.count >= 20) throw aiError('Limite de 20 solicitações de IA por hora atingido. Tente novamente mais tarde.', 429);
  if (!process.env.OPENAI_API_KEY) throw aiError('O assistente ainda não está configurado. O administrador precisa configurar a chave da OpenAI.', 503);
  window.count++; usage.set(userId, window); busyUsers.add(userId);
  try { return await action(); } finally { busyUsers.delete(userId); }
}

export function analysisView(row) {
  return { id: row.pk_id_analise, campanha_id: row.fk_id_campanha,
    nome_campanha: row.campanha?.nome_campanha, texto: row.texto_analise,
    sugestao: row.sugestao_analise, score_desempenho: row.score_desempenho,
    modelo: row.modelo, periodo: row.periodo, data_geracao: row.data_geracao_analise };
}

export async function campaignAnalysis(userId, campaignId, period = 'last_30d') {
  const campaign = await prisma.campanhas.findFirst({ where: { pk_id_campanha: campaignId, conta: { fk_id_usuario: userId } },
    select: { pk_id_campanha: true, nome_campanha: true, objetivo: true } });
  if (!campaign) throw aiError('Campanha não encontrada.', 404);
  const custom = /^custom:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(period);
  const range = custom ? { periodo: 'custom', startDate: custom[1], endDate: custom[2] } : { periodo: period };
  const context = await getAnalytics(userId, { ...range, campaignId });
  if (!context.hasData) throw aiError('Sem métricas neste período. Sincronize a campanha primeiro.', 400);
  const existing = await prisma.analises_ia.findFirst({ where: { fk_id_usuario: userId, fk_id_campanha: campaignId, periodo: period, data_geracao_analise: { gte: new Date(Date.now() - 300000) } }, orderBy: { data_geracao_analise: 'desc' } });
  if (existing) return { ...analysisView(existing), nome_campanha: campaign.nome_campanha, cached: true };
  return withAiLimit(userId, async () => {
    const result = await gerarAnalise({ context: { campaign, ...compactAnalytics(context) } });
    const saved = await prisma.analises_ia.create({ data: { fk_id_usuario: userId, fk_id_campanha: campaignId,
      texto_analise: result.texto, sugestao_analise: result.sugestao, score_desempenho: result.score_desempenho,
      modelo: result.modelo, periodo: period } });
    return { ...analysisView(saved), nome_campanha: campaign.nome_campanha };
  });
}

export async function analyzeSyncedCampaigns(userId, campaignIds, period = 'last_30d') {
  if (process.env.OPENAI_AUTO_ANALYSIS !== 'true' || !process.env.OPENAI_API_KEY) return;
  for (const id of [...new Set(campaignIds)].slice(0, 3)) {
    try {
      const recent = await prisma.analises_ia.findFirst({ where: { fk_id_usuario: userId, fk_id_campanha: id, periodo: period, data_geracao_analise: { gte: new Date(Date.now() - 21600000) } } });
      if (!recent) await campaignAnalysis(userId, id, period);
    } catch { /* Manual analysis remains available after transient background failures. */ }
  }
}
