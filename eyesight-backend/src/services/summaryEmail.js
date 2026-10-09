// Monta o e-mail do resumo semanal (assunto, HTML em tabelas com estilos inline e texto puro). Função pura.
import { CARD_TITLES, STATUS, actionText, count, headline, money, percent, previousLabel } from './summaryCopy.js';

const MAX_ACTIONS = 3;
const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const shortDate = value => String(value).split('-').reverse().slice(0, 2).join('/');

function cards(analytics, comparable) {
  const { verdict, currency, period } = analytics;
  return verdict.highlights.map(item => {
    const title = item.key === 'cost' ? (verdict.indicator === 'cpc' ? CARD_TITLES.costCpc : CARD_TITLES.costCpa) : CARD_TITLES[item.key];
    let value;
    if (item.key === 'conversions' && !item.available) value = 'Não registrado';
    else if (item.key === 'spend' || item.key === 'cost') value = money(item.value, currency);
    else value = count(item.value);
    const hasChange = comparable && Number.isFinite(item.change) && !(item.key === 'conversions' && !item.available);
    const comparison = hasChange ? `${percent(Math.abs(item.change))} ${item.change > 0 ? 'mais' : 'menos'} que ${previousLabel(period)}` : '';
    return { title, value, comparison };
  });
}

export function buildSummaryEmail({ name, analytics, appUrl, unsubscribeUrl }) {
  const { verdict, period, currency } = analytics;
  const status = STATUS[verdict.status] || STATUS.insufficient;
  const comparable = Boolean(analytics.currentComplete && analytics.previousComplete);
  const phrase = headline(verdict, period);
  const items = cards(analytics, comparable);
  const actions = (verdict.actions || []).slice(0, MAX_ACTIONS).map(action => actionText(action, currency)).filter(Boolean);
  const range = `De ${shortDate(period.since)} a ${shortDate(period.until)}`;
  const panelUrl = `${appUrl}/app`;
  const currencyNote = currency === 'UNKNOWN' ? 'Não conseguimos identificar a moeda da sua conta; os valores aparecem sem símbolo de moeda.' : '';
  const reason = 'Você recebe este e-mail porque ligou o resumo semanal no Eyesight.';

  const cell = 'padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;';
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(phrase)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;"><tr><td style="padding:28px;">
<p style="margin:0 0 4px;font-size:16px;">Olá, ${escapeHtml(name)}!</p>
<p style="margin:0 0 16px;color:#334155;font-size:14px;">Este é o seu resumo da semana. ${escapeHtml(range)}.</p>
<p style="margin:0;font-size:18px;font-weight:bold;">${status.mark} ${escapeHtml(status.label)}</p>
<p style="margin:8px 0 20px;font-size:18px;line-height:1.4;">${escapeHtml(phrase)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="8">${items.map(item => `<tr><td style="${cell}"><div style="font-size:14px;color:#475569;">${escapeHtml(item.title)}</div><div style="font-size:22px;font-weight:bold;">${escapeHtml(item.value)}</div>${item.comparison ? `<div style="font-size:13px;color:#475569;">${escapeHtml(item.comparison)}</div>` : ''}</td></tr>`).join('')}</table>
${currencyNote ? `<p style="font-size:13px;color:#475569;">${escapeHtml(currencyNote)}</p>` : ''}
<h2 style="font-size:16px;margin:20px 0 8px;">O que fazer agora</h2>
<ul style="margin:0 0 20px;padding-left:20px;line-height:1.5;">${actions.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>
<p style="margin:0 0 24px;"><a href="${escapeHtml(panelUrl)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-size:16px;">Abrir o painel</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#475569;">${escapeHtml(reason)} <a href="${escapeHtml(unsubscribeUrl)}" style="color:#1d4ed8;">Parar de receber</a></p>
</td></tr></table></body></html>`;

  const text = [
    `Olá, ${name}!`, '', `Este é o seu resumo da semana. ${range}.`, '',
    `${status.mark} ${status.label}`, phrase, '',
    ...items.map(item => `${item.title}: ${item.value}${item.comparison ? ` (${item.comparison})` : ''}`),
    ...(currencyNote ? ['', currencyNote] : []),
    '', 'O que fazer agora:', ...actions.map(textLine => `- ${textLine}`),
    '', `Abrir o painel: ${panelUrl}`, '', reason, `Parar de receber: ${unsubscribeUrl}`,
  ].join('\n');

  return { subject: status.subject, html, text };
}
