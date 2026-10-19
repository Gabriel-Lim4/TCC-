// ─────────────────────────────────────────────────────────────
// services/metaService.js — toda comunicação com a Graph API
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import env   from '../config/env.js';

const GRAPH_VERSION = env.meta.graphVersion; // v19.0 expirou em mai/2026 — configurável via META_GRAPH_VERSION
const GRAPH_URL     = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ── 1. Gera URL de autorização OAuth ────────────────────────
export function gerarUrlAutorizacao(state) {
  const params = new URLSearchParams({
    client_id:     env.meta.appId,
    redirect_uri:  env.meta.redirectUri,
    scope:         'ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights',
    response_type: 'code',
    state,
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

// ── 2. Troca o code temporário por token curto (~1h) ─────────
export async function trocarCodePorToken(code) {
  const resposta = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
    params: {
      client_id:     env.meta.appId,
      client_secret: env.meta.appSecret,
      redirect_uri:  env.meta.redirectUri,
      code,
    },
  });
  return resposta.data; // { access_token, token_type, expires_in }
}

// ── 3. Troca token curto por Long-Lived Token (60 dias) ──────
export async function trocarPorTokenLongo(tokenCurto) {
  const resposta = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
    params: {
      grant_type:        'fb_exchange_token',
      client_id:         env.meta.appId,
      client_secret:     env.meta.appSecret,
      fb_exchange_token: tokenCurto,
    },
  });
  const { access_token, expires_in } = resposta.data;
  const expiraEm = Number(expires_in) > 0 ? new Date(Date.now() + Number(expires_in) * 1000) : null;
  return { access_token, expiraEm };
}

// ── 4. Busca o Ad Account ID do usuário ─────────────────────
// Formato retornado: "act_123456789"
export async function buscarAdAccountId(accessToken, preferidoId) {
  const resposta = await axios.get(`${GRAPH_URL}/me/adaccounts`, {
    params: { fields: 'id,name,account_status', access_token: accessToken },
  });
  const contas = resposta.data.data;
  if (!contas || contas.length === 0) {
    const e = new Error('Nenhuma conta de anúncios encontrada para este usuário.');
    e.code = 'SEM_CONTA';
    throw e;
  }
  // Ao reconectar, mantém a conta já vinculada se ela ainda estiver na lista (a ordem da Meta pode mudar).
  if (preferidoId && contas.some(conta => conta.id === preferidoId)) return preferidoId;
  return contas[0].id;
}

// ── 5. Busca campanhas do Ad Account ────────────────────────
export async function graphList(path, accessToken, params = {}) {
  const rows = [];
  let after;
  const seen = new Set();
  do {
    const response = await axios.get(`${GRAPH_URL}/${path}`, {
      params: { ...params, access_token: accessToken, limit: 100, ...(after ? { after } : {}) },
      timeout: 30000,
    });
    rows.push(...(response.data.data || []));
    after = response.data.paging?.next ? response.data.paging?.cursors?.after : undefined;
    if (response.data.paging?.next && !after) throw new Error('Paginação Meta incompleta.');
    if (after && seen.has(after)) throw new Error('Paginação Meta inválida.');
    if (after) seen.add(after);
  } while (after);
  return rows;
}

export async function buscarCampanhas(adAccountId, accessToken) {
  return graphList(`${adAccountId}/campaigns`, accessToken, {
    fields: 'id,name,status,objective,created_time',
  });
}

export async function buscarContaMeta(adAccountId, accessToken) {
  const response = await axios.get(`${GRAPH_URL}/${adAccountId}`, {
    params: { fields: 'id,name,currency,timezone_name', access_token: accessToken }, timeout: 30000,
  });
  return response.data;
}

// Purchase aliases overlap; select one aggregate instead of summing them.
export function normalizeMetaInsight(row) {
  const purchase = values => {
    for (const type of ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']) {
      const item = (values || []).find(value => value.action_type === type);
      if (item) return Number(item.value) || 0;
    }
    return 0;
  };
  return {
    impressions: Number(row.impressions) || 0, clicks: Number(row.clicks) || 0,
    spend: Number(row.spend) || 0, reach: Number(row.reach) || 0,
    conversions: purchase(row.actions), revenue: purchase(row.action_values),
  };
}

export async function buscarInsightsDiarios(adAccountId, accessToken, range) {
  const rows = await graphList(`${adAccountId}/insights`, accessToken, {
    fields: 'campaign_id,impressions,clicks,spend,reach,actions,action_values',
    level: 'campaign', time_increment: 1,
    time_range: JSON.stringify({ since: range.since, until: range.until }),
  });
  return rows.map(row => ({ campaignId: row.campaign_id, date: row.date_start, ...normalizeMetaInsight(row) }));
}

// ── 6. Busca insights de uma campanha ───────────────────────
// periodo: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
export async function buscarInsights(campanhaId, accessToken, periodo = 'last_30d') {
  const resposta = await axios.get(`${GRAPH_URL}/${campanhaId}/insights`, {
    params: {
      fields:       'impressions,clicks,spend,reach,ctr,cpc,cpm,frequency,actions,action_values',
      date_preset:  periodo,
      access_token: accessToken,
    },
  });
  const dados = resposta.data.data;
  if (!dados.length) return null;
  const { actions, action_values, ...values } = dados[0];
  return { ...values, ...normalizeMetaInsight({ ...values, actions, action_values }) };
}

// ── Extrai erro legível da Graph API ────────────────────────
// Códigos: 190=token expirado, 200=sem permissão, 4/17=rate limit
export function extrairErroMeta(err) {
  const erroApi = err.response?.data?.error;
  if (!erroApi) return { mensagem: 'Erro ao comunicar com a API do Meta.', codigo: null };

  const mapa = {
    190: 'Token do Meta inválido ou expirado. Reconecte sua conta.',
    200: 'Permissão negada. Reconecte sua conta e autorize todas as permissões.',
    4:   'Muitas requisições ao Meta. Aguarde alguns minutos.',
    17:  'Limite de chamadas atingido. Tente novamente mais tarde.',
    100: 'Parâmetro inválido na chamada ao Meta.',
  };

  return {
    mensagem: mapa[erroApi.code] || 'Não foi possível consultar o Meta. Confira as permissões da conta.',
    codigo:   erroApi.code,
    tipo:     erroApi.type,
  };
}
