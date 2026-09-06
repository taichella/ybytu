# Revisão de alérgenos — catálogo de nutrição (2026-08-31)

> ⚠️ **SUPERADO** — ver nota no topo de `docs/REVISAO_NUTRICIONISTA_ALERGENOS_486_FOODS_20260901.md`.
> **Correção adicional 2026-09-03:** o parágrafo abaixo também descreve uma "Fase B" de
> bloqueio automático que nunca foi implementada no código — verificado, nenhuma RPC de
> matching lê `allergen_review_status`. Não é comportamento intencional nem bug corrigido, é
> algo que nunca existiu. Ver `docs/SESSAO_1_NUTRICIONISTA_20260902.md`.

Este lote **destrava a Fase B** da correção de `restriction_tags` (ver auditoria de
2026-08-31 e a decisão de arquitetura que segue). Enquanto ele não voltar preenchido,
o gerador de plano continua bloqueando qualquer plano que use um ingrediente sem
revisão — comportamento intencional, não bug.

**Por que 42 e não menos:** esses são todos os ingredientes sem alérgeno registrado que
aparecem em alguma das 100 refeições hoje ativas no catálogo — não só nas mais usadas.
Cobre qualquer seleção de cardápio que o piloto venha a usar depois, não só o que já foi
usado até hoje (planos antigos, já reparados, não são um bom guia do que vai ao ar).

**Como preencher:** pra cada item, marca **um** dos dois quadrados. Se tem alérgeno,
escreve qual (pode ser mais de um — nesse caso lista todos, separados por vírgula).
Terminada uma linha, aquele ingrediente já destrava; não precisa terminar a lista
inteira numa sentada — está ordenada do que aparece em mais refeições pro que aparece
em menos, então parar no meio já libera o máximo de refeições possível com o menor
esforço.

**Pendência separada, já registrada, ainda aberta:** `Vitamina de Abacate Tradicional`
(`3784b6d6-c283-4e8e-b187-31d4ba351bc5`) foi desativada em 2026-08-31 por levar leite
(200ml de Leite integral) sem a tag `milk` registrada. Detalhe completo em
`docs/REVISAO_NUTRICIONISTA_meal_leite_sem_tag_20260831.md`, no mesmo diretório. Essa
refeição não está nesta lista porque já está desativada (não entra no cálculo de
"refeições ativas") — mas segue esperando sua confirmação pra poder voltar.

---

### 1. Banana (`food_079`) — aparece em 13 refeições ativas

**Refeições:** Banana Amassada com Aveia, Batido de Whey e Banana, Batido Hipercalórico (Mass Gainer Caseiro), Bolo de Chocolate de Microondas Fit, Crepioca Doce (Pré-Treino), Iogurte com Cacau e Banana, Milkshake de Cacau e Aveia (Vegan), Mingau de Aveia com Banana, Muffin de Banana de Microondas, Panqueca Fit de Banana e Aveia, Smoothie Bowl de Açaí e Banana, Sorvete Caseiro de Banana e Morango, Tosta de Pasta de Amendoim e Banana

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 2. Cacau em pó (sem açúcar) (`food_367`) — aparece em 11 refeições ativas

**Refeições:** Bolo de Caneca de Aveia e Cacau, Bolo de Caneca Proteico, Bolo de Chocolate de Microondas Fit, Brigadeiro de Colher (Sem Açúcar), Crepioca Doce (Pré-Treino), Iogurte com Cacau e Banana, Leite com Cacau e Canela, Milkshake de Cacau e Aveia (Vegan), Mingau Proteico de Cacau, Mousse Funcional de Abacate e Cacau, Pudim de Chia de Cacau

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 3. Azeite de oliva extravirgem (`food_320`) — aparece em 9 refeições ativas

**Refeições:** Creme de Abóbora com Frango, Cuscuz Marroquino com Grão-de-Bico, Escondidinho Vegano de Grão-de-Bico, Panqueca de Grão-de-Bico (Vegana), Salada de Atum e Grão-de-bico, Salada de Frango Rápida, Shakshuka (Ovos no Molho de Tomate), Sopa Creme de Ervilha, Tofu Mexido com Cúrcuma

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 4. Molho de tomate caseiro (`food_380`) — aparece em 9 refeições ativas

**Refeições:** Almôndegas Caseiras de Patinho, Panqueca de Frango Desfiado, Panqueca Integral de Carne Moída, Pizza de Frigideira com Massa de Aveia, Pizza de Frigideira Low Carb, Shakshuka (Ovos no Molho de Tomate), Sopa de Tomate com Ovo Escalfado, Strogonoff de Carne Saudável, Strogonoff Vegano de Grão-de-Bico

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 5. Peito de frango grelhado (`food_163`) — aparece em 9 refeições ativas

**Refeições:** Creme de Abóbora com Frango, Crepioca de Frango Desfiado, Escondidinho de Frango com Abóbora, Frango Desfiado com Purê de Abóbora, Frango Desfiado com Tapioca, Panqueca de Frango Desfiado, Salada de Frango Rápida, Tapioca de Frango com Requeijão Light, Wrap Rápido de Frango

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 6. Tapioca (goma preparada) (`food_260`) — aparece em 9 refeições ativas

**Refeições:** Crepioca de Frango Desfiado, Crepioca de Queijo Minas, Crepioca de Ricota, Crepioca Doce (Pré-Treino), Frango Desfiado com Tapioca, Panqueca de Tapioca Doce, Pão de Queijo de Frigideira, Tapioca de Frango com Requeijão Light, Tapioca Doce de Amendoim e Morango

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 7. Morango (`food_088`) — aparece em 8 refeições ativas

**Refeições:** Batido de Morango e Pasta de Amendoim, Iogurte com Granola e Morango, Kombucha de Morango Caseira, Smoothie de Leite de Coco e Frutas Vermelhas, Sorvete Caseiro de Banana e Morango, Tapioca Doce de Amendoim e Morango, Tigela de Grego, Frutas Vermelhas e Mel, Vitamina de Aveia, Morango e Colágeno

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 8. Purê de abóbora (preparado) (`food_270`) — aparece em 6 refeições ativas

**Refeições:** Creme de Abóbora com Frango, Escondidinho de Frango com Abóbora, Escondidinho Vegano de Grão-de-Bico, Frango Desfiado com Purê de Abóbora, Hambúrguer Vegetal com Purê de Abóbora, Purê de Abóbora Simples

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 9. Grão-de-bico cozido (`food_161`) — aparece em 5 refeições ativas

**Refeições:** Cuscuz Marroquino com Grão-de-Bico, Escondidinho Vegano de Grão-de-Bico, Salada de Atum e Grão-de-bico, Strogonoff Vegano de Grão-de-Bico, Wrap Integral de Falafel

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 10. Mel de abelha (`food_363`) — aparece em 5 refeições ativas

**Refeições:** Bolo de Caneca de Aveia e Cacau, Iogurte com Mel e Linhaça, Mousse Funcional de Abacate e Cacau, Panqueca de Tapioca Doce, Tigela de Grego, Frutas Vermelhas e Mel

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 11. Abacate (`food_028`) — aparece em 4 refeições ativas

**Refeições:** Abacate com Limão e Chia, Avocado Toast com Ovo (Pão com Abacate), Batido de Abacate Proteico, Mousse Funcional de Abacate e Cacau

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 12. Bacon de peru (`food_238`) — aparece em 4 refeições ativas

**Refeições:** Batata Frita com Queijo e Bacon, Hambúrguer Caseiro com Bacon, Ovos Mexidos com Bacon de Peru, Sopa de Ervilha com Bacon de Peru

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 13. Batata doce cozida (`food_002`) — aparece em 3 refeições ativas

**Refeições:** Feijoada Vegana (com Tofu Defumado), Strogonoff de Carne Saudável, Strogonoff Vegano de Grão-de-Bico

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 14. Chia hidratada (Pudim de Chia base) (`food_497`) — aparece em 3 refeições ativas

**Refeições:** Abacate com Limão e Chia, Pudim de Chia com Leite de Coco, Pudim de Chia de Cacau

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 15. Peito de peru defumado (`food_221`) — aparece em 3 refeições ativas

**Refeições:** Pão de Queijo com Peito de Peru, Sanduíche de Peru e Cottage, Wrap Quente de Peito de Peru

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 16. Canela em pó (`food_489`) — aparece em 2 refeições ativas

**Refeições:** Café Termogênico com Canela, Leite com Cacau e Canela

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 17. Ervilha em conserva (`food_487`) — aparece em 2 refeições ativas

**Refeições:** Sopa Creme de Ervilha, Sopa de Ervilha com Bacon de Peru

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 18. Guacamole (`food_395`) — aparece em 2 refeições ativas

**Refeições:** Nachos com Carne e Guacamole, Torrada com Guacamole e Ovo Quente

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 19. Ketchup (`food_383`) — aparece em 2 refeições ativas

**Refeições:** Cachorro-Quente Especial, Hambúrguer Caseiro Magro

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 20. Limonada sem açúcar (`food_405`) — aparece em 2 refeições ativas

**Refeições:** Abacate com Limão e Chia, Chá Verde Gelado com Limão e Gengibre

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 21. Açaí com xarope de guaraná (`food_378`) — aparece em 1 refeição ativa

**Refeições:** Smoothie Bowl de Açaí e Banana

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 22. Água de coco (`food_402`) — aparece em 1 refeição ativa

**Refeições:** Água de Coco com Spirulina

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 23. Aipo (Salsão) (`food_035`) — aparece em 1 refeição ativa

**Refeições:** Salada de Frango Rápida

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 24. Alface (`food_037`) — aparece em 1 refeição ativa

**Refeições:** Salada de Frango Rápida

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 25. Batata frita Fast-Food (`food_464`) — aparece em 1 refeição ativa

**Refeições:** Batata Frita com Queijo e Bacon

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 26. Biscoito de arroz (`food_257`) — aparece em 1 refeição ativa

**Refeições:** Biscoito de Arroz com Requeijão

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 27. Café sem açúcar (`food_400`) — aparece em 1 refeição ativa

**Refeições:** Café Termogênico com Canela

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 28. Chá verde sem açúcar (`food_401`) — aparece em 1 refeição ativa

**Refeições:** Chá Verde Gelado com Limão e Gengibre

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 29. Colágeno hidrolisado (`food_430`) — aparece em 1 refeição ativa

**Refeições:** Vitamina de Aveia, Morango e Colágeno

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 30. Cúrcuma (Açafrão-da-terra) (`food_490`) — aparece em 1 refeição ativa

**Refeições:** Tofu Mexido com Cúrcuma

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 31. Extrato de baunilha (`food_494`) — aparece em 1 refeição ativa

**Refeições:** Waffle Proteico de Baunilha

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 32. Farinha de grão-de-bico (`food_350`) — aparece em 1 refeição ativa

**Refeições:** Panqueca de Grão-de-Bico (Vegana)

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 33. Farinha de linhaça (`food_346`) — aparece em 1 refeição ativa

**Refeições:** Iogurte com Mel e Linhaça

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 34. Feijão preto cozido (`food_159`) — aparece em 1 refeição ativa

**Refeições:** Feijoada Vegana (com Tofu Defumado)

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 35. Geleia de morango (`food_369`) — aparece em 1 refeição ativa

**Refeições:** Pão Integral com Pasta de Amendoim e Geleia

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 36. Gengibre em pó (`food_493`) — aparece em 1 refeição ativa

**Refeições:** Chá Verde Gelado com Limão e Gengibre

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 37. Hambúrguer vegetal (tipo carne) (`food_443`) — aparece em 1 refeição ativa

**Refeições:** Hambúrguer Vegetal com Purê de Abóbora

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 38. Kombucha (tradicional) (`food_418`) — aparece em 1 refeição ativa

**Refeições:** Kombucha de Morango Caseira

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 39. Mamão (`food_081`) — aparece em 1 refeição ativa

**Refeições:** Vitamina de Papaia e Aveia

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 40. Orégano seco (`food_492`) — aparece em 1 refeição ativa

**Refeições:** Torrada Integral com Requeijão e Orégano

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 41. Salgadinho de pacote (tipo chips de milho) (`food_470`) — aparece em 1 refeição ativa

**Refeições:** Nachos com Carne e Guacamole

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---

### 42. Spirulina em pó (`food_498`) — aparece em 1 refeição ativa

**Refeições:** Água de Coco com Spirulina

| Tem alérgeno? Qual? | Não tem nenhum |
|---|---|
| [ ] Sim — ______________ | [ ] Confirmo, sem alérgeno |

---
