import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEMO_ACCOUNTS, DEMO_CAMPAIGNS, DEMO_PREFIX, buildDemoRows, demoValues, todayInSaoPaulo } from '../services/demoSeed.js';
import { aggregateValues, metricChanges } from '../services/analyticsMath.js';

const TODAY = '2026-09-30';

describe('demoSeed', () => {
  it('gera um dia por data, sem buracos, terminando hoje', () => {
    const rows = buildDemoRows(1, { today: TODAY, days: 45 });
    assert.strictEqual(rows.length, 45);
    assert.strictEqual(rows.at(-1).date, TODAY);
    assert.strictEqual(new Set(rows.map(row => row.date)).size, 45);
    for (let i = 1; i < rows.length; i++) assert.strictEqual(Date.parse(rows[i].date) - Date.parse(rows[i - 1].date), 86400000);
  });

  it('usa as mesmas chaves que o sync real grava e só números finitos', () => {
    const [row] = buildDemoRows(4, { today: TODAY, days: 1 });
    assert.deepStrictEqual(Object.keys(row).sort(), ['clicks', 'conversions', 'date', 'impressions', 'revenue', 'spend']);
    for (const key of ['clicks', 'conversions', 'impressions', 'revenue', 'spend']) assert.ok(Number.isFinite(row[key]) && row[key] >= 0, key);
  });

  it('é determinístico: rodar de novo não muda os números', () => {
    assert.deepStrictEqual(buildDemoRows(2, { today: TODAY, days: 30 }), buildDemoRows(2, { today: TODAY, days: 30 }));
    assert.deepStrictEqual(demoValues(3, '2026-09-01', TODAY), demoValues(3, '2026-09-01', TODAY));
  });

  it('alimenta as contas do painel: CTR, CPA e ROAS saem calculados', () => {
    const totals = aggregateValues(buildDemoRows(5, { today: TODAY, days: 30 }));
    for (const key of ['ctr', 'cpc', 'cpm', 'cpa', 'roas']) assert.ok(Number.isFinite(totals[key]) && totals[key] > 0, key);
  });

  it('conta a história de exemplo: o custo por resultado piora nas campanhas 2 e 3, não nas outras', () => {
    const cpaChange = n => {
      const rows = buildDemoRows(n, { today: TODAY, days: 60 });
      return metricChanges(aggregateValues(rows.slice(30)), aggregateValues(rows.slice(0, 30))).cpa;
    };
    // a queda atinge 15 dos 30 dias da janela atual, então o custo sobe ~38%, bem acima do ruído das outras (<15%)
    assert.ok(cpaChange(2) > 25, `campanha 2: ${cpaChange(2)}`);
    assert.ok(cpaChange(3) > 25, `campanha 3: ${cpaChange(3)}`);
    for (const n of [1, 4, 5, 6]) assert.ok(Math.abs(cpaChange(n)) < 15, `campanha ${n}: ${cpaChange(n)}`);
  });

  it('marca tudo como exemplo, para nunca ser confundido com conta real', () => {
    assert.ok(DEMO_ACCOUNTS.every(account => account.account_id.startsWith(DEMO_PREFIX)));
    assert.ok(DEMO_CAMPAIGNS.every(campaign => campaign.externalId.startsWith(DEMO_PREFIX)));
    assert.deepStrictEqual([...new Set(DEMO_CAMPAIGNS.map(campaign => campaign.platform))].sort(), DEMO_ACCOUNTS.map(account => account.plataforma).sort());
  });

  it('rejeita um número de dias fora do aceito pelo painel', () => {
    assert.throws(() => buildDemoRows(1, { today: TODAY, days: 0 }));
    assert.throws(() => buildDemoRows(1, { today: TODAY, days: 400 }));
  });

  it('calcula a data de hoje no fuso de São Paulo', () => {
    assert.strictEqual(todayInSaoPaulo(new Date('2026-09-30T02:30:00Z')), '2026-09-29');
    assert.strictEqual(todayInSaoPaulo(new Date('2026-09-30T12:00:00Z')), '2026-09-30');
  });
});
