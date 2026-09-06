# Revisão de alérgenos — lote completo dos 486 foods (2026-09-01)

**Este documento substitui `docs/REVISAO_NUTRICIONISTA_ALERGENOS_CATALOGO_20260831.md`** (lote de
apenas 56 ingredientes sem revisão). Aquele arquivo não é apagado — fica no histórico —, mas o
trabalho de revisão de alérgenos do catálogo passa a ser conduzido por este documento, que cobre
os 486 `foods` inteiros (os 254 já `reviewed_has_allergens` mais os 232 restantes).

**Reescrito em 2026-09-01 (2ª vez, mesmo dia)** para trocar a fonte de dados: a primeira versão
deste documento foi construída sobre `analise_alergenos_v5.csv`, que tinha viés forte de remover
alérgeno indevidamente. Chegou uma versão corrigida da mesma proposta (`foods_gemini.csv`, 486
linhas, mesmo formato), e este documento foi **recalculado do zero contra o CSV novo** — todos os
números abaixo (Parte 1, Parte 2, contagem de `egg`, caso do Whey, coco) foram reconferidos
linha a linha contra o banco em 2026-09-01, não reaproveitados da rodada anterior. Estrutura em 3
partes por risco mantida.

## ⚠️ Viés da fonte — leia antes de confiar em qualquer linha, inclusive nos 222 "simples"

Com o CSV **corrigido**, a Parte 1 (proposta REMOVE alérgeno já revisado) caiu de **99 para 79
casos** (-20). A Parte 2 (proposta ACRESCENTA alérgeno que o banco não tinha) subiu de **42 para
56 casos** (+14) — a maior parte do aumento é o retorno de `nuts` em paralelo a `tree_nuts` para
castanhas/coco e de `red_meat` em paralelo a `pork` para suínos, ou seja, refinamentos que
adicionam um token mais genérico ao lado do que já havia, não substituições perigosas. Mesmo assim
a proposta ainda erra **mais na direção de remover alérgeno do que de acrescentar** (79 vs. 56) —
o viés sistemático identificado na rodada anterior diminuiu mas não desapareceu. Leve isso em
conta mesmo revisando os 222 alimentos "simples" da Parte 3a, onde a proposta tende a acertar mas
não está isenta desse viés.

## Decisão registrada: exibir em vez de desativar

As 52 refeições ativas com alérgeno não anunciado no nome — documentadas em
`docs/ALERGENO_NAO_ANUNCIADO_ATIVAS_20260901.md` e na investigação subsequente — **não serão
desativadas**. A decisão tomada foi implementar exibição de alérgeno derivado na interface (badge)
em vez de remover as refeições do catálogo. Motivos registrados:

- **(a) Escala:** o padrão afeta 52 de 100 refeições ativas — não é mais uma lista de exceções
  pontuais, é uma falha estrutural de nomenclatura do catálogo inteiro.
- **(b) Custo de cobertura:** desativar todas de uma vez zeraria duas combinações de
  preferência × tipo de refeição e deixaria outras duas com apenas 1 opção restante — um buraco de
  cardápio maior do que o risco que a desativação resolveria.
- **(c) Nenhuma indução ativa:** a classificação de indução ativa vs. omissão pura mostrou que
  nenhuma das 52 é enganosa — o nome não promete ausência do alérgeno em nenhum caso, só não o
  anuncia. Badge resolve o problema por completo nesses casos (mostra o que falta, sem prometer
  nada que o nome já não prometesse).

## Origem dos dados

Uma IA externa analisou os 486 `foods` do catálogo e propôs, para cada um, uma classificação de
alérgeno (`tokens`, `resposta`, `justificativa`). O arquivo usado nesta versão é
`foods_gemini.csv` — uma correção da proposta original (`analise_alergenos_v5.csv`), que tinha
viés de remoção indevida. Essa mesma linhagem de IA já errou 21 de 76 casos numa tarefa anterior
(substituição de ingredientes) — então nada aqui foi aceito sem cruzar contra o banco real, linha
a linha, mesmo na versão corrigida.

## Validação estrutural (antes de qualquer análise de conteúdo)

- **486/486 linhas passaram na validação de identidade**: todo `id` existe em `foods`, todo
  `nome` bate exatamente com `name_ptbr`. Nenhum id duplicado, nenhum food do banco ausente do
  CSV. **Nenhuma rejeição por identidade.**
- **Vocabulário de tokens: 100% limpo.** Todos os tokens usados no CSV pertencem à lista esperada
  e existem em `restriction_tokens`. **Nenhuma rejeição por vocabulário.**
- **Nenhuma linha foi rejeitada estruturalmente.** Isso não significa que o conteúdo está certo —
  ver as 3 partes abaixo para os problemas de conteúdo encontrados.

**Nota sobre "justificativa":** na versão anterior (v5) essa coluna tinha só 4 textos distintos no
total. **Na versão corrigida ela tem 9 textos distintos** — a fonte passou a escrever
justificativas específicas para casos que antes caíam nos 4 templates genéricos, incluindo textos
dedicados para coco (critério clínico FDA, ver seção própria abaixo), Seitan ("fabricado a partir
de glúten de trigo puro, não contém carne") e produtos vegetais análogos ("base declarada no
nome" vs. "formulação varia por fabricante, pode conter soja/castanhas/glúten — qual a base
exata?"). Isso por si só é evidência de que a correção não foi só nos valores de token, mas na
qualidade do raciocínio por trás deles.

---

## Critério usado para "alimento simples" vs. "prato composto" (Parte 3)

A resposta à pergunta final deste documento (quantos dos 232 `unreviewed` a proposta resolve
sozinha) depende inteiramente deste critério, então ele está documentado aqui para auditoria antes
de qualquer resultado. **Este critério não mudou desde a versão anterior** — ele usa só metadados
do catálogo (`food_type_id`, nome), nunca o conteúdo da proposta, então o CSV novo não altera a
divisão simples/composto.

**Método:** comecei pelos campos de classificação já existentes no catálogo
(`foods.food_type_id`, ver `docs/export_nutricao_20260901/food_types.csv`) e apliquei, nesta
ordem, para cada um dos 486 `foods`:

1. **`food_type_id = 'sauce'` → composto.** Molhos são preparações multi-ingrediente por
   definição (ex.: Ketchup = tomate + açúcar + vinagre + especiarias; BBQ; Guacamole). Isso já tem
   evidência direta no lote `reviewed`: dos molhos já revisados, Molho Pesto (milk, tree_nuts),
   Molho Branco/Bechamel (gluten, milk, wheat) e Molho Tarê (gluten, soy, wheat) — a proposta
   errou por omissão nos 3 (continuam na Parte 1 abaixo). Nome de molho não é confiável para
   inferir alérgeno.
2. **`food_type_id = 'fast_food'` → composto.** É literalmente a categoria de "prato pronto" do
   catálogo (pizza, hambúrguer, cheeseburger, nuggets, sushi, taco, burrito, coxinha, pastel,
   croissant recheado, donut etc. já revisados estão todos aqui).
3. **Nome corresponde a um prato composto conhecido**, independente da categoria técnica: regex
   sobre nomes como croissant, brioche, donut/sonho, pastel, coxinha, pizza, hambúrguer,
   cheeseburger, taco, kebab/shawarma, nugget, burrito, cachorro-quente, sushi, ravioli,
   tortellini, lasanha, empada, quiche, bolo, gnocchi, "mac and cheese". Pega casos como
   "Hambúrguer vegetal (tipo carne)" que estão em categorias técnicas não óbvias
   (`vegan_meat_alternative`).
4. **Nome contém "recheado"/"recheada"** → composto (recheio é um segundo componente não nomeado
   explicitamente).
5. **Nome contém "com" introduzindo um segundo componente alimentar** (xarope, molho, recheio,
   cobertura, geleia, creme, calda) → composto. Ex.: "Açaí com xarope de guaraná". **Importante:**
   "com" NÃO conta quando é só modificador de corte/preparo sem adicionar um alimento novo — "Coxa
   de frango assada (com pele)", "Asa de frango assada (com pele)" e "Margarina com sal" ficaram
   como simples porque pele e sal não são componentes alimentares separados com alérgeno próprio.
6. **Tudo o que não bate em nenhuma regra acima → simples**, incluindo ingrediente único
   cru/cozido/grelhado/assado, carnes processadas de um único tipo de proteína (presunto, bacon,
   salame — são "porco processado", não um prato com múltiplos componentes), pães simples (pão
   francês, baguete, ciabatta — tratados como item atômico do catálogo, não como "prato"), óleos,
   farinhas, temperos e suplementos em pó de proteína/ingrediente único.

Este critério é mecânico e auditável, mas não é perfeito — é uma heurística, não uma leitura
nutricional linha a linha. A nutricionista pode discordar de qualquer classificação individual; a
coluna "Confirmação da nutricionista" nas tabelas 3a/3b serve para isso.

---

## Correção já feita pela fonte: Seitan (`food_453`) — não precisa mais de correção manual

Na versão anterior (`analise_alergenos_v5.csv`), `food_453` (Seitan / Carne de glúten) vinha
marcado com o token **`red_meat`** e resposta "Contém" — um erro de conteúdo claro (Seitan é 100%
glúten de trigo processado, vendido como substituto vegano de carne, sem nenhuma carne real).

**Na versão corrigida (`foods_gemini.csv`), a fonte já entrega o valor certo**: `food_453` vem
como `gluten, wheat` / "Contém", com a justificativa explícita "Seitan é fabricado a partir de
glúten de trigo puro. Não contém carne." — que é exatamente o que já está gravado no banco
(`reviewed_has_allergens`). Como proposta e banco batem, `food_453` **não aparece** em nenhuma das
tabelas de divergência abaixo. Não há mais nada para a nutricionista decidir aqui — é só um
registro de que o erro existiu numa versão anterior e foi corrigido pela própria fonte, não por
edição manual deste documento.

---

## 🔴 Caso mais grave do documento: Whey Protein Concentrado (`food_420`)

Confirmado direto no banco (2026-09-01, reconferido nesta rodada): `food_420` já está
`reviewed_has_allergens` com **`milk` e `soy`** gravados. **A versão corrigida do CSV já resolveu
o `milk`** — mas ainda propõe só `milk`, **continua sem `soy`**. Soja em whey normalmente vem de
lecitina de soja usada como emulsificante na formulação do fabricante; o nome "Whey Protein
Concentrado" não esconde nada — é literalmente proteína do soro do leite — e mesmo assim a
proposta corrigida ainda deixa a soja de fora. É um alérgeno real, já confirmado pelo banco, que a
proposta continua removendo.

**Reconfirmado nesta rodada: usado em 7 refeições ativas — o food_id mais usado de toda a Parte
1**, a mesma contagem e a mesma lista de antes (nada mudou aqui, só a extensão do erro diminuiu de
2 tokens para 1):

| meal_id | Nome |
|---|---|
| meal_022 | Batido de Whey e Banana |
| meal_026 | Mingau Proteico de Cacau |
| meal_043 | Waffle Proteico de Baunilha |
| meal_053 | Proats (Mingau de Aveia com Whey) |
| meal_100 | Batido de Abacate Proteico |
| meal_127 | Bolo de Caneca Proteico |
| meal_176 | Batido Hipercalórico (Mass Gainer Caseiro) |

`food_421` (Whey Protein Isolado) tem exatamente o mesmo padrão — banco `milk, soy`, proposta só
`milk` — mas com 0 refeições ativas hoje, então o impacto imediato é menor.

---

## 🥥 Coco — dois argumentos registrados, sem resolver qual prevalece

Na versão anterior do CSV, a proposta zerava o alérgeno de praticamente todas as variantes de
coco (Coco seco, Coco ralado, Óleo de coco, Farinha de coco, Açúcar de coco, Leite de coco,
Iogurte de coco), removendo `tree_nuts` que o banco já tinha revisado. **Na versão corrigida, 7
das 8 variantes de coco no catálogo voltaram para `nuts, tree_nuts`**, cada uma com a mesma
justificativa customizada (não é mais um dos 4 templates genéricos):

> "Critério clínico adotado: classificação internacional (FDA) que inclui coco como castanha
> (tree nuts), embora no Brasil a Anvisa frequentemente não o exija. Nutricionista: deseja manter
> essa restrição preventiva?"

As 7: `food_131` (Coco seco), `food_132` (Coco ralado), `food_322` (Óleo de coco), `food_347`
(Farinha de coco), `food_362` (Açúcar de coco), `food_442` (Leite de coco, bebida — 2 refeições
ativas), `food_448` (Iogurte de coco). A 8ª, `food_402` (Água de coco), continua `unreviewed` /
"Não contém nenhum" — coerente, já que água de coco não carrega a fração lipídica/proteica que
justificaria a preocupação com `tree_nuts` mesmo pelo critério mais conservador.

Como as 7 variantes agora *acrescentam* `nuts` ao lado do `tree_nuts` que o banco já tinha (não
removem nada), elas aparecem na **Parte 2** deste documento (proposta acrescenta), não mais na
Parte 1 — o que antes era o pior tipo de erro (remover alérgeno confirmado) virou, na versão
corrigida, o tipo de divergência menos grave (proposta mais conservadora que o banco).

**Os dois argumentos ficam registrados aqui, lado a lado, sem que este documento decida qual
prevalece — é decisão da nutricionista:**

- **A favor de manter `tree_nuts` (argumento de quem propôs):** a classificação internacional da
  FDA (EUA) inclui coco na categoria de "tree nuts" para fins de rotulagem de alérgenos, por
  motivos de similaridade proteica e histórico de reações cruzadas documentadas em uma minoria de
  pacientes alérgicos a castanhas. É um critério clínico conservador, adotado preventivamente.
- **A favor de não tratar como castanha (argumento local):** no Brasil, a Anvisa e a prática
  nutricional corrente geralmente não classificam coco como castanha — coco é botanicamente uma
  drupa, não uma nut, e a reatividade cruzada com outras castanhas é rara na literatura. Tratar
  coco como `tree_nuts` no contexto de um cardápio brasileiro pode ser mais restritivo do que o
  necessário, excluindo alimentos de pacientes com alergia a castanhas "de verdade" sem
  necessidade clínica real.

---

## Parte 1 — MAIS URGENTE: proposta REMOVE alérgeno que o banco já tem revisado

**79 casos** (era 99 na versão anterior do CSV — **-20**). Todo `food_id` já
`reviewed_has_allergens` onde a proposta nova tem menos tokens do que o banco (zera ou reduz).
**Enquadramento: o banco já tem X revisado, a análise externa propõe remover — tratar como
suspeita de erro da proposta, a menos que a nutricionista confirme o contrário.** Não é "o banco
pode estar errado" — é "a proposta pode estar errada". As 7 variantes de coco que estavam aqui na
versão anterior **saíram desta parte** (agora só acrescentam `nuts`, foram para a Parte 2 — ver
seção do coco acima). Ordenado por quantas refeições ativas usam o `food_id` (mais usado
primeiro) — o que está no topo afeta mais planos se a remoção estiver errada.

| food_id | Nome | Refeições ativas | Tokens já no banco | Tokens na proposta nova | Alérgeno(s) que a proposta remove | Confirmação da nutricionista |
|---|---|---|---|---|---|---|
| food_420 | Whey Protein Concentrado | 7 | milk, soy | milk | soy | |
| food_220 | Presunto cozido | 3 | pork | — | pork | |
| food_251 | Pão de hambúrguer | 2 | gluten, sesame, wheat | gluten, wheat | sesame | |
| food_269 | Purê de batata (preparado) | 2 | milk | — | milk | |
| food_279 | Massa de panqueca (simples) | 2 | egg, gluten, milk, wheat | gluten, wheat | egg, milk | |
| food_393 | Creme de ricota | 2 | milk | — | milk | |
| food_013 | Granola tradicional | 1 | gluten, nuts | gluten, wheat | nuts | |
| food_245 | Pão de queijo | 1 | egg, milk | milk | egg | |
| food_262 | Cuscuz marroquino (cozido) | 1 | gluten, wheat | — | gluten, wheat | |
| food_345 | Farinha de rosca | 1 | gluten, wheat | — | gluten, wheat | |
| food_397 | Tahine (Pasta de gergelim) | 1 | sesame | — | sesame | |
| food_446 | Nuggets vegetais | 1 | gluten, soy, wheat | egg, gluten, wheat | soy | |
| food_458 | Maionese vegana | 1 | soy | — | soy | |
| food_027 | Nhoque de batata | 0 | gluten | — | gluten | |
| food_121 | Tremoço | 0 | lupin | — | lupin | |
| food_146 | Semente de gergelim | 0 | sesame | — | sesame | |
| food_167 | Carne suína magra cozida | 0 | pork | red_meat | pork | |
| food_179 | Miolo de acém grelhado | 0 | red_meat | — | red_meat | |
| food_184 | Mexilhão cozido | 0 | mollusk, shellfish | — | mollusk, shellfish | |
| food_224 | Presunto cru (Parma / Jamón) | 0 | pork | — | pork | |
| food_226 | Linguiça toscana | 0 | pork | — | pork | |
| food_228 | Salsicha (tipo Viena) | 0 | pork | — | pork | |
| food_231 | Lombinho defumado | 0 | pork | — | pork | |
| food_233 | Paio | 0 | pork | — | pork | |
| food_234 | Salsichão (Bratwurst) | 0 | pork | — | pork | |
| food_236 | Pastrami | 0 | red_meat | — | red_meat | |
| food_237 | Pepperoni | 0 | pork | — | pork | |
| food_239 | Linguiça portuguesa | 0 | pork | — | pork | |
| food_248 | Brioche | 0 | egg, gluten, milk, wheat | gluten, wheat | egg, milk | |
| food_249 | Pão de alho | 0 | gluten, milk, soy, wheat | gluten, wheat | milk, soy | |
| food_254 | Pão de batata | 0 | gluten, milk, wheat | gluten, wheat | milk | |
| food_258 | Pão de milho (Broa) | 0 | egg, gluten, milk, wheat | gluten, wheat | egg, milk | |
| food_263 | Gnocchi de batata (Nhoque) | 0 | gluten, wheat | — | gluten, wheat | |
| food_268 | Noodle instantâneo (Miojo) | 0 | gluten, soy, wheat | — | gluten, soy, wheat | |
| food_276 | Ravioli de carne (cozido) | 0 | egg, gluten, wheat | gluten, red_meat, wheat | egg | |
| food_277 | Tortellini de queijo (cozido) | 0 | egg, gluten, milk, wheat | gluten, milk, wheat | egg | |
| food_278 | Pamonha doce (cozida) | 0 | milk | — | milk | |
| food_291 | Corvina assada | 0 | fish | — | fish | |
| food_292 | Namorado grelhado | 0 | fish | — | fish | |
| food_293 | Pintado assado | 0 | fish | — | fish | |
| food_294 | Tambaqui assado | 0 | fish | — | fish | |
| food_295 | Ostra crua | 0 | mollusk, shellfish | — | mollusk, shellfish | |
| food_296 | Caranguejo cozido | 0 | crustacean, shellfish | — | crustacean, shellfish | |
| food_297 | Lagosta cozida | 0 | crustacean, shellfish | — | crustacean, shellfish | |
| food_298 | Vieiras grelhadas | 0 | mollusk, shellfish | — | mollusk, shellfish | |
| food_299 | Siri cozido | 0 | crustacean, shellfish | — | crustacean, shellfish | |
| food_302 | Costela bovina assada | 0 | red_meat | — | red_meat | |
| food_313 | Picanha suína assada | 0 | pork | red_meat | pork | |
| food_329 | Óleo de gergelim (sésamo) | 0 | sesame | — | sesame | |
| food_332 | Sebo bovino | 0 | red_meat | — | red_meat | |
| food_358 | Cevadinha (em grão) | 0 | gluten | — | gluten | |
| food_373 | Biscoito recheado (chocolate) | 0 | gluten, milk, soy, wheat | gluten, wheat | milk, soy | |
| food_374 | Biscoito tipo Maria / Maizena | 0 | gluten, milk, wheat | gluten, wheat | milk | |
| food_377 | Chocolate branco | 0 | milk | — | milk | |
| food_382 | Mostarda amarela | 0 | mustard | — | mustard | |
| food_388 | Molho Pesto | 0 | milk, tree_nuts | — | milk, tree_nuts | |
| food_389 | Molho Branco (Bechamel) | 0 | gluten, milk, wheat | — | gluten, milk, wheat | |
| food_394 | Hummus (Pasta de grão-de-bico) | 0 | sesame | — | sesame | |
| food_398 | Molho Tarê | 0 | gluten, soy, wheat | — | gluten, soy, wheat | |
| food_411 | Vinho tinto | 0 | sulfites | — | sulfites | |
| food_412 | Vinho branco | 0 | sulfites | — | sulfites | |
| food_413 | Espumante / Champagne | 0 | sulfites | — | sulfites | |
| food_419 | Achocolatado pronto para beber | 0 | milk | — | milk | |
| food_421 | Whey Protein Isolado | 0 | milk, soy | milk | soy | |
| food_427 | Hipercalórico (Mass Gainer) | 0 | gluten, milk, soy, wheat | — | gluten, milk, soy, wheat | |
| food_428 | Barra de proteína (tradicional) | 0 | milk, soy, tree_nuts | — | milk, soy, tree_nuts | |
| food_431 | Pasta de amendoim com whey | 0 | milk, peanuts, soy | peanuts | milk, soy | |
| food_432 | Bebida proteica pronta (RTD) | 0 | milk | — | milk | |
| food_436 | Caseína em pó | 0 | milk, soy | — | milk, soy | |
| food_438 | Barra de cereal com proteína | 0 | gluten, milk, peanuts, soy, wheat | — | gluten, milk, peanuts, soy, wheat | |
| food_444 | Hambúrguer vegetal (tipo frango) | 0 | soy | — | soy | |
| food_445 | Salsicha vegetal | 0 | soy | — | soy | |
| food_447 | Carne moída vegetal | 0 | soy | — | soy | |
| food_451 | Requeijão vegetal | 0 | soy, tree_nuts | — | soy, tree_nuts | |
| food_462 | Hambúrguer Fast-Food (com pão e carne) | 0 | gluten, sesame, wheat | gluten, red_meat, wheat | sesame | |
| food_463 | Cheeseburger Fast-Food | 0 | gluten, milk, sesame, wheat | gluten, milk, red_meat, wheat | sesame | |
| food_468 | Coxinha de frango (frita) | 0 | gluten, milk, wheat | egg, gluten, wheat | milk | |
| food_469 | Pão de queijo (fast-food/congelado) | 0 | egg, milk | milk | egg | |
| food_477 | Burrito de frango e arroz | 0 | gluten, milk, wheat | gluten, wheat | milk | |

---

## Parte 2 — proposta ACRESCENTA alérgeno que o banco não tem

**56 casos** (era 42 na versão anterior do CSV — **+14**). Todo `food_id` já
`reviewed_has_allergens` onde a proposta tem token(s) que o banco não tinha. **Enquadramento
diferente do da Parte 1: o pior caso aqui é restringir demais (esconder um alimento seguro de
alguém sem necessidade), não machuca ninguém — pode revisar com menos pressa que a Parte 1.** A
maior parte do crescimento em relação à versão anterior é o retorno de `nuts` ao lado de
`tree_nuts` para castanhas e coco (ver seção do coco acima) e de `red_meat` ao lado de `pork` para
suínos — refinamentos prováveis e corretos (o banco tinha só o termo específico, a proposta
adiciona o termo genérico do qual o específico é subconjunto). Mesma ordenação por uso ativo.

| food_id | Nome | Refeições ativas | Tokens já no banco | Tokens na proposta nova | Alérgeno(s) que a proposta acrescenta | Confirmação da nutricionista |
|---|---|---|---|---|---|---|
| food_442 | Leite de coco (bebida) | 2 | tree_nuts | nuts, tree_nuts | nuts | |
| food_013 | Granola tradicional | 1 | gluten, nuts | gluten, wheat | wheat | |
| food_015 | Pão francês | 1 | gluten | gluten, wheat | wheat | |
| food_440 | Leite de amêndoas | 1 | tree_nuts | nuts, tree_nuts | nuts | |
| food_446 | Nuggets vegetais | 1 | gluten, soy, wheat | egg, gluten, wheat | egg | |
| food_455 | Creme de leite vegetal (Soja/Aveia) | 1 | soy | gluten_free_if_certified, soy | gluten_free_if_certified | |
| food_461 | Pizza de calabresa (fatia) | 1 | gluten, milk, wheat | gluten, milk, pork, red_meat, wheat | pork, red_meat | |
| food_465 | Cachorro-quente (com pão e salsicha) | 1 | gluten, wheat | gluten, pork, red_meat, wheat | pork, red_meat | |
| food_473 | Kebab / Shawarma de carne | 1 | gluten, wheat | gluten, red_meat, wheat | red_meat | |
| food_476 | Taco Mexicano (Carne e Queijo) | 1 | gluten, milk, wheat | gluten, milk, red_meat, wheat | red_meat | |
| food_003 | Macarrão cozido | 0 | gluten | gluten, wheat | wheat | |
| food_005 | Pão integral | 0 | gluten | gluten, wheat | wheat | |
| food_016 | Biscoito de água e sal | 0 | gluten | gluten, wheat | wheat | |
| food_017 | Farinha de trigo | 0 | gluten | gluten, wheat | wheat | |
| food_022 | Cevada em grãos cozida | 0 | gluten | gluten, wheat | wheat | |
| food_112 | Castanha-do-pará | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_113 | Castanha de caju | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_114 | Nozes | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_129 | Noz pecã | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_130 | Noz de macadâmia | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_131 | Coco seco | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_132 | Coco ralado | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_137 | Amêndoas | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_138 | Pistache | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_139 | Macadâmia | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_140 | Avelã | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_141 | Farinha de amêndoas | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_167 | Carne suína magra cozida | 0 | pork | red_meat | red_meat | |
| food_173 | Costela de porco assada | 0 | pork | pork, red_meat | red_meat | |
| food_174 | Pernil suíno assado | 0 | pork | pork, red_meat | red_meat | |
| food_175 | Barriga de porco (torresmo) | 0 | pork | pork, red_meat | red_meat | |
| food_222 | Salame italiano | 0 | pork | pork, red_meat | red_meat | |
| food_223 | Mortadela | 0 | pork | pork, red_meat | red_meat | |
| food_225 | Bacon | 0 | pork | pork, red_meat | red_meat | |
| food_227 | Linguiça calabresa | 0 | pork | pork, red_meat | red_meat | |
| food_229 | Chouriço / Chorizo | 0 | pork | pork, red_meat | red_meat | |
| food_232 | Copa | 0 | pork | pork, red_meat | red_meat | |
| food_273 | Massa folhada (assada) | 0 | gluten, wheat | egg, gluten, milk, wheat | egg, milk | |
| food_275 | Massa de pizza (assada) | 0 | gluten, wheat | gluten, milk, wheat | milk | |
| food_276 | Ravioli de carne (cozido) | 0 | egg, gluten, wheat | gluten, red_meat, wheat | red_meat | |
| food_311 | Lombo de porco assado | 0 | pork | pork, red_meat | red_meat | |
| food_312 | Costelinha de porco assada | 0 | pork | pork, red_meat | red_meat | |
| food_313 | Picanha suína assada | 0 | pork | red_meat | red_meat | |
| food_322 | Óleo de coco | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_331 | Banha de porco | 0 | pork | pork, red_meat | red_meat | |
| food_334 | Óleo de noz | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_347 | Farinha de coco | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_362 | Açúcar de coco | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_410 | Cerveja Pilsen | 0 | gluten | gluten, wheat | wheat | |
| food_448 | Iogurte de coco | 0 | tree_nuts | nuts, tree_nuts | nuts | |
| food_456 | Leite condensado vegetal (Aveia/Soja) | 0 | gluten_free_if_certified | gluten_free_if_certified, soy | soy | |
| food_462 | Hambúrguer Fast-Food (com pão e carne) | 0 | gluten, sesame, wheat | gluten, red_meat, wheat | red_meat | |
| food_463 | Cheeseburger Fast-Food | 0 | gluten, milk, sesame, wheat | gluten, milk, red_meat, wheat | red_meat | |
| food_466 | Pastel de carne (frito) | 0 | gluten, wheat | gluten, red_meat, wheat | red_meat | |
| food_468 | Coxinha de frango (frita) | 0 | gluten, milk, wheat | egg, gluten, wheat | egg | |
| food_474 | Nuggets de frango Fast-Food | 0 | gluten, wheat | egg, gluten, wheat | egg | |

**Nota sobre `egg`:** a versão nova do CSV marca `egg` em **12 alimentos** (era 3 na versão
anterior — número que já parecia baixo demais para um catálogo de 486 itens, e virou 12 depois da
correção): `food_165` (Ovo cozido), `food_243` (Croissant), `food_273` (Massa folhada, assada),
`food_372` (Sorvete de baunilha, massa), `food_375` (Bolo de chocolate, simples), `food_384`
(Maionese tradicional), `food_435` (Albumina em pó), `food_446` (Nuggets vegetais), `food_468`
(Coxinha de frango, frita), `food_474` (Nuggets de frango Fast-Food), `food_478` (Croissant
recheado, chocolate), `food_479` (Donut / Sonho, com cobertura).

---

## Parte 3 — os 232 `unreviewed`

**Correção 2026-09-03:** o título original chamava isso de "o lote que destrava a Fase B".
Verificado direto no código: a Fase B (bloqueio automático de refeição com ingrediente
`unreviewed`) **nunca foi implementada** — nenhuma RPC de matching lê `allergen_review_status`.
Revisar estes 232 não destrava proteção técnica nenhuma; transforma "não sabemos" em
informação real pro badge de exibição (que avisa, não bloqueia). Ver
`docs/SESSAO_1_NUTRICIONISTA_20260902.md` pro relato completo.

Dividido em simples vs. composto pelo critério documentado acima — **critério idêntico ao da
versão anterior deste documento**, porque depende só de `food_type_id`/nome, não do conteúdo da
proposta, então a divisão 222/10 não mudou com o CSV novo. O que mudou é a resposta/tokens
propostos para cada linha, reconferidos contra o CSV novo nesta rodada. Mesma ordenação por uso
ativo dentro de cada subseção. Coluna "Refeições ativas": quantas `meals` com `is_active=true`
usam este `food_id` em `ingredients_json`.

### 3a. Alimentos simples (222 casos)

A proposta tende a ser confiável aqui — são ingredientes atômicos onde "o nome diz tudo". A
nutricionista pode confirmar em lote com mais velocidade, mas ainda deve olhar linha a linha
(a proposta não é infalível mesmo em itens simples — ver Partes 1 e 2 para os casos já revisados
onde ela errou mesmo em ingredientes de nome direto, como `pork` vs `red_meat`).

| food_id | Nome | Refeições ativas | Resposta da proposta | Tokens propostos | Confirmação da nutricionista |
|---|---|---|---|---|---|
| food_079 | Banana | 13 | Não contém nenhum | — | |
| food_367 | Cacau em pó (sem açúcar) | 11 | Não contém nenhum | — | |
| food_163 | Peito de frango grelhado | 9 | Não contém nenhum | — | |
| food_260 | Tapioca (goma preparada) | 9 | Não contém nenhum | — | |
| food_320 | Azeite de oliva extravirgem | 9 | Não contém nenhum | — | |
| food_088 | Morango | 8 | Não contém nenhum | — | |
| food_270 | Purê de abóbora (preparado) | 6 | Não contém nenhum | — | |
| food_161 | Grão-de-bico cozido | 5 | Não contém nenhum | — | |
| food_363 | Mel de abelha | 5 | Não contém nenhum | — | |
| food_028 | Abacate | 4 | Não contém nenhum | — | |
| food_238 | Bacon de peru | 4 | Não contém nenhum | — | |
| food_002 | Batata doce cozida | 3 | Não contém nenhum | — | |
| food_221 | Peito de peru defumado | 3 | Não contém nenhum | — | |
| food_497 | Chia hidratada (Pudim de Chia base) | 3 | Não contém nenhum | — | |
| food_405 | Limonada sem açúcar | 2 | Não contém nenhum | — | |
| food_487 | Ervilha em conserva | 2 | Não contém nenhum | — | |
| food_489 | Canela em pó | 2 | Não contém nenhum | — | |
| food_035 | Aipo (Salsão) | 1 | Não contém nenhum | — | |
| food_037 | Alface | 1 | Não contém nenhum | — | |
| food_081 | Mamão | 1 | Não contém nenhum | — | |
| food_159 | Feijão preto cozido | 1 | Não contém nenhum | — | |
| food_257 | Biscoito de arroz | 1 | Não contém nenhum | — | |
| food_346 | Farinha de linhaça | 1 | Não contém nenhum | — | |
| food_350 | Farinha de grão-de-bico | 1 | Não contém nenhum | — | |
| food_369 | Geleia de morango | 1 | Não contém nenhum | — | |
| food_400 | Café sem açúcar | 1 | Não contém nenhum | — | |
| food_401 | Chá verde sem açúcar | 1 | Não contém nenhum | — | |
| food_402 | Água de coco | 1 | Não contém nenhum | — | |
| food_418 | Kombucha (tradicional) | 1 | Não contém nenhum | — | |
| food_430 | Colágeno hidrolisado | 1 | Não dá para saber pelo nome | — | |
| food_470 | Salgadinho de pacote (tipo chips de milho) | 1 | Não dá para saber pelo nome | — | |
| food_490 | Cúrcuma (Açafrão-da-terra) | 1 | Não contém nenhum | — | |
| food_492 | Orégano seco | 1 | Não contém nenhum | — | |
| food_493 | Gengibre em pó | 1 | Não contém nenhum | — | |
| food_494 | Extrato de baunilha | 1 | Não dá para saber pelo nome | — | |
| food_498 | Spirulina em pó | 1 | Não contém nenhum | — | |
| food_001 | Arroz integral cozido | 0 | Não contém nenhum | — | |
| food_006 | Mandioca cozida | 0 | Não contém nenhum | — | |
| food_007 | Milho cozido | 0 | Não contém nenhum | — | |
| food_008 | Quinoa cozida | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_009 | Cuscuz de milho cozido | 0 | Não contém nenhum | — | |
| food_010 | Tapioca (massa pronta) | 0 | Contém | gluten, wheat | |
| food_011 | Inhame cozido | 0 | Não contém nenhum | — | |
| food_014 | Arroz branco cozido | 0 | Não contém nenhum | — | |
| food_018 | Polenta cozida | 0 | Não contém nenhum | — | |
| food_019 | Fubá de milho | 0 | Não contém nenhum | — | |
| food_020 | Arroz parboilizado cozido | 0 | Não contém nenhum | — | |
| food_021 | Batata inglesa cozida | 0 | Não contém nenhum | — | |
| food_023 | Trigo sarraceno cozido | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_024 | Araruta cozida | 0 | Não contém nenhum | — | |
| food_025 | Pipoca (sem óleo, sem sal) | 0 | Não contém nenhum | — | |
| food_026 | Batata baroa (mandioquinha) cozida | 0 | Não contém nenhum | — | |
| food_029 | Abóbora Cabotiá | 0 | Não contém nenhum | — | |
| food_030 | Abóbora Moranga | 0 | Não contém nenhum | — | |
| food_031 | Abóbora Paulista | 0 | Não contém nenhum | — | |
| food_032 | Abobrinha | 0 | Não contém nenhum | — | |
| food_033 | Acelga | 0 | Não contém nenhum | — | |
| food_034 | Agrião | 0 | Não contém nenhum | — | |
| food_036 | Alcachofra | 0 | Não contém nenhum | — | |
| food_038 | Alho | 0 | Não contém nenhum | — | |
| food_039 | Alho-poró | 0 | Não contém nenhum | — | |
| food_040 | Aspargos | 0 | Não contém nenhum | — | |
| food_041 | Beringela | 0 | Não contém nenhum | — | |
| food_042 | Bertalha | 0 | Não contém nenhum | — | |
| food_043 | Beterraba | 0 | Não contém nenhum | — | |
| food_044 | Brócolis | 0 | Não contém nenhum | — | |
| food_045 | Broto de bambu | 0 | Não contém nenhum | — | |
| food_046 | Cebola | 0 | Não contém nenhum | — | |
| food_047 | Cebola roxa | 0 | Não contém nenhum | — | |
| food_048 | Cebolinha | 0 | Não contém nenhum | — | |
| food_049 | Cenoura | 0 | Não contém nenhum | — | |
| food_050 | Chuchu | 0 | Não contém nenhum | — | |
| food_051 | Cogumelo Paris | 0 | Não contém nenhum | — | |
| food_052 | Cogumelo Shitake | 0 | Não contém nenhum | — | |
| food_053 | Cogumelo Shimeji | 0 | Não contém nenhum | — | |
| food_054 | Couve | 0 | Não contém nenhum | — | |
| food_055 | Couve-flor | 0 | Não contém nenhum | — | |
| food_056 | Endívia | 0 | Não contém nenhum | — | |
| food_057 | Escarola | 0 | Não contém nenhum | — | |
| food_058 | Espinafre | 0 | Não contém nenhum | — | |
| food_059 | Funcho (erva-doce) | 0 | Não contém nenhum | — | |
| food_060 | Gengibre | 0 | Não contém nenhum | — | |
| food_061 | Jiló | 0 | Não contém nenhum | — | |
| food_062 | Maxixe | 0 | Não contém nenhum | — | |
| food_063 | Mostarda (folha) | 0 | Não contém nenhum | — | |
| food_064 | Nabo | 0 | Não contém nenhum | — | |
| food_065 | Palmito | 0 | Não contém nenhum | — | |
| food_066 | Pepino | 0 | Não contém nenhum | — | |
| food_067 | Pepino Japonês | 0 | Não contém nenhum | — | |
| food_068 | Pimenta Dedo-de-Moça | 0 | Não contém nenhum | — | |
| food_069 | Pimentão Amarelo | 0 | Não contém nenhum | — | |
| food_070 | Quiabo | 0 | Não contém nenhum | — | |
| food_071 | Rabanete | 0 | Não contém nenhum | — | |
| food_072 | Rabanete Branco (Daikon) | 0 | Não contém nenhum | — | |
| food_073 | Raiz de Bardana | 0 | Não contém nenhum | — | |
| food_074 | Repolho | 0 | Não contém nenhum | — | |
| food_075 | Rúcula | 0 | Não contém nenhum | — | |
| food_076 | Taioba | 0 | Não contém nenhum | — | |
| food_077 | Tomate | 0 | Não contém nenhum | — | |
| food_078 | Tomate-cereja | 0 | Não contém nenhum | — | |
| food_080 | Maçã | 0 | Não contém nenhum | — | |
| food_082 | Abacaxi | 0 | Não contém nenhum | — | |
| food_083 | Melancia | 0 | Não contém nenhum | — | |
| food_084 | Uva | 0 | Não contém nenhum | — | |
| food_085 | Laranja | 0 | Não contém nenhum | — | |
| food_086 | Pera | 0 | Não contém nenhum | — | |
| food_087 | Manga | 0 | Não contém nenhum | — | |
| food_089 | Kiwi | 0 | Não contém nenhum | — | |
| food_090 | Ameixa | 0 | Não contém nenhum | — | |
| food_091 | Framboesa | 0 | Não contém nenhum | — | |
| food_092 | Blueberry (mirtilo) | 0 | Não contém nenhum | — | |
| food_093 | Caju | 0 | Não contém nenhum | — | |
| food_094 | Graviola | 0 | Não contém nenhum | — | |
| food_095 | Goiaba | 0 | Não contém nenhum | — | |
| food_096 | Açaí (polpa sem açúcar) | 0 | Não contém nenhum | — | |
| food_097 | Tamarindo | 0 | Não contém nenhum | — | |
| food_098 | Figo | 0 | Não contém nenhum | — | |
| food_099 | Jabuticaba | 0 | Não contém nenhum | — | |
| food_100 | Pitaya | 0 | Não contém nenhum | — | |
| food_102 | Acerola | 0 | Não contém nenhum | — | |
| food_103 | Amora | 0 | Não contém nenhum | — | |
| food_104 | Cereja | 0 | Não contém nenhum | — | |
| food_105 | Feijão carioca | 0 | Não contém nenhum | — | |
| food_106 | Feijão preto | 0 | Não contém nenhum | — | |
| food_107 | Lentilha | 0 | Não contém nenhum | — | |
| food_108 | Grão-de-bico | 0 | Não contém nenhum | — | |
| food_109 | Ervilha seca | 0 | Não contém nenhum | — | |
| food_116 | Semente de girassol | 0 | Não contém nenhum | — | |
| food_117 | Semente de abóbora | 0 | Não contém nenhum | — | |
| food_118 | Feijão branco | 0 | Não contém nenhum | — | |
| food_119 | Feijão fradinho | 0 | Não contém nenhum | — | |
| food_120 | Feijão roxinho | 0 | Não contém nenhum | — | |
| food_122 | Fava | 0 | Não contém nenhum | — | |
| food_126 | Grão-de-bico torrado | 0 | Não contém nenhum | — | |
| food_127 | Semente de linhaça | 0 | Não contém nenhum | — | |
| food_128 | Semente de chia | 0 | Não contém nenhum | — | |
| food_152 | Carne de jaca desfiada | 0 | Não contém nenhum | — | |
| food_153 | Couve cozida | 0 | Não contém nenhum | — | |
| food_154 | Brócolis cozido | 0 | Não contém nenhum | — | |
| food_155 | Espinafre cozido | 0 | Não contém nenhum | — | |
| food_156 | Ervilha-torta cozida | 0 | Não contém nenhum | — | |
| food_157 | Jaca verde cozida | 0 | Não contém nenhum | — | |
| food_158 | Batata-doce cozida (proteína vegetal modesta) | 0 | Não dá para saber pelo nome | — | |
| food_160 | Lentilha comum cozida | 0 | Não contém nenhum | — | |
| food_230 | Peito de frango defumado | 0 | Não contém nenhum | — | |
| food_235 | Linguiça de frango | 0 | Não dá para saber pelo nome | — | |
| food_261 | Cuscuz de milho (nordestino) | 0 | Não contém nenhum | — | |
| food_265 | Macarrão de arroz (Bifum) cozido | 0 | Não contém nenhum | — | |
| food_271 | Farofa de mandioca simples | 0 | Não contém nenhum | — | |
| food_272 | Macarrão konjac (Shirataki) | 0 | Não contém nenhum | — | |
| food_303 | Pato assado (sem pele) | 0 | Não contém nenhum | — | |
| food_314 | Coxa de frango assada (com pele) | 0 | Não contém nenhum | — | |
| food_315 | Asa de frango assada (com pele) | 0 | Não contém nenhum | — | |
| food_316 | Coração de frango grelhado | 0 | Não contém nenhum | — | |
| food_318 | Moela de frango cozida | 0 | Não contém nenhum | — | |
| food_321 | Azeite de oliva virgem | 0 | Não contém nenhum | — | |
| food_323 | Óleo de girassol | 0 | Não contém nenhum | — | |
| food_325 | Óleo de milho | 0 | Não contém nenhum | — | |
| food_326 | Óleo de canola | 0 | Não contém nenhum | — | |
| food_327 | Óleo de abacate | 0 | Não contém nenhum | — | |
| food_333 | Óleo de linhaça | 0 | Não contém nenhum | — | |
| food_335 | Margarina com sal | 0 | Não dá para saber pelo nome | — | |
| food_336 | Margarina sem sal | 0 | Não dá para saber pelo nome | — | |
| food_338 | Banha de pato | 0 | Não contém nenhum | — | |
| food_339 | Azeite de dendê (Óleo de palma) | 0 | Não contém nenhum | — | |
| food_340 | Farinha de mandioca crua | 0 | Não contém nenhum | — | |
| food_341 | Farinha de mandioca torrada | 0 | Contém | gluten, wheat | |
| food_342 | Polvilho doce | 0 | Não contém nenhum | — | |
| food_343 | Polvilho azedo | 0 | Não contém nenhum | — | |
| food_344 | Farinha de milho flocada | 0 | Não contém nenhum | — | |
| food_348 | Farinha de arroz | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_349 | Sagu | 0 | Não contém nenhum | — | |
| food_351 | Amaranto em grão | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_352 | Painço descascado | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_353 | Sorgo em grão | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_354 | Teff em grão | 0 | Risco de contaminação cruzada | gluten_free_if_certified | |
| food_359 | Farinha de maca peruana | 0 | Não contém nenhum | — | |
| food_360 | Açúcar branco refinado | 0 | Não contém nenhum | — | |
| food_361 | Açúcar mascavo | 0 | Não contém nenhum | — | |
| food_364 | Xarope de bordo (Maple Syrup) | 0 | Não contém nenhum | — | |
| food_365 | Chocolate amargo 70% | 0 | Não contém nenhum | — | |
| food_370 | Goiabada | 0 | Não contém nenhum | — | |
| food_376 | Gelatina sem açúcar (pronta) | 0 | Não dá para saber pelo nome | — | |
| food_379 | Açúcar demerara | 0 | Não contém nenhum | — | |
| food_386 | Vinagre balsâmico | 0 | Não contém nenhum | — | |
| food_387 | Vinagre de maçã | 0 | Não contém nenhum | — | |
| food_396 | Geleia de pimenta | 0 | Não contém nenhum | — | |
| food_403 | Suco de laranja natural | 0 | Não contém nenhum | — | |
| food_404 | Suco de uva integral | 0 | Não contém nenhum | — | |
| food_406 | Suco de maçã integral | 0 | Não contém nenhum | — | |
| food_407 | Suco de abacaxi natural | 0 | Não contém nenhum | — | |
| food_408 | Refrigerante de Cola (tradicional) | 0 | Não dá para saber pelo nome | — | |
| food_409 | Refrigerante de Cola (Zero) | 0 | Não dá para saber pelo nome | — | |
| food_414 | Vodka (Destilado) | 0 | Não contém nenhum | — | |
| food_415 | Bebida isotônica (Esportiva) | 0 | Não contém nenhum | — | |
| food_416 | Bebida energética | 0 | Não dá para saber pelo nome | — | |
| food_417 | Chá preto sem açúcar | 0 | Não contém nenhum | — | |
| food_422 | Creatina Monohidratada | 0 | Não dá para saber pelo nome | — | |
| food_423 | BCAA em pó | 0 | Não contém nenhum | — | |
| food_424 | Glutamina | 0 | Não dá para saber pelo nome | — | |
| food_425 | Pré-treino em pó | 0 | Não dá para saber pelo nome | — | |
| food_426 | Maltodextrina | 0 | Não dá para saber pelo nome | — | |
| food_429 | Proteína vegana em pó (Ervilha/Arroz) | 0 | Não dá para saber pelo nome | — | |
| food_433 | Waxy Maize | 0 | Não contém nenhum | — | |
| food_434 | Palatinose (Isomaltulose) | 0 | Não contém nenhum | — | |
| food_437 | Gel de carboidrato (Energy Gel) | 0 | Não contém nenhum | — | |
| food_450 | Queijo vegetal (tipo muçarela) | 0 | Não dá para saber pelo nome | — | |
| food_452 | Levedura nutricional | 0 | Não contém nenhum | — | |
| food_457 | Manteiga vegetal (Vegan Butter) | 0 | Não dá para saber pelo nome | — | |
| food_459 | Proteína de ervilha texturizada | 0 | Não contém nenhum | — | |
| food_471 | Batata chips (pacote) | 0 | Não contém nenhum | — | |
| food_480 | Azeitona verde em conserva | 0 | Não contém nenhum | — | |
| food_481 | Azeitona preta em conserva | 0 | Não contém nenhum | — | |
| food_482 | Palmito em conserva | 0 | Não contém nenhum | — | |
| food_483 | Alcaparras em conserva | 0 | Não contém nenhum | — | |
| food_484 | Picles de pepino (Cornichon) | 0 | Não contém nenhum | — | |
| food_486 | Milho verde em conserva | 0 | Não contém nenhum | — | |
| food_488 | Grão-de-bico em conserva | 0 | Não contém nenhum | — | |
| food_491 | Pimenta-do-reino preta | 0 | Não contém nenhum | — | |
| food_495 | Cacau em pó (Alcalinizado/Holandês) | 0 | Não contém nenhum | — | |
| food_496 | Tomate seco em óleo | 0 | Não contém nenhum | — | |
| food_499 | Sal rosa do Himalaia | 0 | Não contém nenhum | — | |

### 3b. Pratos compostos (10 casos)

Aqui a proposta tende a errar por omissão — precisa olhar ingrediente por ingrediente, não confiar
no nome do prato. Molhos (Ketchup, BBQ, Guacamole, molhos de tomate) são a maioria: todos vieram
"Não dá para saber pelo nome" ou "Não contém nenhum" da proposta, mas o padrão nos já revisados
(Pesto, Bechamel, Tarê) mostra que molhos costumam esconder pelo menos um alérgeno.

| food_id | Nome | Refeições ativas | Resposta da proposta | Tokens propostos | Confirmação da nutricionista |
|---|---|---|---|---|---|
| food_380 | Molho de tomate caseiro | 9 | Não dá para saber pelo nome | — | |
| food_383 | Ketchup | 2 | Não dá para saber pelo nome | — | |
| food_395 | Guacamole | 2 | Não dá para saber pelo nome | — | |
| food_378 | Açaí com xarope de guaraná | 1 | Não contém nenhum | — | |
| food_443 | Hambúrguer vegetal (tipo carne) | 1 | Não dá para saber pelo nome | — | |
| food_464 | Batata frita Fast-Food | 1 | Não contém nenhum | — | |
| food_381 | Molho de tomate industrializado | 0 | Não dá para saber pelo nome | — | |
| food_390 | Molho Barbecue (BBQ) | 0 | Não dá para saber pelo nome | — | |
| food_391 | Extrato de tomate | 0 | Não dá para saber pelo nome | — | |
| food_392 | Molho de pimenta (Tabasco) | 0 | Não dá para saber pelo nome | — | |

### Molhos em refeição ativa hoje — não são poucos

3 dos 7 molhos aparecem em refeições ativas: `food_380` (Molho de tomate caseiro) em **9**
refeições, `food_383` (Ketchup) em **2**, `food_395` (Guacamole) em **2** — **13 usos ativos no
total, sem sobreposição entre eles** (13 refeições diferentes). Isso não é "poucos" — desativar
essas 13 refeições até a revisão sairia mais caro em cobertura de cardápio do que esperar a
nutricionista revisar os 3 molhos (que são só 3 itens de catálogo, não 13). Não preparei SQL de
desativação para esses casos; se quiser, listo as 13 refeições por nome antes de qualquer decisão.

### Dá para derivar o alérgeno dos molhos a partir de alguma composição registrada? Não.

Confirmei o schema completo de `foods` — não existe nenhuma coluna de composição/receita/lista de
sub-ingredientes. `foods` é o catálogo atômico: cada linha é um item final (`name_ptbr`,
macros, `brand`, categorias), sem nenhum campo que decomponha "Molho de tomate caseiro" nos
ingredientes que o compõem. `ingredients_json` só existe em `meals` (a composição de uma
*refeição* a partir de vários `foods`), nunca dentro de um `food` individual. **Não há como
derivar o alérgeno desses 10 pratos compostos a partir de dado nenhum já no banco — `unreviewed`
é o estado honesto, e eles vão para a nutricionista sem proposta nenhuma da IA externa** (a
"proposta" que existe pra eles é só "Não dá para saber pelo nome" ou "Não contém nenhum" sem
tokens, o que na prática é a IA externa admitindo a mesma limitação).

---

## Resposta à pergunta do usuário

Dos 232 `foods` `unreviewed`, pelo critério documentado acima:

- **222 caem em "simples"** (95.7%)
- **10 caem em "composto"** (4.3%)

A maioria é simples: **a proposta resolve a maior parte do lote sozinha** — ela só precisa olhar
de perto os 10 compostos (majoritariamente molhos, mais 1 fast-food, 1 hambúrguer
vegetal e 1 bebida com xarope adicionado). Isso não significa que os 222 simples
podem ser aprovados sem olhar — só que o risco de omissão da proposta é estruturalmente menor
nessa subseção, pelo padrão observado nas Partes 1 e 2.
