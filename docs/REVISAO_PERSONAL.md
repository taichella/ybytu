# Revisão Personal Trainer — Geração de Treinos Ybytu

## 1. Contexto (leia antes de tudo)

O Ybytu gera planos de treino automaticamente para os alunos. Parte da estrutura vem de
7 "moldes" (modelos) reais, feitos por vocês (personal trainers) há tempos — esses já
são curadoria de verdade e não estão em revisão aqui. O que precisa da sua aprovação é
tudo que foi **desenhado do zero pela equipe técnica**, sem um exercício-fonte real por
trás, para cobrir combinações que os moldes originais não cobriam (2, 5, 6 e 7 dias por
semana). Nada disso vai para o piloto sem seu aval — é literalmente a trava que a Taina
pediu.

Este documento não pressupõe que você conhece o sistema. Cada seção explica o "porquê"
antes do "o quê".

## 2. Os 4 splits novos (2, 5, 6, 7 dias) — pra você aprovar a estrutura

Hoje o sistema só tinha moldes reais para 3 e 4 dias por semana (mais um "3x foco
emagrecimento", "4x foco hipertrofia" etc — 7 moldes ao todo, `tr_201` a `tr_207`).
Quando o aluno pede 2, 5, 6 ou 7 dias no onboarding, o sistema precisa de uma estrutura
— e para 5 dias reaproveitamos o padrão dos moldes reais; para 2, 6 e 7 dias, desenhamos
do zero por padrão de movimento (não por "cópia" de nenhum molde existente).

### 2 dias — Full Body A/B
Desenho por padrão de movimento (agachar, empurrar, puxar, dobrar quadril), não por
grupo muscular isolado — é o que um full body de 2x/semana precisa cobrir em pouco
volume.

- **Dia A**: agachamento (composto) → empurrar horizontal peito/tríceps/ombro (composto)
  → puxar horizontal costas/bíceps (composto secundário) → dobrar quadril
  posterior/glúteo (composto secundário) → panturrilha (isolamento) → core.
- **Dia B**: dobrar quadril posterior/glúteo/costas (composto) → puxar vertical
  costas/dorsal/bíceps (composto) → empurrar vertical ombro/tríceps (composto
  secundário) → avanço quadríceps/glúteo (composto secundário) → bíceps (isolamento) →
  core.

### 5 dias — Upper/Lower repetido (REFORMULAÇÃO, não é desenho 100% novo)
Antes, os moldes de 5 dias (`tr_206`/`tr_207`) tinham um "dia 3" que misturava
condicionamento e core de um jeito que identificamos como **acidental** (parecia ter
entrado por engano na hora de montar o molde original, não desenho intencional).
Descartamos esse dia 3 e substituímos por uma repetição limpa: **U-L-U-L-U**, repetindo
os dias 1 (Upper/superior) e 2 (Lower/inferior) do próprio molde de 4 dias do mesmo
objetivo. Ou seja, os exercícios em si continuam sendo os curados originais — só a
sequência de 5 dias é nova (repetir U/L uma vez a mais na semana).
**Pergunta pra você**: o antigo dia 3 (condicionamento/core) deveria ter sido
intencional? Se sim, precisamos recuperá-lo em vez de descartar.

### 6 dias — Push/Pull/Legs ×2
Bloco push/pull/legs repetido duas vezes na semana (dias 1-3 e 4-6), mesma lógica de
repetição do padrão upper/lower que os moldes de 4 dias já usam.

- **Push**: peito/tríceps/ombro (composto) → ombro/tríceps (composto) → peito/ombro
  (composto secundário) → tríceps (isolamento) → ombro (isolamento).
- **Pull**: costas/bíceps/romboides (composto) → costas/dorsal/bíceps (composto) →
  costas/trapézio (composto secundário) → bíceps (isolamento).
- **Legs**: quadríceps/glúteo/posterior (composto) → quadríceps/glúteo/posterior
  (composto) → quadríceps (isolamento) → posterior de coxa (isolamento) → panturrilha
  (isolamento) → core.

### 7 dias — Push/Pull/Legs ×2 + 1 dia leve obrigatório
Os 6 primeiros dias são exatamente o split de 6 dias acima. O 7º dia é **sempre**
mobilidade/recuperação ativa, nunca treino pesado — decisão explícita da Taina: "7 dias"
no onboarding nunca deveria significar 7 dias de treino pesado sem descanso nenhum. Veja
a seção 4 sobre esse dia.

## 3. Matriz de séries/descanso por papel × objetivo (já em produção)

O sistema classifica cada exercício de um treino em um "papel" dentro do dia, e usa uma
matriz única de séries/descanso por papel — a MESMA matriz vale para os 4 objetivos
(emagrecimento, hipertrofia, condicionamento, rotina saudável). Isso veio de uma
mineração das 179 linhas dos 7 moldes reais em 2026-07-27.

| Papel | O que é | Séries | Descanso |
|---|---|---|---|
| Composto principal | Exercício-base do dia (ex: agachamento, supino, remada) | 3 | 60s (padrão) / 120s (hipertrofia) |
| Composto secundário | Segundo exercício composto do dia | 2 | 60s (padrão) / 120s (hipertrofia) |
| Isolamento | Exercício de isolamento (ex: rosca, tríceps testa) | 1 | 60s fixo, não muda com objetivo |
| Core | Abdominal | 3 | 45s fixo |
| Cardio | Esteira/corrida | 3 | 60s fixo |
| Leve/mobilidade (novo) | Dia 7 do split de 7 dias | 2 | 40s (proposta, sem dado real — ver seção 4) |

**Pergunta pra você**: essa matriz de séries/descanso está correta como curadoria única
pra todo objetivo? Foi confirmada batendo isolamento/core/cardio entre `tr_204`
(emagrecimento) e `tr_205` (hipertrofia) — só os compostos escalam descanso com o
objetivo. Se isso não fizer sentido pra você, é a hora de falar.

## 4. Reps NÃO são padronizadas hoje — e a Taina pediu pra padronizar

Aqui está uma inconsistência que achamos ao investigar o pedido da Taina de "cada
exercício ter UM valor de séries e UM de reps, sem variação":

- **Séries**: já são únicas por papel (tabela acima) — isso já é exatamente o que a
  Taina quer.
- **Reps**: **NÃO são únicas.** Para os splits de 3, 4 e 5 dias (que usam moldes reais),
  o número de reps de cada exercício vem herdado diretamente da linha curada do molde
  original — e isso varia exercício a exercício, mesmo dentro do mesmo papel. Exemplo
  real do banco, "Panturrilha no leg press 45" (sempre 1 série = isolamento):

  | Molde | Reps |
  |---|---|
  | tr_202 (emagrecimento, 3 dias) | 12 |
  | tr_203 (hipertrofia, 3 dias) | 25 e 20 (2 ocorrências diferentes no MESMO molde!) |
  | tr_204 (emagrecimento, 4 dias) | 20 |
  | tr_205 (hipertrofia, 5 dias) | 20 |
  | tr_206/tr_207 (5 dias) | 20 |

  Ou seja, mesmo exercício, mesmo papel (isolamento) — reps variando de 12 a 25.

  Só os splits novos (2, 6, 7 dias), que não têm exercício-fonte real, já usam um valor
  único por papel: composto = 12, isolamento = 15, core = 15, cardio = 12,
  leve/mobilidade = 12 (esse último ainda pendente da sua validação).

**O que precisa da sua decisão**: se a Taina quer reps 100% padronizado (um valor fixo
por papel, igual ao que sets já faz), isso é uma mudança de código — hoje os splits de
3/4/5 dias preservam a variação original dos moldes de propósito ("nunca reinventado").
Precisamos que você diga: **um valor de reps por papel × objetivo é aceitável
clinicamente** (ex: perde a diferenciação fina que talvez fizesse sentido pra um
exercício específico), ou a variação por exercício deveria continuar existindo em algum
grau?

## 5. Dia leve/mobilidade (split de 7 dias) — sem base empírica, proposta pura

Esse dia não existe em nenhum molde real hoje — é 100% desenho novo pra cobrir a decisão
da Taina de nunca deixar um plano de 7 dias ser 7 dias de treino pesado. A estrutura
proposta:

| Ordem | Foco | Papel | Reps (proposto) | Descanso (proposto) |
|---|---|---|---|---|
| 1 | Costas / mobilidade | leve_mobilidade | 12 | 40s |
| 2 | Quadril/flexores de quadril/glúteo / mobilidade | leve_mobilidade | 12 | 40s |
| 3 | Posterior de coxa/panturrilha / mobilidade | leve_mobilidade | 12 | 40s |
| 4 | Ombro / mobilidade | leve_mobilidade | 12 | 40s |
| 5 | Core / mobilidade | leve_mobilidade | 12 | 40s |

Todos os números aqui (reps=12, descanso=40s, os 5 focos escolhidos) são uma proposta da
equipe técnica, **não curadoria sua**. Precisamos que você valide se faz sentido
clinicamente antes de qualquer split de 7 dias ir para o piloto.

## 6. Panturrilha reclassificada

Os moldes de 4/5 dias guardavam panturrilha com 2 séries e descanso escalando com o
objetivo (tratada quase como um "composto"), enquanto os moldes de 3 dias já guardavam
como 1 série a 60s fixo. Normalizamos as duas versões para **isolamento** (1 série, 60s
fixo, sem variar com objetivo) — a classificação automática por número de séries já
resolveu isso sozinha, sem precisar de regra especial por nome.
**Pergunta pra você**: panturrilha como isolamento puro está correto, ou ela merece
tratamento de "quase-composto" como um dos moldes antigos sugeria?

## 7. Exercícios com músculo principal faltando ou errado

Isso não é sobre a estrutura dos treinos — é sobre a base de exercícios em si
(`exercises`, 298 linhas). Encontramos **exercícios duplicados pelo nome** (mesmo
exercício cadastrado 2x) onde as duas cópias têm `muscle_groups_ids` diferentes — e numa
delas falta o músculo principal do movimento. Isso é grave porque o gerador usa
`muscle_groups_ids` para decidir cobertura muscular do plano; se a cópia "errada" for
sorteada, o aluno recebe um treino que parece cobrir um grupo muscular que na prática
não está sendo puxado corretamente no relatório/planejamento.

| Exercício | Cópia correta (`muscle_groups_ids`) | Cópia com problema (`muscle_groups_ids`) | O que falta |
|---|---|---|---|
| Cadeira flexora | ex_081: hamstrings, glutes | **ex_050: glutes** (só) | Falta o posterior de coxa — o músculo que a cadeira flexora existe pra treinar |
| Mesa flexora | ex_087: hamstrings, glutes, core, stabilizers | **ex_078: glutes** (só) | Mesmo problema — falta posterior de coxa |
| Stiff com barra | ex_071: glutes, hamstrings | **ex_079: glutes** (só) | Falta posterior de coxa — stiff é um exercício clássico de posterior |
| Kettlebell swing | ex_082: hamstrings, glutes, quadriceps, core | **ex_054: glutes** (só) | Falta posterior de coxa, quadríceps e core |
| Deadlift com barra olímpica | ex_055: glutes, posterior_chain | ex_083: glutes (só) | Falta detalhamento de cadeia posterior (menos grave, `posterior_chain` cobre parcialmente) |
| Flexão de braço com pegada fechada | ex_216: triceps_brachii, chest, deltoids, core | **ex_194: biceps_brachii, chest, triceps_brachii, deltoids** | Inclui bíceps como alvo — fisiologicamente questionável num exercício de empurrar (push) |
| Wall ball | ex_013: quadriceps (só) | ex_285: full_body | As duas entradas descrevem o MESMO exercício de formas contraditórias — uma diz "só quadríceps", outra diz "corpo todo". Qual está certa? |

Esses são exatamente os "10 exercícios com músculo principal faltando" que você já tinha
sinalizado — confirmamos e localizamos os IDs exatos no banco pra correção.

## 8. Varredura NOVA — catálogo de exercícios (298 linhas), igual à de nutrição

Você pediu a mesma varredura que foi feita na nutrição: quantos exercícios têm
nome/instrução que não bate com `muscle_groups_ids`? Fizemos uma checagem automatizada
por palavra-chave no nome (ex: "supino" deveria sempre incluir peitoral;
"panturrilha" deveria sempre incluir "calves"), depois revisamos manualmente cada
resultado pra descartar falsos positivos do próprio script (ex: "crucifixo **inverso**"
é uma inversão do movimento — o script não entendia a palavra "inverso" e apontou como
erro um exercício que na verdade está certo).

**Resultado**: 298 exercícios verificados, 14 sinalizados pelo script, **9 eram falsos
positivos** (o script não entendeu contexto — "joelho no peito" não é peitoral, "leg
press" no nome de um exercício de panturrilha não é agachamento, "crucifixo inverso" não
é peitoral). Sobraram **5 casos reais**, e todos os 5 já estão listados na tabela da
seção 7 (cadeira flexora, mesa flexora, stiff com barra, kettlebell swing, deadlift).

**Achado adicional que não estava mapeado antes**: o catálogo tem **19 pares de
exercícios com o mesmo nome cadastrados duas vezes** (não 5 — bem mais do que
imaginávamos). Na maioria dos casos (14 pares) as duas cópias têm exatamente os mesmos
`muscle_groups_ids` — ou seja, são apenas registros duplicados sem prejuízo à
classificação (desperdício de espaço no catálogo, mas não gera plano errado). Nos outros
5 pares (seção 7) a duplicata carrega dado errado.

**Limitação que você deve saber**: essa varredura foi só por **nome**, com um dicionário
de palavras-chave que cobre os padrões mais comuns (supino, remada, rosca, tríceps,
desenvolvimento, agachamento, panturrilha, abdominal, glúteo, cardio). Não comparamos
`instruction_ptbr` (o texto do passo a passo) contra `muscle_groups_ids` linha a linha —
isso exigiria julgamento anatômico caso a caso que preferimos deixar pra você, em vez de
arriscar outro heurístico ruidoso feito por IA sem revisão (é literalmente o problema
que gerou a bagunça na nutrição). Se quiser, podemos gerar uma planilha com as 298
linhas completas (nome + instrução + músculos) pra você revisar por amostragem.

## 9. Lista de perguntas em aberto (resumo)

1. O split de 5 dias reformulado (U-L-U-L-U) está certo, ou o antigo dia 3 de
   condicionamento/core deveria ser recuperado?
2. A matriz de séries/descanso por papel (seção 3) está clinicamente correta pra todo
   objetivo?
3. Reps deveriam ser 100% padronizadas por papel (como sets já são), abandonando a
   variação por exercício herdada dos moldes originais?
4. O dia leve/mobilidade (seção 5) — os 5 focos, reps=12 e descanso=40s fazem sentido?
5. Panturrilha como isolamento puro está correto?
6. As correções da tabela da seção 7 — pode confirmar os valores certos de
   `muscle_groups_ids` pra cada um dos 5 casos?
7. Quer que geremos a planilha completa dos 298 exercícios pra revisão por amostragem
   (seção 8, limitação)?
