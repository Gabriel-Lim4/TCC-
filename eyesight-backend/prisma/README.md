# Migrações do banco

O histórico fica em `prisma/migrations`. **Não use mais `prisma db push`.**

| Migração | O que faz |
|---|---|
| `0_init` | Estado inicial: tabelas do `schema.prisma` + o que o Prisma não modela (FK para `auth.users`, RLS e `REVOKE` para `anon`/`authenticated`). Já existe em produção: marcada como aplicada, não executada. |
| `1_drop_legacy_campaign_unique` | Remove o índice único antigo só em `campanhas.id_externo`. |

## Rotina

- **Mudar o schema:** edite `schema.prisma` e rode `npm run db:migrate -- --name o_que_mudou`. Isso exige um banco **local** descartável (o `migrate dev` cria e apaga um banco sombra), então aponte `DATABASE_URL`/`DIRECT_URL` para um Postgres local, nunca para o Supabase de produção. Revise o SQL gerado e faça o commit da pasta nova.
- **Aplicar em produção:** `npm run db:deploy` (usa `DIRECT_URL`, porta 5432). Só aplica o que ainda não foi aplicado.
- **Ver o estado:** `npm run db:status`.
- Qualquer coisa que o Prisma não modela (RLS, grants, FKs para `auth`) entra **à mão** no SQL da migração.
- O CI aplica todas as migrações num banco vazio e falha se o resultado for diferente do `schema.prisma`.
- Os arquivos `scripts/*-additions.sql` e `scripts/protect-existing.mjs` são históricos: já estão incorporados à `0_init`.

## Primeira vez em produção (uma única vez)

```
# 1. Informe ao Prisma que o banco atual já corresponde à 0_init (não executa SQL)
npx prisma migrate resolve --applied 0_init
# 2. Aplique o que falta (a 1_drop_legacy_campaign_unique)
npx prisma migrate deploy
npx prisma migrate status
```
