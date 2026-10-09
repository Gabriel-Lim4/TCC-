// Rotina diária: sincroniza as contas conectadas e, de segunda a quarta, envia o resumo semanal a quem ligou a opção.
// As dependências entram por parâmetro para a rodada ser testável sem rede nem banco.
import env from '../config/env.js';
import { prisma } from '../config/database.js';
import { getAnalytics } from './analyticsService.js';
import { resolveDateRange } from './dateRange.js';
import { enviarResumoSemanal } from './emailService.js';
import { syncGoogleAccount, syncMetaAccount } from './platformSyncService.js';
import { weekKey, weekdayOf } from './routineClock.js';
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
  listOptedInUsers: async () => {
    const users = await prisma.usuarios.findMany({ where: { contas: { some: {} } }, select: { pk_id_usuario: true, nome_usuario: true, auth_user_id: true, preferences: true } });
    return users.filter(user => user.preferences?.summary?.weekly === true).map(user => ({ id: user.pk_id_usuario, name: user.nome_usuario, authUserId: user.auth_user_id }));
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
  const stats = { synced: 0, sent: 0, skipped: 0, errors: 0 };
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

  if (SUMMARY_DAYS.includes(weekdayOf(now))) await sendSummaries({ d, now, stats });
  console.log('[JOB] rotina concluída', stats);
  return stats;
}

async function sendSummaries({ d, now, stats }) {
  const started = d.nowMs();
  const users = await d.listOptedInUsers();
  if (!d.unsubscribeSecret) {
    stats.skipped += users.length;
    if (users.length) console.warn('[JOB] resumos não enviados: UNSUBSCRIBE_SECRET não configurada');
    return;
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
    } catch {
      stats.errors++;
      console.error('[JOB] falha ao enviar o resumo', { userId: user.id });
      if (claimed) await d.release(user.id, SUMMARY_KIND, periodKey).catch(() => {});
    }
  }
}
