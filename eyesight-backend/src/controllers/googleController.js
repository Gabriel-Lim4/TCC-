// ─────────────────────────────────────────────────────────────
// controllers/googleController.js
//
// Orquestra o fluxo OAuth do Google Ads e as chamadas de dados.
// ────────────────────────────────────────────────────────────

import { sealToken } from '../services/tokenVault.js';
import { prisma } from '../config/database.js';
import * as googleService from '../services/googleService.js';
import env from '../config/env.js';
import { saveMetrics } from '../services/metricsStore.js';
import { getGoogleAccessToken } from '../services/platformSyncService.js';
import { resolveDateRange } from '../services/dateRange.js';
import jwt from 'jsonwebtoken';


// ── GET /google/conectar ───────────────────────────────────────
// Gera URL de autorização e state CSRF. Front redireciona o browser.
export async function iniciarConexaoGoogle(req, res) {
  if (!(env.google.clientId && env.google.clientSecret && env.google.redirectUri && env.google.developerToken)) return res.status(503).json({ erro: 'Integração ainda não configurada pelo administrador.' });
  try {
    const state = jwt.sign(
      {
        userId: req.usuario.id,
        finalidade: 'google-oauth',
      },
      env.jwt.secret,
      {
        expiresIn: '10m',
      }
    );

    const urlAutorizacao = googleService.gerarUrlAutorizacaoGoogle(state);

    return res.status(200).json({
      url: urlAutorizacao,
    });

  } catch (err) {
    console.error('[GOOGLE] Erro ao iniciar OAuth:');
    return res.status(500).json({
      erro: 'Não foi possível iniciar a conexão com o Google Ads.',
    });
  }
}

// ── GET /google/callback ───────────────────────────────────────
// Rota PÚBLICA — o Google redireciona o browser aqui após autorização.
// Não tem JWT: o userId vem como query param passado pelo front.
export async function callbackGoogle(req, res) {
  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(`${env.frontendUrl}/app/account?google=negado`);
  }

  if (!code || !state) {
    return res.redirect(`${env.frontendUrl}/app/account?google=erro`);
  }

  let userId;

  try {
    const payload = jwt.verify(state, env.jwt.secret);

    if (payload.finalidade !== 'google-oauth') {
      return res.redirect(`${env.frontendUrl}/app/account?google=erro`);
    }

    userId = payload.userId;

  } catch (err) {
    console.error('[GOOGLE] State OAuth inválido:');
    return res.redirect(`${env.frontendUrl}/app/account?google=erro`);
  }

  try {
    // Troca code → token
    const tokenData = await googleService.trocarCodePorTokenGoogle(code);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Busca o customer ID da conta de anúncios do usuário
    const customerId = await googleService.buscarClienteGoogle(accessToken);

    const existingAccount = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: Number(userId), plataforma: 'google' },
      select: { account_id: true },
    });
    if (existingAccount && existingAccount.account_id !== customerId) {
      return res.redirect(`${env.frontendUrl}/app/account?google=troca-bloqueada`);
    }

    // upsert: cria ou atualiza a conta vinculada
    // @unique([fk_id_usuario, plataforma]) no schema habilita isso
    await prisma.contas_vinculadas.upsert({
      where: {
        fk_id_usuario_plataforma: {
          fk_id_usuario: parseInt(userId),
          plataforma:    'google',
        },
      },
      update: {
        acess_token:  sealToken(accessToken),
        account_id:   customerId,
        ...(refreshToken ? { refresh_token: sealToken(refreshToken) } : {}),
        token_expires_at: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000),
        vinculado_em: new Date(),
      },
      create: {
        fk_id_usuario: parseInt(userId),
        plataforma:    'google',
        acess_token:   sealToken(accessToken),
        account_id:    customerId,
        ...(refreshToken ? { refresh_token: sealToken(refreshToken) } : {}),
        token_expires_at: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000),
      },
    });

    console.log(`[GOOGLE] Conta vinculada. Usuário: ${userId} | Customer: ${customerId}`);
    return res.redirect(`${env.frontendUrl}/app/account?google=conectado`);

  } catch (err) {
    if (err.code === 'SEM_CONTA') {
      return res.redirect(`${env.frontendUrl}/app/account?google=sem-conta`);
    }
    console.error('[GOOGLE] Erro no callback:');
    if (err.response?.data?.errors) {
      const { mensagem } = googleService.extrairErroGoogle(err);
      console.error('[GOOGLE] Erro Graph API:');
    }
    return res.redirect(`${env.frontendUrl}/app/account?google=erro`);
  }
}

// ── GET /google/status ────────────────────────────────────────
// Verifica se o usuário logado tem conta Google Ads vinculada.
export async function status(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where:  { fk_id_usuario: req.usuario.id, plataforma: 'google' },
      select: { pk_id_conta: true, account_id: true, vinculado_em: true, account_name: true, currency: true, token_expires_at: true },
    });

    if (!conta) return res.status(200).json({ conectado: false, configured: Boolean(env.google.clientId && env.google.clientSecret && env.google.redirectUri && env.google.developerToken) });

    return res.status(200).json({
      conectado:    true,
      configured: Boolean(env.google.clientId && env.google.clientSecret && env.google.redirectUri && env.google.developerToken),
      account_id:   conta.account_id,
      account_name: conta.account_name, currency: conta.currency, token_expires_at: conta.token_expires_at,
      vinculado_em: conta.vinculado_em,
    });
  } catch (err) {
    console.error('[GOOGLE] Erro ao verificar status:');
    return res.status(500).json({ erro: 'Erro ao verificar conexão com o Google Ads.' });
  }
}

// ── GET /google/campanhas ──────────────────────────────────────
// Busca campanhas na Google Ads API e sincroniza no banco.
export async function listarCampanhasGoogle(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'google' },
    });

    if (!conta) {
      return res.status(404).json({ erro: 'Nenhuma conta Google Ads vinculada. Conecte sua conta primeiro.' });
    }

    // Busca na Google Ads API
    let campanhasApi;
    try {
      campanhasApi = await googleService.buscarCampanhasGoogle(conta.account_id, await getGoogleAccessToken(conta));
    } catch (err) {
      const { mensagem, codigo } = googleService.extrairErroGoogle(err);
      if (codigo === 190 || codigo === 'UNAUTHENTICATED') return res.status(409).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    // Sincroniza cada campanha no banco em paralelo
    await Promise.all(
      campanhasApi.map(c =>
        prisma.campanhas.upsert({
          where: {
            fk_id_conta_id_externo: {
              fk_id_conta: conta.pk_id_conta,
              id_externo: c.id,
            },
          },
          update: {
            nome_campanha:   c.name,
            status_campanha: c.status,
            objetivo:        c.objective || null,
            sincronizado_em: new Date(),
          },
          create: {
            fk_id_conta:     conta.pk_id_conta,
            id_externo:      c.id,
            nome_campanha:   c.name,
            status_campanha: c.status,
            objetivo:        c.objective || null,
          },
        })
      )
    );

    return res.status(200).json({
      campanhas:    campanhasApi,
      total:        campanhasApi.length,
      sincronizado: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GOOGLE] Erro ao listar campanhas:');
    return res.status(500).json({ erro: 'Erro interno ao buscar campanhas.' });
  }
}

// ── GET /google/campanhas/:id/insights ────────────────────────
// Busca métricas de uma campanha e salva na tabela metricas.
export async function buscarInsightsCampanhaGoogle(req, res) {
  const { id }      = req.params;
  let range;
  try { range = resolveDateRange(req.query); } catch { return res.status(400).json({ erro: 'Período inválido.' }); }
  const periodo = range.period;

  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'google' },
    });
    if (!conta) return res.status(404).json({ erro: 'Conta Google Ads não vinculada.' });

    // Busca a campanha no banco para pegar o pk_id_campanha
    const campanha = await prisma.campanhas.findFirst({
      where: {
        id_externo: id,
        fk_id_conta: conta.pk_id_conta,
      },
    });
    if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });

    // Busca insights na Google Ads API
    let insights;
    try {
      const rows = await googleService.buscarInsightsDiariosGoogle(conta.account_id, await getGoogleAccessToken(conta), range, id);
      insights = rows.reduce((total, row) => {
        for (const key of Object.keys(total)) total[key] += row[key] || 0;
        return total;
      }, { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });
      insights.ctr = insights.impressions ? insights.clicks / insights.impressions * 100 : 0;
      insights.cpc = insights.clicks ? insights.spend / insights.clicks : 0;
      insights.cpm = insights.impressions ? insights.spend / insights.impressions * 1000 : 0;
    } catch (err) {
      const { mensagem, codigo } = googleService.extrairErroGoogle(err);
      if (codigo === 190 || codigo === 'UNAUTHENTICATED') return res.status(409).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    if (!insights) {
      return res.status(200).json({ mensagem: 'Sem dados para o período informado.', insights: null });
    }

    await saveMetrics(campanha.pk_id_campanha, periodo, insights);

    return res.status(200).json({
      campanha_id: id,
      periodo:     periodo || 'last_30d',
      insights,
    });
  } catch (err) {
    console.error('[GOOGLE] Erro ao buscar insights:');
    return res.status(500).json({ erro: 'Erro interno ao buscar insights.' });
  }
}

// ── DELETE /google/desconectar ─────────────────────────────────
// Remove a conta Google Ads vinculada (cascade apaga campanhas e métricas).
export async function desconectarGoogle(req, res) {
  try {
    const deletado = await prisma.contas_vinculadas.deleteMany({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'google' },
    });

    if (deletado.count === 0)
      return res.status(404).json({ erro: 'Nenhuma conta Google Ads vinculada encontrada.' });

    return res.status(200).json({ mensagem: 'Conta Google Ads desvinculada com sucesso.' });
  } catch (err) {
    console.error('[GOOGLE] Erro ao desconectar:');
    return res.status(500).json({ erro: 'Erro ao desconectar conta Google Ads.' });
  }
}