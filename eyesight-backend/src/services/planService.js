// Regras do plano de ações: quais ações têm plano, chave estável e validação dos passos escritos pela IA.
import { z } from 'zod';
import { aiError } from './iaService.js';
import { aggregateValues } from './analyticsMath.js';
import { dayKey } from './routineClock.js';

export const PLAN_ACTION_CODES = ['budget_exceeded', 'campaign_over_goal', 'campaign_low_ctr', 'campaign_without_results', 'enable_conversion_tracking'];
const STEP_MIN = 3;
const STEP_MAX = 5;
const STEP_TEXT_MAX = 200;

const actionSchema = z.object({
  code: z.enum(PLAN_ACTION_CODES),
  campaignId: z.number().int().positive().optional(),
}).strict();

export function parsePlanAction(raw) {
  const parsed = actionSchema.safeParse(raw);
  if (!parsed.success) throw aiError('Ação inválida.', 400);
  return parsed.data;
}

// Reduz uma ação do veredito (com params) à identidade usada na chave do plano.
export const planIdentity = action => ({ code: action.code, ...(action.campaignId != null ? { campaignId: action.campaignId } : {}) });

export function actionKey(action) {
  const { code, campaignId } = parsePlanAction(action);
  return `${code}:${campaignId ?? '-'}`;
}

export function validateSteps(raw) {
  const list = raw && typeof raw === 'object' ? raw.passos : null;
  const texts = Array.isArray(list) ? list.map(item => (typeof item === 'string' ? item.trim() : null)) : null;
  if (!texts || texts.length < STEP_MIN || texts.length > STEP_MAX || texts.some(text => !text || text.length > STEP_TEXT_MAX)) {
    throw aiError('A IA não conseguiu montar os passos. Tente novamente.', 502);
  }
  return texts.map((text, index) => ({ id: `s${index + 1}`, text, done: false }));
}

export function findCurrentAction(analytics, action) {
  return analytics?.verdict?.actions?.find(item => item.code === action.code && (item.campaignId ?? null) === (action.campaignId ?? null)) ?? null;
}

// --- Acompanhamento: o indicador melhorou depois que o usuário começou a agir? ---
// Sem coluna nova: cada passo concluído guarda `doneAt`; o corte é o dia do primeiro passo concluído.

export const FOLLOW_UP_LIMITS = { BEFORE_DAYS: 7, MIN_DAYS_AFTER: 3, MIN_CLICKS: 30, MIN_IMPRESSIONS: 100, BAND_PCT: 5 };
export const FOLLOW_UP_METRICS = {
  campaign_over_goal: { key: 'cpa', lowerIsBetter: true },
  campaign_low_ctr: { key: 'ctr', lowerIsBetter: false },
  campaign_without_results: { key: 'resultsPerDay', lowerIsBetter: false },
  budget_exceeded: { key: 'spendPerDay', lowerIsBetter: true },
};

export function markStep(steps, stepId, done, now = new Date()) {
  return steps.map(step => {
    if (step.id !== stepId) return step;
    if (done && step.done && step.doneAt) return step; // repetir o mesmo "feito" não muda o corte
    const { doneAt, ...rest } = step;
    return done ? { ...rest, done: true, doneAt: now.toISOString() } : { ...rest, done: false };
  });
}

export function firstDoneAt(steps) {
  const times = (Array.isArray(steps) ? steps : [])
    .filter(step => step?.done && typeof step.doneAt === 'string' && Number.isFinite(Date.parse(step.doneAt)))
    .map(step => step.doneAt);
  return times.length ? times.reduce((first, time) => (Date.parse(time) < Date.parse(first) ? time : first)) : null;
}

const DAY_MS = 86400000;
const shiftDay = (key, days) => new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Primeiro dia (AAAA-MM-DD) que a consulta de métricas precisa cobrir para acompanhar este plano. */
export function followUpFrom(steps) {
  const cutAt = firstDoneAt(steps);
  return cutAt ? shiftDay(dayKey(new Date(cutAt)), -FOLLOW_UP_LIMITS.BEFORE_DAYS) : null;
}
const rowDay = row => new Date(row.date).toISOString().slice(0, 10);

function metricValue(key, totals, days) {
  if (key === 'cpa') return totals.conversions > 0 && totals.clicks >= FOLLOW_UP_LIMITS.MIN_CLICKS ? totals.cpa : null;
  if (key === 'ctr') return totals.impressions >= FOLLOW_UP_LIMITS.MIN_IMPRESSIONS ? totals.ctr : null;
  if (key === 'resultsPerDay') return totals.conversions != null ? totals.conversions / days : null;
  return totals.spend > 0 ? totals.spend / days : null;
}

/** rows: linhas de campaign_daily_metrics ({ date, values }) das campanhas do plano; today: dia local AAAA-MM-DD. */
export function evaluateFollowUp({ actionCode, steps, rows, today }) {
  const metric = FOLLOW_UP_METRICS[actionCode];
  const cutAt = firstDoneAt(steps);
  if (!metric || !cutAt) return null;
  const since = dayKey(new Date(cutAt));
  const from = shiftDay(since, -FOLLOW_UP_LIMITS.BEFORE_DAYS);
  const beforeRows = rows.filter(row => rowDay(row) >= from && rowDay(row) < since);
  const afterRows = rows.filter(row => rowDay(row) > since && rowDay(row) < today); // hoje é um dia parcial: fica de fora
  const distinct = list => new Set(list.map(rowDay)).size;
  const daysBefore = distinct(beforeRows);
  const daysAfter = distinct(afterRows);
  if (daysAfter < FOLLOW_UP_LIMITS.MIN_DAYS_AFTER) return { status: 'waiting', since, daysAfter, daysNeeded: FOLLOW_UP_LIMITS.MIN_DAYS_AFTER };
  const before = daysBefore ? metricValue(metric.key, aggregateValues(beforeRows.map(row => row.values)), daysBefore) : null;
  const after = metricValue(metric.key, aggregateValues(afterRows.map(row => row.values)), daysAfter);
  if (before == null || after == null) return { status: 'unavailable', since };
  const changePct = before === 0 ? null : (after / before - 1) * 100;
  const improved = metric.lowerIsBetter ? after < before : after > before;
  const result = changePct != null
    ? (Math.abs(changePct) < FOLLOW_UP_LIMITS.BAND_PCT ? 'same' : improved ? 'better' : 'worse')
    : (after === before ? 'same' : improved ? 'better' : 'worse');
  return { status: 'ready', metric: metric.key, since, daysBefore, daysAfter, before, after, changePct, result };
}
