const CORE = ['impressions', 'clicks', 'spend'];
const OPTIONAL = ['conversions', 'revenue'];
export function aggregateValues(rows) {
  const totals = Object.fromEntries(CORE.map(key => [key, 0]));
  for (const key of OPTIONAL) totals[key] = rows.length && rows.every(row => row[key] != null && Number.isFinite(Number(row[key]))) ? 0 : null;
  for (const row of rows) {
    for (const key of [...CORE, ...OPTIONAL]) {
      if (totals[key] !== null && Number.isFinite(Number(row[key]))) totals[key] += Number(row[key]);
    }
  }
  return { ...totals,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : null,
    cpm: totals.impressions > 0 ? totals.spend / totals.impressions * 1000 : null,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
    roas: totals.revenue != null && totals.spend > 0 ? totals.revenue / totals.spend : null,
  };
}

export function metricChanges(current, previous) {
  return Object.fromEntries(Object.keys(current).map(key => [key,
    current[key] == null || previous[key] == null || previous[key] === 0 ? null : (current[key] - previous[key]) / Math.abs(previous[key]) * 100,
  ]));
}

export function csvCell(value) {
  let text = value == null ? '' : String(value);
  // Prevent spreadsheet formulas even when a campaign name starts with whitespace.
  if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
