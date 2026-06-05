// ─────────────────────────────────────────────────────────────
// controllers/metaController.js
//
// Orquestra o fluxo OAuth do Meta e as chamadas de dados.
// Usa o schema Prisma corrigido com @@unique e @unique.
// ─────────────────────────────────────────────────────────────

import { prisma }       from '../config/database.js';
import * as metaService from '../services/metaService.js';
import env              from '../config/env.js';
import crypto           from 'crypto';

// ── GET /meta/conectar ───────────────────────────────────────
export async function iniciarConexao(req, res) {
  try {
    const random = crypto.randomBytes(16).toString('hex');
    // Embute o userId no state: "123:randomhex"
    // O Meta devolve esse state intacto no callback
    const state  = `${req.usuario.id}:${random}`;

    const urlAutorizacao = metaService.gerarUrlAutorizacao(state);
    return res.status(200).json({ url: urlAutorizacao, state });
  } catch (err) {
    console.error('[META] Erro ao gerar URL:', err.message);
    return res.status(500).json({ erro: 'Erro ao iniciar conexão com o Meta.' });
  }
}

// ── GET /meta/callback ───────────────────────────────────────
export async function callback(req, res) {
  const { code, error, state } = req.query;

  if (error) {
    console.warn('[META] Usuário negou autorização:', error);
    return res.redirect(`${env.frontendUrl}/app/meta?meta=negado`);
  }

  // Extrai o userId do state: "123:randomhex"
  const userId = state?.split(':')[0];

  if (!code || !userId || isNaN(parseInt(userId))) {
    console.warn('[META] state inválido:', state);
    return res.redirect(`${env.frontendUrl}/app/meta?meta=erro`);
  }

  try {
    const tokenCurto       = await metaService.trocarCodePorToken(code);
    const { access_token } = await metaService.trocarPorTokenLongo(tokenCurto.access_token);
    const adAccountId      = await metaService.buscarAdAccountId(access_token);

    await prisma.contas_vinculadas.upsert({
      where: {
        fk_id_usuario_plataforma: {
          fk_id_usuario: parseInt(userId),
          plataforma:    'meta',
        },
      },
      update: {
        acess_token:  access_token,
        account_id:   adAccountId,
        vinculado_em: new Date(),
      },
      create: {
        fk_id_usuario: parseInt(userId),
        plataforma:    'meta',
        acess_token:   access_token,
        account_id:    adAccountId,
      },
    });

    console.log(`[META] Conta vinculada. Usuário: ${userId} | Account: ${adAccountId}`);
    return res.redirect(`${env.frontendUrl}/app/meta?meta=conectado`);

  } catch (err) {
    console.error('[META] Erro no callback:', err.message);
    if (err.response?.data?.error) {
      const { mensagem } = metaService.extrairErroMeta(err);
      console.error('[META] Erro Graph API:', mensagem);
    }
    return res.redirect(`${env.frontendUrl}/app/meta?meta=erro`);
  }
}

// ── GET /meta/status ────────────────────────────────────────
// Verifica se o usuário logado tem conta Meta vinculada.
export async function status(req, res) {
  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where:  { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
      select: { pk_id_conta: true, account_id: true, vinculado_em: true },
      // Nunca retornamos acess_token ao front
    });

    if (!conta) return res.status(200).json({ conectado: false });

    return res.status(200).json({
      conectado:    true,
      account_id:   conta.account_id,
      vinculado_em: conta.vinculado_em,
    });
  } catch (err) {
    console.error('[META] Erro ao verificar status:', err.message);
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
      campanhasApi = await metaService.buscarCampanhas(conta.account_id, conta.acess_token);
    } catch (err) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      if (codigo === 190) return res.status(401).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    // Sincroniza cada campanha no banco em paralelo
    // @unique em id_externo no schema habilita o upsert
    await Promise.all(
      campanhasApi.map(c =>
        prisma.campanhas.upsert({
          where:  { id_externo: c.id },
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
    console.error('[META] Erro ao listar campanhas:', err.message);
    return res.status(500).json({ erro: 'Erro interno ao buscar campanhas.' });
  }
}

// ── GET /meta/campanhas/:id/insights ────────────────────────
// Busca métricas de uma campanha e salva na tabela metricas.
export async function buscarInsightsCampanha(req, res) {
  const { id }      = req.params;
  const { periodo } = req.query;

  try {
    const conta = await prisma.contas_vinculadas.findFirst({
      where: { fk_id_usuario: req.usuario.id, plataforma: 'meta' },
    });
    if (!conta) return res.status(404).json({ erro: 'Conta Meta não vinculada.' });

    // Busca a campanha no banco para pegar o pk_id_campanha
    const campanha = await prisma.campanhas.findFirst({
      where: {
        id_externo: id,
        conta: { fk_id_usuario: req.usuario.id },
      },
    });
    if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });

    // Busca insights na Graph API
    let insights;
    try {
      insights = await metaService.buscarInsights(id, conta.acess_token, periodo);
    } catch (err) {
      const { mensagem, codigo } = metaService.extrairErroMeta(err);
      if (codigo === 190) return res.status(401).json({ erro: mensagem, acao: 'reconectar' });
      return res.status(502).json({ erro: mensagem });
    }

    if (!insights) {
      return res.status(200).json({ mensagem: 'Sem dados para o período informado.', insights: null });
    }

    // Salva métricas no banco
    // periodo_metrica é String no banco real — usamos a string do período
    const periodoStr      = periodo || 'last_30d';
    const camposIgnorados = ['date_start', 'date_stop'];

    const registros = Object.entries(insights)
      .filter(([chave]) => !camposIgnorados.includes(chave))
      .map(([tipo, valor]) => ({
        fk_id_campanha:  campanha.pk_id_campanha,
        tipo_metrica:    tipo,
        valor_metrica:   parseFloat(valor) || 0,
        periodo_metrica: periodoStr,
      }));

    await prisma.metricas.createMany({ data: registros, skipDuplicates: true });

    return res.status(200).json({
      campanha_id: id,
      periodo:     periodoStr,
      insights,
    });
  } catch (err) {
    console.error('[META] Erro ao buscar insights:', err.message);
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
    console.error('[META] Erro ao desconectar:', err.message);
    return res.status(500).json({ erro: 'Erro ao desconectar conta Meta.' });
  }
}
