import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explainCostChange } from '../services/changeExplainer.js';
import { aggregateValues } from '../services/analyticsMath.js';

const period = row => aggregateValues([row]);
const base = { impressions: 100000, clicks: 2000, spend: 4000, conversions: 100 };

test('o custo por clique que sobe só porque o CPM subiu aponta o CPM como causa principal', () => {
  const previous = period(base);
  const current = period({ ...base, spend: 6000 }); // CPM +50%, CTR igual
  const result = explainCostChange(current, previous, 'cpc');
  assert.equal(result.indicator, 'cpc');
  assert.equal(result.main, 'cpm');
  assert.ok(Math.abs(result.costChange - 50) < 1e-9);
  assert.deepEqual(result.factors.map(factor => factor.key).sort(), ['cpm', 'ctr']);
  assert.ok(Math.abs(result.factors.find(factor => factor.key === 'cpm').share - 1) < 1e-9);
  assert.ok(Math.abs(result.factors.find(factor => factor.key === 'ctr').share) < 1e-9);
});

test('as parcelas dos fatores somam 100% e a queda da taxa de conversão explica o custo por resultado', () => {
  const previous = period(base);
  const current = period({ ...base, conversions: 60 }); // CPA sobe 66,7% só por causa da conversão
  const result = explainCostChange(current, previous, 'cpa');
  assert.equal(result.main, 'cvr');
  const total = result.factors.reduce((sum, factor) => sum + factor.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.deepEqual(result.factors.map(factor => factor.key).sort(), ['cpm', 'ctr', 'cvr']);
  assert.ok(result.factors.find(factor => factor.key === 'cvr').change < 0);
});

test('um fator que atua contra a variação aparece com parcela negativa', () => {
  const previous = period(base);
  // CPM +100% (gasto dobra), CTR +25% (mais cliques): o custo por clique sobe menos do que o CPM sozinho.
  const current = period({ ...base, spend: 8000, clicks: 2500 });
  const result = explainCostChange(current, previous, 'cpc');
  const ctr = result.factors.find(factor => factor.key === 'ctr');
  assert.ok(ctr.share < 0);
  assert.equal(result.main, 'cpm');
  assert.ok(Math.abs(result.factors.reduce((sum, factor) => sum + factor.share, 0) - 1) < 1e-9);
});

test('quando o custo cai, o fator que mais ajudou é o principal', () => {
  const previous = period(base);
  const current = period({ ...base, clicks: 3000 }); // CTR +50% → CPC cai
  const result = explainCostChange(current, previous, 'cpc');
  assert.ok(result.costChange < 0);
  assert.equal(result.main, 'ctr');
});

test('devolve null quando a variação do custo está dentro da faixa de estabilidade', () => {
  const previous = period(base);
  const current = period({ ...base, spend: 4100 }); // +2,5%
  assert.equal(explainCostChange(current, previous, 'cpc'), null);
});

test('devolve null quando falta volume, conversão ou período', () => {
  const previous = period(base);
  assert.equal(explainCostChange(period({ ...base, clicks: 20, spend: 9000 }), previous, 'cpc'), null);
  assert.equal(explainCostChange(period({ ...base, spend: 9000 }), period({ ...base, clicks: 10 }), 'cpc'), null);
  assert.equal(explainCostChange(period({ ...base, conversions: 0, spend: 9000 }), previous, 'cpa'), null);
  assert.equal(explainCostChange(period({ ...base, spend: 9000 }), period({ ...base, conversions: 0 }), 'cpa'), null);
  assert.equal(explainCostChange(period({ ...base, impressions: 0, spend: 9000 }), previous, 'cpc'), null);
  assert.equal(explainCostChange(null, previous, 'cpc'), null);
  assert.equal(explainCostChange(previous, null, 'cpc'), null);
  assert.equal(explainCostChange(period({ ...base, spend: 9000 }), previous, 'roas'), null);
});

test('conversões não medidas (null) impedem a explicação do custo por resultado', () => {
  const previous = period(base);
  const current = aggregateValues([{ impressions: 100000, clicks: 2000, spend: 9000 }]);
  assert.equal(explainCostChange(current, previous, 'cpa'), null);
});
