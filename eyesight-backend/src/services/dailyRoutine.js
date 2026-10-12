// Rotina diária: sincroniza as contas conectadas e, de segunda a quarta, envia o resumo semanal a quem ligou a opção.
// As dependências entram por parâmetro para a rodada ser testável sem rede nem banco.
import env from '../config/env.js';
import { prisma } from '../config/database.js';
import { getAnalytics } from './analyticsService.js';
import { resolveDateRange } from './dateRange.js';
import { enviarResumoSemanal } from './emailService.js';
import { syncGoogleAccount, syncMetaAccount } from './platformSyncService.js';
import { dayKey, weekKey, weekdayOf } from './routineClock.js';
import { buildSummaryEmail } from './summaryEmail.js';
import { createUnsubscribeToken } from './unsubscribeToken.js';
import { findUserEmail } from './userEmail.js';

export const MAX_USERS = 50;
// Cada fase tem seu próprio orçamento: um sync lento não pode consumir o tempo dos resumos.
export const SYNC_BUDGET_MS = 5 * 60 * 1000;
export const SUMMARY_BUDGET_MS = 3 * 60 * 1000;
export const SYNC_PERIOD = 'last_30d';
export const SUMMARY_DAYS = [1, 2, 3];
export const SUMMARY_KIND = 'weekly_summary';
// Alertas por mudança de estado (etapa 2): estado e alerta ficam em rotina_envios, sem tabela nova.
export const ALERT_BUDGET_MS = 2 * 60 * 1000;
export const ALERT_MIN_GAP_DAYS = 3;
export const ALERT_KIND = 'alert_attention';
const STATE_KINDS = ['state_ok', 'state_attention'];
export const STATE_MAX_AGE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

async function listUsersWithFlag(flag) {
  const users = await prisma.usuarios.findMany({ where: { contas: { some: {} } }, select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true, preferences: true } });
  return users.filter(user => user.preferences?.summary?.[flag] === true).map(user => ({ id: user.pk_id_usuario, name: user.nome_usuario, authUserId: user.auth_user_id }));
}

const realDeps = {
  nowMs: () => Date.now(),
  listUsersToSync: async limit => {
    const rows = await prisma.$queryRaw`
      SELECT u.pk_id_usuario AS id, array_agg(DISTINCT cv.plataforma::text) AS platforms
      FROM usuarios u
      JOIN contas_vinculadas cv ON cv.fk_id_usuario = u.pk_id_usuario
      LEFT JOIN campanhas c ON c.fk_id_conta = cv.pk_id_conta
      GROUP BY u.pk_id_usuario
      ORDER BY MAX(c.sincronizado_em) ASC NULLS FIRST
      LIMIT ${Number(limit)}::int`;
    return rows.map(row => ({ id: row.id, platforms: row.platforms.filter(platform => platform === 'meta' || platform === 'google') }));
  },
  syncAccount: (userId, platform, range) => (platform === 'meta' ? syncMetaAccount(userId, range) : syncGoogleAccount(userId, range)),
  listOptedInUsers: () => listUsersWithFlag('weekly'),
  listAlertUsers: () => listUsersWithFlag('alerts'),
  lastState: async userId => {
    const row = await prisma.rotina_envios.findFirst({ where: { user_id: userId, kind: { in: STATE_KINDS } }, orderBy: { sent_at: 'desc' } });
    return row ? { state: row.kind === 'state_attention' ? 'attention' : 'ok', at: row.sent_at } : null;
  },
  lastAlertAt: async userId => {
    const row = await prisma.rotina_envios.findFirst({ where: { user_id: userId, kind: ALERT_KIND }, orderBy: { sent_at: 'desc' } });
    return row?.sent_at ?? null;
  },
  claim: async (userId, kind, periodKey) => {
    try {
      await prisma.rotina_envios.create({ data: { user_id: userId, kind, period_key: periodKey } });
      return true;
    } catch (err) {
      if (err.code === 'P2002') return false;
      throw err;
    }
  },
  release: async (userId, kind, periodKey) => { await prisma.rotina_envios.deleteMany({ where: { user_id: userId, kind, period_key: periodKey } }); },
  getAnalytics,
  findEmail: findUserEmail,
  send: enviarResumoSemanal,
};

export async function runDailyRoutine({ now = new Date(), deps = {} } = {}) {
  const d = { unsubscribeSecret: env.unsubscribeSecret, frontendUrl: env.frontendUrl, backendUrl: env.backendUrl, ...realDeps, ...deps };
  const stats = { synced: 0, sent: 0, alerts: 0, skipped: 0, errors: 0 };
  const syncStarted = d.nowMs();
  const syncOutOfTime = () => d.nowMs() - syncStarted >= SYNC_BUDGET_MS;

  const range = resolveDateRange({ periodo: SYNC_PERIOD }, now);
  for (const user of await d.listUsersToSync(MAX_USERS)) {
    if (syncOutOfTime()) break;
    for (const platform of user.platforms) {
      if (syncOutOfTime()) break;
      try {
        await d.syncAccount(user.id, platform, range);
        stats.synced++;
      } catch (err) {
        stats.errors++;
        console.error('[JOB] falha no sync', { userId: user.id, platform, status: err?.status ?? err?.code ?? null });
      }
    }
  }

  const summarized = SUMMARY_DAYS.includes(weekdayOf(now)) ? await sendSummaries({ d, now, stats }) : new Set();
  await sendAlerts({ d, now, stats, summarized });
  console.log('[JOB] rotina concluída', stats);
  return stats;
}

async function sendSummaries({ d, now, stats }) {
  const summarized = new Set();
  const started = d.nowMs();
  const users = await d.listOptedInUsers();
  if (!d.unsubscribeSecret) {
    stats.skipped += users.length;
    if (users.length) console.warn('[JOB] resumos não enviados: UNSUBSCRIBE_SECRET não configurada');
    return summarized;
  }
  const periodKey = weekKey(now);
  for (const [index, user] of users.entries()) {
    if (d.nowMs() - started >= SUMMARY_BUDGET_MS) {
      console.warn(`[JOB] tempo dos resumos esgotado; ${users.length - index} usuário(s) ficam para a próxima rodada`);
      break;
    }
    let claimed = false;
    try {
      claimed = await d.claim(user.id, SUMMARY_KIND, periodKey);
      if (!claimed) { stats.skipped++; continue; }
      const email = await d.findEmail(user.authUserId);
      const analytics = email ? await d.getAnalytics(user.id, { periodo: 'last_7d' }) : null;
      if (!email || !analytics?.hasData || !analytics.verdict) {
        await d.release(user.id, SUMMARY_KIND, periodKey);
        stats.skipped++;
        continue;
      }
      const token = createUnsubscribeToken(user.id, { now, secret: d.unsubscribeSecret });
      const unsubscribeUrl = `${d.frontendUrl}/cancelar-resumo?t=${token}`;
      const unsubscribePostUrl = d.backendUrl ? `${d.backendUrl}/resumo/cancelar?t=${token}` : undefined;
      const message = buildSummaryEmail({ name: user.name, analytics, appUrl: d.frontendUrl, unsubscribeUrl });
      await d.send({ to: email, ...message, unsubscribeUrl, unsubscribePostUrl });
      stats.sent++;
      summarized.add(user.id);
    } catch {
      stats.errors++;
      console.error('[JOB] falha ao enviar o resumo', { userId: user.id });
      if (claimed) await d.release(user.id, SUMMARY_KIND, periodKey).catch(() => {});
    }
  }
  return summarized;
}

/** Alerta quando o veredito dos últimos 7 dias passa de bom/estável para atenção (no máximo 1 por dia). */
async function sendAlerts({ d, now, stats, summarized }) {
  const started = d.nowMs();
  const users = await d.listAlertUsers();
  if (!d.unsubscribeSecret) {
    stats.skipped += users.length;
    if (users.length) console.warn('[JOB] alertas não enviados: UNSUBSCRIBE_SECRET não configurada');
    return;
  }
  const today = dayKey(now);
  for (const [index, user] of users.entries()) {
    if (d.nowMs() - started >= ALERT_BUDGET_MS) {
      console.warn(`[JOB] tempo dos alertas esgotado; ${users.length - index} usuário(s) ficam para a próxima rodada`);
      break;
    }
    const claimed = [];
    try {
      const analytics = await d.getAnalytics(user.id, { periodo: 'last_7d' });
      const status = analytics?.hasData ? analytics.verdict?.status : null;
      if (!status || status === 'insufficient') { stats.skipped++; continue; }
      const state = status === 'attention' ? 'attention' : 'ok';
      const last = await d.lastState(user.id);
      // Estado antigo (alertas desligados por um tempo) não é ponto de partida: só registra.
      const previous = last && now.getTime() - new Date(last.at ?? now).getTime() <= STATE_MAX_AGE_DAYS * DAY_MS ? last : null;
      const transition = state === 'attention' && previous?.state === 'ok' && !summarized.has(user.id);
      if (transition) {
        const lastAlert = await d.lastAlertAt(user.id);
        if (!lastAlert || now.getTime() - new Date(lastAlert).getTime() >= ALERT_MIN_GAP_DAYS * DAY_MS) {
          if (await d.claim(user.id, ALERT_KIND, today)) {
            claimed.push(ALERT_KIND);
            const email = await d.findEmail(user.authUserId);
            if (!email) { await releaseAll(d, user.id, claimed, today); stats.skipped++; continue; }
            const token = createUnsubscribeToken(user.id, { now, secret: d.unsubscribeSecret });
            const unsubscribeUrl = `${d.frontendUrl}/cancelar-resumo?t=${token}&e=alertas`;
            const unsubscribePostUrl = d.backendUrl ? `${d.backendUrl}/resumo/cancelar?t=${token}&e=alertas` : undefined;
            const message = buildSummaryEmail({ name: user.name, analytics, appUrl: d.frontendUrl, unsubscribeUrl, variant: 'alert' });
            await d.send({ to: email, ...message, unsubscribeUrl, unsubscribePostUrl });
            stats.alerts++;
          }
        }
      }
      // O estado só é gravado depois do envio: se o envio falhar, a transição continua pendente para a próxima rodada.
      if (!(await d.claim(user.id, `state_${state}`, today))) stats.skipped++;
    } catch (err) {
      stats.errors++;
      console.error('[JOB] falha no alerta', { userId: user.id, status: err?.status ?? err?.code ?? null });
      await releaseAll(d, user.id, claimed, today);
    }
  }
}

// Apaga as reservas do dia para a próxima rodada tentar de novo; falha ao apagar é registrada, nunca silenciosa.
async function releaseAll(d, userId, kinds, today) {
  for (const kind of kinds) {
    try { await d.release(userId, kind, today); } catch (err) { console.error('[JOB] falha ao liberar a reserva', { userId, kind, status: err?.status ?? err?.code ?? null }); }
  }
}
