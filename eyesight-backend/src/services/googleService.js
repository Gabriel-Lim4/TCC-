// ─────────────────────────────────────────────────────────────
// services/googleService.js — toda comunicação com a Google Ads API
// ─────────────────────────────────────────────────────────────

import axios from 'axios';
import env from '../config/env.js';

const GOOGLE_ADS_VERSION = env.google.apiVersion || 'v23';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_VERSION}`;
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ── 1. Gera URL de autorização OAuth ────────────────────────
export function gerarUrlAutorizacaoGoogle(state) {
  const params = new URLSearchParams({
    client_id:     env.google.clientId,
    redirect_uri:  env.google.redirectUri,
    scope:         'https://www.googleapis.com/auth/adwords',
    response_type: 'code',
    state,
    access_type:   'offline',
    prompt:        'consent',
  });
  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

// ── 2. Troca o code temporário por token ──────────────────────
export async function trocarCodePorTokenGoogle(code) {
  const resposta = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
    code,
    client_id:     env.google.clientId,
    client_secret: env.google.clientSecret,
    redirect_uri:  env.google.redirectUri,
    grant_type:    'authorization_code',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  });
  return resposta.data; // { access_token, refresh_token, expires_in }
}

// ── 3. Atualiza token usando refresh token ─────────────────────
export async function atualizarTokenGoogle(refreshToken) {
  const resposta = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
    refresh_token:  refreshToken,
    client_id:      env.google.clientId,
    client_secret:  env.google.clientSecret,
    grant_type:     'refresh_token',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  });
  return resposta.data; // { access_token, expires_in }
}

// Headers padrão para todas as requisições à Google Ads API
function googleAdsHeaders(accessToken) {
  return {
    'Authorization':  `Bearer ${accessToken}`,
    'developer-token': env.google.developerToken,
    'Content-Type':   'application/json',
    ...(env.google.loginCustomerId ? { 'login-customer-id': validateGoogleId(env.google.loginCustomerId) } : {}),
  };
}

// ── 4. Busca contas de cliente do Google Ads ──────────────────
// Retorna o customer ID (ex: "1234567890")
export async function buscarClienteGoogle(accessToken) {
  if (env.google.customerId) {
    const id = validateGoogleId(env.google.customerId);
    // The authenticated customer query verifies access, including through an MCC.
    // Never fall back to another account if the explicitly selected one is denied.
    const account = await buscarContaGoogle(id, accessToken);
    if (!account || account.manager || validateGoogleId(account.id) !== id) {
      throw Object.assign(new Error('A conta configurada não é uma conta de anúncios acessível.'), { code: 'SEM_CONTA' });
    }
    return id;
  }
  const resposta = await axios.get(
    `${GOOGLE_ADS_BASE_URL}/customers:listAccessibleCustomers`,
    { headers: googleAdsHeaders(accessToken) }
  );
  const resourceNames = resposta.data.resourceNames || [];
  if (!resourceNames || resourceNames.length === 0) {
    const e = new Error('Nenhuma conta de cliente Google Ads encontrada.');
    e.code = 'SEM_CONTA';
    throw e;
  }
  // resourceName no formato: "customers/1234567890"
  for (const resource of resourceNames) {
    const id = validateGoogleId(resource.replace('customers/', ''));
    const account = await buscarContaGoogle(id, accessToken);
    if (!account?.manager) return id;
    if (!env.google.loginCustomerId || validateGoogleId(env.google.loginCustomerId) !== id) continue;
    const clients = await searchGoogle(id, accessToken,
      'SELECT customer_client.id, customer_client.manager, customer_client.status FROM customer_client WHERE customer_client.manager = FALSE');
    const client = clients.find(row => row.customerClient?.status === 'ENABLED');
    if (client) return validateGoogleId(client.customerClient.id);
  }
  throw Object.assign(new Error('Nenhuma conta de anúncios disponível.'), { code: 'SEM_CONTA' });
}

export function validateGoogleId(value) {
  const id = String(value).replaceAll('-', '');
  if (!/^\d+$/.test(id)) throw new Error('Identificador Google Ads inválido.');
  return id;
}

export async function searchGoogle(customerId, accessToken, query) {
  const rows = [];
  let pageToken;
  const seen = new Set();
  do {
    const response = await axios.post(
      `${GOOGLE_ADS_BASE_URL}/customers/${validateGoogleId(customerId)}/googleAds:search`,
      { query, ...(pageToken ? { pageToken } : {}) },
      { headers: googleAdsHeaders(accessToken), timeout: 30000 },
    );
    rows.push(...(response.data.results || []));
    pageToken = response.data.nextPageToken;
    if (pageToken && seen.has(pageToken)) throw new Error('Paginação Google inválida.');
    if (pageToken) seen.add(pageToken);
  } while (pageToken);
  return rows;
}

export async function buscarContaGoogle(customerId, accessToken) {
  const rows = await searchGoogle(customerId, accessToken,
    'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer LIMIT 1');
  return rows[0]?.customer;
}

export async function buscarCampanhasGoogle(customerId, accessToken) {
  const rows = await searchGoogle(customerId, accessToken,
    "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign WHERE campaign.status != 'REMOVED'");
  return rows.map(({ campaign }) => ({
    id: campaign.id, name: campaign.name, status: campaign.status,
    objective: campaign.advertisingChannelType,
  }));
}

export async function buscarInsightsDiariosGoogle(customerId, accessToken, range, campaignId) {
  if (![range.since, range.until].every(date => /^\d{4}-\d{2}-\d{2}$/.test(date))) {
    throw new Error('Datas inválidas.');
  }
  const rows = await searchGoogle(customerId, accessToken, `
    SELECT campaign.id, segments.date, metrics.impressions, metrics.clicks,
      metrics.cost_micros, metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${range.since}' AND '${range.until}'
      ${campaignId ? `AND campaign.id = ${validateGoogleId(campaignId)}` : ''}`);
  return rows.map(({ campaign, segments, metrics }) => ({
    campaignId: campaign.id, date: segments.date,
    impressions: Number(metrics.impressions) || 0, clicks: Number(metrics.clicks) || 0,
    spend: (Number(metrics.costMicros) || 0) / 1000000,
    conversions: Number(metrics.conversions) || 0,
    // This is the configured conversion value, not necessarily sales revenue.
    revenue: Number(metrics.conversionsValue) || 0,
  }));
}

// ── Extrai erro legível da Google Ads API ──────────────────────
export function extrairErroGoogle(err) {
  // Erros da Google Ads API vêm em `err.response.data.error.details`
  const erroApi = err.response?.data?.error;
  if (!erroApi) {
    return { mensagem: 'Erro ao comunicar com a API do Google Ads.', codigo: null };
  }

  const details = erroApi.details || [];
  const googleAdsError = details.find(d => d['@type']?.includes('GoogleAdsFailure'));
  const firstError = googleAdsError?.errors?.[0];

  const mapa = {
    UNAUTHENTICATED:   'Token do Google Ads inválido ou expirado. Reconecte sua conta.',
    PERMISSION_DENIED: 'Permissão negada. Verifique se o Developer Token está aprovado e reconecte.',
    QUOTA_EXCEEDED:    'Muitas requisições ao Google Ads. Aguarde alguns minutos.',
    RATE_EXCEEDED:     'Limite de chamadas atingido. Tente novamente mais tarde.',
    INVALID_ARGUMENT:  'Parâmetro inválido na chamada ao Google Ads.',
  };

  const httpStatus = erroApi.status || '';
  const codigo = firstError?.errorCode ? Object.values(firstError.errorCode)[0] : httpStatus;

  return {
    mensagem: mapa[httpStatus] || mapa[codigo] || 'Não foi possível consultar o Google Ads. Confira a configuração e as permissões da conta.',
    codigo,
    tipo: erroApi.status,
  };
}