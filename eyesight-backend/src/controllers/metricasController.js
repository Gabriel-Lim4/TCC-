// ─────────────────────────────────────────────────────────────
// controllers/metricasController.js
//
// Dashboard de métricas: listagem, filtros, agregações
// e exportação de dados de campanhas.
//
// GET  /metricas/campanhas          — lista campanhas do usuário
// GET  /metricas/campanhas/:id      — detalhes + métricas de uma campanha
// GET  /metricas/geral              — métricas agregadas de todas as campanhas
// GET  /metricas/exportar           — exporta métricas em CSV
// ─────────────────────────────────────────────────────────────

import { prisma } from '../config/database.js';
import { latestMetrics, summarizeMetrics } from '../services/metricsSummary.js';
import {
  listarCampanhasQuerySchema,
  detalharCampanhaQuerySchema,
  metricasGeraisQuerySchema,
  exportarMetricasQuerySchema,
  resumoUnificadoQuerySchema,
} from '../validators/metricasValidator.js';

// ── GET /metricas/campanhas ──────────────────────────────────
// Lista todas as campanhas do usuário com contagem de métricas.
export async function listarCampanhas(req, res) {
  const result = listarCampanhasQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Parâmetros de query inválidos.',
      detalhes: errors,
    });
  }
  try {
    const campanhas = await prisma.campanhas.findMany({
      where: {
        conta: { fk_id_usuario: req.usuario.id },
      },
      include: {
        conta: {
          select: { plataforma: true, account_id: true },
        },
        metricas: {
          take: 1,
          orderBy: { coletado_em: 'desc' },
        },
      },
      orderBy: { sincronizado_em: 'desc' },
    });

    return res.status(200).json({
      campanhas,
      total: campanhas.length,
    });
  } catch (err) {
    console.error('[METRICAS] Erro ao listar campanhas:');
    return res.status(500).json({ erro: 'Erro ao listar campanhas.' });
  }
}

// ── GET /metricas/campanhas/:id ──────────────────────────────
// Detalhes de uma campanha com todas as suas métricas.
export async function detalharCampanha(req, res) {
  const { id } = req.params;
  const { periodo } = req.query;

  try {
    const campanha = await prisma.campanhas.findFirst({
      where: {
        pk_id_campanha: parseInt(id),
        conta: { fk_id_usuario: req.usuario.id },
      },
      include: {
        conta: {
          select: { plataforma: true, account_id: true },
        },
        metricas: periodo
          ? { where: { periodo_metrica: periodo } }
          : true,
        _count: {
          select: { metricas: true, analises: true },
        },
      },
    });

    if (!campanha) {
      return res.status(404).json({ erro: 'Campanha não encontrada.' });
    }

    return res.status(200).json({ campanha });
  } catch (err) {
    console.error('[METRICAS] Erro ao detalhar campanha:');
    return res.status(500).json({ erro: 'Erro ao detalhar campanha.' });
  }
}

// ── GET /metricas/geral ──────────────────────────────────────
// Métricas agregadas de todas as campanhas do usuário.
export async function metricasGerais(req, res) {
  const result = metricasGeraisQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Parâmetros de query inválidos.',
      detalhes: errors,
    });
  }

  const { periodo } = result.data;

  try {
    const metricas = await prisma.metricas.findMany({
      where: {
        campanha: {
          conta: { fk_id_usuario: req.usuario.id },
        },
        periodo_metrica: periodo,
      },
      include: {
        campanha: {
          select: {
            pk_id_campanha: true,
            nome_campanha: true,
            id_externo: true,
            status_campanha: true,
            conta: {
              select: { plataforma: true },
            },
          },
        },
      },
      orderBy: { coletado_em: 'desc' },
    });

    const latest = latestMetrics(metricas);

    // Agrega métricas por campanha
    const porCampanha = {};
    for (const m of latest) {
      const cid = m.campanha.pk_id_campanha;
      if (!porCampanha[cid]) {
        porCampanha[cid] = {
          campanha_id: cid,
          nome_campanha: m.campanha.nome_campanha,
          plataforma: m.campanha.conta.plataforma,
          status_campanha: m.campanha.status_campanha,
          metricas: {},
        };
      }
      porCampanha[cid].metricas[m.tipo_metrica] = m.valor_metrica != null ? Number(m.valor_metrica) : 0;
    }

    const totais = summarizeMetrics(latest);

    return res.status(200).json({
      periodo,
      totais,
      campanhas: Object.values(porCampanha),
      total_registros: latest.length,
    });
  } catch (err) {
    console.error('[METRICAS] Erro ao buscar métricas gerais:');
    return res.status(500).json({ erro: 'Erro ao buscar métricas gerais.' });
  }
}

// ── GET /metricas/exportar ───────────────────────────────────
// Exporta métricas em formato CSV.
export async function exportarMetricas(req, res) {
  const result = exportarMetricasQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Parâmetros de query inválidos.',
      detalhes: errors,
    });
  }

  const { periodo } = result.data;

  try {
    const where = {
      campanha: {
        conta: { fk_id_usuario: req.usuario.id },
      },
    };

    if (periodo) {
      where.periodo_metrica = periodo;
    }

    // Limite de segurança para evitar memory overflow em exports grandes
    const MAX_REGISTROS = 10000;
    const metricas = await prisma.metricas.findMany({
      where,
      include: {
        campanha: {
          select: {
            nome_campanha: true,
            id_externo: true,
            conta: { select: { plataforma: true } },
          },
        },
      },
      orderBy: { coletado_em: 'desc' },
      take: MAX_REGISTROS,
    });

    if (metricas.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma métrica encontrada para exportar.' });
    }

    // Monta CSV
    const header = 'Campanha,Plataforma,Tipo,Valor,Período,Coletado Em\n';
    const linhas = metricas.map(m => {
      const nome = `"${m.campanha.nome_campanha.replace(/"/g, '""')}"`;
      return `${nome},${m.campanha.conta.plataforma},${m.tipo_metrica},${Number(m.valor_metrica)},${m.periodo_metrica},${m.coletado_em.toISOString()}`;
    }).join('\n');

    const csv = header + linhas;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="metricas_${periodo || 'todas'}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[METRICAS] Erro ao exportar métricas:');
    return res.status(500).json({ erro: 'Erro ao exportar métricas.' });
  }
}
// ── GET /metricas/resumo ────────────────────────────────────
// Agrega métricas de Meta + Google em formato unificado.
// Usado pela página Metrics.jsx para eliminar hardcode.
export async function resumoUnificado(req, res) {
  const result = resumoUnificadoQuerySchema.safeParse(req.query);

  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      erro: 'Parâmetros de query inválidos.',
      detalhes: errors,
    });
  }

  const { periodo } = result.data;

  try {
    // Busca todas as métricas do usuário (ambas plataformas)
    const metricas = await prisma.metricas.findMany({
      where: {
        campanha: {
          conta: { fk_id_usuario: req.usuario.id },
        },
        periodo_metrica: periodo,
      },
      include: {
        campanha: {
          select: {
            nome_campanha: true,
            conta: { select: { plataforma: true } },
          },
        },
      },
      orderBy: { coletado_em: 'desc' },
    });

    const latest = latestMetrics(metricas);
    const totals = summarizeMetrics(latest);
    const { spend = 0, clicks = 0, impressions = 0, conversions = 0, reach = 0 } = totals;
    const totais = {
      spend, clicks, impressoes: impressions, conversoes: conversions,
      alcance: reach, ctr: totals.ctr, cpc: totals.cpc, cpm: totals.cpm,
      roi: totals.revenue != null && spend > 0 ? (totals.revenue - spend) / spend : null,
    };
    const platforms = [...new Set(latest.map(row => row.campanha.conta.plataforma))];
    const porPlataforma = platforms.map(platform => {
      const summary = summarizeMetrics(latest.filter(row => row.campanha.conta.plataforma === platform));
      return {
        nome: platform === 'meta' ? 'Meta Ads' : platform === 'google' ? 'Google Ads' : platform,
        chave: platform,
        spend: summary.spend || 0,
        clicks: summary.clicks || 0,
        impressoes: summary.impressions || 0,
        conversoes: summary.conversions || 0,
        alcance: summary.reach || 0,
        ctr: summary.ctr,
      };
    });

    // Funil de conversão
    const funil = [
      { name: 'Impressões', value: impressions },
      { name: 'Cliques', value: clicks },
      { name: 'Conversões', value: conversions },
    ];

    return res.status(200).json({
      periodo,
      totais,
      porPlataforma,
      funil,
      total_registros: latest.length,
    });
  } catch (err) {
    console.error('[METRICAS] Erro ao buscar resumo unificado:');
    return res.status(500).json({ erro: 'Erro ao buscar resumo unificado.' });
  }
}
