# Proposta: o onboarding só oferece números de refeições que cabem no piso de segurança

**Data:** 17 de outubro de 2026
**Pedido por:** Taina, 2026-10-17 ("nem plano abaixo do piso nem aluno esperando")
**Estado:** a proposta COMPLETA abaixo fica para depois do catálogo corrigido (decisão da Taina). **Versão curta FEITA 2026-10-17:** a checagem roda no FIM do onboarding, sem reordenar perguntas; se o número escolhido não couber, a tela "Sua rotina alimentar vai precisar mudar" oferece ajustar (volta para a pergunta) ou manter (termina e o plano alimentar cai na montagem manual, com alerta). Regra única em `supabase/functions/_shared/mealFeasibility.ts`, usada pelo gerador e por `ybytu-meal-feasibility`.

---

## 1. O problema

Desde 2026-10-17 o piso de segurança (1.500 kcal homem / 1.200 demais) vale para a soma de cada cardápio. Com o
catálogo atual, alguns perfis nunca alcançam o piso (ex.: homem com 3 refeições, máximo 1.433; vegano com 3,
máximo 1.083 — ver `docs/POS_PILOTO.md`, "BLOQUEIO CLÍNICO"). Hoje esses alunos terminam o onboarding e ficam
sem plano.

## 2. Achados que mudam a proposta

1. **O onboarding pergunta o número de refeições ANTES da preferência alimentar e das restrições**
   (`apps/ybytu-onboarding/src/App.jsx`: `meals_per_day` vem antes de `dietary_preferences` e
   `dietary_restrictions`). Sem preferência e restrições não dá para saber o que cabe. **É preciso mover a
   pergunta para depois das restrições.** Corpo (sexo, idade, peso, altura, atividade, objetivo) já vem antes.
2. **A conta só é criada no fim do onboarding.** Na hora da pergunta o visitante não está logado; a consulta
   precisa ser um endpoint público.
3. **O conserto do gerador alcança exatamente o máximo do pool.** A troca de refeições (7b) continua enquanto
   houver ganho, só dentro das opções seguras e sem repetir prato no dia. Então "o máximo possível do pool
   ≥ piso" é a mesma pergunta que "o gerador vai conseguir". A verificação pode ser exata, não aproximada.

## 3. Uma regra só, em um lugar só

Novo módulo `supabase/functions/_shared/mealFeasibility.ts`, usado por **dois** chamadores:

- **gerador** (`ybytu-generate-meal-plan`): checa antes de compor;
- **endpoint novo** `ybytu-meal-feasibility` (público, só leitura): o onboarding chama na hora da pergunta.

O módulo usa o que já é compartilhado — nada novo para divergir:

| Peça | Onde mora hoje |
|---|---|
| Piso por sexo | `_shared/safetyFloor.ts` |
| Meta de kcal (Mifflin-St Jeor + objetivo + piso da meta) | hoje dentro do gerador → **mover** para `_shared/calorieTarget.ts` |
| Opções seguras por tipo (preferência + restrições) | RPC `ybytu_match_meals` (regra de proibição já compartilhada desde a migração 20261017210000) |

Cálculo, para cada número de refeições (3, 4, 5, 6): pega o pool que o gerador receberia, soma o prato mais
calórico de cada refeição principal e os N lanches mais calóricos **distintos**, e compara com o piso.
Resposta: `{ viable: [4, 5, 6] }`. **Nenhum número de kcal sai do servidor.**

## 4. No onboarding

- A pergunta "Como é sua rotina alimentar?" passa para depois de "restrições alimentares".
- Ao chegar nela, o onboarding chama o endpoint com as respostas anteriores e mostra **só as opções viáveis**,
  sem explicar cálculo. O texto da pergunta não muda.
- **Se a consulta falhar** (rede, endpoint fora): mostra todas as opções. O gerador continua protegendo; quem cair
  num número inviável entra no caminho do item abaixo.
- **Se nenhuma opção for viável:** a pergunta aparece com todas as opções (registra o hábito), o aluno termina o
  cadastro normalmente, e o gerador marca o plano como **pendente de montagem manual** (status novo
  `manual_pending`), dispara o alerta aos admins com o motivo ("nenhum número de refeições alcança o piso de
  segurança com o catálogo atual") e o aluno vê uma tela com texto próprio.
- `manual_pending` **não** entra nas tentativas automáticas (repetir não muda o resultado) e aparece em
  "Planos que falharam" com a ação de atribuir plano.

**Texto sugerido para a tela do aluno** (a aprovar; o desenho é do Antigravity):
> **Seu plano alimentar está sendo montado pela nossa equipe**
> Pelo seu perfil, a nutricionista vai montar o seu cardápio pessoalmente. Você recebe um e-mail assim que ele
> for liberado aqui. Dúvidas: contato@ybytu.app

Sem prazo (decisão da Taina, 2026-10-17).

## 5. Dá para calcular na hora sem expor cálculo? Sim.

São 4 chamadas da RPC que o gerador já usa (uma por número de refeições), na mesma requisição; a RPC roda em
milissegundos sobre ~100 refeições ativas. O aluno vê só a lista de opções. O endpoint recebe dados de corpo
(sexo, idade, peso, altura, atividade) sem nome, e-mail nem telefone, e não grava nada.

Ponto de atenção: endpoint público sem rate limit (já é débito conhecido em `docs/POS_PILOTO.md`, "Rate limit
nos endpoints públicos"). Ele não expõe dado de aluno, só a disponibilidade de opções do catálogo.

## 6. Trabalho

| Peça | Estimativa |
|---|---|
| `_shared/mealFeasibility.ts` + mover a meta para `_shared/calorieTarget.ts` + endpoint público | 0,5 dia |
| Gerador: checagem prévia + status `manual_pending` (migração do CHECK) + alerta + fora das tentativas automáticas + FailedPlans | 0,5 dia |
| Onboarding: mover a pergunta, buscar opções viáveis, estado de carregamento, cair para "todas" se falhar | 0,5 a 1 dia |
| Tela do aluno com texto próprio (depois do desenho) | 0,25 dia |
| Testes (contas descartáveis: inviável em 3 e viável em 5; nenhum viável; endpoint fora) | 0,5 dia |
| **Total** | **~2,5 a 3 dias** |

## 7. O que isto NÃO resolve

É remendo: restringe a escolha do aluno para caber no catálogo. A solução real é o catálogo (receitas maiores,
porções ajustáveis) — registrado na lista da nutricionista (`docs/POS_PILOTO.md`, item N10).
