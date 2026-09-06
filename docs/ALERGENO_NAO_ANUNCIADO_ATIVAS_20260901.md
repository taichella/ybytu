# Alérgeno não anunciado no nome — refeições ATIVAS (2026-09-01)

**URGENTE.** Estas refeições estão ativas hoje no catálogo — usuário real pode estar
recebendo qualquer uma delas neste momento. Mesmo padrão do caso já confirmado e corrigido
em 2026-08-31: `Vitamina de Abacate Tradicional` (`meal_005`, desativada por levar 200ml de
leite integral sem isso aparecer no nome da receita nem — naquele caso específico — na tag
de restrição). Ver `docs/REVISAO_NUTRICIONISTA_meal_leite_sem_tag_20260831.md`.

**Nota de escopo importante, diferente do caso `meal_005`:** para a maioria das refeições
abaixo, a tag de alérgeno (`restriction_tags`) **já está corretamente preenchida** no banco
(ex.: `meal_046` já tem `milk` na tag). O defeito aqui não é dado quebrado — é que **o nome
da receita**, sozinho, não avisa quem tem a restrição. Alguém filtrando por nome/categoria
sem checar a ficha completa pode se enganar. Ainda assim, a ação recomendada (desativar até
o nome ser corrigido ou o prato ser marcado com aviso visível) é a mesma.

**Contagem:** a tarefa que originou este documento citava "23 ativas". A lista de meal_ids
fornecida continha 22 IDs únicos. Refazendo a varredura (ingredientes reais × tags de
alérgeno em `food_restriction_tags`, cruzado com o nome da receita), **`meal_042` (Pão de
Queijo de Frigideira) foi identificada como a 23ª** — mesmo padrão dos demais: o nome anuncia
o laticínio ("queijo") mas não o ovo (`Ovo cozido`, 50g), que está presente e não anunciado.
Ela é tratada como parte do lote de 23 abaixo. Sinalizando essa reconciliação explicitamente
para quem for aprovar, já que não estava na enumeração literal do pedido.

**Atualização 2026-09-01 — a lista virou 26.** Investigando `food_420` (Whey Protein
Concentrado) na revisão de alérgenos do catálogo completo (ver
`docs/REVISAO_NUTRICIONISTA_ALERGENOS_486_FOODS_20260901.md`), apareceram 3 refeições ativas
novas que a varredura original (por nome de receita) não pegou, porque a investigação partiu
do ingrediente, não do nome: `meal_043`, `meal_022` e `meal_053`. Ver seção dedicada logo
abaixo — `meal_043` é tratado como o caso mais grave de todo este documento, pior que o
`meal_005` original.

---

## 🔴 O caso mais grave do documento — encontrado depois, via investigação de ingrediente

### meal_043 — Waffle Proteico de Baunilha (breakfast)
- Whey Protein Concentrado (`food_420`) — 30g
- Ovo cozido (`food_165`) — 50g
- Aveia em flocos (`food_004`) — 15g
- Extrato de baunilha (`food_494`) — 5ml
- **Alérgenos não anunciados: leite + soja (via whey) + ovo — três alérgenos numa refeição só,
  nenhum aparece no nome.** "Proteico" não especifica whey nem leite; nada no nome menciona
  ovo. Pior que `meal_005` (Vitamina de Abacate, 1 alérgeno escondido): aqui são três.

### meal_022 — Batido de Whey e Banana (snack)
- Whey Protein Concentrado (`food_420`) — 30g
- **Leite desnatado (`food_186`) — 200ml** (ingrediente de leite direto, além do whey)
- Banana (`food_079`) — 100g
- **Alérgenos não anunciados: leite (duplo — whey E leite desnatado puro) + soja (via whey).**
  "Whey" no nome não é "leite"/"laticínio" explícito.

### meal_053 — Proats (Mingau de Aveia com Whey) (breakfast)
- Aveia em flocos (`food_004`) — 30g
- Whey Protein Concentrado (`food_420`) — 30g
- **Alérgeno não anunciado: soja (via whey) — sempre, independente da decisão abaixo.**
  **Sobre o leite:** tratado como não anunciado. O nome diz "com Whey" explicitamente, mas
  "Whey" só comunica laticínio para quem conhece o jargão fitness — um alérgico à proteína do
  leite que não é desse meio não reconhece o termo como aviso de laticínio. A nutricionista
  pode discordar se avaliar que o público dela reconhece "whey" como leite; registrado aqui
  para essa decisão ser dela, não assumida.

Essas 3 refeições apareceram porque a investigação partiu do ingrediente (`food_420`) e checou
suas refeições, não do nome da refeição pra trás — a varredura original desta lista fazia o
caminho inverso (nome → alérgeno) e não capturou esses casos. Ver pedido de varredura completa
partindo de cada ingrediente com alérgeno confirmado, em andamento.

---

## Seção prioritária — padrão "vitamina/batido escondendo leite" (mais próximas do caso confirmado)

Essas 4 repetem exatamente o padrão do caso já corrigido: nome de vitamina/batido/shake, sem
nenhuma palavra que sugira laticínio, mas leva leite (ou leite + outro alérgeno) de verdade.

### meal_046 — Vitamina de Papaia e Aveia (breakfast)
- Mamão — 100g
- Leite desnatado — 200ml
- Aveia em flocos — 15g
- **Alérgeno não anunciado:** leite (laticínio) — nome não menciona leite/laticínio.

### meal_100 — Batido de Abacate Proteico (snack)
- Leite desnatado — 200ml
- Abacate — 50g
- Whey Protein Concentrado — 20g
- **Alérgeno não anunciado:** leite (laticínio) — "Proteico" não especifica whey/leite. Whey também carrega traço de soja (tag `soy` no ingrediente), não anunciado.

### meal_165 — Batido de Morango e Pasta de Amendoim (snack)
- Leite desnatado — 200ml
- Morango — 100g
- Pasta de amendoim — 20g
- **Alérgeno não anunciado:** leite (laticínio). (Amendoim está anunciado no nome — "Pasta de Amendoim" — esse não é o problema aqui.)

### meal_176 — Batido Hipercalórico (Mass Gainer Caseiro) (snack)
- Leite integral — 250ml
- Whey Protein Concentrado — 30g
- Banana — 100g
- Pasta de amendoim — 20g
- **Alérgeno não anunciado:** leite (laticínio) + soja (via whey). Amendoim está anunciado (`Pasta de amendoim` é o próprio nome do prato, mas "Batido Hipercalórico" isolado não deixa isso óbvio de cara — mencionado aqui por transparência, risco menor que leite/soja).

---

## Demais 19 refeições ativas

### meal_002 — Mingau de Aveia com Banana (breakfast)
- Aveia em flocos — 40g
- Leite desnatado — 200ml
- Banana — 100g
- **Alérgeno não anunciado:** leite.

### meal_003 — Ovos Mexidos com Pão Francês (breakfast)
- Ovo cozido — 100g
- Manteiga sem sal — 5g
- Pão francês — 50g
- **Alérgeno não anunciado:** leite (manteiga). (Ovo e glúten/pão já estão no nome — esses dois não são o problema.)

### meal_026 — Mingau Proteico de Cacau (snack)
- Aveia em flocos — 30g
- Leite desnatado — 150ml
- Whey Protein Concentrado — 20g
- Cacau em pó (sem açúcar) — 5g
- **Alérgeno não anunciado:** leite + soja (via whey).

### meal_042 — Pão de Queijo de Frigideira (breakfast) — *incluída para fechar as 23, ver nota de contagem acima*
- Ovo cozido — 50g
- Tapioca (goma preparada) — 20g
- Queijo muçarela — 20g
- **Alérgeno não anunciado:** ovo. (Queijo/laticínio já está no nome.)

### meal_054 — Pão de Aveia de Microondas (breakfast)
- Ovo cozido — 50g
- Aveia em flocos — 20g
- Iogurte natural — 30g
- **Alérgeno não anunciado:** ovo + leite (iogurte). Nada no nome sugere nenhum dos dois.

### meal_063 — Cuscuz Marroquino com Grão-de-Bico (lunch)
- Cuscuz marroquino (cozido) — 100g
- Grão-de-bico cozido — 100g
- Azeite de oliva extravirgem — 5ml
- **Alérgeno não anunciado:** glúten (trigo). "Cuscuz" em português do Brasil é fortemente associado ao cuscuz de milho (sem glúten); "cuscuz marroquino" é feito de sêmola de trigo — a ambiguidade do termo no PT-BR é justamente por que isso não conta como anunciado.

### meal_081 — Pizza de Frigideira com Massa de Aveia (dinner)
- Aveia em flocos — 40g
- Ovo cozido — 50g
- Molho de tomate caseiro — 30g
- Queijo muçarela — 30g
- **Alérgeno não anunciado:** ovo. (Queijo já está no nome.) — **ver risco de cobertura abaixo.**

### meal_082 — Hambúrguer Caseiro Magro (dinner)
- Pão de hambúrguer — 50g
- Carne moída (patinho) cozida — 100g
- Queijo prato — 20g
- Ketchup — 10g
- **Alérgeno não anunciado:** leite (queijo prato). (Pão/glúten é esperado em hambúrguer, não anunciado explicitamente mas convencional; foco do risco é o queijo.)

### meal_092 — Wrap Frio de Atum Rápido (lunch)
- Wrap / Tortilha de trigo — 50g
- Atum em lata (natural) — 50g
- Maionese tradicional — 10g
- **Alérgeno não anunciado:** ovo (via maionese). (Glúten do wrap é esperado pelo nome "Wrap".) — **ver risco de cobertura abaixo.**

### meal_103 — Rolo de Carne Moída Recheado (lunch)
- Carne moída (patinho) cozida — 150g
- Presunto cozido — 30g
- Queijo muçarela — 30g
- **Alérgeno não anunciado:** leite (queijo) — nome não menciona recheio de queijo.

### meal_114 — Tilápia Empanada na Aveia (dinner)
- Tilápia grelhada — 150g
- Aveia em flocos — 30g
- Ovo cozido — 20g
- **Alérgeno não anunciado:** ovo (usado para empanar, mas nome só menciona aveia). — **ver risco de cobertura abaixo (CRÍTICO).**

### meal_127 — Bolo de Caneca Proteico (snack)
- Whey Protein Concentrado — 30g
- Ovo cozido — 50g
- Cacau em pó (sem açúcar) — 5g
- **Alérgeno não anunciado:** leite + soja (whey) + ovo.

### meal_136 — Escondidinho de Frango com Abóbora (lunch)
- Peito de frango grelhado — 100g
- Purê de abóbora (preparado) — 150g
- Queijo muçarela — 20g
- **Alérgeno não anunciado:** leite (queijo, cobertura gratinada não citada no nome).

### meal_151 — Pizza de Frigideira Low Carb (snack)
- Ovo cozido — 100g
- Queijo muçarela — 30g
- Molho de tomate caseiro — 20g
- **Alérgeno não anunciado:** ovo + leite — "Low Carb" não indica nenhum dos dois.

### meal_156 — Pudim de Chia de Cacau (snack)
- Chia hidratada (Pudim de Chia base) — 15g
- Leite de amêndoas — 150ml
- Cacau em pó (sem açúcar) — 5g
- **Alérgeno não anunciado:** castanha (amêndoa).

### meal_192 — Hambúrguer Caseiro com Bacon (dinner)
- Pão de hambúrguer — 50g
- Carne moída (patinho) cozida — 100g
- Queijo prato — 20g
- Bacon de peru — 20g
- **Alérgeno não anunciado:** leite (queijo prato).

### meal_194 — Cachorro-Quente Especial (lunch)
- Cachorro-quente (com pão e salsicha) — 100g
- Ketchup — 20g
- Maionese tradicional — 10g
- **Alérgeno não anunciado:** ovo (maionese).

### meal_198 — Wrap de Kebab de Carne (dinner)
- Wrap / Tortilha de trigo — 50g
- Kebab / Shawarma de carne — 100g
- Maionese tradicional — 10g
- **Alérgeno não anunciado:** ovo (maionese). (Glúten do wrap é esperado pelo nome.)

### meal_200 — Nachos com Carne e Guacamole (snack)
- Salgadinho de pacote (tipo chips de milho) — 50g
- Carne moída (patinho) cozida — 100g
- Queijo muçarela — 20g
- Guacamole — 30g
- **Alérgeno não anunciado:** leite (queijo, coberto pelo nachos gratinado não citado no nome).

---

## Impacto de cobertura se desativar (refeito com as 26)

Base: hoje há **100 refeições ativas** no catálogo, distribuídas em 4 categorias de
`dietary_preference` (`omnivore`, `pescetarian`, `vegan`, `vegetarian`) × 4 `meal_type`
(`breakfast`, `lunch`, `dinner`, `snack`). "Poucas opções" = **2 ou menos** restantes na
mesma combinação preferência × tipo depois de tirar as 26 do ar.

As 3 novas (`meal_022` snack, `meal_043` e `meal_053` breakfast) caem nas mesmas duas
combinações de maior folga do catálogo — não introduzem nenhum risco novo.

### Combinação por combinação (preferência × tipo) — só as combinações tocadas pelas 26

| Preferência × Tipo | Ativas hoje | Quantas das 26 saem daqui | Restam se todas saírem | Risco |
|---|---|---|---|---|
| vegetarian × breakfast | 17 | 7 (046,002,003,054,042,043,053) | 10 | OK |
| vegetarian × snack | 19 | 7 (100,165,176,026,127,151,022) | 12 | OK |
| vegan × lunch | 5 | 1 (063) | 4 | OK |
| **vegetarian × dinner** | **2** | **1 (081)** | **1** | **RISCO — só sobra 1 opção** |
| omnivore × dinner | 11 | 3 (082,192,198) | 8 | OK |
| **pescetarian × lunch** | **2** | **1 (092)** | **1** | **RISCO — só sobra 1 opção** |
| omnivore × lunch | 8 | 3 (103,136,194) | 5 | OK |
| **pescetarian × dinner** | **1** | **1 (114)** | **0** | **CRÍTICO — zera a categoria** |
| vegan × snack | 12 | 1 (156) | 11 | OK |
| omnivore × snack | 5 | 1 (200) | 4 | OK |

Nenhuma combinação nova ficou arriscada — os mesmos 3 casos de risco de antes continuam sendo
os únicos 3, e as folgas em `vegetarian × breakfast`/`vegetarian × snack` continuam confortáveis
(10 e 12 restantes) mesmo com 2 saídas a mais em cada uma.

### Veredito — as 7 mais prioritárias (padrão vitamina/batido + whey)

As 4 originais (`meal_046`, `meal_100`, `meal_165`, `meal_176`) mais as 3 novas (`meal_022`,
`meal_043`, `meal_053`) caem em `vegetarian × breakfast` ou `vegetarian × snack`, as duas
combinações com mais folga do catálogo. **Podem ser desativadas primeiro, sem restrição de
cobertura** — `meal_043` (3 alérgenos escondidos) é a mais urgente de todas.

### Grupo 1 — pode sair sem risco de cobertura (23 de 26)

`meal_046, meal_100, meal_165, meal_176, meal_022, meal_043, meal_053, meal_002, meal_003,
meal_026, meal_054, meal_042, meal_063, meal_082, meal_103, meal_127, meal_136, meal_151,
meal_156, meal_192, meal_194, meal_198, meal_200`

### Grupo 2 — NÃO desativar ainda sem repor opção antes (3 de 26, inalterado)

| meal_id | Nome | Combinação | Restaria |
|---|---|---|---|
| `meal_081` | Pizza de Frigideira com Massa de Aveia | vegetarian × dinner | 1 opção |
| `meal_092` | Wrap Frio de Atum Rápido | pescetarian × lunch | 1 opção |
| `meal_114` | Tilápia Empanada na Aveia | pescetarian × dinner | **0 opções — zera o cardápio de jantar pescetariano** |

Recomendação inalterada: essas 3 esperam até existir substituto ativo na mesma combinação
preferência × tipo, especialmente `meal_114` (única opção de jantar pescetariano ativa hoje).
