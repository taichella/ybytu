-- plan_generation_status agora é escrito pelo próprio gerador (server-side,
-- autoritativo — ver memória project_plan_generation_status_server_authoritative).
-- Falta o "porquê": hoje 'failed' não guarda nenhuma mensagem, só o status.
-- Esta coluna guarda a última mensagem de erro (ou o motivo de negócio, tipo
-- 'no_safe_meals'/'no_safe_exercises') pra alimentar a tela "Ver planos que
-- falharam" sem precisar caçar em logs.
alter table profiles add column if not exists plan_generation_error text;
