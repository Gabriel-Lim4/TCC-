// ─────────────────────────────────────────────────────────────
// services/demoSeed.js — dados de exemplo para o painel
//
// Gera campanhas e métricas diárias no MESMO formato que o sync real
// grava em `campaign_daily_metrics` (impressions, clicks, spend,
// conversions, revenue). Assim dá para ver o painel funcionando de
// ponta a ponta (banco → /metricas/analytics → tela) sem ter uma
// conta de anúncios conectada.
//
// Módulo puro: não acessa o banco. Quem grava é scripts/seed-demo.mjs.
// A fórmula é a mesma da demonstração do front (src/services/demoApi.js).
// ─────────────────────────────────────────────────────────────

const DAY = 86400000;
export const DEMO_PREFIX = 'demo-';
export const RECENT_DROP_DAYS = 15;
const CONVERSION_DROP = 0.45;

export const DEMO_ACCOUNTS = [
  { plataforma: 'meta', account_id: 'demo-meta', account_name: 'Conta de exemplo (Meta Ads)' },
  { plataforma: 'google', account_id: 'demo-google', account_name: 'Conta de exemplo (Google Ads)' },
];

export const DEMO_CAMPAIGNS = [
  { n: 1, platform: 'meta', name: 'Exemplo · Coleção primavera', objective: 'Vendas' },
  { n: 2, platform: 'meta', name: 'Exemplo · Remarketing catálogo', objective: 'Vendas' },
  { n: 3, platform: 'meta', name: 'Exemplo · Novos públicos', objective: 'Vendas' },
  { n: 4, platform: 'google', name: 'Exemplo · Pesquisa de marca', objective: 'Vendas' },
  { n: 5, platform: 'google', name: 'Exemplo · Pesquisa de produtos', objective: 'Vendas' },
  { n: 6, platform: 'google', name: 'Exemplo · Shopping', objective: 'Vendas' },
].map(campaign => ({ ...campaign, externalId: `${DEMO_PREFIX}${campaign.n}` }));

const dayNumber = isoDate => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY);
const isoOf = day => new Date(day * DAY).toISOString().slice(0, 10);

/** Data de hoje em São Paulo (AAAA-MM-DD), a mesma referência do resto do sistema. */
export function todayInSaoPaulo(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Valores de um dia para uma campanha. Determinístico: rodar duas vezes gera o mesmo resultado.
 * História de exemplo: nos últimos 15 dias, as campanhas 2 e 3 perdem taxa de conversão
 * (o painel usa isso para mostrar o veredito "atenção" e explicar o motivo).
 */
export function demoValues(n, date, today) {
  const day = dayNumber(date);
  const wave = ((day * 17 + n * 29) % 23) / 23;
  const impressions = Math.round(1100 + n * 370 + wave * 850);
  const clicks = Math.round(impressions * (0.012 + n * 0.003 + wave * 0.005));
  const dropping = n === 2 || n === 3;
  const recent = dayNumber(today) - day < RECENT_DROP_DAYS;
  const conversions = Math.max(1, Math.round(clicks * (0.04 + n * 0.006) * (dropping && recent ? CONVERSION_DROP : 1)));
  return {
    impressions,
    clicks,
    spend: Math.round(clicks * (0.9 + n * 0.16 + wave * 0.3) * 100) / 100,
    conversions,
    revenue: conversions * (95 + n * 15),
  };
}

/** Linhas diárias de uma campanha, de (hoje − days + 1) até hoje. */
export function buildDemoRows(n, { today = todayInSaoPaulo(), days = 180 } = {}) {
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('days deve ser um número inteiro entre 1 e 366.');
  const end = dayNumber(today);
  return Array.from({ length: days }, (_, index) => {
    const date = isoOf(end - (days - 1) + index);
    return { date, ...demoValues(n, date, today) };
  });
}
