import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numbersIn, unsupportedNumbers, guardAnswer } from '../services/answerGuard.js';

test('numbersIn lê números no formato brasileiro e ignora contagens pequenas, anos e datas', () => {
  assert.deepEqual(numbersIn('Gastou R$ 1.234,56 com CTR de 2,5% em 3 dias, desde 2026-09-01 (set/2026).'), [1234.56, 2.5]);
  assert.deepEqual(numbersIn('Foram 12.500 impressões e 87 cliques'), [12500, 87]);
});

test('números que existem no contexto, arredondados ou derivados, são aceitos', () => {
  const context = { totals: { spend: 1234.5678, clicks: 87, conversions: 4 }, previousTotals: { spend: 1000, clicks: 100 }, goals: { cpaMax: 50 } };
  assert.deepEqual(unsupportedNumbers('Gastou R$ 1.234,57 e teve 87 cliques.', [context]), []);
  // variação percentual e diferença entre dois números do contexto
  assert.deepEqual(unsupportedNumbers('O gasto subiu 23,5% (R$ 234,57 a mais).', [context]), []);
  // fração × 100
  assert.deepEqual(unsupportedNumbers('CTR de 2,5%', [{ ctr: 0.025 }]), []);
});

test('número que não está no contexto é apontado', () => {
  const context = { totals: { spend: 1000, clicks: 87 } };
  assert.deepEqual(unsupportedNumbers('Você ganhou R$ 9.999,00 e teve 87 cliques.', [context]), [9999]);
});

test('números da própria pergunta do usuário também valem', () => {
  assert.deepEqual(unsupportedNumbers('Sim, uma meta de R$ 80 é viável.', [{ totals: {} }], 'e se minha meta for R$ 80?'), []);
});

test('guardAnswer acrescenta um aviso só quando há número não confirmado', () => {
  const context = { totals: { spend: 1000 } };
  assert.equal(guardAnswer('Gastou R$ 1.000,00.', [context]).text, 'Gastou R$ 1.000,00.');
  const flagged = guardAnswer('Gastou R$ 7.777,00.', [context]);
  assert.equal(flagged.checked, false);
  assert.match(flagged.text, /^Gastou R\$ 7\.777,00\./);
  assert.match(flagged.text, /7\.777/);
  assert.match(flagged.text, /confira/i);
});
