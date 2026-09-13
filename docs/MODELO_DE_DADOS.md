# Modelo de Dados do Catálogo de Nutrição Ybytu

Este documento explica como funciona a arquitetura do catálogo de nutrição, criado para garantir a geração automatizada e segura de dietas.

## O Histórico e o Estado Atual
Em agosto de 2026, um *seed* automatizado introduziu um problema sistêmico durante uma carga em massa, causando um deslocamento de índices no catálogo de nutrição. Devido a esse incidente, ingredientes inteiros foram substituídos mecanicamente por vizinhos na lista (ex: maçã virou laranja). É por isso que cerca de 100 das 200 refeições de base encontram-se inativadas no banco, deixando a oferta de cardápios temporariamente restrita.

## O Ciclo de Vida de um Plano Alimentar
O fluxo nutricional no sistema não é um texto solto, mas sim uma hierarquia de montagem estrita:

1. **Geração do Plano (`meal_plans`):** É o envelope principal. Baseia-se nas preferências do usuário (vegano, onívoro) e nos macros estipulados.
2. **Distribuição das Refeições (`meal_plan_meals`):** O plano é dividido em momentos (café da manhã, almoço) conectando o plano às refeições de base do catálogo.
3. **A Refeição (`meals`):** Uma refeição possui um nome e instruções de preparo, mas sua alma matemática está no `ingredients_json`. Este campo determina de fato a composição química e estrutural do prato.
4. **Os Alimentos (`foods`):** Cada nó dentro do `ingredients_json` aponta para um alimento na base genérica. A partir daqui, são extraídas as calorias reais, carboidratos, proteínas e as matrizes de segurança (tags e alérgenos).

## A Cadeia de Segurança (Alérgenos)

**CORRIGIDO 2026-09-13 — a versão anterior deste parágrafo descrevia um bloqueio que não existe.**
Este é justamente o documento usado para explicar o modelo a quem faz a análise/revisão externa —
se alguém ler que `unreviewed` bloqueia e decidir com base nisso, a decisão sai errada.

O caminho da segurança nasce no alimento cru e sobe até o perfil do aluno: o sistema lê as
propriedades ligadas aos alimentos da refeição. Os três estados do `allergen_review_status`
determinam a confiabilidade daquele alimento:

*   **`reviewed_none`:** Confirma que não possui alérgenos ocultos.
*   **`reviewed_has_allergens`:** Possui o alérgeno marcado e explícito (vira `restriction_tags` na
    refeição, ver abaixo).
*   **`unreviewed`:** Significa "não sabemos" — e essa incerteza **hoje não bloqueia nada**. Uma
    refeição com ingrediente `unreviewed` é gerada e entregue ao aluno normalmente; a única
    diferença visível é um badge na tela do aluno ("Alergênicos não verificados"), que avisa mas não
    impede a entrega. Não existe trava automática nem revisão manual obrigatória antes de servir —
    é por isso que a Sessão 1 de revisão com a nutricionista existe: sem a revisão dela, o "não
    sabemos" nunca vira informação de verdade por conta própria.

O que **de fato** bloqueia, na geração de um plano novo: a RPC de match (`ybytu_match_meals` /
`ybytu_match_meal_plans`) exclui qualquer refeição cujo `restriction_tags` colida com os tokens que
o *aluno declarou* no onboarding (`dietary_restrictions.excludes_tokens`). Isso é um bloqueio real,
mas só cobre restrição **declarada** — não cobre ingrediente `unreviewed`, que pode conter qualquer
coisa e ainda assim passar.

## Tabelas de Apoio: Classificação vs. Segurança
Existem várias tabelas satélites gravitando em torno dos alimentos e refeições. Elas dividem-se em dois propósitos fundamentais:

*   **Puramente Classificatórias (UX/Filtros):** Tabelas como `food_groups` (Grupo Alimentar), `food_types` (Tipo), `food_measurement_units` (Medidas), `food_preparation_methods` e `food_sources` organizam a visualização no app e a construção semântica do cardápio, mas *não* atuam no algoritmo de bloqueio clínico.
*   **Estruturais e de Decisão Clínica:** A tabela `meal_types` define as restrições de horários (âncoras), enquanto as restrições alimentares impõem o bloqueio rígido.

## Tokens e Tabelas Relacionais 
Por que as restrições (`restriction_tokens`) operam como uma tabela de chave estrangeira (FK) isolada, e não como campos de texto livre nas refeições?
A integridade referencial exige que não ocorram erros de digitação (ex: "glttem" em vez de "gluten"). Ter uma tabela dedicada forçando relação de FK garante que o banco de dados proíba (rejeite) tokens desconhecidos instantaneamente. Se fossem textos livres, o sistema ignoraria a restrição silenciosamente e geraria um plano tóxico para um alérgico.

## Campos Legados e Mortos (Não utilizar)
Ao consultar as tabelas principais, preste atenção aos dados depreciados que ainda habitam o schema para retrocompatibilidade, mas não devem fundamentar operações lógicas novas:
*   `dietary_restrictions_ids_deprecated`: Antiga forma de gerenciar alergias diretamente por coluna.
*   `meal_plans.restriction_tags`: O sistema a abandonou como fonte primária da verdade clínica. Como esta coluna tende a dessincronizar (ficar estática) quando os pratos mudam suas amarrações internas, a segurança atual rederiva a restrição em tempo real lendo diretamente do alimento.