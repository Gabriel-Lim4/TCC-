import { z } from 'zod';

export const insightPeriodSchema = z.enum(['today', 'yesterday', 'last_7d', 'last_30d', 'last_90d']).default('last_30d');

// ── Query params schemas ─────────────────────────────────────
export const listarCampanhasQuerySchema = z.object({
  periodo: z.string().optional(),
});

export const detalharCampanhaQuerySchema = z.object({
  periodo: z.string().optional(),
});

export const metricasGeraisQuerySchema = z.object({
  periodo: z.enum(['today', 'last_7d', 'last_30d', 'last_90d', 'all_time']).default('last_30d'),
});

export const exportarMetricasQuerySchema = z.object({
  periodo: z.string().optional(),
});

export const resumoUnificadoQuerySchema = z.object({
  periodo: z.enum(['today', 'last_7d', 'last_30d', 'last_90d', 'all_time']).default('last_30d'),
});
export const analyticsQuerySchema = z.object({
  periodo: z.enum(['today', 'yesterday', 'last_7d', 'last_30d', 'last_90d', 'custom']).default('last_30d'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  platform: z.enum(['all', 'meta', 'google']).default('all'),
  campaignId: z.coerce.number().int().positive().optional(),
  currency: z.string().regex(/^(?:[A-Z]{3}|UNKNOWN)$/).optional(),
});

export const alertSettingsSchema = z.object({
  ctrMin: z.number().min(0).max(100).nullable().optional(),
  cpaMax: z.number().min(0).max(1000000000).nullable().optional(),
  budgetMax: z.number().min(0).max(1000000000).nullable().optional(),
});
