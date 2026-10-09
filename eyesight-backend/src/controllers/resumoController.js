import env from '../config/env.js';
import { prisma } from '../config/database.js';
import { getAnalytics } from '../services/analyticsService.js';
import { enviarResumoSemanal } from '../services/emailService.js';
import { buildSummaryEmail } from '../services/summaryEmail.js';
import { createUnsubscribeToken, verifyUnsubscribeToken } from '../services/unsubscribeToken.js';

const NOT_CONFIGURED = 'O envio de e-mail ainda não está configurado.';

// Envia um exemplo do resumo ao e-mail da própria conta, mesmo com o resumo desligado; não usa a vaga semanal.
export async function enviarTeste(req, res) {
  const { id: userId, nome, email } = req.usuario;
  if (!env.unsubscribeSecret) return res.status(503).json({ erro: NOT_CONFIGURED });
  if (!email) return res.status(409).json({ erro: 'Sua conta não tem um e-mail para receber o exemplo.' });
  try {
    const analytics = await getAnalytics(userId, { periodo: 'last_7d' });
    if (!analytics.hasData || !analytics.verdict) return res.status(409).json({ erro: 'Ainda não há dados para montar o resumo. Conecte uma conta e atualize os dados.' });
    const token = createUnsubscribeToken(userId);
    const unsubscribeUrl = `${env.frontendUrl}/cancelar-resumo?t=${token}`;
    const unsubscribePostUrl = env.backendUrl ? `${env.backendUrl}/resumo/cancelar?t=${token}` : undefined;
    const message = buildSummaryEmail({ name: nome, analytics, appUrl: env.frontendUrl, unsubscribeUrl });
    try {
      await enviarResumoSemanal({ to: email, ...message, unsubscribeUrl, unsubscribePostUrl });
    } catch (err) {
      console.error('[RESUMO] falha no envio de teste', { userId });
      if (/RESEND_API_KEY/.test(err?.message ?? '')) return res.status(503).json({ erro: NOT_CONFIGURED });
      return res.status(502).json({ erro: 'Não foi possível enviar o e-mail agora. Tente novamente.' });
    }
    return res.json({ mensagem: 'Enviamos um exemplo para o e-mail da sua conta.' });
  } catch {
    console.error('[RESUMO] falha ao montar o exemplo', { userId });
    return res.status(500).json({ erro: 'Não foi possível montar o exemplo agora. Tente novamente.' });
  }
}

// Cancelamento público: só o token assinado identifica o usuário, e só a chave `summary` é alterada.
export async function cancelar(req, res) {
  const userId = verifyUnsubscribeToken(req.body?.token ?? req.query?.t);
  if (!userId) return res.status(400).json({ erro: 'Este link não é válido ou expirou.' });
  try {
    await prisma.$executeRaw`UPDATE usuarios SET preferences = COALESCE(preferences, '{}'::jsonb) || jsonb_build_object('summary', jsonb_build_object('weekly', false)) WHERE pk_id_usuario = ${userId}`;
    return res.json({ mensagem: 'Resumo semanal desligado.' });
  } catch {
    console.error('[RESUMO] falha ao cancelar', { userId });
    return res.status(500).json({ erro: 'Não foi possível cancelar agora. Tente novamente.' });
  }
}
