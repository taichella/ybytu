# Pedido de Novas Receitas — Lacunas de Cobertura do Cardápio

**Data:** 2026-09-01
**Solicitante:** equipe Ybytu (produto)
**Para:** nutricionista responsável pelo cardápio

## Contexto

Estas lacunas de cobertura foram identificadas durante uma investigação sobre alérgeno
não anunciado no catálogo de refeições (`meals`). Algumas das combinações abaixo ficaram
ainda mais frágeis quando se considerou desativar receitas com alérgeno escondido — mas
é importante deixar claro: **as lacunas em si já existiam antes disso, de forma
independente**. Isso não é uma questão de segurança alimentar, é uma questão de
**variedade de cardápio**: hoje, para certas combinações de `dietary_preference ×
meal_type`, o app tem pouquíssimas (ou nenhuma) opção ativa para oferecer ao usuário.

Os números abaixo foram apurados em 2026-09-01 direto no banco de produção
(`meals`, contagem de registros com `is_active = true`, agrupados por
`dietary_preference` e `meal_type`).

Verificação adicional pedida: conferimos também a cobertura vegana, que havia sido
mencionada como possível ponto de atenção. **Não encontramos lacuna crítica no vegano** —
todas as combinações (`breakfast`: 5, `lunch`: 5, `dinner`: 3, `snack`: 12) têm 3 ou mais
opções ativas, acima do limiar de risco usado neste documento (≤2 opções). Não está
incluído no pedido abaixo por esse motivo.

---

## 1. Pescetariano × Café da manhã (breakfast) — CRÍTICO (0 opções ativas)

Hoje não existe **nenhuma** receita de café da manhã ativa para o perfil pescetariano.
Qualquer usuário pescetariano que abrir o plano nessa refeição não tem opção alguma.

**Pedido:** 2-3 receitas de café da manhã pescetariano (podem reutilizar peixe/frutos do
mar leves como salmão defumado, atum, ou simplesmente opções vegetarianas/ovo-lácteas
compatíveis com o perfil, já que pescetariano tipicamente aceita tudo exceto carne — desde
que a receita não dependa de carne vermelha/aves).

---

## 2. Pescetariano × Jantar (dinner) — ALTO (1 opção ativa)

Opção existente hoje:
- Tilápia Empanada na Aveia

**Pedido:** 1-2 receitas novas de jantar pescetariano, evitando repetir "peixe empanado
em aveia" — priorizar outra técnica de preparo (ex: assado, grelhado, ensopado) ou outra
proteína aquática (camarão, salmão) para dar variedade real.

---

## 3. Pescetariano × Lanche (snack) — ALTO (1 opção ativa)

Opção existente hoje:
- Sanduíche Natural de Atum

**Pedido:** 1-2 receitas novas de lanche pescetariano, evitando repetir "atum em pão" —
sugerir formatos diferentes (ex: patê/dip com torradas, salada rápida, wrap com outro
peixe) para não duplicar a opção já existente.

---

## 4. Vegetariano × Jantar (dinner) — MODERADO (2 opções ativas)

Opções existentes hoje:
- Pizza de Frigideira com Massa de Aveia
- Sopa de Tomate com Ovo Escalfado

**Pedido:** 1-2 receitas novas de jantar vegetariano, evitando repetir "massa de aveia" e
"ovo escalfado em sopa" — sugerir outras bases (ex: legumes assados, tofu/queijo grelhado,
risoto) para ampliar variedade.

---

## 5. Pescetariano × Almoço (lunch) — MODERADO (2 opções ativas)

Opções existentes hoje:
- Salada de Atum e Grão-de-bico
- Wrap Frio de Atum Rápido

**Pedido:** 1-2 receitas novas de almoço pescetariano, evitando repetir "atum frio" —
sugerir preparo quente (ex: peixe grelhado com acompanhamento, risoto de camarão) para
diversificar as opções de proteína aquática e temperatura de prato.

---

## Resumo

| Combinação | Opções ativas hoje | Urgência |
|---|---|---|
| Pescetariano × Café da manhã | 0 | Crítico |
| Pescetariano × Jantar | 1 | Alto |
| Pescetariano × Lanche | 1 | Alto |
| Vegetariano × Jantar | 2 | Moderado |
| Pescetariano × Almoço | 2 | Moderado |

Vegano foi conferido e **não apresenta lacuna** (mínimo de 3 opções ativas em todas as
refeições).
