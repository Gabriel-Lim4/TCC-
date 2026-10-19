// Popula o banco com dados de exemplo para ver o painel funcionando sem conta de anúncios.
//
//   npm run seed:demo -- --dry-run                 só mostra o que seria criado (não acessa o banco)
//   npm run seed:demo -- --user 3                  grava para o usuário de id 3 (usuarios.pk_id_usuario)
//   npm run seed:demo -- --auth-id <uuid>          o mesmo, pelo id do Supabase
//   npm run seed:demo -- --user 3 --days 90        quantos dias de histórico (padrão 180)
//   npm run seed:demo -- --user 3 --remove         apaga só o que este script criou
//
// Sem --user/--auth-id, usa o único usuário do banco (se houver mais de um, lista e pede para escolher).
// Contas reais nunca são alteradas: só as que têm account_id começando com "demo-".
import 'dotenv/config';
import { DEMO_ACCOUNTS, DEMO_CAMPAIGNS, DEMO_PREFIX, buildDemoRows, todayInSaoPaulo } from '../src/services/demoSeed.js';

const args = (() => {
  const out = {}, list = process.argv.slice(2);
  for (let i = 0; i < list.length; i++) {
    if (!list[i].startsWith('--')) continue;
    const key = list[i].slice(2), next = list[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true; else { out[key] = next; i++; }
  }
  return out;
})();

const days = args.days === undefined ? 180 : Number(args.days);
const today = todayInSaoPaulo();
const plan = DEMO_CAMPAIGNS.map(campaign => ({ campaign, rows: buildDemoRows(campaign.n, { today, days }) }));

if (args['dry-run']) {
  console.log(`[seed] Simulação — nada será gravado. Período: ${plan[0].rows[0].date} a ${today} (${days} dias).`);
  for (const { campaign, rows } of plan) {
    const total = rows.reduce((sum, row) => ({ spend: sum.spend + row.spend, conversions: sum.conversions + row.conversions, revenue: sum.revenue + row.revenue }), { spend: 0, conversions: 0, revenue: 0 });
    console.log(`  ${campaign.platform.padEnd(6)} ${campaign.name.padEnd(36)} ${rows.length} dias · investimento R$ ${total.spend.toFixed(2)} · ROAS ${(total.revenue / total.spend).toFixed(2)}x`);
  }
  process.exit(0);
}

const { prisma } = await import('../src/config/database.js');

async function pickUser() {
  const select = { pk_id_usuario: true, nome_usuario: true, auth_user_id: true };
  if (args.user) return prisma.usuarios.findUnique({ where: { pk_id_usuario: Number(args.user) }, select });
  if (args['auth-id']) return prisma.usuarios.findUnique({ where: { auth_user_id: String(args['auth-id']) }, select });
  const users = await prisma.usuarios.findMany({ select, orderBy: { pk_id_usuario: 'asc' }, take: 20 });
  if (users.length === 1) return users[0];
  console.error(users.length ? 'Há mais de um usuário. Escolha um com --user <id>:' : 'Nenhum usuário encontrado. Cadastre-se pelo site primeiro.');
  for (const user of users) console.error(`  --user ${user.pk_id_usuario}   ${user.nome_usuario}`);
  return null;
}

try {
  const user = await pickUser();
  if (!user) { console.error(args.user || args['auth-id'] ? 'Usuário não encontrado.' : ''); process.exitCode = 1; }
  else if (args.remove) {
    const removed = await prisma.contas_vinculadas.deleteMany({ where: { fk_id_usuario: user.pk_id_usuario, account_id: { startsWith: DEMO_PREFIX } } });
    console.log(`[seed] ${removed.count} conta(s) de exemplo removida(s) de ${user.nome_usuario} (campanhas e métricas saem junto).`);
  } else {
    for (const account of DEMO_ACCOUNTS) {
      const existing = await prisma.contas_vinculadas.findUnique({ where: { fk_id_usuario_plataforma: { fk_id_usuario: user.pk_id_usuario, plataforma: account.plataforma } } });
      if (existing && !existing.account_id.startsWith(DEMO_PREFIX)) {
        console.warn(`[seed] ${account.plataforma}: já existe uma conta REAL conectada. Mantida, nada foi alterado nessa plataforma.`);
        continue;
      }
      const conta = existing ?? await prisma.contas_vinculadas.create({
        data: { fk_id_usuario: user.pk_id_usuario, plataforma: account.plataforma, acess_token: 'demo-sem-token', account_id: account.account_id, account_name: account.account_name, currency: 'BRL', time_zone: 'America/Sao_Paulo' },
      });
      for (const { campaign, rows } of plan.filter(item => item.campaign.platform === account.plataforma)) {
        const saved = await prisma.campanhas.upsert({
          where: { fk_id_conta_id_externo: { fk_id_conta: conta.pk_id_conta, id_externo: campaign.externalId } },
          update: { nome_campanha: campaign.name, status_campanha: 'ACTIVE', objetivo: campaign.objective, sincronizado_em: new Date() },
          create: { fk_id_conta: conta.pk_id_conta, id_externo: campaign.externalId, nome_campanha: campaign.name, status_campanha: 'ACTIVE', objetivo: campaign.objective },
        });
        await prisma.$transaction([
          prisma.campaign_daily_metrics.deleteMany({ where: { campaign_id: saved.pk_id_campanha } }),
          prisma.campaign_daily_metrics.createMany({
            data: rows.map(({ date, ...values }) => ({ campaign_id: saved.pk_id_campanha, date: new Date(`${date}T00:00:00Z`), values })),
          }),
        ]);
        console.log(`[seed] ${account.plataforma} · ${campaign.name}: ${rows.length} dias gravados.`);
      }
    }
    console.log(`\n[seed] Pronto para ${user.nome_usuario}. Abra o painel e use o período "Últimos 30 dias".`);
    console.log('[seed] Para apagar depois: npm run seed:demo -- --user ' + user.pk_id_usuario + ' --remove');
  }
} catch (error) {
  console.error('[seed] Falhou:', error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
