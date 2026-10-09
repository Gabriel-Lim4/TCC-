const DAY = 86400000;
const PRESETS = { today: 1, yesterday: 1, last_7d: 7, last_30d: 30, last_90d: 90 };

function badRange(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw badRange('Informe uma data no formato AAAA-MM-DD.');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw badRange('Data inválida.');
  return parsed;
}

export function resolveDateRange({ periodo = 'last_30d', startDate, endDate } = {}, now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: process.env.REPORT_TIME_ZONE || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  let since, until, period = periodo;
  if (periodo === 'custom' || startDate || endDate) {
    if (!startDate || !endDate) throw badRange('Informe a data inicial e a final.');
    since = parseDate(startDate);
    until = parseDate(endDate);
    period = `custom:${startDate}:${endDate}`;
  } else {
    if (!(periodo in PRESETS)) throw badRange('Período inválido.');
    until = parseDate(today);
    if (periodo === 'yesterday') until = new Date(until.getTime() - DAY);
    since = new Date(until.getTime() - (PRESETS[periodo] - 1) * DAY);
  }
  const days = Math.round((until - since) / DAY) + 1;
  if (days < 1 || days > 366) throw badRange('Escolha um período de 1 a 366 dias.');
  if (until > parseDate(today)) throw badRange('A data final não pode estar no futuro.');
  const date = value => value.toISOString().slice(0, 10);
  return { since: date(since), until: date(until), period, days,
    previousSince: date(new Date(since.getTime() - days * DAY)), previousUntil: date(new Date(since.getTime() - DAY)) };
}
