# Revisão de segurança do treino — sua ajuda é necessária antes do lançamento

## O que é isso

O app monta o treino de cada aluno automaticamente, escolhendo exercícios de um catálogo. Quando
um aluno declara alguma dor ou lesão no cadastro, o sistema tenta ajustar o treino pra essa
condição — em alguns casos, avisando que aquele exercício pede atenção; em outros, tirando o
exercício do treino por completo.

Essas regras de ajuste foram sugeridas por inteligência artificial, e **ainda não foram revisadas
por nenhum profissional**. Elas já estão em produção — ou seja, um aluno real que declarar dor no
joelho, por exemplo, já está recebendo o texto de aviso que a IA escreveu, sem ninguém do time
clínico ter confirmado se está certo. É você quem decide se cada regra está certa, deveria ser
mais rígida, ou precisa de ajuste no texto.

Este documento tem duas partes: 13 regras de segurança pra confirmar ou corrigir, e 7 exercícios
onde o cadastro de músculo trabalhado parece estar errado. Estimativa: 20 a 25 minutos.

---

## Comece por aqui — este é o caso mais urgente

Pra quem tem **problema articular grave** (artrite grave, prótese articular), o sistema hoje só
**avisa** antes de exercícios como agachamento com barra, levantamento terra, press militar e
burpee (e mais 36 exercícios, 40 no total) — o aluno vê o aviso, mas o exercício continua no
treino dele.

O texto do próprio aviso, do jeito que está registrado hoje, diz:

> "Artrite grave/prótese articular: impacto e compressão axial **contraindicados** em articulação
> comprometida"

"Contraindicado" é uma palavra médica que significa "não fazer" — não "fazer com cuidado". Ou
seja: o próprio texto do aviso já diz que não deveria ser feito, mas hoje só avisa. Essa é a
pergunta mais importante do documento.

**Sua decisão:**
- [ ] Aviso está certo — o aluno vê o alerta, mas o exercício continua no treino dele.
- [ ] Deveria ser exclusão — esses exercícios não entram no treino de quem tem essa condição.

---

## O que já está funcionando direito (não precisa da sua revisão)

Duas coisas já estão corretas hoje, então você não precisa se preocupar com elas:

- Quando um exercício é marcado como "não deveria fazer" pra uma condição, ele nunca aparece no
  treino de quem tem essa condição — não é um aviso escondido, ele simplesmente não é
  considerado na hora de montar o treino.
- Se depois de aplicar todos os filtros (nível, ambiente, equipamento, condições declaradas) não
  sobrar nenhum exercício seguro pra completar o treino, o sistema não entrega um treino
  incompleto ou arriscado disfarçado de completo — ele recusa montar e avisa que não conseguiu.

---

## As 13 regras — confirme ou corrija cada uma

Cada pergunta já traz o total de exercícios afetados e alguns nomes de exemplo — não precisa
abrir mais nada pra responder. Em cada uma, marque uma opção:

- [ ] **Aviso** — o aluno vê um alerta na tela, mas o exercício continua no treino dele.
- [ ] **Exclusão** — o exercício não entra no treino de quem tiver essa condição.
- [ ] **Ajustar o texto do aviso** — se a regra está certa mas a redação precisa mudar.

**1. Quem tem dor no tornozelo pode fazer exercícios de impacto — Box Jump, Burpee, Pular corda,
Salto de sapo e mais 15 (19 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: o impacto ao aterrissar sobrecarrega o ligamento lateral do tornozelo.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**2. Quem tem dor no tornozelo pode fazer exercícios que exigem empinar o pé repetidamente —
Elevação de panturrilha no Smith, Corrida em inclinação, Step-up no degrau, Panturrilha no Leg
Press e mais 12 (16 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: sobrecarrega o tendão de Aquiles.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**3. Quem tem dor no cotovelo pode fazer exercícios de rosca e tríceps com carga — Rosca direta
com barra, Tríceps testa com barra, Rosca Scott com barra W, Tríceps francês com halteres e mais
31 (35 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: dobrar e esticar o cotovelo repetidamente com carga pode causar epicondilite
(dor crônica no cotovelo). Hoje ninguém consegue declarar "dor no cotovelo" no cadastro — essa
opção ainda não existe na tela do aluno, mas está prevista (ver pergunta extra no fim deste
documento).
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**4. Quem tem dor na virilha pode fazer exercícios de abrir/fechar a perna com carga — Sumô
Deadlift com barra, Agachamento sumô isométrico, Cossack squat, Abdução em pé com miniband e mais
4 (8 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: tensiona os adutores e os ligamentos da virilha. Opção de cadastro ainda não
existe na tela do aluno (ver pergunta extra no fim).
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**5. Quem tem lesão ativa no posterior de coxa (isquiotibial) pode fazer exercícios de dobradiça
de quadril — Levantamento terra romeno, Stiff com barra, Good morning com barra, Sumô Deadlift
com halteres e mais 18 (22 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: a fase de descida do movimento arrisca romper de novo uma lesão ativa. Opção de
cadastro ainda não existe na tela do aluno. Quando essa pergunta for criada, ela deveria distinguir
lesão **ativa/recente** de **histórico antigo já reabilitado**? Deixe registrado como acha que a
pergunta deveria ser feita, se tiver opinião: ____
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**6. Quem tem dor no quadril pode fazer exercícios de flexão de quadril com carga — Elevação de
pernas deitado, Dead bug, GHD Sit-up, Joelho no peito na barra e mais 13 (17 no total) —, com
aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: contração forçada do músculo que liga a coxa ao quadril pode agravar
tendinite/impacto no quadril. Opção de cadastro ainda não existe na tela do aluno.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**7. Já respondida acima ("Comece por aqui") — problema articular grave, 40 exercícios no total.**

**8. Quem tem dor no joelho pode fazer exercícios de agachamento/avanço com carga — Back Squat,
Box Squat com barra, Avanço reverso com halteres, Front squat com barra olímpica e mais 11 (15 no
total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: dobrar o joelho com carga comprime a articulação atrás da patela. A própria IA
já marcou 6 desses 15 exercícios (incluindo o Box Squat) como prioridade alta de atenção.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**9. Quem tem dor no joelho pode fazer exercícios de impacto — Box Jump, Burpee, Pular corda,
Salto de sapo e mais 11 (15 no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: o impacto ao aterrissar sobrecarrega meniscos e ligamentos do joelho.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**10. Quem tem dor lombar pode fazer exercícios de carga na coluna com flexão — Levantamento
terra, Back Squat, Good morning com barra, Stiff com barra e mais 26 (30 no total) —, com aviso?
Ou não deveria fazer de jeito nenhum?**
Motivo da regra: pode causar dor mecânica ou agravar hérnia de disco.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**11. Quem tem dor no pescoço pode fazer exercícios de empurrar peso acima da cabeça — Press
militar com barra, Desenvolvimento com halteres, Arnold press, Push press com barra e mais 6 (10
no total) —, com aviso? Ou não deveria fazer de jeito nenhum?**
Motivo da regra: sobrecarrega a cervical.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**12. Quem tem alteração de assoalho pélvico (incontinência, prolapso, pós-parto) pode fazer
exercícios de carga pesada e impacto — Levantamento terra, Back Squat, Burpee, GHD Sit-up e mais
60 (64 no total, a regra que afeta mais exercícios de todo o catálogo) —, com aviso? Ou não
deveria fazer de jeito nenhum?**
Motivo da regra: impacto e/ou pressão na barriga pode agravar incontinência ou prolapso. Testamos
o cenário mais restritivo possível — todos os 64 virando exclusão, no nível mais básico do
catálogo (iniciante, sem equipamento) — e mesmo assim sobra exercício suficiente pra montar um
treino completo. Isso não decide se a regra deveria ser exclusão (isso é decisão sua), só garante
que promover pra exclusão não vai deixar ninguém sem treino.

*Nota à parte, se você tiver a experiência clínica pra opinar sobre isso:* a regra hoje trata do
mesmo jeito levantamento de carga pesada (deadlift, agachamento) e exercícios de impacto/pulo
(burpee, pular corda) — são mecanismos de risco diferentes. Faria sentido separar em duas regras?
____
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

**13. Quem tem dor no punho pode fazer exercícios que exigem esticar o pulso pra trás com o peso
do corpo em cima — Flexão de braço tradicional, Prancha frontal, Burpee com apoio nas mãos,
Push-up explosivo com palmas e mais 28 (32 no total) —, com aviso? Ou não deveria fazer de jeito
nenhum?**
Motivo da regra: sobrecarrega o pulso. Opção de cadastro ainda não existe na tela do aluno.
- [ ] Aviso [ ] Exclusão [ ] Ajustar o texto do aviso: ____

---

## 7 exercícios com músculo trabalhado errado no cadastro

O cadastro de qual músculo cada exercício trabalha é usado pra decidir quais exercícios entram no
treino de cada aluno. Um exercício com o músculo errado no cadastro pode nunca aparecer onde
deveria, ou aparecer no lugar errado.

Os 5 primeiros parecem ser o mesmo tipo de erro (esqueceram de cadastrar o músculo principal). Os
2 últimos são realmente uma questão de opinião — pedem seu julgamento, não só confirmação.

1. **Cadeira flexora** está cadastrada hoje trabalhando só **glúteos**. Deveria incluir também
   **posterior de coxa**? [ ] Sim, corrige [ ] Não, está certo do jeito que está [ ] Outro: ____

2. **Mesa flexora** está cadastrada hoje trabalhando só **glúteos**. Deveria incluir também
   **posterior de coxa, core e estabilizadores**? [ ] Sim, corrige [ ] Não, está certo do jeito
   que está [ ] Outro: ____

3. **Stiff com barra** está cadastrado hoje trabalhando só **glúteos**. Deveria incluir também
   **posterior de coxa**? [ ] Sim, corrige [ ] Não, está certo do jeito que está [ ] Outro: ____

4. **Kettlebell swing** está cadastrado hoje trabalhando só **glúteos**. Deveria incluir também
   **posterior de coxa, quadríceps e core**? [ ] Sim, corrige [ ] Não, está certo do jeito que
   está [ ] Outro: ____

5. **Levantamento terra com barra olímpica** está cadastrado hoje trabalhando só **glúteos**.
   Deveria incluir também **posterior de coxa (cadeia posterior)**? [ ] Sim, corrige [ ] Não,
   está certo do jeito que está [ ] Outro: ____

6. **Flexão de braço com pegada fechada** — existem duas versões cadastradas com o mesmo nome no
   catálogo. Uma diz que trabalha **bíceps, peito, tríceps e ombro**; a outra diz **tríceps,
   peito, ombro e core**. Pegada fechada de flexão trabalha bíceps ou não?
   [ ] A primeira está certa (com bíceps) [ ] A segunda está certa (sem bíceps, com core)
   [ ] Nenhuma das duas — o certo é: ____

7. **Wall ball** — existem duas versões cadastradas com o mesmo nome. Uma diz que trabalha só
   **quadríceps**; a outra diz **corpo inteiro**. Wall ball é isolado de quadríceps ou trabalha o
   corpo inteiro?
   [ ] A primeira está certa (só quadríceps) [ ] A segunda está certa (corpo inteiro)
   [ ] Nenhuma das duas — o certo é: ____

---

## Pergunta extra: nomes de 7 condições novas que vão entrar no cadastro do aluno

Hoje, a pergunta "possui alguma dor ou limitação física?" no cadastro do aluno só oferece 7
opções: Joelho, Lombar, Ombro, Pescoço, Tornozelo, Outra limitação, Nenhuma. Vamos adicionar mais
7 opções, que são justamente as condições que aparecem nas regras 3, 4, 5, 6, 7, 12 e 13 acima —
hoje nenhum aluno consegue declarar essas condições, então essas regras nunca chegam a valer pra
ninguém ainda.

Confirme o nome de cada opção nova (ou proponha outro):

| Condição | Nome proposto | Sua decisão |
|---|---|---|
| Dor no cotovelo | Cotovelo | [ ] Confirma [ ] Outro nome: ____ |
| Dor no punho | Punho | [ ] Confirma [ ] Outro nome: ____ |
| Dor no quadril | Quadril | [ ] Confirma [ ] Outro nome: ____ |
| Dor na virilha | Virilha | [ ] Confirma [ ] Outro nome: ____ |
| Lesão no posterior de coxa | Posterior de coxa | [ ] Confirma [ ] Outro nome: ____ |
| Problemas articulares graves | Problemas articulares graves | [ ] Confirma [ ] Outro nome: ____ |
| Alteração de assoalho pélvico | Assoalho pélvico | [ ] Confirma [ ] Outro nome: ____ |

"Posterior de coxa" foi escolhido no lugar de "isquiotibial" por ser mais fácil de entender pra
quem não é da área — se preferir outro termo, é só trocar.

---

## O que NÃO precisa da sua atenção agora

Pra você não procurar problema onde não há: splits de 2/6/7 dias, a matriz de séries e descanso,
padronização de repetições, dia leve/mobilidade, e treino de panturrilha já estão em produção sem
nenhum problema relatado — só ainda não passaram por um aval formal seu. Isso fica pra uma
próxima sessão, sem urgência nenhuma agora.

---

*Versão de envio, em linguagem simples, sem termos técnicos do sistema. A versão técnica completa
— com a justificativa de cada decisão de arquitetura, referências de código e achados registrados
pra ação nossa (não perguntas pro personal) — está em
`docs/SESSAO_1_PERSONAL_20260903.md`.*
