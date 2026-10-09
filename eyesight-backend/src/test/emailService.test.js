import test from 'node:test';
import assert from 'node:assert/strict';
import env from '../config/env.js';
import { enviarResumoSemanal, setResendClient } from '../services/emailService.js';

const message = { to: 'ana@example.com', subject: 'Assunto', html: '<p>oi</p>', text: 'oi', unsubscribeUrl: 'https://app.example.com/cancelar-resumo?t=abc' };
const fakeClient = (result = { error: null }) => { const sent = []; return { sent, client: { emails: { send: async payload => { sent.push(payload); return result; } } } }; };

test('the weekly summary goes through Resend with unsubscribe headers', async () => {
  const { sent, client } = fakeClient();
  setResendClient(client);
  await enviarResumoSemanal(message);
  assert.equal(sent[0].to, 'ana@example.com');
  assert.equal(sent[0].subject, 'Assunto');
  assert.equal(sent[0].html, '<p>oi</p>');
  assert.equal(sent[0].text, 'oi');
  assert.equal(sent[0].from, env.resend.from);
  assert.deepEqual(sent[0].headers, { 'List-Unsubscribe': '<https://app.example.com/cancelar-resumo?t=abc>' });
});

test('one-click unsubscribe is declared only when a POST endpoint is known', async () => {
  const { sent, client } = fakeClient();
  setResendClient(client);
  await enviarResumoSemanal({ ...message, unsubscribePostUrl: 'https://api.example.com/resumo/cancelar?t=abc' });
  assert.deepEqual(sent[0].headers, { 'List-Unsubscribe': '<https://api.example.com/resumo/cancelar?t=abc>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
});

test('an error from Resend is thrown', async () => {
  setResendClient(fakeClient({ error: { message: 'domain not verified' } }).client);
  await assert.rejects(enviarResumoSemanal(message), /domain not verified/);
});

test('without an API key nothing is sent', async () => {
  const previous = env.resend.apiKey;
  env.resend.apiKey = '';
  setResendClient(null);
  try { await assert.rejects(enviarResumoSemanal(message), /RESEND_API_KEY não configurada/); }
  finally { env.resend.apiKey = previous; }
});
