// Regras do plano de ações: quais ações têm plano, chave estável e validação dos passos escritos pela IA.
import { z } from 'zod';
import { aiError } from './iaService.js';

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
