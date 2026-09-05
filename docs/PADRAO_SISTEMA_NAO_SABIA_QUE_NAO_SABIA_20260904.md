# Padrão: "o sistema não sabia que não sabia" (referência, não lição de moral)

Sete casos reais deste projeto, formas diferentes do mesmo bug: o sistema (ou a ferramenta usada
pra verificá-lo, caso 7) tinha um estado inválido, ausente ou incerto e serviu normal mesmo
assim, sem sinalizar nada. Nenhum foi achado por um mecanismo que o pegasse de graça — todos foram
achados por alguém desconfiar e ir olhar. Registrado pra decidir, no próximo projeto, onde vale
gastar esforço de arquitetura antes do primeiro bug em vez de depois do sétimo.

## 1. Refeições com ingrediente errado servidas sem sinal (nutrição)

**O quê:** 99 de 200 refeições ativas tinham o ingrediente errado no `ingredients_json` —
receita e instrução corretas, ingrediente trocado por um bug sistemático de carga (~10 padrões
de substituição consistentes, ex: cenoura→polenta em 12 refeições). Serviu normal pra qualquer
aluno que recebesse essas refeições, por tempo indeterminado antes de alguém notar.

**Custo pra achar:** auditoria externa comparando análise nutricional real contra o cardápio, mais
uma sessão inteira de análise de padrão só pra caracterizar o bug (ainda sem correção aplicada —
49.5% do catálogo desativado como contenção, não como conserto).

**Regra que teria evitado:** checagem de consistência automática na carga (ex: macros somados dos
ingredientes batendo com os macros declarados da refeição) teria pegado o padrão sistemático na
hora do load, não meses depois.

## 2. Alimento não revisado servido sem aviso (alérgeno)

**O quê:** `foods.allergen_review_status='unreviewed'` nunca bloqueou nada — nenhuma RPC de
matching lê essa coluna. Documentação interna ("Fase B") descrevia um bloqueio automático como
fato consumado; não existia. Descoberto só quando alguém foi ler o código da RPC em vez de
confiar no doc.

**Custo pra achar:** sessão completa de revisão nutricionista-por-nutricionista (57 decisões só
na fatia urgente, de 486 alimentos no catálogo) pra alcançar o nível de confiança que a
documentação já afirmava existir.

**Regra que teria evitado:** toda alegação de "o sistema bloqueia/protege contra X" devia ser um
teste executável (uma query ou teste de integração que afirma o bloqueio disparando), não uma
frase em doc — doc desatualiza, código não mente se você perguntar direto a ele.

## 3. Gerador de treino preenchia slot errado calado (degradação silenciosa)

**O quê:** quando não sobrava exercício seguro pro grupo muscular de um slot, o gerador preenchia
com o primeiro `exercise_id` em ordem alfabética do pool inteiro — sem relação nenhuma com o
slot — e computava `degraded: true`. Essa flag só existia na resposta HTTP síncrona de uma
function fire-and-forget que ninguém lê; nunca foi gravada no banco.

**Custo pra achar:** investigação deliberada + recomputar os 3 planos reais existentes pra
confirmar que nenhum tinha sido afetado ainda — sorte, não segurança.

**Regra que teria evitado:** todo código com uma flag `degraded`/`fallback`/`retry-exhausted`
precisa persistir essa flag em algo que um humano ou uma UI leia — uma flag computada e devolvida
numa resposta fire-and-forget é o mesmo que não computar nada.

## 4. Notificação de staff nunca disparou (2 onboardings reais)

**O quê:** gate client-side (`generationFailed`) impedia o disparo da notificação de staff
sempre que o client desistia de esperar o Gemini/Groq responder, mesmo quando o plano terminava
de gerar com sucesso no servidor. O "safety net" (cron de lembrete) também não cobria esse caso
exato: `.lt('plan_ready_notified_at', cutoff)` nunca bate linha com `NULL`.

**Custo pra achar:** 2 onboardings reais (Rayan Road, Camila Ozene) com zero notificação, achado
só comparando manualmente `plan_generation_status` contra `whatsapp_notifications` no banco.

**Regra que teria evitado:** todo comentário tipo "o cron pega isso depois" precisa ser checado
contra a cláusula `WHERE` real pro caso de coluna `NULL` — Postgres `<` nunca casa `NULL`, e "o
cron cobre" só é verdade se testado contra a forma exata da falha (nunca notificado, não só
notificado tarde).

## 5. Admin não conseguia registrar parecer (seletor de papel nunca renderizava)

**O quê:** backend passou a aceitar `admin` como equivalente a `personal`/`nutricionista` pra
assinar um parecer. O formulário só renderizava o seletor de papel quando `staff.roles` continha
os dois papéis ao mesmo tempo — nunca verdadeiro pra admin. Resultado: botão "Salvar Parecer"
sempre caía no alerta bloqueante, sem explicar por quê.

**Custo pra achar:** só foi achado logando como o admin real no dashboard ao vivo e andando o
fluxo — invisível em revisão de código porque a mudança de backend parecia completa sozinha.

**Regra que teria evitado:** uma mudança de permissão no backend não está pronta até alguém
exercitar de verdade pelo caminho de UI, como o papel que ganhou a permissão — revisão de diff
não enxerga um branch de UI que falta para um papel que ninguém testou.

## 6. Dado fabricado exibido como real (adesão, estatísticas, paginação) — pior que os outros cinco

**O quê:** `Users.jsx` tinha três formas de fabricação na mesma tela — `Math.random()`
recalculado a cada render na coluna de adesão (mesmo aluno mostrava número diferente a cada
reload), faixa de estatísticas do topo hardcoded (números de exemplo do mockup, nunca trocados
por dado real), e paginação decorativa (controles sem `onClick`, a tabela renderizava tudo sem
fatiar). `Login.jsx` tinha o mesmo tipo de resíduo — "1.4k alimentos" no painel de marca, uma
afirmação falsa sobre o catálogo real (486 alimentos).

**Por que é pior que os outros cinco, não só mais um caso:** os cinco anteriores escondiam
informação — o sistema sabia menos do que aparentava e ficava em silêncio sobre isso. Este
inventa — o sistema não tinha o dado e mostrou um número convincente no lugar. Silêncio deixa
espaço pra alguém desconfiar; fabricação convincente não deixa.

**Custo pra achar:** comparação sistemática de cada tela contra o mockup de origem, perguntando
"esse valor exibido tem uma fonte real por trás?" pra cada elemento — não apareceu por acidente
numa investigação de outro bug, foi achado só porque essa pergunta foi feita tela por tela.

**Regra que teria evitado:** todo valor copiado de um mockup pra virar código de produção precisa
ser substituído por dado real ou por um estado vazio explícito no mesmo commit que liga a tela ao
backend — nunca ficar como está "só até plugar o dado depois", porque depois é quando vira
invisível.

## 7. Zero linha retornada lida como "sem problema" em vez de "a consulta não rodou" — a versão mais barata do padrão, e a mais fácil de repetir

**O quê:** verificando o plano da Marina contra alergênicos, rodei duas queries manuais fazendo
`JOIN meal_plan_meals m ON m.meal_id = mpm.meal_id`. `meal_plan_meals.meal_id`, nesse plano gerado
por IA, guarda o UUID de `meals.id` — não o código texto `meal_XXX` que o nome da coluna sugere
(landmine já documentada em `buildPlanPayload.ts`, que faz o join certo). As duas queries
retornaram zero linhas, e eu reportei isso como "Verificação A passa" e "Verificação B
inconclusiva" — sem notar que o `JOIN` não tinha casado uma linha sequer. Não era "nenhuma
refeição com soja"; era "a comparação nunca aconteceu".

**Por que é a versão mais barata e mais fácil de repetir:** os outros seis casos exigiam ler
código de produção, uma view, ou testar um fluxo inteiro. Este acontece em qualquer query ad hoc
de verificação, a qualquer momento, sem precisar de nenhum bug de sistema por trás — só precisa
que o `JOIN` esteja errado e que ninguém confira se ele bateu linha nenhuma antes de confiar no
resultado. É o mesmo padrão dos outros seis, só que na ferramenta de quem está caçando os outros
seis, não no sistema sendo caçado.

**Custo pra achar:** descoberto por acidente, rodando uma query auxiliar que expôs os IDs crus e
mostrando que eram UUID, não código — não por suspeitar da query original.

**Regra que teria evitado:** toda verificação que espera "zero linhas = passou" precisa antes
confirmar que o `JOIN`/filtro tem candidatos pra achar — rodar o `COUNT(*)` sem a condição extra
primeiro, ou pelo menos olhar 1-2 linhas cruas antes de aplicar o filtro que vai zerar o
resultado. Um `JOIN` que não bate nada e um `JOIN` que bate tudo e filtra tudo fora produzem a
mesma saída (zero linhas) — e só um dos dois significa o que a pessoa lendo o resultado vai achar
que significa.

## Técnicas de detecção reutilizáveis

Duas técnicas usadas pra achar o caso 6, worth carregar pro próximo projeto:

**1. Literal cru vs. variável interpolada — não depende de ninguém confessar.** Dado real em JSX
sempre aparece como `{variavel}`; dado copiado de mockup fica como texto solto entre tags
(`>76%<`, `>12.450<`). Buscar por número/percentual formatado como texto puro (não dentro de
`{}`) numa tela que deveria ter dado dinâmico é uma forma barata de achar fabricação que ninguém
comentou — não exige o autor original ter deixado pista nenhuma, só que o número seja grande ou
formatado o bastante pra "parecer" estatística.

**2. Perguntar, por elemento, "essa tela bate com o design porque tem dado real, ou porque
ninguém trocou o exemplo do mockup?"** — é a pergunta que separa "implementação completa" de
"implementação que só parece completa". Rodar essa pergunta tela por tela contra os mockups de
origem é mais confiável que qualquer grep, porque não depende do formato da fabricação — rastreia
a origem do valor, não a aparência dele.

**3. Antes de confiar num "zero linhas" de verificação, confirmar que o `JOIN`/filtro tinha
candidato pra achar.** Rodar o `COUNT(*)` sem a condição que está sendo testada, ou olhar 1-2
linhas cruas do lado bruto do `JOIN`, antes de aplicar o filtro que zera o resultado. Existe
`JOIN` errado que não bate nenhuma linha (parece "passou", na real não rodou) e `JOIN` certo que
bate tudo e filtra tudo fora (passou de verdade) — os dois produzem a mesma saída visível.

**Limitação conhecida, registrada pra não confiar demais na primeira técnica:** ela só pega
fabricação numérica formatada. Não pega fabricação em prosa — nome de revisor de exemplo, data de
exemplo, depoimento de exemplo que ficou no código — porque não há regex que distinga "nome real"
de "nome de mockup" pela forma. Esse tipo só é pego pela segunda técnica (rastrear a origem de
cada valor, tela por tela), nunca por varredura automática.

## O fio comum

Em nenhum dos cinco o problema era falta de cuidado pontual — era ausência de um mecanismo que
tornasse o silêncio ruidoso: teste executável em vez de comentário/doc, campo persistido em vez
de valor descartado numa resposta que ninguém lê, cláusula SQL verificada contra o caso `NULL`
real, UI exercitada de verdade pelo papel que ganhou a permissão. O custo de construir esse
mecanismo na hora certa é sempre menor que o custo de descobrir por acidente meses depois.
