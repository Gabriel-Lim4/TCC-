-- Índice único antigo só em id_externo, que não está no schema. Ele impedia que dois usuários
-- (ex.: agência e cliente) conectassem a mesma conta de anúncios. A regra correta é por conta:
-- campanhas_conta_id_externo_key (fk_id_conta, id_externo).
DROP INDEX IF EXISTS "campanhas_id_externo_key";
