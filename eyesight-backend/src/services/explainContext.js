// Contexto que o painel "Explicar" entrega à IA: veredito, metas e o item em foco.
// Montado no servidor a partir do resultado de getAnalytics; o cliente só diz o que está olhando.
import { z } from 'zod';
import { aiError } from './iaService.js';
import { ACTION_CODES, LIMITS, REASON_CODES } from './verdictService.js';

export const EXPLAIN_MAX_CHARS = 4000;
const MAX_ITEMS = 10;
const CARD_KEYS = ['spend', 'clicks', 'conversions', 'cost'];

const focusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('verdict') }).strict(),
  z.object({ kind: z.literal('card'), key: z.enum(CARD_KEYS) }).strict(),
  z.object({ kind: z.literal('reason'), code: z.enum(REASON_CODES) }).strict(),
  z.object({ kind: z.literal('action'), code: z.enum(ACTION_CODES), campaignId: z.number().int().positive().optional() }).strict(),
]);

export function parseFocus(raw) {
  if (raw === undefined || raw === null) return null;
  const parsed = focusSchema.safeParse(raw);
  if (!parsed.success) throw aiError('Foco da pergunta inválido.', 400);
  return parsed.data;
}

const cut = value => (typeof value === 'string' ? value.slice(0, LIMITS.NAME_MAX) : value);
const cleanParams = params => Object.fromEntries(Object.entries(params || {}).map(([key, value]) => [key, cut(value)]));
const cleanReason = ({ code, params }) => ({ code, params: cleanParams(params) });
const cleanAction = ({ code, params, campaignId }) => ({ code, params: cleanParams(params), ...(campaignId != null ? { campaignId } : {}) });
const goalOf = value => (Number.isFinite(Number(value)) && value != null ? Number(value) : null);

function resolveFocus(analytics, focus) {
  const verdict = analytics.verdict;
  if (!focus || !verdict) return null;
  if (focus.kind === 'verdict') return { kind: 'verdict' };
  if (focus.kind === 'card') {
    const item = verdict.highlights?.find(highlight => highlight.key === focus.key);
    return item ? { kind: 'card', key: item.key, value: item.value, change: item.change, trend: item.trend, available: item.available } : null;
  }
  if (focus.kind === 'reason') {
    const reason = verdict.reasons?.find(item => item.code === focus.code);
    return reason ? { kind: 'reason', ...cleanReason(reason) } : null;
  }
  if (focus.campaignId != null && !analytics.campaigns?.some(campaign => campaign.id === focus.campaignId)) return null;
  const action = verdict.actions?.find(item => item.code === focus.code && (focus.campaignId == null || item.campaignId === focus.campaignId));
  return action ? { kind: 'action', ...cleanAction(action) } : null;
}

export function buildExplainContext(analytics, focus) {
  const verdict = analytics.verdict;
  const settings = analytics.alertSettings || {};
  return {
    verdict: verdict ? {
      status: verdict.status, basis: verdict.basis, indicator: verdict.indicator, insufficientReason: verdict.insufficientReason ?? null,
      reasons: (verdict.reasons || []).slice(0, MAX_ITEMS).map(cleanReason),
      actions: (verdict.actions || []).slice(0, MAX_ITEMS).map(cleanAction),
    } : null,
    goals: { ctrMin: goalOf(settings.ctrMin), cpaMax: goalOf(settings.cpaMax), budgetMax: goalOf(settings.budgetMax) },
    focus: resolveFocus(analytics, focus),
  };
}

const round1 = value => Math.round(value * 10) / 10;

// Contexto do chat: o mesmo do painel "Explicar" (veredito e metas), mais o "Por que mudou?" já calculado e o acompanhamento
// dos planos, para a IA citar os números do painel em vez de deduzi-los. Sem veredito não há o que ancorar: devolve null.
export function buildChatContext(analytics, focus, planFollowUps = []) {
  if (!analytics.verdict) return null;
  const change = analytics.changeExplanation;
  return {
    ...buildExplainContext(analytics, focus),
    changeExplanation: change ? {
      indicator: change.indicator, costChangePct: round1(change.costChange), mainFactor: change.main,
      factors: change.factors.map(item => ({ factor: item.key, changePct: round1(item.change), sharePct: Math.round(item.share * 100) })),
    } : null,
    planFollowUps: planFollowUps.slice(0, 5),
  };
}
