import { prisma } from '../config/database.js';
import { openToken, sealToken } from './tokenVault.js';
import * as meta from './metaService.js';
import * as google from './googleService.js';
import { saveDailyMetrics } from './metricsStore.js';

export async function getGoogleAccessToken(account) {
  if (account.token_expires_at && new Date(account.token_expires_at).getTime() > Date.now() + 60000) {
    return openToken(account.acess_token);
  }
  if (!account.refresh_token) {
    const error = new Error('Reconecte sua conta Google Ads para renovar o acesso.');
    error.status = 409;
    error.code = 'RECONNECT_REQUIRED';
    throw error;
  }
  const token = await google.atualizarTokenGoogle(openToken(account.refresh_token));
  await prisma.contas_vinculadas.update({
    where: { pk_id_conta: account.pk_id_conta },
    data: { acess_token: sealToken(token.access_token), token_expires_at: new Date(Date.now() + Number(token.expires_in || 3600) * 1000) },
  });
  return token.access_token;
}

async function syncAccount(userId, platform, range) {
  const account = await prisma.contas_vinculadas.findFirst({ where: { fk_id_usuario: userId, plataforma: platform } });
  if (!account) throw Object.assign(new Error('Conecte sua conta antes de sincronizar.'), { status: 404 });
  const isMeta = platform === 'meta';
  const token = isMeta ? openToken(account.acess_token) : await getGoogleAccessToken(account);
  const [details, campaigns, dailyRows] = await Promise.all([
    isMeta ? meta.buscarContaMeta(account.account_id, token) : google.buscarContaGoogle(account.account_id, token),
    isMeta ? meta.buscarCampanhas(account.account_id, token) : google.buscarCampanhasGoogle(account.account_id, token),
    isMeta ? meta.buscarInsightsDiarios(account.account_id, token, range) : google.buscarInsightsDiariosGoogle(account.account_id, token, range),
  ]);
  const currency = (isMeta ? details?.currency : details?.currencyCode) || account.currency || null;
  await prisma.contas_vinculadas.update({ where: { pk_id_conta: account.pk_id_conta }, data: {
    currency, account_name: (isMeta ? details?.name : details?.descriptiveName) || null,
    time_zone: (isMeta ? details?.timezone_name : details?.timeZone) || null,
  } });
  const known = await prisma.campanhas.findMany({ where: { fk_id_conta: account.pk_id_conta } });
  const byId = new Map(known.map(c => [c.id_externo, c]));
  for (const campaign of campaigns) {
    const data = { nome_campanha: campaign.name, status_campanha: campaign.status, objetivo: campaign.objective || null };
    const stored = await prisma.campanhas.upsert({
      where: { fk_id_conta_id_externo: { fk_id_conta: account.pk_id_conta, id_externo: campaign.id } },
      update: data, create: { ...data, fk_id_conta: account.pk_id_conta, id_externo: campaign.id },
    });
    byId.set(campaign.id, stored);
  }
  // Include historical campaigns returned by reporting even when removed from listing.
  for (const row of dailyRows) {
    if (!byId.has(row.campaignId)) {
      const stored = await prisma.campanhas.upsert({
        where: { fk_id_conta_id_externo: { fk_id_conta: account.pk_id_conta, id_externo: row.campaignId } },
        update: {}, create: { fk_id_conta: account.pk_id_conta, id_externo: row.campaignId, nome_campanha: `Campanha ${row.campaignId}`, status_campanha: 'UNKNOWN' },
      });
      byId.set(row.campaignId, stored);
    }
  }
  for (const [externalId, campaign] of byId) {
    await saveDailyMetrics(campaign.pk_id_campanha, dailyRows.filter(row => row.campaignId === externalId)
      .map(({ campaignId: _campaignId, ...row }) => row), range);
  }
  return {
    campaigns: byId.size, days: dailyRows.length, campaignIds: [...byId.values()].map(c => c.pk_id_campanha), currency,
    warnings: [isMeta ? 'Conversões Meta representam compras atribuídas; configure eventos de compra e seus valores.' : 'O valor de conversões Google depende da configuração das ações e pode não representar receita de vendas.'],
  };
}

export const syncMetaAccount = (userId, range) => syncAccount(userId, 'meta', range);
export const syncGoogleAccount = (userId, range) => syncAccount(userId, 'google', range);
