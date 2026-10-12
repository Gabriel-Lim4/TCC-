// "Por que mudou?": decompõe a variação do custo entre dois períodos nos fatores que o formam.
//   CPC = (CPM / 1000) / CTR            CPA = CPC / TCV   (TCV = conversões / cliques)
// Em logaritmos a decomposição é exata: Δln custo = Δln CPM − Δln CTR (− Δln TCV para o CPA).
// A parcela de cada fator é a sua contribuição dividida pela variação total; as parcelas somam 1.
// Função pura: sem dado suficiente devolve null em vez de arriscar uma explicação errada.

export const EXPLAIN_LIMITS = { MIN_CLICKS: 30, MIN_COST_CHANGE_PCT: 5 };

const positive = value => Number.isFinite(value) && value > 0;

function factorsOf(metrics, indicator) {
  const { impressions, clicks, spend, conversions } = metrics;
  const factors = { cpm: spend / impressions * 1000, ctr: clicks / impressions };
  if (indicator === 'cpa') factors.cvr = conversions / clicks;
  return factors;
}

const costOf = (metrics, indicator) => (indicator === 'cpa' ? metrics.spend / metrics.conversions : metrics.spend / metrics.clicks);
// Cada fator entra no custo elevado a este sinal: o custo sobe com o CPM e desce com CTR e TCV.
const SIGN = { cpm: 1, ctr: -1, cvr: -1 };

export function explainCostChange(current, previous, indicator) {
  if (!current || !previous || !['cpc', 'cpa'].includes(indicator)) return null;
  const needed = indicator === 'cpa' ? ['impressions', 'clicks', 'spend', 'conversions'] : ['impressions', 'clicks', 'spend'];
  for (const metrics of [current, previous]) {
    if (needed.some(key => !positive(Number(metrics[key])))) return null;
    if (metrics.clicks < EXPLAIN_LIMITS.MIN_CLICKS) return null;
  }
  const now = factorsOf(current, indicator);
  const before = factorsOf(previous, indicator);
  const logChange = Math.log(costOf(current, indicator) / costOf(previous, indicator));
  const costChange = (Math.exp(logChange) - 1) * 100;
  if (!Number.isFinite(logChange) || Math.abs(costChange) < EXPLAIN_LIMITS.MIN_COST_CHANGE_PCT) return null;
  const factors = Object.keys(now).map(key => ({
    key,
    change: (now[key] / before[key] - 1) * 100,
    share: SIGN[key] * Math.log(now[key] / before[key]) / logChange,
  })).sort((a, b) => b.share - a.share);
  return { indicator, costChange, factors, main: factors[0].share > 0 ? factors[0].key : null };
}
