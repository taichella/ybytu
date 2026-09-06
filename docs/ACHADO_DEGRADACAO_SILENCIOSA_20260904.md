# Degradação silenciosa de slot — o quinto fail-open, o mais consequente (2026-09-04)

## O bug

Quando o gerador de treino (`ybytu-generate-training-plan/index.ts`) monta um slot e não sobra
nenhum exercício no pool seguro (`safePool`) com overlap no grupo muscular alvo do slot —
situação que fica mais alcançável à medida que mais condições entram no onboarding (ver
`docs/SESSAO_1_PERSONAL_20260903.md`) — `deterministicPick` (linha 921-925) não recusa o slot.
Preenche com **qualquer exercício do `safePool` inteiro, em ordem alfabética de `exercise_id`**,
sem relação nenhuma com o grupo muscular pedido, e marca `degraded: true`.

Esse `degraded` (por slot) e `degraded_slots` (booleano do plano) são calculados e devolvidos só
na resposta HTTP síncrona da function — **nunca são gravados no banco**. Como o client trata essa
chamada fire-and-forget (ninguém lê a resposta), o sinal existe por uma fração de segundo e se
perde pra sempre. Não é o mesmo badge de "degradação IA→determinístico" que já existe em
`UserDetail.jsx` (esse mede `ai_filled_slots`/`deterministic_fallback_slots`, persistido — outra
coisa, sobre se a IA ou o determinístico escolheu, não sobre se o músculo bate).

## Investigação (feita antes de propor correção, por pedido)

### 1. Quantos planos reais já entregues estão degradados: zero, dos 3 existentes

Só 3 profiles têm plano no banco hoje. Recomputei a lógica exata do gerador contra o estado real
de cada um:

| Profile | Nível | Ambiente | Condição declarada | `avoid` aplicável no nível dele | Degradou? |
|---|---|---|---|---|---|
| 386c4a52 | Iniciante | Academia | Lombar → `lumbar_hernia` (avoid) | **0 exercícios** — as 4 linhas de `avoid` pra `lumbar_hernia` estão todas em nível intermediário/avançado, nenhuma em iniciante | Não |
| 70ddc1f8 | Iniciante | Academia | Nenhuma | — | Não (sem filtro aplicado) |
| c1de7398 | Iniciante | Academia | Nenhuma | — | Não (sem filtro aplicado) |

Nenhum caso real bateu na condição de degradação até agora — não por o mecanismo estar seguro,
mas porque a única condição declarada num plano real (lombar) coincidentemente não intersecta o
catálogo de iniciante, e ambiente "academia" nunca restringe por equipamento. A base de teste é
pequena demais e o único dado real não expôs o bug — o risco identificado nas simulações de
combinação (`docs/SESSAO_1_PERSONAL_20260903.md`) continua de pé pra quando a base crescer ou as
7 condições novas entrarem no onboarding.

### 2. O fallback alfabético não é aleatório — é sempre o MESMO exercício por nível, e é sempre um agachamento

`exercise_id` segue o padrão `ex_NNN` (texto zero-padded), então ordenar por string ==
ordenar numericamente. O menor `exercise_id` de cada nível, hoje:

| Nível | `exercise_id` sentinela | Exercício |
|---|---|---|
| Iniciante | `ex_001` | **Agachamento livre** |
| Intermediário | `ex_003` | **Agachamento sumô isométrico** |
| Avançado | `ex_006` | **Agachamento frontal com kettlebell** |

Coincidência de cadastro: "Agachamento" começa com A, então squats dominam os `exercise_id`
mais baixos. **Todo slot que degradar puxa um agachamento**, não importa se o slot pedia
antebraço, peito ou o que for — sempre o mesmo exercício, sempre a mesma "resposta errada".
Isso É um sintoma detectável e barato de monitorar: qualquer plano com `ex_001` num slot cujo dia
não é de perna é candidato quase certo a degradação (a única exceção seria um dia de perna
legítimo escolher ex_001 pelo ranking normal — mas nesse caso o exercício bate com o contexto,
então não é falso positivo problemático).

### 3. Como o profissional vê isso hoje: não vê nada, a menos que reconheça o exercício de cabeça

Conferido em `UserPlan.jsx` (mesmo componente pro staff, pro aluno via `/plano/:token`, e pro
PDF): a tabela de exercícios mostra só **nome, séries, reps, descanso** — nenhuma tag de grupo
muscular por linha. O título do dia (`region_label_ptbr` + `muscle_groups_ptbr`) é um voto de
maioria calculado sobre TODOS os slots do dia (`buildPlanPayload.ts`, `dayCategoryCounts`) — um
único slot degradado num dia de 4-5 exercícios não muda a maioria, então o título do dia continua
dizendo "Superior" mesmo com um agachamento na lista.

**Não é impossível perceber — é possível só se o revisor souber de cabeça que "Agachamento livre"
é exercício de perna e notar que ele não pertence ali.** O sistema não dá nenhuma ajuda: sem tag,
sem cor, sem contagem, sem filtro. Mesmo padrão de silêncio já visto nos outros 4 fail-open deste
projeto (alérgeno não anunciado, filtro de restrição não fechado, `no_safe_exercises` sem aviso
ao aluno, gate de revisão nunca conectado) — a diferença é que aqui o dado ERRADO se parece com
dado certo, não é ausência de dado.

## Parecer sobre a alternativa (recusar o slot vs. preencher errado)

Concordo que persistir e tornar visível é necessário, mas sozinho não é suficiente — só ajuda
alguém a PERCEBER o problema depois que ele já está no plano entregue. A pergunta de fundo é se
o preenchimento errado deveria acontecer.

**Recomendo trocar o fallback puro-alfabético por dois estágios antes de aceitar preencher errado:**

1. **Hoje o fallback pula direto de "candidato exato pro grupo muscular" pra "qualquer exercício
   do pool inteiro"** — não existe estágio intermediário. Um fallback por **categoria ampla**
   (ex: "perna" em vez de "quadríceps" especificamente) resolveria a maior parte dos casos sem
   nunca precisar do pior cenário — a maioria das combinações que estressei nas simulações zera
   um grupo FINO (`adductors`, `hip_flexors`, `forearms`), mas a categoria ampla (perna, braço)
   quase sempre ainda tem opção.
2. **Só se mesmo a categoria ampla estiver vazia**, aí sim prefiro **pular o slot** (o dia fica
   com um exercício a menos) a preencher com algo do zero relacionado. Um dia com 4 exercícios
   coerentes é melhor treino — e mais honesto — que um dia com 5 onde 1 é ruído. Isso não é o
   mesmo que o `no_safe_exercises` que já existe (que mata o plano inteiro por impossibilidade
   total) — é uma recusa pontual, no nível do slot, plano continua sendo gerado.

Independente de qual estágio disparar, **persistir e mostrar continua obrigatório**: se o slot
foi pulado, o profissional precisa ver "faltou 1 exercício de perna aqui, sem opção segura pro
pool desse aluno" em vez de um dia silenciosamente mais curto sem explicação — senão vira um
sexto fail-open no lugar do quinto.

Isso é parecer, não plano dimensionado — proposta de correção com tamanho de implementação fica
pra quando houver decisão sobre qual dos dois caminhos (ou os dois) seguir.

## Decisão 2026-09-04: só o Estágio 2 (pular o slot)

Estágio 1 (categoria ampla) descartado — não existe hierarquia de músculo no schema
(`muscle_groups` é lista flat de 49 nomes) e reaproveitar `MUSCLE_CATEGORY_MAP` (4 baldes,
existe só pra rótulo de dia) repetiria o problema em escala menor: `forearms` cai no mesmo
balde `superior` que `chest`/`pectoralis_major` — trocaria antebraço por peitoral. Registrado
como armadilha de schema em `docs/ARMADILHAS_SCHEMA.md`. Construir uma hierarquia de verdade é
trabalho de curadoria clínica (sessão com o personal), não cabe agora.

## Desenho do Estágio 2 (pular slot) — pra revisão antes de implementar

**1. Persistência.** Coluna nova `training_plans.skipped_slots jsonb default '[]'`. Cada slot
pulado vira uma entrada:
```json
{
  "day_number": 2,
  "target_muscle_groups": ["forearms"],
  "condition_slugs": ["wrist_pain", "elbow_pain"],
  "mensagem": "Nenhum exercício seguro de Antebraço disponível dadas as condições declaradas."
}
```
Mesmo padrão já usado por `caution_warnings` (array jsonb, resolvido em `buildPlanPayload.ts`,
nunca em texto solto). `condition_slugs` fica registrado pra auditoria futura — permite
responder "por causa de qual condição esse slot sumiu" sem re-simular a geração.

**2. Visibilidade pro profissional.** `buildPlanPayload.ts` já resolve `caution_warnings` em
`day.adapted_note_ptbr` (badge âmbar no cabeçalho do dia). Mesmo mecanismo, badge separado:
`day.skipped_note_ptbr` = a `mensagem` acima, quando aquele dia tiver entrada em
`skipped_slots`. `UserPlan.jsx` já tem o padrão de badge amber no `day-head` (usado hoje pra
`adapted_note_ptbr`) — replicar pro caso de slot pulado. Resultado: quem abre o plano vê "Dia 2
— 4 exercícios" com um aviso ao lado, não precisa contar exercícios nem comparar com outros dias
pra perceber que falta algo.

**3. Piso.** `targetSlotsPerDay()` (index.ts:377-379) já usa `Math.max(3, ...)` — 3 é o piso que
o próprio sistema já respeita hoje pra cortar por duração, e **nenhum dia de nenhum plano
(molde ou gerado) já teve menos de 3 exercícios** (conferido: `count(*) < 3` por dia, zero
resultado). Recomendo reaproveitar esse mesmo piso: se pular slots levasse um dia a menos de 3
exercícios reais, esse dia não é mais um treino, é um problema de geração — trato como o
`no_safe_exercises` já trata hoje (recusa a geração inteira, `plan_generation_status='failed'`,
cai na mesma fila de `ybytu-admin-failed-plans`/retry que já existe). Não invento um terceiro
estado ("plano parcialmente ruim") — reaproveito a infraestrutura de falha que já existe,
em vez de construir uma nova. Entre 3 e o total do molde, o dia é entregue magro com o aviso do
item 2.

**Tamanho com esse desenho, sem estágio 1:** confirma a estimativa anterior de ~2-3h (migração +
gerador + payload + UserPlan.jsx + deploy de 3 functions + teste manual simulando um cenário que
realmente esvazia um grupo muscular).

## Busca do sintoma nos planos existentes — confirmado por 2 métodos

Recomputação direta da lógica do gerador: 0/3 planos reais degradados (o único perfil com
condição declarada tem `avoid` que só afeta níveis intermediário/avançado, e ele é iniciante).

Busca pelo sintoma (agachamento — `ex_001`/`ex_003`/`ex_006` ou nome `Agachamento%` — em dia
onde menos de 50% dos slots tocam músculo de perna): achou 2 candidatos, ambos no plano com
condição declarada. Inspeção mostrou **falso-positivo**: "Agachamento livre" aparece nas
posições 6-7 de um dia de push (peito/tríceps/ombro), repetido de forma idêntica em dois dias
diferentes do mesmo plano — padrão de "compound de perna fechando dia de empurrar", desenho de
molde legítimo (um fallback aleatório não repetiria a mesma posição/padrão entre dias).

**Os dois métodos concordam: 0/3.** O detector de sintoma por si só teve falso-positivo — pra
virar monitoramento confiável precisa também exigir "não repete o mesmo padrão em mais de um
dia do mesmo plano, fora de posição de compound-finisher (não nas últimas posições do dia)".

## Implementado e testado com dado real (2026-09-04)

Implementado exatamente o desenho acima: `training_plans.skipped_slots` (coluna nova),
`deterministicPick` pula em vez de preencher errado, piso de 3/dia reaproveitando
`no_safe_exercises`, e as duas mensagens (`mensagem_staff`/`mensagem_aluno`) resolvidas em
`buildPlanPayload.ts` conforme o `audience` de quem está lendo o plano.

**Texto das duas mensagens** (a pergunta era: profissional precisa saber o que fazer, aluno
precisa entender sem jargão):
- **Staff** — descreve E instrui: *"Nenhum exercício seguro de [grupo(s)] disponível dadas as
  condições físicas declaradas. Você pode adicionar um exercício manualmente no construtor se
  julgar seguro — a decisão é clínica."*
- **Aluno** — sem "slot"/"grupo-alvo", direto ao ponto: *"Este dia tem menos exercícios do que o
  normal porque as limitações físicas que você declarou restringiram as opções seguras de
  [grupo(s)]."* Optei por mostrar (não esconder) — decisão de transparência consistente com o
  resto desta sessão: silêncio já foi o problema 4 vezes antes, esconder do aluno por que o
  plano dele é mais curto teria sido o mesmo padrão de novo, só que num lugar novo.

**Teste ponta-a-ponta com dado real** (conta de teste descartável, criada e apagada na mesma
sessão — nunca conta real): usuário iniciante, ambiente casa-sem-equipamento, objetivo
emagrecimento/3 dias → molde real `tr_202`. Slot dia 2 posição 5 (`Rosca inversa`, alvo
`biceps_brachii`+`forearms`) só tem 1 exercício candidato nesse nível+ambiente
(`ex_194`); excluí temporariamente só esse 1 exercício via `avoid_health_conditions_ids`
(revertido depois) pra zerar o candidato do slot sem mexer em `exercise_condition_proposals`
(dado que o personal ainda vai revisar) nem em `onboarding_physical_conditions` (opções ainda
não aprovadas).

Resultado, chamando a function de geração de verdade (não simulação):
- Resposta da geração: `success: true`, `skipped_slots` com 1 entrada (dia 2, `biceps_brachii,
  forearms`).
- Banco: `training_plan_exercises` do dia 2 tem 5 linhas (posições 1,2,3,4,6 — **a posição 5
  realmente não existe**, não foi preenchida com nada).
- `training_plans.skipped_slots` persistido com as duas mensagens completas.
- Chamando `ybytu-get-plan-payload` (a mesma function que serve `/plano/:token`, o que o aluno
  vê) com um token de teste: `day.skipped_note_ptbr` veio com o texto do aluno, `exercises.length
  = 5`. Confirmado o caminho até a tela pública.
- Chamando `ybytu-get-plan-for-staff` com o usuário de teste (não-staff): **rejeitado com
  `403 not_staff`** — confirma que o controle de acesso separado staff/público
  (`[[project_staff_role_system_design]]`) continua íntegro; não testei a mensagem de staff
  renderizada ao vivo por não ter credencial de um staff real de teste à mão, mas o campo
  `mensagem_staff` persistido está correto e o código que escolhe entre as duas mensagens é o
  mesmo ternário de 3 linhas testado no lado do aluno.

Limpeza confirmada: usuário de teste, profile, plano, token e a exclusão temporária em `ex_194`
todos revertidos — `ex_194.avoid_health_conditions_ids` de volta a `['pregnancy']`, zero dado de
teste residual no banco.

Deployado: `ybytu-generate-training-plan`, `ybytu-get-plan-payload`, `ybytu-get-plan-for-staff`.
`UserPlan.jsx` commitado e no `main`.
