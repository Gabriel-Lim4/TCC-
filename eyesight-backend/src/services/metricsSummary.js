// Keep the latest value per campaign, period and metric; repeated syncs are snapshots.
export function latestMetrics(rows) {
  const latest = new Map();
  for (const row of rows) {
    const key = `${row.fk_id_campanha}:${row.periodo_metrica}:${row.tipo_metrica}`;
    const previous = latest.get(key);
    const time = new Date(row.coletado_em || 0).getTime();
    const previousTime = previous ? new Date(previous.coletado_em || 0).getTime() : -1;
    if (!previous || time > previousTime || (time === previousTime && row.pk_id_metrica > previous.pk_id_metrica)) {
      latest.set(key, row);
    }
  }
  return [...latest.values()];
}

export function summarizeMetrics(rows) {
  const totals = {};
  const rates = new Set(['ctr', 'cpc', 'cpm', 'frequency', 'cpa']);
  for (const row of latestMetrics(rows)) {
    if (rates.has(row.tipo_metrica)) continue;
    const value = Number(row.valor_metrica);
    if (Number.isFinite(value)) totals[row.tipo_metrica] = (totals[row.tipo_metrica] || 0) + value;
  }
  const { impressions = 0, clicks = 0, spend = 0, reach = 0, conversions = 0 } = totals;
  return {
    ...totals,
    ctr: impressions > 0 ? clicks / impressions * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? spend / impressions * 1000 : 0,
    frequency: reach > 0 ? impressions / reach : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}
