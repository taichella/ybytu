# Briefing de desenho: encerrar o registro do dia alimentar (app e dashboard)

**Data:** 17 de outubro de 2026
**Para:** Antigravity (desenho das telas)
**Aprovado por:** Taina, 2026-10-17
**Implementação:** Claude, depois do desenho

Substitui, neste ponto, o "sem fechamento do dia" do briefing de 16/10
(`20261016_briefing_cardapio_do_dia.md`) e do princípio 2 de `docs/PRINCIPIOS_DE_PRODUTO.md`
(já atualizado). O resto do briefing de 16/10 (cardápio escolhido do dia) continua valendo.

---

## 1. A regra em uma frase

**Encerrar é o aluno declarando que terminou de REGISTRAR o dia — não que terminou de comer.**
O sistema nunca deduz nada a partir disso.

- Todo texto diz **"registro"/"registrado"**. Nunca "comeu", "consumiu", "concluiu o dia",
  "dia completo", "dia parcial".
- **Registrar a última refeição do cardápio do dia encerra sozinho** (como o treino ao marcar o
  último exercício).
- **Dia que o aluno não encerrou:** na virada não acontece nada para o aluno (sem aviso, sem
  "parcial"). No dashboard aparece "registro não encerrado pelo aluno", neutro.
- **Reabrir** funciona como no treino (desmarcar depois de encerrado pede confirmação).

## 2. App (360px) — estados para desenhar

1. **Dia em andamento.** Como hoje (contador "N refeições registradas hoje", bolinhas, barra
   estática, "Registrado hoje: …"), mais o controle para encerrar: sugestão de botão no fim da
   lista, no lugar onde o treino tem "Concluir treino". Texto sugerido: **"Encerrar o registro de
   hoje"**, com uma linha de apoio do tipo "Use quando terminar de registrar as refeições de hoje".
   Evitar "Concluir", "Finalizar dia".
2. **Encerrado pelo aluno com refeições sem registro** (ex.: 3 de 5). Como fica o card principal:
   "Registro de hoje encerrado às 21:05 · 3 refeições registradas". Sem fração, sem destacar as
   que ficaram sem registro, sem cor de alerta. Os cartões não registrados ficam limpos.
3. **Encerrado sozinho ao registrar a última refeição.** Substitui o aviso atual "Você registrou
   todas as refeições de hoje." por algo como "Registro de hoje encerrado — todas as refeições do
   cardápio registradas". Discreto, como hoje.
4. **Reabrir.** Tocar numa caixa depois de encerrado abre a confirmação, no mesmo padrão visual do
   treino ("Deseja reabrir este treino?"): **"Reabrir o registro de hoje?"** + o que acontece
   ("Você volta a poder registrar e desfazer refeições de hoje"). Desenhar também o toque numa
   refeição NÃO registrada com o dia encerrado (sugestão: o mesmo diálogo, e ao confirmar a
   refeição já entra registrada).
5. **Estado com o cardápio trocado no meio do dia** continua como no briefing de 16/10.

Não desenhar: aviso no dia seguinte, selo "parcial", contagem do que faltou, comparação com o
cardápio para o aluno (a comparação é só no dashboard, abaixo).

## 3. Dashboard (aba Atividade) — estados para desenhar

Linha do dia em "Refeições registradas por dia":

- **Encerrado pelo aluno:** "Registro encerrado pelo aluno às 21:05 · 3 de 5 refeições
  registradas · 1.240 kcal registradas".
- **Encerrado sozinho** (registrou a última refeição): igual, com "todas as refeições do cardápio
  registradas".
- **Não encerrado:** "registro não encerrado pelo aluno", neutro (cinza, sem tom de falha).
- **Dia sem registro:** continua "Sem registros".

Linha expandida, **só para dia encerrado pelo aluno** (aprovado pela Taina): comparação dos macros
com o cardápio, **sempre com "registrado"**. Ex.: "Proteína registrada: 55g de 70g do cardápio".
Para dia não encerrado, nenhuma comparação — só a lista de refeições como hoje.

Proibido em qualquer estado: "comeu", "consumiu", "parcial", "meta", comparação com a meta de kcal
do plano.

## 4. Dados disponíveis

- Por dia: cardápio, refeições registradas (hora, prato, tipo, kcal, macros), número de refeições
  do cardápio, **encerrado em / por** (aluno ou automático ao registrar a última), reaberturas.
- **Não existe:** o que o aluno comeu fora do registro, porções, motivo de não registrar.

## 5. Decisões da Taina (2026-10-17)

1. **Reabrir até o fim do mesmo dia**, no fuso do aluno (igual ao desfazer de refeição).
2. **Sem diálogo de confirmação ao encerrar**, mesmo com refeições sem registro: é reversível no mesmo dia e
   o diálogo vira atrito.
