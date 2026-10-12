import test from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOW_UP_LIMITS, evaluateFollowUp, firstDoneAt, markStep } from '../services/planService.js';

process.env.REPORT_TIME_ZONE = 'America/Sao_Paulo';
const NOW = new Date('2026-10-10T15:00:00Z');
const steps = (...marks) => marks.map((done, index) => ({ id: `s${index + 1}`, text: `Passo ${index + 1}`, done }));
const row = (date, values) => ({ date: new Date(`${date}T00:00:00Z`), values });
const days = (from, count, values) => Array.from({ length: count }, (_, index) => row(new Date(Date.parse(`${from}T00:00:00Z`) + index * 86400000).toISOString().slice(0, 10), values));
const withCut = (cut = '2026-10-03T15:00:00Z') => [{ id: 's1', text: 'a', done: true, doneAt: cut }, { id: 's2', text: 'b', done: false }, { id: 's3', text: 'c', done: false }];
const TODAY = '2026-10-10';
const evaluate = (rows, extra = {}) => evaluateFollowUp({ actionCode: 'campaign_over_goal', steps: withCut(), rows, today: TODAY, ...extra });

test('markStep grava doneAt ao concluir e remove ao desmarcar, sem mexer nos outros passos', () => {
  const marked = markStep(steps(false, false, false), 's2', true, NOW);
  assert.equal(marked[1].done, true);
  assert.equal(marked[1].doneAt, NOW.toISOString());
  assert.equal(marked[0].doneAt, undefined);
  const unmarked = markStep(marked, 's2', false, NOW);
  assert.equal(unmarked[1].done, false);
  assert.equal('doneAt' in unmarked[1], false);
});

test('firstDoneAt devolve o primeiro passo concluído e ignora passos antigos sem data', () => {
  assert.equal(firstDoneAt(withCut()), '2026-10-03T15:00:00Z');
  const two = [{ id: 's1', done: true, doneAt: '2026-10-05T10:00:00Z' }, { id: 's2', done: true, doneAt: '2026-10-04T10:00:00Z' }];
  assert.equal(firstDoneAt(two), '2026-10-04T10:00:00Z');
  assert.equal(firstDoneAt([{ id: 's1', done: true }]), null);
  assert.equal(firstDoneAt([{ id: 's1', done: false, doneAt: '2026-10-05T10:00:00Z' }]), null);
  assert.equal(firstDoneAt(null), null);
});

test('sem passo concluído ou para ação sem acompanhamento não há followUp', () => {
  assert.equal(evaluateFollowUp({ actionCode: 'campaign_over_goal', steps: steps(false, false, false), rows: [], today: TODAY }), null);
  assert.equal(evaluateFollowUp({ actionCode: 'enable_conversion_tracking', steps: withCut(), rows: [], today: TODAY }), null);
});

test('aguardando: menos de 3 dias de dados depois do corte', () => {
  const rows = [...days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }), ...days('2026-10-04', 2, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 })];
  const result = evaluate(rows);
  assert.equal(result.status, 'waiting');
  assert.equal(result.daysAfter, 2);
  assert.equal(result.daysNeeded, FOLLOW_UP_LIMITS.MIN_DAYS_AFTER);
  assert.equal(result.since, '2026-10-03');
});

test('indisponível: nenhum dado antes do corte para comparar', () => {
  const result = evaluate(days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }));
  assert.equal(result.status, 'unavailable');
});

test('pronto: custo por resultado caiu depois de agir (menor é melhor)', () => {
  const before = days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 4 }); // cpa 50
  const after = days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }); // cpa 40
  const result = evaluate([...before, ...after]);
  assert.equal(result.status, 'ready');
  assert.equal(result.metric, 'cpa');
  assert.equal(result.before, 50);
  assert.equal(result.after, 40);
  assert.ok(Math.abs(result.changePct + 20) < 1e-9);
  assert.equal(result.result, 'better');
  assert.equal(result.daysBefore, 7);
  assert.equal(result.daysAfter, 6);
});

test('pronto: piorou quando o custo sobe e sem mudança dentro da faixa', () => {
  const before = days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 });
  assert.equal(evaluate([...before, ...days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 3 })]).result, 'worse');
  assert.equal(evaluate([...before, ...days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 204, conversions: 5 })]).result, 'same');
});

test('CTR: maior é melhor', () => {
  const rows = [...days('2026-09-26', 7, { impressions: 10000, clicks: 100, spend: 100 }), ...days('2026-10-04', 6, { impressions: 10000, clicks: 150, spend: 100 })];
  const result = evaluateFollowUp({ actionCode: 'campaign_low_ctr', steps: withCut(), rows, today: TODAY });
  assert.equal(result.metric, 'ctr');
  assert.equal(result.result, 'better');
});

test('resultados por dia partindo de zero contam como melhora, sem percentual', () => {
  const rows = [...days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 0 }), ...days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 2 })];
  const result = evaluateFollowUp({ actionCode: 'campaign_without_results', steps: withCut(), rows, today: TODAY });
  assert.equal(result.metric, 'resultsPerDay');
  assert.equal(result.before, 0);
  assert.equal(result.after, 2);
  assert.equal(result.changePct, null);
  assert.equal(result.result, 'better');
});

test('gasto por dia: menor é melhor e soma campanhas do mesmo dia', () => {
  const day = (date, spend) => [row(date, { impressions: 1000, clicks: 50, spend, conversions: 1 }), row(date, { impressions: 1000, clicks: 50, spend, conversions: 1 })];
  const rows = [];
  for (let d = 26; d < 33; d++) rows.push(...day(new Date(Date.UTC(2026, 8, d)).toISOString().slice(0, 10), 100));
  for (let d = 4; d < 10; d++) rows.push(...day(`2026-10-0${d}`, 50));
  const result = evaluateFollowUp({ actionCode: 'budget_exceeded', steps: withCut(), rows, today: TODAY });
  assert.equal(result.metric, 'spendPerDay');
  assert.equal(result.before, 200);
  assert.equal(result.after, 100);
  assert.equal(result.result, 'better');
});

test('o dia do corte fica de fora e janelas fora do limite são ignoradas', () => {
  const rows = [
    ...days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 4 }),
    row('2026-10-03', { impressions: 5000, clicks: 100, spend: 9999, conversions: 1 }), // dia do corte
    row('2026-09-20', { impressions: 5000, clicks: 100, spend: 9999, conversions: 1 }), // antes demais
    ...days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }),
  ];
  const result = evaluate(rows);
  assert.equal(result.before, 50);
  assert.equal(result.daysBefore, 7);
});

test('pouco volume nos dois lados não vira conclusão', () => {
  const rows = [...days('2026-09-26', 7, { impressions: 100, clicks: 2, spend: 20, conversions: 1 }), ...days('2026-10-04', 6, { impressions: 100, clicks: 2, spend: 20, conversions: 1 })];
  assert.equal(evaluate(rows).status, 'unavailable');
});

test('o dia de hoje (parcial) fica de fora da janela depois', () => {
  const rows = [
    ...days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 4 }),
    ...days('2026-10-04', 6, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }),
    row(TODAY, { impressions: 10, clicks: 1, spend: 1, conversions: 0 }),
  ];
  const result = evaluate(rows);
  assert.equal(result.daysAfter, 6);
  assert.equal(result.after, 40);
  const onlyToday = evaluate([...days('2026-09-26', 7, { impressions: 5000, clicks: 100, spend: 200, conversions: 4 }), ...days('2026-10-08', 2, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 }), row(TODAY, { impressions: 5000, clicks: 100, spend: 200, conversions: 5 })]);
  assert.equal(onlyToday.status, 'waiting');
  assert.equal(onlyToday.daysAfter, 2);
});

test('marcar de novo um passo já concluído não muda a data do corte', () => {
  const first = markStep(steps(false, false, false), 's1', true, new Date('2026-10-05T10:00:00Z'));
  const again = markStep(first, 's1', true, new Date('2026-10-09T10:00:00Z'));
  assert.equal(again[0].doneAt, '2026-10-05T10:00:00.000Z');
});
