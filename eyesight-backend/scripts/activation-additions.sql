-- Additive update only. Keep public.usuarios -> auth.users intact.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS localizacao VARCHAR(150),
  ADD COLUMN IF NOT EXISTS preferences JSONB;
ALTER TABLE public.contas_vinculadas
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS account_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
  ADD COLUMN IF NOT EXISTS time_zone VARCHAR(100);
ALTER TABLE public.analises_ia
  ADD COLUMN IF NOT EXISTS score_desempenho INTEGER,
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS periodo VARCHAR(50);
CREATE TABLE IF NOT EXISTS public.campaign_daily_metrics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  date DATE NOT NULL,
  "values" JSONB NOT NULL,
  synced_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT campaign_daily_metrics_campaign_id_fkey FOREIGN KEY (campaign_id)
    REFERENCES public.campanhas(pk_id_campanha) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_daily_metrics_campaign_id_date_key ON public.campaign_daily_metrics(campaign_id,date);
CREATE INDEX IF NOT EXISTS campaign_daily_metrics_date_idx ON public.campaign_daily_metrics(date);
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT assistant_conversations_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.usuarios(pk_id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS assistant_conversations_user_id_updated_at_idx ON public.assistant_conversations(user_id,updated_at);
-- New private application tables: accessed through the authenticated Express API.
ALTER TABLE public.campaign_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.campaign_daily_metrics,public.assistant_conversations FROM anon,authenticated;
