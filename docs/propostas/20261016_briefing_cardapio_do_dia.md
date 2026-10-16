# Briefing de desenho: cardápio escolhido do dia (app e dashboard)

**Data:** 16 de outubro de 2026
**Para:** Antigravity (desenho das telas)
**Aprovado por:** Taina, 2026-10-16
**Implementação:** Claude, depois do desenho

Leia antes: `docs/PRINCIPIOS_DE_PRODUTO.md` (princípios 1 a 3) e o desenho atual
`designs/AlunoAlimentacaoCheckin.dc.html`, que este briefing estende.

---

## 1. A ideia em uma frase

O aluno **escolhe qual dos cardápios do plano vai seguir hoje** e registra as refeições contra
ele. **Escolher é intenção; concluir seria afirmação, e só a primeira entra.**

Por que faz sentido: o número de cardápios do plano é igual ao número de dias de treino
(4 ou 5) — o onboarding usa uma pergunta só para os dois. Os cardápios **não são dias da
semana**: são opções.

## 2. O que NÃO existe (não desenhar)

- Botão ou estado de "concluir o dia alimentar", "dia fechado", "dia completo".
- Fração ou porcentagem para o aluno ("3/5", "60%"), "faltam N", cor de alerta.
- Aviso no dia seguinte sobre o que não foi registrado.
- Comparação com a meta de kcal em qualquer tela.
- Qualquer texto que trate "não escolheu" ou "não registrou" como falha.

## 3. App (360px) — estados para desenhar

1. **Ao abrir, sem escolha feita hoje.** O app **sugere** o próximo cardápio da sequência
   (como o treino sugere o próximo dia). A sugestão **não é escolha** (princípio 3): precisa
   parecer sugestão (ex.: "Sugerido para hoje: Cardápio 3"), não "Seu cardápio de hoje".
2. **Cardápio escolhido.** A escolha acontece quando o aluno toca num cardápio **ou** registra a
   primeira refeição dele. Daí em diante o rótulo vira algo como "Cardápio de hoje: 3".
3. **Trocar de cardápio no meio do dia.** Permitido, sem diálogo de bloqueio. Refeições já
   registradas de outro cardápio continuam valendo e continuam aparecendo como registradas.
   Desenhar como fica o seletor e o contador depois da troca.
4. **Contador e bolinhas.** O contador continua "N refeições registradas hoje" (todas as do dia,
   de qualquer cardápio). As bolinhas são as refeições **do cardápio de hoje**.
5. **Tudo registrado no cardápio de hoje:** o aviso discreto atual ("Você registrou todas as
   refeições de hoje.") continua igual. Sem fechamento.

O cartão de refeição, o "Desfazer registro" e o aviso de 4s não mudam (ver o desenho atual).
Pendente à parte, decidido pela Taina para você: caixa de marcar **à direita** e cartões de treino
e refeição com a mesma estrutura — se for desenhar isso agora, aplique aqui também.

## 4. Dashboard (aba Atividade) — estados para desenhar

Na linha do dia de "Refeições registradas por dia":

- **Com cardápio escolhido:** "Cardápio 3 · 3 de 5 refeições registradas · 1.240 kcal registradas"
  (o "de 5" é o número de refeições do cardápio escolhido).
- **Sem cardápio escolhido** (o aluno registrou antes de existir a escolha ou não escolheu):
  "cardápio não escolhido", neutro, e a contagem como hoje.
- **Troca no meio do dia:** mostrar o cardápio final e, ao expandir, as refeições agrupadas pelo
  cardápio a que pertencem (o detalhamento por cardápio já existe).
- Dia sem nenhum registro continua "Sem registros", neutro.

## 5. Dados disponíveis (para não desenhar o que não existe)

- Por dia: cardápio escolhido (ou nenhum), hora da escolha, refeições registradas com hora, prato,
  tipo e kcal; número de refeições do cardápio.
- **Não existe:** horário real em que o aluno comeu (só a hora do registro), motivo de não
  registro, porção consumida, kcal "consumidas" (só registradas).
