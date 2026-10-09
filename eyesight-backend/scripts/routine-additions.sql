CREATE TABLE IF NOT EXISTS public.rotina_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  kind varchar(30) NOT NULL,
  period_key varchar(10) NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rotina_envios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(pk_id_usuario) ON DELETE CASCADE,
  CONSTRAINT rotina_envios_user_kind_period_key UNIQUE (user_id, kind, period_key)
);
ALTER TABLE public.rotina_envios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rotina_envios FROM anon, authenticated;
