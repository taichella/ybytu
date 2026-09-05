# Sessão 1 — o mínimo pra o piloto sair (2026-09-02, corrigido em 2026-09-03)

**Este é o documento técnico interno.** A versão efetivamente enviada à nutricionista, em
linguagem simples e sem termos do sistema, é
`docs/SESSAO_1_NUTRICIONISTA_PARA_ENVIO_20260905.md` — é ela que tem as respostas dela quando
chegarem. Use este aqui pra justificativa técnica; não aplique respostas dela comparando com este
documento, ela nunca viu este texto.

Este documento junta só o que precisa da sua revisão antes do piloto — e o motivo mudou desde a
primeira versão, corrigido aqui com a verdade em vez de suavizar ou dramatizar.

**Hoje nada impede que uma refeição com ingrediente não revisado chegue ao aluno.** Não existe
bloqueio automático — uma versão anterior deste documento dizia que existia, e isso estava
errado. O único aviso que existe é um badge na tela do aluno dizendo "Alérgenos não
verificados": é honesto, mas não impede a entrega, e não diz nada específico pra quem tem uma
alergia real decidir se pode comer. Sua revisão é o que transforma esse "não sabemos" em
informação de verdade — não é uma trava técnica que sua resposta libera, é a diferença entre o
aluno saber ou não saber o que está comendo.

**O que NÃO precisa da sua atenção agora:** dos 486 alimentos do catálogo, 190 não aparecem em
nenhuma refeição ativa hoje — ficam pra sessão 2, sem urgência, e **não foram esquecidos**. O
mesmo vale pro restante da Parte 1/2 de alérgenos, receitas novas pedidas, correções de
catálogo e a auditoria de instruções de preparo. Você não está aprovando um catálogo pela
metade — está resolvendo só a fatia mais urgente pro aluno agora; o resto tem sua própria
sessão depois, no seu tempo.

**4 blocos, ~57 decisões no total** — a maioria do bloco 3 é confirmação de segundos, não
análise.

---

## Bloco 1 — o caso mais grave, uma linha só

**`food_420` Whey Protein Concentrado.** O banco já tem `milk` e `soy` registrados
(`reviewed_has_allergens`). Uma proposta externa de reclassificação corrigiu `milk` mas
continua sem `soy` — que em whey normalmente vem da lecitina usada como emulsificante. Usado em
**7 refeições ativas** hoje (o alimento mais usado de toda a revisão de alérgenos).

| Pergunta | Resposta |
|---|---|
| O banco registra `soy`; a análise externa quer remover. Confirma que o banco está certo? | [ ] Sim, o banco está certo [ ] Não, a análise externa está certa |

Se você só responder isso, já resolve o pior caso do lote inteiro.

---

## Bloco 2 — duas perguntas rápidas

### 2a. Piso mínimo de proteína por refeição principal (almoço/jantar)

Usamos `protein_g` real (somado por gramagem, não taxonomia) pra substituir a categoria
"Refeição Incompleta" de uma auditoria externa que teve 80% de falso positivo. Precisamos do
padrão do produto:

| Piso | Refeições ativas abaixo hoje |
|---|---|
| 10g (piso técnico — abaixo disso, sem fonte de proteína que se sustente) | 3 |
| 15g | 8 |
| 20g (recomendação geral de saciedade/síntese proteica) | **15 (43% do cardápio principal)** |

**Pergunta:** qual desses três é o padrão do produto? [ ] 10g [ ] 15g [ ] 20g [ ] Outro: ____

### 2b. Coco — tree nut ou não?

7 variantes (seco, ralado, óleo, farinha, açúcar, leite, iogurte) estão hoje marcadas
`tree_nuts`. A revisão original marcou como "sem alérgeno"; a proposta corrigida voltou atrás e
recolocou `tree_nuts`, com justificativa: critério clínico internacional (FDA) trata coco como
tree nut pra fins de rotulagem, mesmo não sendo botanicamente uma noz verdadeira. No Brasil, a
prática comum não trata coco como castanha.

**Pergunta:** manter `tree_nuts` (postura conservadora, já vigente) ou remover? [ ] Manter [ ] Remover

---

## Bloco 3 — os 42 `unreviewed` que o aluno já está recebendo sem verificação

Estes são os únicos alimentos, de um total de 232 ainda não revisados, que **aparecem em pelo
menos uma refeição ativa hoje** — os outros 190 não têm urgência (não estão em nada ativo).
Enquanto ficarem `unreviewed`, qualquer refeição que os use é entregue normalmente ao aluno, com
o card mostrando só "Alérgenos não verificados" — sem dizer se há risco real ou não.

**A maioria aqui é confirmação, não análise.** Banana, morango e peito de frango grelhado você
confirma em segundos — são alimentos simples, sem ambiguidade.

Ordenado do mais usado pro menos, com o volume que cada faixa destrava (contagem é ocorrências
em refeições ativas, uma mesma refeição pode ter mais de um destes 42):

- **Confirmar os 6 primeiros já destrava 60 ocorrências** (quase metade do volume total).
- Confirmar os 20 primeiros destrava 111 de 133 (83%).
- Os 22 últimos (uso único cada) fecham o resto.

| # | food_id | Nome | Refeições ativas |
|---|---|---|---|
| 1 | food_079 | Banana | 13 |
| 2 | food_367 | Cacau em pó (sem açúcar) | 11 |
| 3 | food_163 | Peito de frango grelhado | 9 |
| 4 | food_320 | Azeite de oliva extravirgem | 9 |
| 5 | food_380 | Molho de tomate caseiro | 9 |
| 6 | food_260 | Tapioca (goma preparada) | 9 |
| 7 | food_088 | Morango | 8 |
| 8 | food_270 | Purê de abóbora (preparado) | 6 |
| 9 | food_363 | Mel de abelha | 5 |
| 10 | food_161 | Grão-de-bico cozido | 5 |
| 11 | food_238 | Bacon de peru | 4 |
| 12 | food_028 | Abacate | 4 |
| 13 | food_497 | Chia hidratada (Pudim de Chia base) | 3 |
| 14 | food_221 | Peito de peru defumado | 3 |
| 15 | food_002 | Batata doce cozida | 3 |
| 16 | food_405 | Limonada sem açúcar | 2 |
| 17 | food_489 | Canela em pó | 2 |
| 18 | food_487 | Ervilha em conserva | 2 |
| 19 | food_395 | Guacamole | 2 |
| 20 | food_383 | Ketchup | 2 |
| 21 | food_430 | Colágeno hidrolisado | 1 |
| 22 | food_400 | Café sem açúcar | 1 |
| 23 | food_402 | Água de coco | 1 |
| 24 | food_418 | Kombucha (tradicional) | 1 |
| 25 | food_464 | Batata frita Fast-Food | 1 |
| 26 | food_470 | Salgadinho de pacote (tipo chips de milho) | 1 |
| 27 | food_490 | Cúrcuma (Açafrão-da-terra) | 1 |
| 28 | food_159 | Feijão preto cozido | 1 |
| 29 | food_037 | Alface | 1 |
| 30 | food_494 | Extrato de baunilha | 1 |
| 31 | food_492 | Orégano seco | 1 |
| 32 | food_350 | Farinha de grão-de-bico | 1 |
| 33 | food_443 | Hambúrguer vegetal (tipo carne) | 1 |
| 34 | food_378 | Açaí com xarope de guaraná | 1 |
| 35 | food_369 | Geleia de morango | 1 |
| 36 | food_035 | Aipo (Salsão) | 1 |
| 37 | food_498 | Spirulina em pó | 1 |
| 38 | food_081 | Mamão | 1 |
| 39 | food_257 | Biscoito de arroz | 1 |
| 40 | food_493 | Gengibre em pó | 1 |
| 41 | food_401 | Chá verde sem açúcar | 1 |
| 42 | food_346 | Farinha de linhaça | 1 |

Formato de resposta por linha: `[ ] Sem alérgeno` ou `[ ] Contém: ______`.

---

## Bloco 4 — 12 alimentos onde o banco registra um alérgeno e uma análise externa discorda

Diferente do Bloco 3 (nunca revisados), estes já têm `allergen_review_status =
reviewed_has_allergens` — **o banco já registra uma resposta.** Uma análise externa propõe
remover o(s) alérgeno(s) abaixo. **Essa fonte externa já errou mais de duas vezes mais na
direção de liberar alérgeno do que na de restringir** (79 remoções indevidas contra 56 adições,
numa validação anterior) — não é uma segunda opinião equilibrada, é uma fonte com viés
conhecido nessa direção. A pergunta de cada linha não é "aprova a remoção?" — é **"o banco
registra este alérgeno; a análise externa discorda; confirma que o banco está certo?"**

Se a resposta atual do banco estiver errada, o aluno já está recebendo essa refeição **hoje**
achando que o alérgeno está confirmado — pior que "não verificado", porque parece verificado e
não está. Por isso estes 12 entram na sessão 1 mesmo já revisados. Os outros 66 alimentos da
mesma lista (sem uso em refeição ativa) ficam pra sessão 2, sem esse risco.

| food_id | Nome | Refeições ativas | O banco registra | A análise externa quer remover |
|---|---|---|---|---|
| food_220 | Presunto cozido | 3 | pork | pork (ficaria sem nenhum) |
| food_251 | Pão de hambúrguer | 2 | gluten, sesame, wheat | sesame |
| food_269 | Purê de batata (preparado) | 2 | milk | milk (ficaria sem nenhum) |
| food_279 | Massa de panqueca (simples) | 2 | egg, gluten, milk, wheat | egg, milk |
| food_393 | Creme de ricota | 2 | milk | milk (ficaria sem nenhum) |
| food_013 | Granola tradicional | 1 | gluten, nuts | nuts |
| food_245 | Pão de queijo | 1 | egg, milk | egg |
| food_262 | Cuscuz marroquino (cozido) | 1 | gluten, wheat | gluten, wheat (ficaria sem nenhum) |
| food_345 | Farinha de rosca | 1 | gluten, wheat | gluten, wheat (ficaria sem nenhum) |
| food_397 | Tahine (Pasta de gergelim) | 1 | sesame | sesame (ficaria sem nenhum) |
| food_446 | Nuggets vegetais | 1 | gluten, soy, wheat | soy |
| food_458 | Maionese vegana | 1 | soy | soy (ficaria sem nenhum) |

Formato de resposta por linha: `[ ] Confirmo, o banco está certo` ou `[ ] A análise externa está
certa, pode remover`.
