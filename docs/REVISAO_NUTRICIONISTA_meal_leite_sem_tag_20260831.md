# Refeição desativada por tag de alérgeno faltando — aguarda revisão

**Refeição:** Vitamina de Abacate Tradicional
**ID:** `3784b6d6-c283-4e8e-b187-31d4ba351bc5`

**Ingrediente que gera o alérgeno:** Leite integral (`food_171`), 200ml — carrega a tag
`milk` no cadastro do alimento (`foods.dietary_restrictions_ids`).

**Tag que falta na refeição:** `restriction_tags` da refeição está `[]` (vazio) — deveria
conter `milk`.

**Como foi achado:** comparando `meals.restriction_tags` (curado à mão) contra a tag
derivada da composição real (`ingredients_json` → `foods.dietary_restrictions_ids`) nas
200 refeições do catálogo. Única divergência encontrada nessa checagem.

**Ação tomada:** `meals.is_active = false` nesta refeição, até confirmação. Nenhum outro
campo foi alterado.

**Pendente da nutricionista:** confirmar se a tag `milk` deve ser adicionada (e
reativar) ou se há algum outro motivo pelo qual ela não deveria carregar essa tag.
