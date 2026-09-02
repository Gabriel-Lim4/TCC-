// ─────────────────────────────────────────────────────────────
// services/metaService.js — toda comunicação com a Graph API
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import env   from '../config/env.js';

const GRAPH_VERSION = 'v19.0';
const GRAPH_URL     = `https://graph.facebook.com/${GRAPH_VERSION}`;

// ── 1. Gera URL de autorização OAuth ────────────────────────
export function gerarUrlAutorizacao(state) {
  const params = new URLSearchParams({
    client_id:     env.meta.appId,
    redirect_uri:  env.meta.redirectUri,
    scope:         'ads_read,ads_management,business_management',
    response_type: 'code',
    state,
  });
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
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
  const expiraEm = new Date(Date.now() + expires_in * 1000);
  return { access_token, expiraEm };
}

// ── 4. Busca o Ad Account ID do usuário ─────────────────────
// Formato retornado: "act_123456789"
export async function buscarAdAccountId(accessToken) {
  const resposta = await axios.get(`${GRAPH_URL}/me/adaccounts`, {
    params: { fields: 'id,name,account_status', access_token: accessToken },
  });
  const contas = resposta.data.data;
  if (!contas || contas.length === 0)
    throw new Error('Nenhuma conta de anúncios encontrada para este usuário.');
  return contas[0].id;
}

// ── 5. Busca campanhas do Ad Account ────────────────────────
export async function buscarCampanhas(adAccountId, accessToken) {
  const resposta = await axios.get(`${GRAPH_URL}/${adAccountId}/campaigns`, {
    params: {
      fields:       'id,name,status,objective,created_time',
      filtering:    JSON.stringify([{
        field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'],
      }]),
      access_token: accessToken,
    },
  });
  return resposta.data.data;
}

// ── 6. Busca insights de uma campanha ───────────────────────
// periodo: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
export async function buscarInsights(campanhaId, accessToken, periodo = 'last_30d') {
  const resposta = await axios.get(`${GRAPH_URL}/${campanhaId}/insights`, {
    params: {
      fields:       'impressions,clicks,spend,reach,ctr,cpc,cpm',
      date_preset:  periodo,
      access_token: accessToken,
    },
  });
  const dados = resposta.data.data;
  return dados.length > 0 ? dados[0] : null;
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
    mensagem: mapa[erroApi.code] || erroApi.message || 'Erro desconhecido do Meta.',
    codigo:   erroApi.code,
    tipo:     erroApi.type,
  };
}
