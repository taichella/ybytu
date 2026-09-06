# Critério de `food_group_id` e de detecção de proteína (2026-09-02)

Decisão de produto, registrada pra sobreviver a quem vier depois — não é óbvia e já foi
implementada errado uma vez (auditoria externa usando taxonomia pra responder pergunta de
composição nutricional, ver abaixo).

## `food_group_id` classifica pela NATUREZA do alimento, nunca por cálculo

Regra: **predominância de macronutriente para alimento simples, `mixed` para prato composto**
— mesmo padrão das tabelas de referência (TACO, USDA), que classificam por natureza (feijão
fica em leguminosas mesmo com carboidrato predominante) e reservam uma categoria à parte pra
prato composto.

**`food_group_id` NUNCA deve ser recalculado a partir de `protein_g`/`carbs_g`/`fat_g`.** Os 3
casos de `mixed` que já existiam no catálogo antes desta decisão provam por quê:

| food_id | Nome | protein_g | carbs_g | fat_g |
|---|---|---|---|---|
| food_276 | Ravioli de carne (cozido) | 11.5 | **30.0** | 8.0 |
| food_277 | Tortellini de queijo (cozido) | 11.0 | **35.0** | 7.5 |
| food_476 | Taco Mexicano (Carne e Queijo) | 12.0 | **20.0** | 11.5 |

Nos 3, carboidrato é o macro numericamente maior. Se `food_group_id` fosse recalculado por
predominância, os 3 estariam em `carbohydrates` — errado, porque são pratos compostos (massa/
casca de carboidrato com recheio de proteína), não alimentos de natureza única. Um cálculo
automático reverteria os 3 casos que hoje estão certos.

Efeito colateral do cálculo automático que também pesou nessa decisão: dois alimentos do mesmo
tipo com composição nutricional levemente diferente (ex. iogurte integral vs. desnatado)
cairiam em grupos diferentes só por causa de `fat_g`, quando "isto é laticínio" não deveria
mudar por causa disso.

## `food_group_id` NUNCA responde "esta refeição tem proteína?"

Essa pergunta se responde com **`protein_g` somado proporcionalmente à gramagem de cada
ingrediente da refeição**, não com taxonomia. `food_group_id` é rótulo de natureza do alimento,
não medida de composição — nunca foi desenhado pra essa pergunta e não deveria ser usado pra
ela.

**Evidência real do custo de usar taxonomia pra essa pergunta:** uma auditoria externa (IA sem
acesso a banco, reprocessando um CSV) marcou 20 refeições ativas/inativas como "sem fonte
evidente de proteína" checando `food_group_id` dos ingredientes contra o nome do alimento. Ao
validar contra `protein_g` real, **16 das 20 (80%) eram falso positivo** — a maioria porque o
alimento com proteína de verdade (Contrafilé, Pescada, Alcatra, Camarão, Polvo, Sardinha,
Cação) estava corretamente listado, mas 12 alimentos do bloco "pratos prontos/fast-food"
(`food_460`–`food_479`) tinham `food_group_id='carbohydrates'` apesar de conterem proteína
embutida (pizza, hambúrguer, pastel, coxinha, cachorro-quente etc.) — ver
`docs/RECLASSIFICACAO_FOOD_GROUP_MIXED_20260902.sql`. A categoria "Refeição Incompleta" dessa
auditoria foi descartada por causa disso; substituída pela checagem direta via `protein_g`
(ver `docs/AUDITORIA_PROTEINA_REFEICOES_20260902.md`).

## Risco conhecido, registrado sem correção ainda: `derivePlanPreference` confia em `meals.dietary_preference` sem checar ingredientes

Achado na auditoria de código de 2026-09-02 (`supabase/functions/ybytu-generate-meal-plan/index.ts:174-181`).
`derivePlanPreference` lê `meals.dietary_preference` (campo curado manualmente) de todas as
refeições de um rodízio e atribui ao **plano inteiro** o rank mais permissivo presente — sem
nenhuma checagem cruzada contra `ingredients_json`. A lógica de rank em si está correta (nunca
promete um plano mais restritivo do que a pior refeição do rodízio permite); o problema é
confiar no rótulo sem verificar se ele é consistente com o dado bruto que descreve.

**É a mesma arquitetura de risco do bug já confirmado em `restriction_tags`** (campo curado
decidindo entrega sem verificação) — com uma diferença importante: em `restriction_tags` já
sabemos de um caso real que passou batido (`meal_005`, Vitamina de Abacate, leite não
registrado). **Aqui, ninguém pisou ainda** — é risco estrutural registrado antes do incidente,
não depois.

Por que isso importa concretamente: já existe uma auditoria de catálogo mostrando 49,5% das
refeições com ingrediente errado por defeito de offset
(`project_meal_ingredient_mismatch_systemic`, ver também
`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv`). Uma refeição rotulada `vegan`
com carne de verdade nos ingredientes (por causa desse defeito) passaria pelo
`derivePlanPreference` inteiro sem ser detectada.

**Correção não é trocar qual coluna o código lê** — `meals.dietary_preference` é a coluna certa
pra essa decisão, curada com mais cuidado que `restriction_tags` até aqui (a varredura de
preferência × origem de ingrediente não achou nenhuma violação real, ver
`docs/ALERGENO_NAO_ANUNCIADO_ATIVAS_20260901.md` e a investigação relacionada). A correção é
terminar a limpeza de ingredientes já em andamento — depois disso, o risco estrutural continua
existindo (nada substitui uma checagem cruzada de verdade), mas a superfície de erro real
diminui bastante. Prioridade: baixa/média, dependente da limpeza em curso, não urgente hoje.

## Como calcular proteína real de uma refeição

Para cada ingrediente em `ingredients_json` (`{id, qtd, unit}`), a contribuição de proteína é:

```
protein_g_do_food × (qtd_do_ingrediente / quantity_do_food)
```

`quantity` em `foods` é a base de referência de `protein_g` (tipicamente 100, mas ler a coluna
real, não assumir). Soma das contribuições de todos os ingredientes = proteína real da
refeição. Isso não quebra quando alguém corrige um valor nutricional — pelo contrário, fica
mais preciso.
