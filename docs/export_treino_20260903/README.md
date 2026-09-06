# Export catálogo de TREINO — 2026-09-03

Export somente-leitura do banco `ybytu` (via `npx supabase db query --linked`), pra análise externa. Nenhuma escrita no banco; as únicas escritas foram estes arquivos.

## Arquivos

- **`exercises.csv`** — 298 exercícios, todas as colunas de `exercises` + coluna resolvida ao lado de cada FK/array de código: `muscle_groups_nomes`, `exercise_equipments_nomes`, `exercise_level_nome`, `avoid_health_conditions_nomes`, `caution_health_condition_nomes`, `ambiente_permitido`. **Regerado em 2026-09-03** — a versão original tinha `avoid_health_conditions_nomes`/`caution_health_condition_nomes` presentes no cabeçalho mas vazios em ~70%/56% das linhas (bug de resolução: o join cobria só `health_conditions`, e os códigos que só existem via a ponte `physical_condition_exercise_slugs` — `knee_pain`, `lumbar_hernia` etc — nunca resolviam). Corrigido: resolução agora usa as duas fontes, 100% das linhas resolvidas. Ver "Por que ficou incompleto" abaixo.
- **`muscle_groups.csv`** — 49 linhas, vocabulário de grupos musculares.
- **`equipment.csv`** — 72 linhas, vocabulário de equipamentos (tabela real chama-se `exercise_equipments`, não `equipment`).
- **`exercise_levels.csv`** — 3 linhas (beginner/intermediate/advanced).
- **`exercise_environments.csv`** — 4 linhas (tabela real chama-se `exercise_environment`, singular). Não é usada para filtrar exercício individual — é atributo de nível de perfil/plano (`profiles.exercise_environment_id`, `training_plans.exercise_environments_ids`), que por sua vez decide a lista de equipamentos permitidos.
- **`physical_conditions.csv`** — 16 linhas, vocabulário "grosso" de condição física (o que o onboarding captura, ex: `knee`, `neck`, `lumbar`).
- **`physical_condition_exercise_slugs.csv`** — 16 linhas, tabela-ponte que expande cada `physical_conditions.physical_condition_id` pro(s) slug(s) fino(s) realmente usados em `exercises`/cautions (ex: `neck` → `cervical_hernia` + `neck_pain`). Sem essa ponte, `condition_slug` em `exercise_effective_cautions` não bate com `physical_conditions` nem com `health_conditions` — ver nota 3 abaixo.
- **`exercise_effective_cautions.csv`** — 2.106 linhas, com `exercise_nome` e `condition_nome_ptbr` já resolvidos (resolução passa por `health_conditions`, `physical_conditions` e a ponte acima, conforme o caso).
- **`meal_plans_resumo.csv`** — 1.400 linhas (uma por plano-dia), só dos 200 `meal_plans` de catálogo (`created_by_ai = false OR IS NULL`).
- **`schema_treino.sql`** — DDL (colunas + constraints + FKs + CHECKs) das tabelas acima, extraído via `information_schema`/`pg_catalog`, mais a definição real da view `exercise_effective_cautions`.

## Nomes que divergiram do que foi assumido inicialmente

- Tabela de equipamento chama-se `exercise_equipments` (não `equipment`).
- Tabela de ambiente chama-se `exercise_environment`, singular (não `exercise_environments`).
- `exercises` **não tem** `exercise_environment_id` nem `exercise_type_id` — ambiente e tipo não são atributos por exercício.
- `meal_plan_meals.meal_id` referencia `meals.id` (uuid), **não** `meals.meal_id` (código texto `meal_XXX`) — mesmo padrão enganoso já visto em `meal_plan_meals.meal_plan_id` (que referencia `meal_plans.id`, não `meal_plans.meal_plan_id`). Corrigido no JOIN usado pra montar `meal_plans_resumo.csv`.
- Resolver `condition_slug` exigiu **três** tabelas, não uma: `health_conditions` (doenças/condições sistêmicas: diabetes, obesidade, gravidez, hipertensão, asma, condição cardíaca), `physical_conditions` (dor/lesão localizada, vocabulário grosso: `knee`, `neck`, `lumbar`...) e a tabela-ponte `physical_condition_exercise_slugs` (vocabulário fino usado de fato em `exercises`: `knee_pain`, `cervical_hernia`, `lumbar_hernia`...). Nenhuma tabela isolada resolve tudo.

## Por que `exercises.csv` ficou incompleto na 1ª rodada (status ativo + ambiente)

Uma análise externa parou o trabalho porque `exercises.csv` não tinha coluna de status ativo
nem de ambiente. As duas faltavam por razões diferentes — nenhuma das duas era "coluna que
passou despercebida no export":

**Status ativo (`is_active`) — não existe, ponto final.** Confirmado em
`information_schema.columns`: `exercises` não tem essa coluna. Ao contrário de `meals`,
`meal_plans`, `training_plans` e `dietary_restrictions` (que têm `is_active` e o usam pra
desativar item sem apagar), o catálogo de exercícios não tem mecanismo de desativação nenhum —
todo exercício na tabela está, por definição, disponível pro gerador. Não há coluna pra
resolver nem pra exportar; a ausência é do schema, não do export. Isso muda como qualquer
auditoria de treino precisa tratar "remover um exercício ruim do catálogo": não existe um
`UPDATE ... SET is_active=false` equivalente ao que a nutrição usa — a única forma de tirar um
exercício de circulação hoje é deletar a linha (ou usar `avoid_health_conditions_ids`/
`exercise_condition_proposals` pra bloquear por condição, o que não é a mesma coisa que
desativar globalmente).

**Ambiente — não é atributo do exercício, é relação computada em código, não em tabela.** Não
existe FK `exercises.exercise_environment_id`. A tabela `exercise_environment` (4 linhas:
casa-sem-equip/casa-com-equip/academia/ar-livre) é vocabulário usado em `profiles` e
`training_plans` — atributo de **perfil/plano**, não de exercício. O gerador
(`ybytu-generate-training-plan/index.ts:829-839`) decide quais exercícios servem pra cada
ambiente **na hora de montar o plano**, cruzando `exercise_equipments_ids` do exercício contra
uma lista fixa de equipamentos "de casa" (`HOME_EQUIPMENT_WHITELIST`, hardcoded no código, 16
itens) — gym aceita qualquer equipamento, casa-com-equipamento só aceita o que está na lista,
casa-sem-equipamento/ar-livre só aceita `none_bodyweight`. Não existe uma tabela ou view que já
guarde "este exercício serve pra este ambiente" — é lógica de aplicação, recalculada a cada
geração de plano. Pra exportar isso resolvido, tive que reproduzir essa mesma regra em SQL
(coluna nova `ambiente_permitido`, ver abaixo) — sem isso, qualquer análise externa (sem acesso
ao código do gerador) não tinha como saber quais exercícios cabem em qual ambiente.

**O que isso muda daqui pra frente:** uma auditoria de treino não pode assumir que
"status"/"ambiente" são colunas em `exercises` como são em `foods`/`meals` do lado da nutrição.
Nível (`exercise_level_id`) e equipamento (`exercise_equipments_ids`) SÃO atributos diretos do
exercício; ambiente é derivado de equipamento por regra de negócio no código do gerador, e
status ativo simplesmente não existe como conceito no catálogo de treino hoje. Qualquer export
futuro de `exercises` precisa decidir explicitamente se quer reproduzir a regra de ambiente (como
fizemos aqui) ou deixar de fora e avisar que é derivado, não estático.

**Bug à parte, achado nesta rodada:** `avoid_health_conditions_nomes` e
`caution_health_condition_nomes` já existiam no cabeçalho da 1ª versão do CSV, mas a resolução
tinha um bug real — cobria só `health_conditions`, então qualquer código vindo da ponte
`physical_condition_exercise_slugs` (`knee_pain`, `lumbar_hernia` etc.) ficava com nome vazio.
70% das linhas de `avoid_health_conditions_nomes` e 56% de `caution_health_condition_nomes`
estavam em branco apesar de ter `_ids` preenchido. Corrigido nesta rodada — resolução agora
cruza as duas fontes (mesma lógica já usada, corretamente, em `exercise_effective_cautions.csv`),
100% das linhas resolvidas.

## Duas notas de contexto importantes pra quem for analisar

1. **`muscle_groups_ids` não é rótulo de exibição.** Ele alimenta o filtro de seleção de exercício na geração de treino (`ybytu-generate-training-plan`) — o pool de candidatos é montado consultando esse array. Um exercício com o array errado ou incompleto pode ser silenciosamente excluído da lista de candidatos pra um slot que deveria contemplá-lo (ou, na direção oposta, nunca ser escolhido pro grupo muscular certo). Erro aqui tem consequência real de composição de plano, não é só cosmético.

2. **`exercise_effective_cautions` é quem decide segurança**, e roda **antes** de qualquer montagem de plano (mesmo papel que o filtro de alérgeno tem do lado de nutrição). Linha com `tipo='avoid'` remove o exercício do pool de candidatos pra quem tem aquela condição — filtro rígido. `tipo='caution'` só gera aviso, não remove nada. A view combina três fontes (ver `schema_treino.sql`): os arrays `avoid_health_conditions_ids`/`caution_health_condition_ids` direto em `exercises` (`source='confirmed'`), e as propostas de `exercise_condition_proposals` com `status='ai_suggested'` (`source='ai_suggested'`) — ver achado da Tarefa 7 abaixo, essas últimas nunca passaram por revisão humana.

## Achado da Tarefa 7 (auditoria geral, não pedida mas relevante)

`exercise_condition_proposals` é uma tabela de staging com fluxo de revisão desenhado (`status` ∈ `ai_suggested`/`confirmed`/`rejected`, `reviewed_at`, `reviewed_by`, `review_priority`) — mas **nenhuma linha nunca foi revisada**: as 323 propostas existentes têm `status='ai_suggested'` e `reviewed_at IS NULL`, incluindo 64 marcadas `review_priority='critical'`. Apesar disso, a view `exercise_effective_cautions` (usada pelo gerador de treino em produção) já inclui essas 323 linhas como se fossem dado ativo — todas são `tipo='caution'` (nenhuma é `avoid`, então não removem exercício do pool, só geram aviso), mas ainda assim é conteúdo de segurança gerado por IA, nunca visto por humano, já em produção sem gate. Mesmo padrão da "Fase B não implementada" encontrado do lado de nutrição: fluxo de revisão construído no schema, mas nunca conectado a uma tela/processo que efetivamente grave `status='confirmed'` ou `'rejected'`.
