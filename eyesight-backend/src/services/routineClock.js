// Dia da semana e semana ISO no fuso do relatório (nunca no UTC nem no fuso do servidor).
const DAY = 86400000;
const zone = () => process.env.REPORT_TIME_ZONE || 'America/Sao_Paulo';

function localDate(date, timeZone = zone()) {
  const [year, month, day] = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

const mondayIndex = utcMs => (new Date(utcMs).getUTCDay() + 6) % 7;

/** Segunda = 1 … domingo = 7. */
export function weekdayOf(date, timeZone) {
  return mondayIndex(localDate(date, timeZone)) + 1;
}

/** Semana ISO no formato `AAAA-Wss`. */
export function weekKey(date, timeZone) {
  const day = localDate(date, timeZone);
  const thursday = day - mondayIndex(day) * DAY + 3 * DAY;
  const weekYear = new Date(thursday).getUTCFullYear();
  const jan4 = Date.UTC(weekYear, 0, 4);
  const firstMonday = jan4 - mondayIndex(jan4) * DAY;
  const week = 1 + Math.floor((thursday - firstMonday) / DAY / 7);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

/** Data local `AAAA-MM-DD` (fuso do relatório). */
export function dayKey(date, timeZone) {
  return new Date(localDate(date, timeZone)).toISOString().slice(0, 10);
}
