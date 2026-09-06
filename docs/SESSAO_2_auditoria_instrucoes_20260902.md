# Sessão 2 — auditoria de instruções de preparo (2026-09-02)

**Não bloqueia lançamento.** Registrado aqui, não validado ainda — fica pra depois da sessão 1.

Arquivo fonte: `docs/auditoria_instrucoes_20260902.csv` (cópia de
`auditoria_instrucoes.csv`, análise externa, 234 linhas / 150 refeições).

## Duas ressalvas identificadas na leitura, antes de qualquer validação

**1. A categoria "Completude" (110 casos, a maior) provavelmente está inflada pelo defeito de
ingredientes já conhecido.** Exemplo concreto: em `meal_011`, a auditoria acusa que "arroz
integral cozido" e "farinha de trigo" estão listados como ingrediente mas ausentes do modo de
preparo. Mas `meal_011` é uma das refeições do defeito de offset — arroz e farinha de trigo
estão lá **por engano, no lugar de batata doce e brócolis** (ver
`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv`). A instrução está certa; o
ingrediente é que está errado. Como **171 das 234 linhas são de refeições inativas** — as mesmas
já capturadas pelo defeito de offset — boa parte desta categoria é o mesmo problema visto por
outro ângulo, não um defeito novo de redação.

O que provavelmente sobra de real: as **63 linhas de refeições ativas**, concentradas em
"Precisão utilizável" e "Consistência de estilo" (verbo sem tempo/indicador visual, estilo
inconsistente entre receitas) — problemas de redação genuínos, independentes do dado de
ingrediente.

**2. A recomendação de reescrever o conjunto inteiro (baseada em média de 17 palavras por
instrução) não deve ser aceita sem discussão.** 17 palavras pode ser exatamente o adequado pra
leitura no celular durante o preparo — não é óbvio que "curto" seja defeito. Se virar decisão de
reescrever tudo, é da nutricionista, não uma conclusão a aceitar de cara.

## Próximo passo (sessão 2, não agora)

Validar as 63 linhas de refeições ativas contra o banco real (separando "Completude" residual
de "Precisão utilizável"/"Consistência de estilo"), do mesmo jeito rigoroso usado nas outras
auditorias externas — antes de qualquer coisa ir pra nutricionista.
