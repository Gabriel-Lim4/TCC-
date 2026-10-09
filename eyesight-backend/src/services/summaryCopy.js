// Textos do veredito em pt-BR para o e-mail do resumo semanal.
// ATENÇÃO: este arquivo duplica o mínimo de eyesight-front/src/utils/verdictCopy.js (backend e frontend não
// compartilham pacote). Ao mudar uma frase aqui, mude também lá, e vice-versa.

const PRESETS = ['last_7d', 'last_30d', 'last_90d'];
const isPreset = period => PRESETS.includes(period?.period);
const finite = value => value != null && Number.isFinite(Number(value));

export const previousLabel = period => (isPreset(period) ? `os ${period.days} dias anteriores` : 'o período anterior');
export const previousLabelTo = period => (isPreset(period) ? `aos ${period.days} dias anteriores` : 'ao período anterior');

export function money(value, currency) {
  if (!finite(value)) return '—';
  const number = Number(value);
  if (currency === 'UNKNOWN') return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return number.toLocaleString('pt-BR', { style: 'currency', currency: currency || 'BRL' });
}

export function percent(value, digits = 1) {
  if (!finite(value)) return '—';
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`;
}

export const count = value => (finite(value) ? Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—');
const shortDate = value => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const ACTIONS = {
  budget_exceeded: (p, c) => `Você já gastou ${money(p.spend, c)}, acima do seu limite de ${money(p.limit, c)}.`,
  campaign_over_goal: (p, c) => `A campanha '${p.campaign}' está custando ${money(p.value, c)} por resultado, acima da sua meta de ${money(p.goal, c)}.`,
  campaign_low_ctr: p => `Poucas pessoas clicam na campanha '${p.campaign}' (${percent(p.ctr)}; sua meta é ${percent(p.min)}).`,
  campaign_without_results: (p, c) => `A campanha '${p.campaign}' gastou ${money(p.spend, c)} e não gerou resultados.`,
  enable_conversion_tracking: () => 'Ative o acompanhamento de conversões na plataforma para ver quanto cada resultado custa.',
  refresh_data: p => (p.lastSyncedAt
    ? `Seus dados foram atualizados em ${shortDate(p.lastSyncedAt)}. Clique em Atualizar dados para ver o dia de hoje.`
    : 'Seus dados ainda não foram atualizados. Clique em Atualizar dados.'),
  nothing_urgent: () => 'Nada urgente por enquanto. Continue acompanhando.',
};

export const actionText = (action, currency) => (ACTIONS[action?.code] ? ACTIONS[action.code](action.params || {}, currency) : '');

const INSUFFICIENT = {
  no_data: 'Ainda não há dados para avaliar.',
  incomplete_period: 'Ainda não dá para avaliar: faltam dados de alguns dias. Atualize os dados.',
  zero_spend: 'Seus anúncios não gastaram neste período.',
  low_volume: 'Poucos dados para avaliar ainda. Os números abaixo já aparecem.',
  no_baseline: 'Ainda não dá para avaliar: falta o período anterior para comparar. Defina uma meta ou aguarde alguns dias.',
};

const ATTENTION = [
  ['budget_exceeded', () => 'Atenção: você passou do seu limite de gasto.'],
  ['cost_above_goal', () => 'Atenção: o custo por resultado está acima da sua meta.'],
  ['cost_worse', period => `Atenção: seus anúncios pioraram em relação ${previousLabelTo(period)}.`],
  ['ctr_below_min', () => 'Atenção: poucas pessoas estão clicando nos seus anúncios.'],
];

export function headline(verdict, period) {
  if (verdict.status === 'good') {
    return verdict.basis === 'goal' ? 'Seus anúncios estão dentro da sua meta.' : `Seus anúncios estão melhores que ${previousLabel(period)}.`;
  }
  if (verdict.status === 'stable') return `Seus anúncios estão estáveis em relação ${previousLabelTo(period)}.`;
  if (verdict.status === 'attention') {
    const codes = (verdict.reasons || []).map(reason => reason.code);
    const candidates = verdict.basis === 'goal' ? ATTENTION.filter(([code]) => code !== 'cost_worse') : ATTENTION;
    const found = candidates.find(([code]) => codes.includes(code));
    return found ? found[1](period) : 'Atenção: vale revisar seus anúncios.';
  }
  return INSUFFICIENT[verdict.insufficientReason] || INSUFFICIENT.no_data;
}

export const STATUS = {
  good: { label: 'Vai bem', mark: '✔', subject: 'Seus anúncios estão melhores · resumo da semana' },
  stable: { label: 'Estável', mark: '–', subject: 'Seus anúncios estão estáveis · resumo da semana' },
  attention: { label: 'Atenção', mark: '⚠', subject: 'Seus anúncios estão pedindo atenção · resumo da semana' },
  insufficient: { label: 'Sem base para avaliar', mark: '?', subject: 'Resumo da semana: ainda sem base para avaliar' },
};

export const CARD_TITLES = { spend: 'Você investiu', clicks: 'Pessoas que clicaram', conversions: 'Resultados', costCpa: 'Custo por resultado', costCpc: 'Custo por clique' };
