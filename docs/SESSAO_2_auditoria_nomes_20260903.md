# Sessão 2 — auditoria de nomes de refeição (2026-09-03)

**Não bloqueia nada.** Registrado, não validado ainda — fica pra depois da sessão 1.

Arquivo fonte: `docs/auditoria_nomes_20260903.csv` (cópia de `auditoria_nomes.csv`, análise
externa, 221 linhas / 117 refeições).

## Veredito geral (concordância registrada)

Nomes são bons com exceções, média de 5 palavras — adequada pra leitura em lista no celular.
Sem discordância desse veredito.

## Três ressalvas, pra quem for validar depois

**1. As duas maiores categorias (158 das 221 linhas) são quase certamente o mesmo defeito de
offset visto pela terceira vez, não problema de nomenclatura.** "Omissão de Conteúdo" (87
casos) e "Promessa Falsa" (71 casos) somam 158 — e **186 das 221 linhas totais são de
refeições inativas**, o mesmo universo já capturado pelo defeito de troca de ingrediente (ver
`docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv` e
`docs/SESSAO_2_auditoria_instrucoes_20260902.md`, que documentou o mesmo padrão pra
"Completude"). Nome prometendo brócolis quando o ingrediente virou farinha de trigo por
defeito de dados não é falha de redação — é o mesmo bug, visto pela terceira auditoria
externa diferente. Se o CSV de substituições for aplicado, boa parte desta categoria some
sozinha, sem precisar reescrever nome nenhum.

**2. "Adjetivos Vazios" (35 casos) é preferência de estilo, não defeito — precisa de decisão
de produto antes de virar trabalho.** "Panqueca Fit de Banana e Aveia" comunica bem, e "fit"/
"light" são linguagem reconhecível pelo público-alvo. Não corrigir isso até alguém (produto)
decidir se esse tom é intencional. Se for, a categoria inteira é descartada, igual ao que já
aconteceu com "Refeição Incompleta" via `food_group_id`.

**3. Dois achados específicos da análise externa parecem reais — checar quando chegar a vez:**
- **`Pizza de Frigideira Low Carb`** — segundo a análise, feita quase só de ovos, sem o nome
  avisar. Vale conferir ingredientes reais.
- **Nomes com parênteses que parecem linha de catálogo, não nome de prato** — exemplo citado:
  `"Batata-doce cozida (proteína vegetal modesta)"`. Parece um rótulo técnico de planilha que
  vazou pro nome da refeição em vez de virar texto de apoio. Confirmar o padrão completo
  (quantos casos, mesmo formato) na validação.

## Próximo passo (sessão 2, não agora)

Validar as linhas contra o banco real, separando o que é reflexo do defeito de offset
(desaparece com a correção já mapeada) do que é problema de nomenclatura genuíno — e resolver
a decisão de produto sobre "Adjetivos Vazios" antes de tratá-la como pendência de correção.
