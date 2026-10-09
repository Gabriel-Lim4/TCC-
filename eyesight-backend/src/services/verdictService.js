// Veredito da Visão geral: função pura sobre o resultado de getAnalytics.
// Devolve códigos e parâmetros; o front transforma em frases.

export const LIMITS = {
  STABLE_BAND_PCT: 5,
  MIN_CLICKS: 30,
  MIN_IMPRESSIONS_FOR_CTR: 100,
  BUDGET_NEAR_RATIO: 0.8,
  WASTED_SPEND_SHARE: 0.2,
  STALE_HOURS: 24,
  MAX_ACTIONS: 3,
  NAME_MAX: 80,
};

export const REASON_CODES = ['cost_within_goal', 'cost_above_goal', 'cost_better', 'cost_worse', 'cost_stable', 'budget_exceeded', 'budget_near', 'ctr_below_min', 'no_conversion_tracking', 'no_results_yet'];
export const ACTION_CODES = ['budget_exceeded', 'campaign_over_goal', 'campaign_low_ctr', 'campaign_without_results', 'enable_conversion_tracking', 'refresh_data', 'nothing_urgent'];

const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const positive = value => Number(value) > 0;
const moneyKnown = analytics => analytics.currency !== 'UNKNOWN';
const ATTENTION_RANK = { budget_exceeded: 0, cost_above_goal: 1, cost_worse: 2, ctr_below_min: 3 };

function assertShape(analytics) {
  if (!analytics || typeof analytics !== 'object' || !analytics.totals || !analytics.period) {
    throw new TypeError('buildVerdict: analytics inválido');
  }
}

function pickIndicator(totals) {
  return totals.conversions > 0 && isNumber(totals.cpa) ? 'cpa' : 'cpc';
}

function indicatorNotes(totals) {
  if (totals.conversions == null) return [{ code: 'no_conversion_tracking', params: {} }];
  if (totals.conversions === 0) return [{ code: 'no_results_yet', params: {} }];
  return [];
}

function budgetSignals(analytics) {
  const { totals, alertSettings } = analytics;
  const limit = Number(alertSettings?.budgetMax);
  if (!positive(limit) || !moneyKnown(analytics) || !isNumber(totals.spend)) return { attention: [], warning: [] };
  if (totals.spend > limit) return { attention: [{ code: 'budget_exceeded', params: { spend: totals.spend, limit } }], warning: [] };
  const ratio = totals.spend / limit;
  if (ratio >= LIMITS.BUDGET_NEAR_RATIO) {
    return { attention: [], warning: [{ code: 'budget_near', params: { spend: totals.spend, limit, percent: Math.round(ratio * 100) } }] };
  }
  return { attention: [], warning: [] };
}

function ctrSignal(analytics) {
  const { totals, alertSettings } = analytics;
  const min = Number(alertSettings?.ctrMin);
  if (positive(min) && totals.impressions >= LIMITS.MIN_IMPRESSIONS_FOR_CTR && totals.ctr < min) {
    return [{ code: 'ctr_below_min', params: { ctr: totals.ctr, min } }];
  }
  return [];
}

function comparisonReason(indicator, change, value) {
  const band = LIMITS.STABLE_BAND_PCT;
  const code = change <= -band ? 'cost_better' : change >= band ? 'cost_worse' : 'cost_stable';
  return { code, params: { indicator, change, value } };
}

function insufficientReason(analytics) {
  const { totals } = analytics;
  if (!analytics.hasData) return 'no_data';
  if (!analytics.currentComplete) return 'incomplete_period';
  if (!(totals.spend > 0)) return 'zero_spend';
  if (!(totals.clicks >= LIMITS.MIN_CLICKS)) return 'low_volume';
  return null;
}

function evaluateIndicator(analytics, indicator) {
  const blocked = insufficientReason(analytics);
  if (blocked) return { status: 'insufficient', basis: 'none', reasons: [], insufficientReason: blocked };
  const value = analytics.totals[indicator];
  const change = analytics.previousComplete ? analytics.changes?.[indicator] : null;
  const comparison = isNumber(change) ? comparisonReason(indicator, change, value) : null;
  const goal = Number(analytics.alertSettings?.cpaMax);
  if (indicator === 'cpa' && positive(goal) && moneyKnown(analytics)) {
    const within = value <= goal;
    const primary = { code: within ? 'cost_within_goal' : 'cost_above_goal', params: { value, goal } };
    return { status: within ? 'good' : 'attention', basis: 'goal', reasons: [primary, ...(comparison ? [comparison] : [])], insufficientReason: null };
  }
  if (comparison) {
    const status = { cost_better: 'good', cost_worse: 'attention', cost_stable: 'stable' }[comparison.code];
    return { status, basis: 'comparison', reasons: [comparison], insufficientReason: null };
  }
  return { status: 'insufficient', basis: 'none', reasons: [], insufficientReason: 'no_baseline' };
}

const trendFor = (change, higherIsBetter) => {
  if (!isNumber(change)) return 'unknown';
  if (Math.abs(change) < LIMITS.STABLE_BAND_PCT) return 'stable';
  return (change > 0) === higherIsBetter ? 'better' : 'worse';
};

function buildHighlights(analytics, indicator) {
  const { totals } = analytics;
  // Sem os dois períodos completos qualquer variação seria falsa: não há tendência a mostrar.
  const comparable = Boolean(analytics.currentComplete && analytics.previousComplete);
  const changeOf = key => (comparable && isNumber(analytics.changes?.[key]) ? analytics.changes[key] : null);
  return [
    { key: 'spend', value: totals.spend, change: changeOf('spend'), trend: 'neutral', available: true },
    { key: 'clicks', value: totals.clicks, change: changeOf('clicks'), trend: trendFor(changeOf('clicks'), true), available: true },
    { key: 'conversions', value: totals.conversions, change: changeOf('conversions'), trend: trendFor(changeOf('conversions'), true), available: totals.conversions != null },
    { key: 'cost', value: totals[indicator], change: changeOf(indicator), trend: trendFor(changeOf(indicator), false), available: true },
  ];
}

const shortName = name => String(name ?? '').slice(0, LIMITS.NAME_MAX);
const withData = campaigns => (Array.isArray(campaigns) ? campaigns : []).filter(campaign => campaign?.metrics);
const maxBy = (items, score) => items.reduce((best, item) => (best === null || score(item) > score(best) ? item : best), null);
const minBy = (items, score) => maxBy(items, item => -score(item));

function campaignActions(analytics) {
  const { totals, alertSettings } = analytics;
  const campaigns = withData(analytics.campaigns);
  const actions = [];
  const goal = Number(alertSettings?.cpaMax);
  if (positive(goal) && moneyKnown(analytics)) {
    const worst = maxBy(campaigns.filter(campaign => isNumber(campaign.metrics.cpa) && campaign.metrics.cpa > goal), campaign => campaign.metrics.cpa / goal);
    if (worst) actions.push({ code: 'campaign_over_goal', params: { campaign: shortName(worst.name), value: worst.metrics.cpa, goal }, campaignId: worst.id });
  }
  const min = Number(alertSettings?.ctrMin);
  if (positive(min)) {
    const lowest = minBy(campaigns.filter(campaign => campaign.metrics.impressions >= LIMITS.MIN_IMPRESSIONS_FOR_CTR && campaign.metrics.ctr < min), campaign => campaign.metrics.ctr);
    if (lowest) actions.push({ code: 'campaign_low_ctr', params: { campaign: shortName(lowest.name), ctr: lowest.metrics.ctr, min }, campaignId: lowest.id });
  }
  if (totals.conversions > 0) {
    const wasted = maxBy(campaigns.filter(campaign => campaign.metrics.conversions === 0 && campaign.metrics.spend >= LIMITS.WASTED_SPEND_SHARE * totals.spend), campaign => campaign.metrics.spend);
    if (wasted) actions.push({ code: 'campaign_without_results', params: { campaign: shortName(wasted.name), spend: wasted.metrics.spend }, campaignId: wasted.id });
  }
  return actions;
}

function isStale(lastSyncedAt, now) {
  const time = lastSyncedAt ? new Date(lastSyncedAt).getTime() : NaN;
  return !Number.isFinite(time) || now.getTime() - time > LIMITS.STALE_HOURS * 3600000;
}

function buildActions(analytics, budgetSignal, now) {
  const [over, lowCtr, wasted] = ['campaign_over_goal', 'campaign_low_ctr', 'campaign_without_results']
    .map(code => campaignActions(analytics).find(action => action.code === code));
  const candidates = [
    budgetSignal[0] && { code: 'budget_exceeded', params: budgetSignal[0].params },
    over, lowCtr, wasted,
    analytics.currentComplete && analytics.totals.conversions == null && { code: 'enable_conversion_tracking', params: {} },
    analytics.hasData && isStale(analytics.lastSyncedAt, now) && { code: 'refresh_data', params: { lastSyncedAt: analytics.lastSyncedAt ?? null } },
  ].filter(Boolean).slice(0, LIMITS.MAX_ACTIONS);
  return candidates.length ? candidates : [{ code: 'nothing_urgent', params: {} }];
}

const byPriority = reasons => reasons
  .map((reason, index) => ({ reason, index }))
  .sort((a, b) => (ATTENTION_RANK[a.reason.code] ?? 4) - (ATTENTION_RANK[b.reason.code] ?? 4) || a.index - b.index)
  .map(({ reason }) => reason);

export function buildVerdict(analytics, { now = new Date() } = {}) {
  assertShape(analytics);
  const indicator = pickIndicator(analytics.totals);
  const evaluation = evaluateIndicator(analytics, indicator);
  const budget = budgetSignals(analytics);
  const signals = [...budget.attention, ...ctrSignal(analytics)];
  const attention = signals.length > 0 || evaluation.status === 'attention';
  const status = attention ? 'attention' : evaluation.status;
  return {
    status,
    basis: evaluation.basis,
    indicator,
    insufficientReason: status === 'insufficient' ? evaluation.insufficientReason : null,
    reasons: byPriority([...signals, ...evaluation.reasons, ...budget.warning, ...indicatorNotes(analytics.totals)]),
    highlights: buildHighlights(analytics, indicator),
    actions: buildActions(analytics, budget.attention, now),
  };
}
