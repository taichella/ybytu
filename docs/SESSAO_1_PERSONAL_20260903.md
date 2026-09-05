# Sessão 1 — o mínimo pra o piloto sair (personal trainer, 2026-09-03)

**Este é o documento técnico interno.** A versão efetivamente enviada ao personal, em linguagem
simples e sem termos do sistema, é `docs/SESSAO_1_PERSONAL_PARA_ENVIO_20260905.md` — é ela que
tem as respostas dele quando chegarem. Use este aqui pra justificativa técnica e achados de ação
nossa; não aplique respostas do personal comparando com este documento, ele nunca viu este texto.

## Se ele não responder

**Isso não é revisão de qualidade opcional.** Hoje, 13 regras de segurança geradas por IA
(seção "Cautions gerados por IA" abaixo) estão em produção **sem nenhuma revisão humana**. São
elas que decidem o texto de aviso que o aluno lê no plano — "você reportou X, os exercícios
abaixo pedem atenção" — pra quem declarar dor/lesão no onboarding. Enquanto ele não confirmar ou
corrigir cada regra, o app segue publicando esse texto pra aluno real sem ninguém do time clínico
ter olhado. Não tem posição neutra aqui: ficar como está *é* uma decisão (manter tudo como
`caution`), só que tomada por default, não por julgamento.

Mesmo formato e critério da Sessão 1 da nutricionista: só entra aqui o que tem consequência
real se não for resolvido antes do piloto. Tudo o mais do `docs/REVISAO_PERSONAL.md` (splits
de 2/6/7 dias, matriz de séries/descanso, reps não-padronizadas, dia leve/mobilidade,
panturrilha) já está em produção sem incidente relatado — ausência de aval formal é dívida de
governança, não risco ativo. Fica pra sessão 2, sem urgência.

## O que já está correto (não é o que ele precisa julgar)

Pra ele não procurar problema onde não há — a arquitetura de segurança está certa, o que falta
é julgamento clínico sobre as 13 regras, não conserto de mecanismo:

- **O filtro de `avoid` funciona de verdade.** Confirmado em código e testado com dado real:
  exercício marcado `avoid` pra uma condição é **removido do pool de candidatos antes de montar
  o plano** (`ybytu-generate-training-plan/index.ts:853-864`) — nunca chega a ser considerado,
  não é um aviso que aparece por cima. O texto de `caution` é atrelado ao exercício exato que
  entrou no plano, não é um aviso genérico solto na tela.
- **O gerador recusa em vez de degradar.** Se depois de aplicar nível + ambiente + equipamento +
  condições não sobrar nenhum exercício seguro pra montar um slot, o gerador **não monta um
  plano incompleto ou arriscado** — ele falha explicitamente (`no_safe_exercises`,
  `index.ts:869-878`) em vez de preencher com o que sobrou. (Existe um bug separado, já registrado
  na seção final deste documento, de o app não avisar o aluno quando isso acontece — mas o
  gerador em si não engana ninguém entregando plano ruim calado.)

Isso não faz parte desta sessão porque já está correto.

**Tamanho final da sessão: 20 decisões objetivas + 1 pergunta de contexto.** 7 confirmações de
`muscle_groups_ids` (cópia errada no catálogo, seção abaixo) + 13 confirmações de regra de
caution/avoid (não 323 — a IA aplicou 13 regras em lote, seção mais abaixo). Cada linha das duas
tabelas é sim/não/corrige, sem exigir leitura de exercício por exercício. Estimativa: 20–25 min.

## Por que os 7 exercícios abaixo entram, e os outros achados não

`muscle_groups_ids` errado não é rótulo cosmético — o gerador usa esse campo pra decidir quais
exercícios **entram na lista de candidatos** de um slot (`ybytu-generate-training-plan/
index.ts:622-624`: um exercício com zero interseção com o músculo-alvo do slot é **removido**
da lista, não só rankeado pior). Um exercício com `muscle_groups_ids` faltando o músculo
primário pode desaparecer de onde deveria aparecer, ou aparecer rankeado errado num lugar que
não é o dele. Consequência real na composição do treino de qualquer aluno que sortear a cópia
errada.

## Os 7 casos — confirme os valores corretos

Cada exercício tem duas entradas no catálogo com o mesmo nome; uma tem `muscle_groups_ids`
completo, a outra está faltando músculo(s). Formato de resposta por linha: confirmar que a
coluna "Correto" está certa, ou corrigir.

| Exercício | `exercise_id` com problema | Tem hoje | `exercise_id` correto | Tem (referência) | Confirma? |
|---|---|---|---|---|---|
| Cadeira flexora | `ex_050` | `glutes` | `ex_081` | `hamstrings, glutes` | [ ] Sim [ ] Outro: ____ |
| Mesa flexora | `ex_078` | `glutes` | `ex_087` | `hamstrings, glutes, core, stabilizers` | [ ] Sim [ ] Outro: ____ |
| Stiff com barra | `ex_079` | `glutes` | `ex_071` | `glutes, hamstrings` | [ ] Sim [ ] Outro: ____ |
| Kettlebell swing | `ex_054` | `glutes` | `ex_082` | `hamstrings, glutes, quadriceps, core` | [ ] Sim [ ] Outro: ____ |
| Deadlift com barra olímpica | `ex_083` | `glutes` | `ex_055` | `glutes, posterior_chain` | [ ] Sim [ ] Outro: ____ |
| Flexão de braço com pegada fechada | `ex_194` | `biceps_brachii, chest, triceps_brachii, deltoids` | `ex_216` | `triceps_brachii, chest, deltoids, core` | [ ] `ex_216` está certo [ ] `ex_194` está certo [ ] Nenhum dos dois, correto é: ____ |
| Wall ball | `ex_013` | `quadriceps` | `ex_285` | `full_body` | [ ] `ex_285` está certo [ ] `ex_013` está certo [ ] Nenhum dos dois, correto é: ____ |

Os 5 primeiros são o mesmo padrão claro (cópia errada falta o músculo posterior/primário,
provável corte-colar incompleto no cadastro). Os 2 últimos são divergência real de opinião
(pegada fechada de flexão trabalha bíceps ou não? Wall ball é isolado de quadríceps ou corpo
inteiro?) — pedem seu julgamento, não só confirmação de cópia.

## Cautions gerados por IA sem revisão — 13 regras, não 323 casos

`exercise_condition_proposals` tem 323 linhas com `status='ai_suggested'`, nunca revisadas por
humano, já ativas em produção (entram em `exercise_effective_cautions`, a view que o gerador lê
ao vivo). Parece grande, mas a IA não avaliou 323 exercícios um a um — ela aplicou **13 regras
clínicas** (`rule_id` R1–R12, uma delas dividida em duas condições) a um lote de exercícios
cada. Revisar é confirmar ou corrigir a regra, não cada exercício.

**A pergunta central não é "esse aviso está certo". É "algum desses deveria ser exclusão
(`avoid`) em vez de aviso brando (`caution`)".** Hoje as 323 são todas `caution` — aparecem como
aviso no plano, mas o exercício continua entrando. Se a IA classificou como caution algo que
devia ser avoid, o aluno recebe um aviso brando onde deveria não ver o exercício. Ninguém
checou isso ainda. É o modo de falha perigoso — o oposto (`caution` virar `avoid`
desnecessariamente) só deixa o plano mais conservador, sem risco pro aluno.

Pra cada regra abaixo: **confirmar como está (`caution`), promover pra exclusão (`avoid`), ou
ajustar o texto do aviso.**

---
### ⚠️ COMECE POR AQUI — linha 7

**A própria IA escreveu a palavra "contraindicados" e mesmo assim salvou a regra como `caution`,
não `avoid`.** Texto completo gerado pela IA para `joint_problems_severe` (artrite grave/prótese
articular, 40 exercícios, incluindo agachamento com barra, levantamento terra, press militar):

> "Artrite grave/prótese articular: impacto e compressão axial **contraindicados** em
> articulação comprometida"

Contraindicado é uma palavra clínica com significado específico — "não fazer", não "fazer com
cuidado". A regra que a IA mesma escreveu contradiz a classificação que ela mesma aplicou. Não é
leitura nossa nem interpretação — é o texto salvo na coluna `clinical_reason` da própria
proposta. Esta é a linha com maior chance de precisar virar `avoid` na sessão.
---

| # | Condição | Regra clínica (texto da IA) | Afeta | Exemplos | Alcançável hoje? | Sua decisão |
|---|---|---|---|---|---|---|
| 1 | Dor no tornozelo (`ankle_pain`) | Impacto ao aterrissar: estresse no ligamento lateral e tendão de Aquiles | 19 exercícios | Box Jump, Burpee, Pular corda, Salto de sapo | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 2 | Dor no tornozelo (`ankle_pain`) | Plantiflexão repetida sob carga: sobrecarga do tendão de Aquiles | 16 exercícios | Elevação de panturrilha no Smith, Corrida em inclinação, Step-up no degrau, Panturrilha no Leg Press | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 3 | Dor no cotovelo (`elbow_pain`) | Flexão/extensão repetida do cotovelo sob carga: epicondilite | 35 exercícios | Rosca direta com barra, Tríceps testa com barra, Rosca Scott com barra W, Tríceps francês com halteres | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |
| 4 | Dor na virilha (`groin_pain`) | Abdução/adução sob carga: tensão em adutores e ligamentos inguinais | 8 exercícios | Sumô Deadlift com barra, Agachamento sumô isométrico, Cossack squat, Abdução em pé com miniband | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |
| 5 | Lesão no isquiotibial (`hamstring_injury`) | Fase eccêntrica do hip hinge: **risco de re-ruptura em lesão ativa** | 22 exercícios | Levantamento terra romeno, Stiff com barra, Good morning com barra, Sumô Deadlift com halteres | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |
| 6 | Dor no quadril (`hip_pain`) | Contração forçada do iliopsoas: agrava tendinite/impingement (FAI) | 17 exercícios | Elevação de pernas deitado, Dead bug, GHD Sit-up, Joelho no peito na barra | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |
| 7 | Problemas articulares graves (`joint_problems_severe`) | Artrite grave/prótese: impacto e compressão axial **contraindicados** | 40 exercícios | Agachamento com barra, Levantamento terra, Press militar com barra, Burpee | **Não** ⚠ ver acima | [ ] Caution ok [ ] Promover a avoid: ____ |
| 8 | Dor no joelho (`knee_pain`) | Flexão do joelho sob carga: compressão femoropatelar (padrão squat/lunge) | 15 exercícios (6 já marcados prioridade alta pela própria IA: Box Squat) | Back Squat, Box Squat com barra ⚠, Avanço reverso com halteres, Front squat com barra olímpica | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 9 | Dor no joelho (`knee_pain`) | Impacto ao aterrissar (2–8× peso corporal): estresse em meniscos/ligamentos | 15 exercícios | Box Jump, Burpee, Pular corda, Salto de sapo | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 10 | Dor lombar (`lumbar_pain`) | Carga axial + flexão lombar: lombalgia mecânica, discopatia | 30 exercícios | Levantamento terra, Back Squat, Good morning com barra, Stiff com barra | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 11 | Dor no pescoço (`neck_pain`) | Carga axial cervical ao pressionar acima da cabeça | 10 exercícios | Press militar com barra, Desenvolvimento com halteres, Arnold press, Push press com barra | Sim | [ ] Caution ok [ ] Promover a avoid: ____ |
| 12 | Assoalho pélvico (`pelvic_floor_issues`) | Impacto e/ou pressão intra-abdominal: incontinência, prolapso, pós-parto | **64 exercícios** | Levantamento terra, Back Squat, Burpee, GHD Sit-up | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |
| 13 | Dor no punho (`wrist_pain`) | Extensão forçada do pulso sob peso corporal | 32 exercícios | Flexão de braço tradicional, Prancha frontal, Burpee com push-up, Push-up explosivo com palmas | **Não** | [ ] Caution ok [ ] Promover a avoid: ____ |

### "Alcançável hoje?" — o que essa coluna significa, e por que não muda a prioridade da linha 7

A tela de onboarding que captura limitação física
(`apps/OnboardingPreLaunch.html`, etapa `physical_conditions`) pergunta:

> **"Possui alguma dor ou limitação física?"** (múltipla escolha)
> Opções: Joelho · Lombar (Costas) · Ombro · Pescoço · Tornozelo · Outra limitação · Nenhuma

São só **7 opções**, lidas dinamicamente da tabela `onboarding_physical_conditions` — não é uma
lista fixa no HTML, é o que a tabela tiver. Delas, só 4 alimentam alguma das 13 regras acima
(joelho→`knee_pain`, lombar→`lumbar_pain`, tornozelo→`ankle_pain`, pescoço→`neck_pain`). As
outras 7 regras — cotovelo, virilha, **isquiotibial**, quadril, **problemas articulares graves**,
assoalho pélvico, punho — não têm opção correspondente no formulário. "Outra limitação" é
texto livre que não mapeia pra nenhum slug (`physical_condition_exercise_slugs` não tem ponte
pra `other`). Resultado: **218 dos 323 avisos (67%) não podem ser gerados por nenhum aluno real
hoje**, porque não existe como declarar a condição que os dispararia.

Isso não muda a prioridade da linha 7 — o catálogo já está escrito, a contradição já existe, e
o dado (`joint_problems_severe`) certamente é candidato a onboarding futuro (a tabela
`physical_conditions` já tem as 16 condições completas prontas, incluindo essa; só a pergunta ao
aluno ainda não pergunta por 9 delas). Quando essa pergunta for adicionada — o que parece ser o
plano, dado que o vocabulário já existe pronto no banco — as 218 passam a valer instantaneamente,
sem deploy de código novo. Revisar agora evita que a lacuna clínica chegue destravada junto com
a lacuna de produto.

**Sobre a linha 5 (isquiotibial) especificamente**: como "lesão no isquiotibial" não é opção do
formulário hoje, não dá pra confirmar se a intenção (quando a pergunta existir) é capturar lesão
**ativa/recente** ou **histórico remoto** — a pergunta em si ainda não foi desenhada. "Risco de
re-ruptura em lesão ativa" (texto da IA) só faz sentido clinicamente pra lesão ativa; se a
pergunta futura vier a incluir gente com lesão antiga e já reabilitada, `caution` genérico pra
todo mundo que marcar essa opção pode estar certo ou errado dependendo de como a pergunta for
redigida. Vale o personal já deixar registrado **como a pergunta deveria ser feita** (ex:
"lesão ativa/recente" vs. "histórico de lesão") pra quando o onboarding for estendido — não dá
pra responder isso só pela regra de caution, tem que voltar a decisão pro desenho da pergunta.

**Linha 12 (assoalho pélvico) mistura duas intensidades numa regra só**: levantamento de carga
pesada (deadlift, agachamento) e exercícios de impacto/pliometria (burpee, pular corda) têm
mecanismos de risco diferentes, mas caem na mesma regra `R11` com o mesmo texto. Pode fazer
sentido dividir em duas: uma pra carga axial pesada, outra pra impacto.

### Assoalho pélvico: sobra treino suficiente se virar exclusão?

Rodei a simulação de pool vazio (mesma lógica que já existe no gerador pra recusar por falta de
exercício seguro) supondo o cenário mais restritivo possível: **todos os 64 exercícios da linha
12 promovidos a `avoid`**, cruzado com o pior nível/ambiente do catálogo (iniciante +
peso-corporal-apenas, sem equipamento — o combo com menos exercícios disponíveis, hoje 27 no
total).

**Resultado: não esvazia.** Nesse pior cenário, 7 dos 27 exercícios (26%) saem — sobram 20,
distribuídos pelos grupos musculares sem nenhum grupo zerado (abdominal, por exemplo, tem 3
hoje, perde 1, fica com 2). No nível iniciante inteiro (todos os equipamentos combinados: 48
exercícios), perderia 9, sobrando 39. Não há hoje nenhuma combinação de nível/ambiente onde
promover os 64 a `avoid` deixaria o pool vazio ou um grupo muscular sem opção.

**Conclusão prática:** pode promover a linha 12 pra `avoid` sem medo de gerar plano vazio pro
aluno com essa condição — o catálogo aguenta. Isso não responde se a regra deveria mesmo ser
avoid (isso ainda é decisão clínica do personal), só remove "vai quebrar o plano" da equação.

## Extra: confirme os rótulos das 7 opções novas de onboarding

Achado de 2026-09-03/04: a pergunta de onboarding "Possui alguma dor ou limitação física?" só
oferece 7 das 16 condições que já existem em `physical_conditions` — exatamente as 7 que
alimentam as regras 3, 4, 5, 6, 7, 12, 13 desta sessão (cotovelo, virilha, posterior de
coxa/isquiotibial, quadril, problemas articulares graves, assoalho pélvico, punho) não têm
opção no formulário hoje. Ninguém consegue declará-las, então nenhuma dessas 7 regras dispara
pra aluno nenhum. SQL de expansão já preparado (não executado):
`docs/SQL_EXPANSAO_ONBOARDING_PHYSICAL_CONDITIONS_20260904.sql`.

Proposta de rótulo curto (mesmo padrão de "Joelho", "Tornozelo"), pra você confirmar ou trocar:

| Regra | `condition_slug` | Rótulo proposto | Confirma? |
|---|---|---|---|
| 3 | `elbow_pain` | Cotovelo | [ ] Confirma [ ] Outro: ____ |
| 13 | `wrist_pain` | Punho | [ ] Confirma [ ] Outro: ____ |
| 6 | `hip_pain` | Quadril | [ ] Confirma [ ] Outro: ____ |
| 4 | `groin_pain` | Virilha | [ ] Confirma [ ] Outro: ____ |
| 5 | `hamstring_injury` | Posterior de coxa | [ ] Confirma [ ] Outro: ____ |
| 7 | `joint_problems_severe` | Problemas articulares graves | [ ] Confirma [ ] Outro: ____ |
| 12 | `pelvic_floor_issues` | Assoalho pélvico | [ ] Confirma [ ] Outro: ____ |

"Posterior de coxa" foi escolhido no lugar de "Isquiotibial" por comunicar melhor pra leigo — se
discordar, diga o termo que preferir. A ordem de exibição na tela também está aberta: não existe
critério herdado das 7 opções atuais (elas seguem só ordem de cadastro original, sem lógica
anatômica), então agrupei por região do corpo nas 7 novas — mude se fizer mais sentido pra você.

## Fora da Sessão 1, mas registrado pra ação nossa (não é pergunta pra você)

**Achado ao verificar o fluxo:** quando o gerador recusa por `no_safe_exercises` (combinação de
nível/ambiente/equipamento/condição física restritiva demais pra achar exercício seguro), o
aluno completa o onboarding, é redirecionado pro WhatsApp normalmente, e **não recebe plano
nenhum sem nenhuma mensagem explicando** (`apps/OnboardingPreLaunch.html:597-619` ignora o
`success:false` da resposta e segue o fluxo como se tivesse dado certo). É correção de código,
não pergunta pra você — mas registrado aqui porque é o mesmo tipo de "silêncio em vez de aviso"
que motivou o badge da nutrição, do lado do treino.
