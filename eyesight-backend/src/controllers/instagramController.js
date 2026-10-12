import { prisma } from '../config/database.js';
import { openToken, sealToken } from '../services/tokenVault.js';
import { graphList, extrairErroMeta } from '../services/metaService.js';
import { resolveDateRange } from '../services/dateRange.js';
import axios from 'axios';
import env from '../config/env.js';

const GRAPH_URL = `https://graph.facebook.com/${env.meta.graphVersion}`;

async function findInstagram(userId) {
  const account = await prisma.contas_vinculadas.findFirst({
    where: { fk_id_usuario: userId, plataforma: 'meta' }, select: { acess_token: true },
  });
  if (!account) return { reason: 'conta_meta_nao_vinculada' };
  // Instagram Business is linked to a Facebook Page, not to the /me user node.
  const token = openToken(account.acess_token);
  const pages = await graphList('me/accounts', token, {
    fields: 'id,instagram_business_account{id,username}',
  });
  const instagram = pages.find(page => page.instagram_business_account)?.instagram_business_account;
  return instagram ? { instagram, token } : { reason: 'sem_conta_instagram' };
}

function sendError(res, error) {
  const { mensagem, codigo } = extrairErroMeta(error);
  return res.status(502).json({ erro: mensagem, ...(codigo === 190 ? { acao: 'reconectar' } : {}) });
}

export async function statusInstagram(req, res) {
  try {
    const result = await findInstagram(req.usuario.id);
    return res.json(result.reason ? { conectado: false, motivo: result.reason } : {
      conectado: true, instagram_account_id: result.instagram.id, username: result.instagram.username,
    });
  } catch (error) { return sendError(res, error); }
}

export async function metricasInstagram(req, res) {
  let range;
  try { range = resolveDateRange(req.query); } catch { return res.status(400).json({ erro: 'Período inválido.' }); }
  const since = new Date(`${range.since}T00:00:00Z`).getTime() / 1000;
  const until = new Date(`${range.until}T00:00:00Z`).getTime() / 1000 + 86400;
  if (until - since > 30 * 86400) return res.status(400).json({ erro: 'Instagram permite consultar até 30 dias por vez.' });
  try {
    const result = await findInstagram(req.usuario.id);
    if (result.reason) return res.status(404).json({ erro: 'Vincule uma conta profissional Instagram a uma Página Facebook e reconecte o Meta.' });
    const profile = await axios.get(`${GRAPH_URL}/${result.instagram.id}`, {
      params: { fields: 'username,followers_count,media_count,profile_picture_url', access_token: result.token }, timeout: 30000,
    });
    const warnings = ['Alcance é a soma diária; a mesma pessoa pode aparecer em dias diferentes.'];
    let reach = null;
    try {
      const metrics = await graphList(`${result.instagram.id}/insights`, result.token, {
        metric: 'reach', period: 'day', since, until,
      });
      const values = metrics.find(metric => metric.name === 'reach')?.values;
      if (values?.length) reach = values.reduce((sum, value) => sum + (Number(value.value) || 0), 0);
      else warnings.push('A plataforma não disponibilizou alcance para o período.');
    } catch (error) {
      if (error.response?.data?.error?.code === 190) return sendError(res, error);
      warnings.push('Alcance indisponível. Confira as permissões de insights e tente novamente.');
    }
    return res.json({
      conectado: true, periodo: range.period,
      perfil: { username: profile.data.username, seguidores: profile.data.followers_count ?? null,
        totalPosts: profile.data.media_count ?? null, fotoPerfil: profile.data.profile_picture_url || null },
      metricas: { alcance: reach, impressoes: null, visitasPerfil: null, cliquesLink: null }, warnings,
    });
  } catch (error) { return sendError(res, error); }
}
