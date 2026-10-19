// ─────────────────────────────────────────────────────────────
// controllers/metaController.js
//
// Orquestra o fluxo OAuth do Meta e as chamadas de dados.
// Usa o schema Prisma corrigido com @@unique e @unique.
// ─────────────────────────────────────────────────────────────

import { openToken, sealToken } from '../services/tokenVault.js';
import { prisma }       from '../config/database.js';
import * as metaService from '../services/metaService.js';
import env              from '../config/env.js';
import { saveMetrics } from '../services/metricsStore.js';
import { summarizeMetrics } from '../services/metricsSummary.js';
import jwt from 'jsonwebtoken';
import { insightPeriodSchema } from '../validators/metricasValidator.js';


// ── GET /meta/conectar ───────────────────────────────────────
// Gera URL de autorização e state CSRF. Front redireciona o browser.
export async function iniciarConexao(req, res) {
  if (!(env.meta.appId && env.meta.appSecret && env.meta.redirectUri)) return res.status(503).json({ erro: 'Integração ainda não configurada pelo administrador.' });
  try {
    const state = jwt.sign(
      {
        userId: req.usuario.id,
        finalidade: 'meta-oauth',
      },
      env.jwt.secret,
      {
        expiresIn: '10m',
      }
    );

    const urlAutorizacao = metaService.gerarUrlAutorizacao(state);

    return res.status(200).json({
      url: urlAutorizacao,
    });

  } catch (err) {
    console.error('[META] Erro ao iniciar OAuth:');

    return res.status(500).json({
      erro: 'Não foi possível iniciar a conexão com o Meta.',
    });
  }
}

// ── GET /meta/callback ───────────────────────────────────────
// Rota PÚBLICA — o Meta redireciona o browser aqui após autorização.
// O usuário é identificado pelo state assinado e validado abaixo.
export async function callback(req, res) {
  const { code, error, state } = req.query;

if (error) {
  return res.redirect(`${env.frontendUrl}/app/account?meta=negado`);
}

if (!code || !state) {
  console.error('[META] Callback sem code/state:', { temCode: !!code, temState: !!state });
  return res.redirect(`${env.frontendUrl}/app/account?meta=erro`);
}

let userId;

try {
  const payload = jwt.verify(state, env.jwt.secret);

  if (payload.finalidade !== 'meta-oauth') {
    return res.redirect(`${env.frontendUrl}/app/account?meta=erro`);
  }

  userId = payload.userId;

} catch (err) {
  console.error('[META] State OAuth inválido:', err.name, err.message);

  return res.redirect(`${env.frontendUrl}/app/account?meta=erro`);
}
 

  try {
    // Troca code → token curto → token longo
    const tokenCurto              = await metaService.trocarCodePorToken(code);
    const { access_token, expiraEm } = await metaService.trocarPorTokenLongo(tokenCurto.access_token);

    // Busca o Ad Account ID da conta de anúncios do usuário
    const existingAccount = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: Number(userId), plataforma: 'meta' },
      select: { account_id: true },
    });
    const adAccountId             = await metaService.buscarAdAccountId(access_token, existingAccount?.account_id);

    if (existingAccount && existingAccount.account_id !== adAccountId) {
      return res.redirect(`${env.frontendUrl}/app/account?meta=troca-bloqueada`);
    }

    // upsert: cria ou atualiza a conta vinculada
    // @@unique([fk_id_usuario, plataforma]) no schema habilita isso
    await prisma.contas_vinculadas.upsert({
      where: {
        fk_id_usuario_plataforma: {
          fk_id_usuario: parseInt(userId),
          plataforma:    'meta',
        },
      },
      update: {
        acess_token:  sealToken(access_token),
        token_expires_at: expiraEm,
        account_id:   adAccountId,
        vinculado_em: new Date(),
      },
      create: {
        fk_id_usuario: parseInt(userId),
        plataforma:    'meta',
        acess_token:   sealToken(access_token),
        token_expires_at: expiraEm,
        account_id:    adAccountId,
      },
    });

    console.log(`[META] Conta vinculada. Usuário: ${userId} | Account: ${adAccountId}`);
    return res.redirect(`${env.frontendUrl}/app/account?meta=conectado`);

  } catch (err) {
    if (err.code === 'SEM_CONTA') {
      return res.redirect(`${env.frontendUrl}/app/account?meta=sem-conta`);
    }
    console.error('[META] Erro no callback:', err.code, err.message);
    const erroApi = err.response?.data?.error;
    if (erroApi) {
      console.error('[META] Erro Graph API:', {
        url: err.config?.url, code: erroApi.code, subcode: erroApi.error_subcode,
        type: erroApi.type, message: erroApi.message, fbtrace_id: erroApi.fbtrace_id,
      });
    }
    return res.redirect(`${env.frontendUrl}/app/account?meta=erro`);
  }
}

// ── GET /meta/status ────────────────────────────────────────
// Verifica se o usuário logado tem conta Meta vinculada.
export async function status(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where:  { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
      select: { pk_id_conta: true, account_id: true, vinculado_em: true, account_name: true, currency: true, token_expires_at: true },
      // Nunca retornamos acess_token ao front
    });

    if (!conta) return res.status(200).json({ conectado: false, configured: Boolean(env.meta.appId && env.meta.appSecret && env.meta.redirectUri) });

    return res.status(200).json({
      conectado:    true,
      configured: Boolean(env.meta.appId && env.meta.appSecret && env.meta.redirectUri),
      account_id:   conta.account_id,
      account_name: conta.account_name, currency: conta.currency, token_expires_at: conta.token_expires_at,
      vinculado_em: conta.vinculado_em,
    });
  } catch (err) {
    console.error('[META] Erro ao verificar status:');
    return res.status(500).json({ erro: 'Erro ao verificar conexão com o Meta.' });
  }
}

// ── GET /meta/campanhas ──────────────────────────────────────
// Busca campanhas na Graph API e sincroniza no banco.
export async function listarCampanhas(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
    });

    if (!conta) {
      return res.status(404).json({ erro: 'Nenhuma conta Meta vinculada. Conecte sua conta primeiro.' });
    }

    // Busca na Graph API
    let campanhasApi;
    try {
      campanhasApi = await metaService.buscarCampanhas(conta.account_id, openToken(conta.acess_token));
    } catch (err) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      if (codigo === 190) return res.status(409).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    // Sincroniza cada campanha no banco em paralelo
    // @unique em id_externo no schema habilita o upsert
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
    console.error('[META] Erro ao listar campanhas:');
    return res.status(500).json({ erro: 'Erro interno ao buscar campanhas.' });
  }
}

// ── GET /meta/campanhas/:id/insights ────────────────────────
// Busca métricas de uma campanha e salva na tabela metricas.
export async function buscarInsightsCampanha(req, res) {
  const { id }      = req.params;
  const result = insightPeriodSchema.safeParse(req.query.periodo);
  if (!result.success) return res.status(400).json({ erro: 'Período inválido.' });
  const periodo = result.data;

  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
    });
    if (!conta) return res.status(404).json({ erro: 'Conta Meta não vinculada.' });

    // Busca a campanha no banco para pegar o pk_id_campanha
    const campanha = await prisma.campanhas.findFirst({
      where: {
        id_externo: id,
        fk_id_conta: conta.pk_id_conta,
      },
    });
    if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });

    // Busca insights na Graph API
    let insights;
    try {
      insights = await metaService.buscarInsights(id, openToken(conta.acess_token), periodo);
    } catch (err) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      if (codigo === 190) return res.status(409).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    if (!insights) {
      await saveMetrics(campanha.pk_id_campanha, periodo, { impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0, revenue: 0, ctr: 0, cpc: 0, cpm: 0, frequency: 0 });
      return res.status(200).json({ mensagem: 'Sem dados para o período informado.', insights: null });
    }

    const periodoStr = periodo || 'last_30d';
    await saveMetrics(campanha.pk_id_campanha, periodoStr, insights);

    return res.status(200).json({
      campanha_id: id,
      periodo:     periodoStr,
      insights,
    });
  } catch (err) {
    console.error('[META] Erro ao buscar insights:');
    return res.status(500).json({ erro: 'Erro interno ao buscar insights.' });
  }
}

// ── DELETE /meta/desconectar ─────────────────────────────────
// Remove a conta Meta vinculada (cascade apaga campanhas e métricas).
export async function desconectar(req, res) {
  try {
    const deletado = await prisma.contas_vinculadas.deleteMany({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
    });

    if (deletado.count === 0)
      return res.status(404).json({ erro: 'Nenhuma conta Meta vinculada encontrada.' });

    return res.status(200).json({ mensagem: 'Conta Meta desvinculada com sucesso.' });
  } catch (err) {
    console.error('[META] Erro ao desconectar:');
    return res.status(500).json({ erro: 'Erro ao desconectar conta Meta.' });
  }
}
// metaController.js
export async function resumoInsights(req, res) {
  const result = insightPeriodSchema.safeParse(req.query.periodo);
  if (!result.success) return res.status(400).json({ erro: 'Período inválido.' });
  const periodo = result.data;

  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
    });
    if (!conta) return res.status(404).json({ erro: 'Conta não vinculada.' });

    const campanhas = await prisma.campanhas.findMany({
      where:  { fk_id_conta: conta.pk_id_conta },
      select: { pk_id_campanha: true, id_externo: true },
    });

    const results = [];
    for (let index = 0; index < campanhas.length; index += 4) {
      const batch = await Promise.all(campanhas.slice(index, index + 4).map(async campaign => {
        const insights = await metaService.buscarInsights(campaign.id_externo, openToken(conta.acess_token), periodo);
        // An empty period must clear the previous snapshot rather than retain stale totals.
        const values = insights || { impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0, revenue: 0, ctr: 0, cpc: 0, cpm: 0, frequency: 0 };
        await saveMetrics(campaign.pk_id_campanha, periodo, values);
        return { id: campaign.id_externo, campaignId: campaign.pk_id_campanha, insights: values, hasData: Boolean(insights) };
      }));
      results.push(...batch);
    }
    const rows = results.flatMap(result => Object.entries(result.insights)
      .filter(([type]) => !['date_start', 'date_stop'].includes(type))
      .map(([type, value]) => ({ fk_id_campanha: result.campaignId, periodo_metrica: periodo, tipo_metrica: type, valor_metrica: value })));
    const totais = summarizeMetrics(rows);
    return res.status(200).json({
      periodo, totais,
      campanhas_com_dados: results.filter(result => result.hasData).length,
      campanhas: results.map(result => ({ id: result.id, insights: result.insights })),
    });

  } catch (err) {
    if (err.response) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      return res.status(codigo === 190 ? 409 : 502).json({ erro: mensagem, ...(codigo === 190 ? { acao: 'reconectar' } : {}) });
    }
    console.error('[META] Erro ao buscar resumo:');
    return res.status(500).json({ erro: 'Erro interno ao buscar resumo.' });
  }
}