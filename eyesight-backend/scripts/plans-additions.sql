CREATE TABLE IF NOT EXISTS public.planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  action_key varchar(80) NOT NULL,
  action_code varchar(50) NOT NULL,
  campaign_id integer,
  steps jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT planos_acao_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(pk_id_usuario) ON DELETE CASCADE,
  CONSTRAINT planos_acao_user_action_key UNIQUE (user_id, action_key)
);
CREATE INDEX IF NOT EXISTS planos_acao_user_id_last_seen_at_idx ON public.planos_acao(user_id, last_seen_at);
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.planos_acao FROM anon, authenticated;
