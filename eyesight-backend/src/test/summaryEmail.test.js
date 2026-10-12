import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSummaryEmail } from '../services/summaryEmail.js';

const verdict = (status, extra = {}) => ({
  status, basis: 'comparison', indicator: 'cpa', insufficientReason: null, reasons: [], actions: [{ code: 'nothing_urgent', params: {} }],
  highlights: [
    { key: 'spend', value: 1000, change: 2, trend: 'neutral', available: true },
    { key: 'clicks', value: 500, change: 10, trend: 'better', available: true },
    { key: 'conversions', value: 25, change: 5, trend: 'better', available: true },
    { key: 'cost', value: 40, change: -15, trend: 'better', available: true },
  ], ...extra,
});
const analytics = (v, extra = {}) => ({ currency: 'BRL', period: { period: 'last_7d', days: 7, since: '2026-09-28', until: '2026-10-04' }, currentComplete: true, previousComplete: true, verdict: v, ...extra });
const UNSUB = 'https://app.example.com/cancelar-resumo?t=abc&x=1';
const make = (data, name = 'Ana') => buildSummaryEmail({ name, analytics: data, appUrl: 'https://app.example.com', unsubscribeUrl: UNSUB });

test('the subject follows the verdict status', () => {
  assert.equal(make(analytics(verdict('good'))).subject, 'Seus anúncios estão melhores · resumo da semana');
  assert.equal(make(analytics(verdict('stable'))).subject, 'Seus anúncios estão estáveis · resumo da semana');
  assert.equal(make(analytics(verdict('attention'))).subject, 'Seus anúncios estão pedindo atenção · resumo da semana');
  assert.equal(make(analytics(verdict('insufficient', { insufficientReason: 'low_volume' }))).subject, 'Resumo da semana: ainda sem base para avaliar');
});

test('the body greets, states the verdict, shows the four numbers and the call to action', () => {
  const { html, text } = make(analytics(verdict('good')));
  for (const part of ['Olá, Ana', 'Seus anúncios estão melhores que os 7 dias anteriores.', 'Você investiu', 'Pessoas que clicaram', 'Resultados', 'Custo por resultado', 'Abrir o painel']) {
    assert.ok(html.includes(part), `html: ${part}`);
    assert.ok(text.includes(part), `text: ${part}`);
  }
  assert.match(html, /R\$\s1\.000,00/);
  assert.ok(html.includes('href="https://app.example.com/app"'));
  assert.ok(html.includes('28/09') && html.includes('04/10'));
});

test('comparisons show only when both periods are complete', () => {
  const full = make(analytics(verdict('good')));
  assert.ok(full.html.includes('10% mais que os 7 dias anteriores'));
  assert.ok(full.html.includes('15% menos que os 7 dias anteriores'));
  const partial = make(analytics(verdict('good'), { previousComplete: false }));
  assert.ok(!partial.html.includes('mais que os 7 dias anteriores'));
  assert.ok(!partial.html.includes('menos que os 7 dias anteriores'));
});

test('at most three actions are listed, campaign names included as text', () => {
  const actions = Array.from({ length: 5 }, (_, i) => ({ code: 'campaign_without_results', params: { campaign: `Camp ${i}`, spend: 100 }, campaignId: i + 1 }));
  const { html } = make(analytics(verdict('attention', { actions })));
  assert.equal((html.match(/gastou/g) || []).length, 3);
});

test('unknown currency prints no currency symbol and warns once', () => {
  const { html, text } = make(analytics(verdict('good'), { currency: 'UNKNOWN' }));
  assert.ok(!/R\$|\$/.test(text));
  assert.equal((html.match(/não conseguimos identificar a moeda/gi) || []).length, 1);
});

test('the plain text version has no markup', () => {
  const { text } = make(analytics(verdict('good')));
  assert.ok(!text.includes('<'));
  assert.ok(text.includes(UNSUB));
});

test('outside text is escaped in html and left as is in text', () => {
  const evil = '<img src=x onerror=alert(1)>';
  const actions = [{ code: 'campaign_without_results', params: { campaign: 'A & B', spend: 10 }, campaignId: 1 }];
  const { html, text } = make(analytics(verdict('attention', { actions })), evil);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('A &amp; B'));
  assert.ok(text.includes('A & B'));
  assert.ok(html.includes('href="https://app.example.com/cancelar-resumo?t=abc&amp;x=1"'));
});

test('an insufficient verdict explains what is missing', () => {
  const { html } = make(analytics(verdict('insufficient', { insufficientReason: 'low_volume' })));
  assert.ok(html.includes('Poucos dados para avaliar ainda.'));
});

test('the alert variant changes subject, opening, reason and unsubscribe label, keeping the verdict body', () => {
  const alertUrl = 'https://app.example.com/cancelar-resumo?t=abc&e=alertas';
  const data = analytics(verdict('attention'));
  const mail = buildSummaryEmail({ name: 'Ana', analytics: data, appUrl: 'https://app.example.com', unsubscribeUrl: alertUrl, variant: 'alert' });
  assert.equal(mail.subject, 'Seus anúncios passaram a pedir atenção');
  for (const part of [mail.html, mail.text]) {
    assert.match(part, /mudaram de estado desde a última verificação/);
    assert.match(part, /ligou os alertas no Eyesight/);
    assert.match(part, /Parar de receber alertas/);
    assert.doesNotMatch(part, /ligou o resumo semanal/);
    assert.match(part, /O que fazer agora/);
  }
  assert.ok(mail.html.includes('e=alertas'));
  const weekly = make(data);
  assert.match(weekly.html, /Parar de receber</);
  assert.doesNotMatch(weekly.html, /mudaram de estado/);
});

test('o e-mail também descreve o gasto sem resultado', async () => {
  const { actionText, headline } = await import('../services/summaryCopy.js');
  const params = { spend: 800, goal: 40 };
  assert.equal(actionText({ code: 'spend_without_results', params }, 'BRL').replace(/\s/g, ' '), 'Seus anúncios gastaram R$ 800,00 sem nenhum resultado. Confira o acompanhamento de conversões e pause o que não está funcionando.');
  assert.equal(headline({ status: 'attention', basis: 'comparison', reasons: [{ code: 'spend_without_results', params }] }, { period: 'last_7d', days: 7 }), 'Atenção: você está gastando sem ter resultados.');
});
