# Briefing de desenho: atribuir plano manualmente (dashboard)

**Data:** 17 de outubro de 2026
**Para:** Antigravity (desenho)
**Pedido por:** Taina, 2026-10-17
**Implementação:** Claude, depois do desenho

Já existe um rascunho em `designs/AtribuicaoManualPlano.dc.html` (17/10). Ele acerta o essencial (dois pontos de
entrada, catálogo ou construtor, fila de parecer, tela de espera sem prazo). Este briefing lista o que falta e o
que precisa mudar para bater com o sistema que já está no ar.

---

## 1. Para que serve

Quando a geração automática falha, a equipe dá um plano ao aluno. Hoje não existe como fazer isso: o botão
"Atribuir" está desativado. A atribuição **coloca o aluno na fila de parecer**; o aluno só vê o plano depois do
parecer.

Vale para **os dois planos**: nutrição (nutricionista ou admin) e treino (personal ou admin). O desenho atual só
mostra nutrição; o de treino pode reaproveitar a mesma estrutura, mas precisa ser desenhado (sem piso de kcal;
com as restrições de saúde do aluno no lugar das alimentares).

## 2. O que desenhar

### 2.1 Pontos de entrada (já no rascunho — ok)
- Card "Plano Ativo" do aluno, quando não há plano daquele tipo.
- Linha do aluno em "Planos que falharam" (`/campaign/failed-plans`), ao lado de "Tentar de novo".

### 2.2 Escolha: plano de catálogo ou rascunho do construtor
- **Catálogo:** lista dos planos ativos com filtros. **Mostrar a faixa real dos cardápios** ("1.370 a 1.507 kcal"),
  nunca o número do nome do plano nem a meta — o nome dos planos de catálogo ainda tem kcal e não bate com os
  cardápios.
- **Rascunho do construtor:** planos montados no construtor e ainda não atribuídos. Desenhar também o caminho
  "montar agora": abre o construtor já com o aluno no contexto e volta para esta tela ao salvar.
- Cabeçalho com o que importa do aluno: objetivo, número de refeições, preferência, **restrições alimentares**
  (faltam no rascunho) e o piso.

### 2.3 Confirmação
- Resumo: aluno, plano escolhido, faixa real dos cardápios, número de refeições.
- Texto do destino: "O plano entra como **Aguardando validação** e só aparece no app do aluno depois do parecer."
- Um botão de confirmar, um de voltar. Sem campo de justificativa.

### 2.4 Plano escolhido fora das regras — dois bloqueios, cada um com texto próprio
1. **Abaixo do piso de segurança.** Correção no rascunho: o piso **não é calculado por aluno** — é fixo,
   **1.200 kcal** (mulher, não binário, não declarado) ou **1.500 kcal** (homem). E vale para **cada cardápio**,
   não para a média nem para o número do plano. Texto que o sistema já gera:
   "Cardápio abaixo do piso de segurança (1.200 kcal): cardápio 3 com 1.140 kcal."
   O plano aparece na lista, marcado, e não pode ser confirmado. (55 dos 300 planos de catálogo estão nessa
   situação hoje.)
2. **Prato incompatível com as restrições do aluno** (novo, falta no rascunho). Texto que o sistema já gera:
   "Prato incompatível com as restrições do aluno: "Batata Frita com Queijo e Bacon" (contém soja)."
   Mesmo tratamento: marcado na lista, sem confirmar.

Os dois podem acontecer juntos; mostrar os dois.

### 2.5 Depois de confirmar
- Volta para o perfil do aluno com o plano como "Aguardando validação".
- O alerta de "plano não gerado" fecha sozinho (a faixa vermelha some).

### 2.6 Tela de espera do aluno (já no rascunho — ok)
"Plano em Preparação", sem prazo, suporte por e-mail (contato@ybytu.app) — já está assim no app desde 17/10.

## 3. Ajustes no rascunho atual

- Trocar "piso seguro calculado ≥ 1.450 kcal" por 1.200 / 1.500 fixos.
- Trocar "o cálculo nutricional ficaria em 1.250 kcal" pelo texto real: "Cardápio abaixo do piso de segurança
  (1.500 kcal): cardápio 1 com 1.433 kcal, …".
- Cards de plano: kcal real dos cardápios (faixa), não "⚡ 1.620 kcal/dia" vindo do nome.
- Acrescentar restrições do aluno no cabeçalho e o bloqueio por prato incompatível.
- Acrescentar o fluxo de treino.

## 4. Dados disponíveis

Aluno: objetivo, sexo, número de refeições, preferência, restrições, condições de saúde, motivo da falha.
Plano: nome, cardápios com kcal e macros reais por dia, refeições/dia, preferência, se é catálogo ou rascunho.
**Não existe:** histórico de quem atribuiu o quê (será gravado a partir desta função).
