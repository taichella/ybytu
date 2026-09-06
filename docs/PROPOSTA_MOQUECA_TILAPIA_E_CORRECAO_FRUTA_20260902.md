# Proposta combinada — Moqueca (meal_112): troca de peixe + correção de fruta

Duas origens diferentes, uma proposta só, porque corrigir separado deixa a receita quebrada no
meio: `meal_112` (hoje inativa) é a mesma refeição do defeito de offset de ingrediente já
documentado (`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv`, linha "Moqueca Leve
de Cação e Banana-da-Terra" — `Maçã` no lugar de `Banana-da-terra`) **e** alvo de uma proposta
de troca de peixe por sustentabilidade vinda de análise externa. Corrigir só o peixe sem
corrigir a fruta publica uma moqueca com maçã.

## Estado atual no banco (confirmado)

- `meal_112`, `is_active = false`, único usuário histórico de `food_290` (Cação cozido) — nenhuma
  outra refeição usa esse peixe.
- Ingredientes reais: `food_290` Cação cozido (150g), **`food_080` Maçã (100g)** ← defeito de
  offset, deveria ser banana-da-terra, `food_442` Leite de coco (50ml), `food_339` Azeite de
  dendê (5ml).
- Instrução atual: *"Refogue cebola e pimentão no dendê. Adicione o peixe, a banana-da-terra e o
  leite de coco. Cozinhe por 15 min."*

## Parte 1 — troca de peixe (sustentabilidade), números confirmados

| | Cação cozido (`food_290`, atual) | Tilápia grelhada (`food_285`, proposta) |
|---|---|---|
| Calorias /100g | 130 kcal | **128 kcal** |
| Proteína /100g | 21,0g | **26,2g** |
| Origem | pesca | aquicultura brasileira, mais acessível |

Os números da análise externa batem exatamente com o banco — confirmados, não peguei
divergência nenhuma aqui. Tilápia é mais barata, mais proteica e de origem mais sustentável
(aquicultura vs. pesca extrativa).

**Ajuste de preparo necessário e correto, culinariamente:** cação é peixe de carne firme,
aguenta os 15 minutos de fervura da receita atual. Tilápia desmancha nesse tempo — precisa
entrar só nos últimos ~5 minutos. Instrução proposta:

> *"Refogue cebola e pimentão no dendê. Adicione a banana-da-terra e o leite de coco, cozinhe
> por 10 min. Acrescente a tilápia e cozinhe por mais 5 min, até o peixe ficar opaco e se
> desmanchar facilmente."*

Nome proposto: **"Moqueca Leve de Tilápia e Banana-da-Terra"**.

## Parte 2 — correção da fruta (defeito de offset), com um bloqueio de escopo

**Banana-da-terra NÃO existe no catálogo hoje** — busquei por "banana" em `foods` e só existe
`food_079` "Banana" (a fruta comum). Isso muda o escopo da correção: não é só trocar o
`food_id` no `ingredients_json`, é decidir entre duas opções, e isso é decisão da
nutricionista, não nossa:

- **Opção A — cadastrar "Banana-da-terra" como alimento novo.** Fica com os dados nutricionais
  corretos (a banana-da-terra/plátano é mais amilácea, menos doce que a banana comum, perfil de
  carboidrato diferente) e o prato fica fiel ao nome e à instrução original. Escopo maior:
  precisa de ficha nutricional nova revisada (inclusive `allergen_review_status`, hoje
  `unreviewed` por definição pra qualquer cadastro novo).
- **Opção B — usar `food_079` Banana (já existe) como substituto mais próximo.** Escopo menor,
  disponível imediatamente, mas não é o mesmo alimento — muda o perfil nutricional do prato e
  diverge do nome/instrução ("banana-da-terra" tem preparo e sabor bem diferentes de banana de
  mesa).

Não escolhi entre as duas — fica pra ela decidir com o trade-off à vista.

## O que vai pra ela, resumido

1. Aprovar (ou não) a troca Cação → Tilápia, com números confirmados e ajuste de preparo já
   redigido.
2. Decidir Opção A (cadastrar banana-da-terra) vs. Opção B (usar banana comum) pra fechar o
   defeito de offset da fruta.
3. Aprovar o novo nome "Moqueca Leve de Tilápia e Banana-da-Terra" (ou "...e Banana", se optar
   pela Opção B).

Nada foi alterado no banco por esta proposta — `meal_112` continua inativa como está até
decisão.
