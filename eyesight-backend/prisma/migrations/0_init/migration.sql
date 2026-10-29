-- CreateEnum
CREATE TYPE "contas_vinculadas_plataforma" AS ENUM ('meta', 'google');

-- CreateTable
CREATE TABLE "usuarios" (
    "pk_id_usuario" SERIAL NOT NULL,
    "nome_usuario" VARCHAR(100) NOT NULL,
    "data_criacao_user" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "auth_user_id" UUID,
    "telefone" VARCHAR(30),
    "localizacao" VARCHAR(150),
    "preferences" JSONB,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("pk_id_usuario")
);

-- CreateTable
CREATE TABLE "contas_vinculadas" (
    "pk_id_conta" SERIAL NOT NULL,
    "fk_id_usuario" INTEGER NOT NULL,
    "plataforma" "contas_vinculadas_plataforma" NOT NULL,
    "acess_token" TEXT NOT NULL,
    "account_id" VARCHAR(100) NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "account_name" VARCHAR(200),
    "currency" VARCHAR(3),
    "time_zone" VARCHAR(100),
    "vinculado_em" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_vinculadas_pkey" PRIMARY KEY ("pk_id_conta")
);

-- CreateTable
CREATE TABLE "campanhas" (
    "pk_id_campanha" SERIAL NOT NULL,
    "fk_id_conta" INTEGER NOT NULL,
    "id_externo" VARCHAR(100) NOT NULL,
    "nome_campanha" VARCHAR(200) NOT NULL,
    "status_campanha" VARCHAR(50),
    "objetivo" VARCHAR(100),
    "sincronizado_em" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("pk_id_campanha")
);

-- CreateTable
CREATE TABLE "metricas" (
    "pk_id_metrica" SERIAL NOT NULL,
    "fk_id_campanha" INTEGER NOT NULL,
    "tipo_metrica" VARCHAR(100) NOT NULL,
    "valor_metrica" DECIMAL(15,4) NOT NULL,
    "periodo_metrica" VARCHAR(50) NOT NULL,
    "coletado_em" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metricas_pkey" PRIMARY KEY ("pk_id_metrica")
);

-- CreateTable
CREATE TABLE "analises_ia" (
    "pk_id_analise" SERIAL NOT NULL,
    "fk_id_usuario" INTEGER NOT NULL,
    "fk_id_campanha" INTEGER NOT NULL,
    "texto_analise" TEXT,
    "sugestao_analise" TEXT,
    "score_desempenho" INTEGER,
    "modelo" TEXT,
    "periodo" VARCHAR(50),
    "data_geracao_analise" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_ia_pkey" PRIMARY KEY ("pk_id_analise")
);

-- CreateTable
CREATE TABLE "campaign_daily_metrics" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "values" JSONB NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_conversations" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "messages" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_acao" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action_key" VARCHAR(80) NOT NULL,
    "action_code" VARCHAR(50) NOT NULL,
    "campaign_id" INTEGER,
    "steps" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotina_envios" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "period_key" VARCHAR(10) NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotina_envios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_auth_user_id_key" ON "usuarios"("auth_user_id");

-- CreateIndex
CREATE INDEX "contas_vinculadas_fk_id_usuario_idx" ON "contas_vinculadas"("fk_id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "contas_vinculadas_fk_id_usuario_plataforma_key" ON "contas_vinculadas"("fk_id_usuario", "plataforma");

-- CreateIndex
CREATE INDEX "campanhas_fk_id_conta_idx" ON "campanhas"("fk_id_conta");

-- CreateIndex
CREATE UNIQUE INDEX "campanhas_conta_id_externo_key" ON "campanhas"("fk_id_conta", "id_externo");

-- CreateIndex
CREATE INDEX "metricas_fk_id_campanha_idx" ON "metricas"("fk_id_campanha");

-- CreateIndex
CREATE INDEX "analises_ia_fk_id_campanha_idx" ON "analises_ia"("fk_id_campanha");

-- CreateIndex
CREATE INDEX "analises_ia_fk_id_usuario_idx" ON "analises_ia"("fk_id_usuario");

-- CreateIndex
CREATE INDEX "campaign_daily_metrics_date_idx" ON "campaign_daily_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_daily_metrics_campaign_id_date_key" ON "campaign_daily_metrics"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "assistant_conversations_user_id_updated_at_idx" ON "assistant_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "planos_acao_user_id_last_seen_at_idx" ON "planos_acao"("user_id", "last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "planos_acao_user_action_key" ON "planos_acao"("user_id", "action_key");

-- CreateIndex
CREATE UNIQUE INDEX "rotina_envios_user_kind_period_key" ON "rotina_envios"("user_id", "kind", "period_key");

-- AddForeignKey
ALTER TABLE "contas_vinculadas" ADD CONSTRAINT "contas_vinculadas_fk_id_usuario_fkey" FOREIGN KEY ("fk_id_usuario") REFERENCES "usuarios"("pk_id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_fk_id_conta_fkey" FOREIGN KEY ("fk_id_conta") REFERENCES "contas_vinculadas"("pk_id_conta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricas" ADD CONSTRAINT "metricas_fk_id_campanha_fkey" FOREIGN KEY ("fk_id_campanha") REFERENCES "campanhas"("pk_id_campanha") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_fk_id_campanha_fkey" FOREIGN KEY ("fk_id_campanha") REFERENCES "campanhas"("pk_id_campanha") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_fk_id_usuario_fkey" FOREIGN KEY ("fk_id_usuario") REFERENCES "usuarios"("pk_id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_daily_metrics" ADD CONSTRAINT "campaign_daily_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campanhas"("pk_id_campanha") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("pk_id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("pk_id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotina_envios" ADD CONSTRAINT "rotina_envios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("pk_id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────
-- Partes que o Prisma não modela (já existem no banco de produção).
-- Protegidas por verificações para o mesmo script rodar também fora do Supabase (testes, CI).
-- ─────────────────────────────────────────────────────────────

-- O perfil acompanha a conta do Supabase Auth: apagar o login apaga o perfil.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_auth_user_id_fkey"
      FOREIGN KEY ("auth_user_id") REFERENCES auth.users("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Tabelas privadas: só o backend (que ignora RLS) acessa; o cliente do Supabase (anon/authenticated) não lê nada.
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contas_vinculadas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campanhas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "metricas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analises_ia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_daily_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assistant_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planos_acao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rotina_envios" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "usuarios", "contas_vinculadas", "campanhas", "metricas", "analises_ia",
      "campaign_daily_metrics", "assistant_conversations", "planos_acao", "rotina_envios" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "usuarios", "contas_vinculadas", "campanhas", "metricas", "analises_ia",
      "campaign_daily_metrics", "assistant_conversations", "planos_acao", "rotina_envios" FROM authenticated;
  END IF;
END $$;
