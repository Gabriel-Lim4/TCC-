// ─────────────────────────────────────────────────────────────
// services/emailService.js — envio de e-mails via Resend
// ─────────────────────────────────────────────────────────────

import { Resend } from 'resend';
import env from '../config/env.js';

const resend = env.resend.apiKey ? new Resend(env.resend.apiKey) : null;

function montarHtmlVerificacao({ nome, link }) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <body style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 32px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px;">
          <h1 style="color: #0b1120; font-size: 22px; margin-bottom: 12px;">Confirme seu e-mail</h1>
          <p style="color: #334155; line-height: 1.6;">
            Olá, ${nome}! Obrigado por se cadastrar no <strong>Eyesight</strong>.
          </p>
          <p style="color: #334155; line-height: 1.6;">
            Clique no botão abaixo para confirmar sua conta e acessar o painel de métricas.
          </p>
          <p style="margin: 28px 0;">
            <a href="${link}"
               style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
              Confirmar e-mail
            </a>
          </p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
            Se o botão não funcionar, copie e cole este link no navegador:<br />
            <a href="${link}" style="color: #2563eb;">${link}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Se você não criou esta conta, ignore este e-mail.
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function enviarEmailVerificacao({ email, nome, token }) {
  if (!resend) {
    throw new Error('RESEND_API_KEY não configurada.');
  }

  const link = `${env.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from:    env.resend.from,
    to:      email,
    subject: 'Confirme seu e-mail — Eyesight',
    html:    montarHtmlVerificacao({ nome, link }),
  });

  if (error) {
    throw new Error(error.message || 'Falha ao enviar e-mail de verificação.');
  }
}
