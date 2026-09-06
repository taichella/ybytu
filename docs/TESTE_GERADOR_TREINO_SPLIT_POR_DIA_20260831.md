# Teste ao vivo do split por dia — gerador de treino (2026-08-31 / 2026-09-01)

Resposta pra "por que a IA às vezes não roda no treino". Onboarding real pelo formulário
(`ybytu.app/onboarding-pre-lancamento/`), perfil de 6 dias/semana de treino — escolhido
de propósito por ser o pior caso (mais dias = mais chamadas Groq na mesma janela de 60s).

## Resumo — antes e depois

| | Antes (2026-08-31) | Depois (2026-09-01) |
|---|---|---|
| Treino — IA / determinístico | 18/30 (60%) | **30/30 (100%)** |
| Nutrição — IA / determinístico | 30/30 | 30/30 |
| 429 observados | 2 (Dia 3, Dia 6) | **0** |
| Tempo treino (desde o perfil) | +55.4s | +58.9s |
| Itens fora do catálogo | 0/30 | 0/30 |

**Causa raiz corrigida:** o Groq reserva `prompt_tokens + max_completion_tokens` contra o
teto de TPM no MOMENTO do envio, não o uso real depois. `max_completion_tokens` estava em
1200 mas a resposta real nunca passou de 322 tokens — pagando ~4x o necessário em toda
chamada. Isso, mais o backoff fixo (não lia o `retry-after` real do Groq, que variou 2-16s
observado), produziu as colisões. As duas correções de backend eliminaram o problema
**sozinhas** — o teste "depois" rodou com o client ainda em `Promise.all` (a 3ª mudança,
serializar nutrição→treino, está implementada no arquivo mas não publicada — o WordPress
é colado manualmente, ver nota no final).

## Teste "antes" (2026-08-31)

**18 de 30 slots vieram de IA (60%), 12 caíram no determinístico (40%).** Granular por
dia, não tudo-ou-nada: Dia 1, 2, 4 e 5 tiveram sucesso; Dia 3 e Dia 6 caíram inteiros pro
determinístico depois de esgotar as 3 tentativas.

**Nutrição:** 30 de 30 slots via IA (100%) — a chamada de nutrição é uma só, com prompt
bem menor, e não colide como o treino.

## Os dois 429 reais, texto exato

```
Dia 3: DEBUG_ERROR: Groq overloaded: {"message":"Rate limit reached for model
`openai/gpt-oss-20b` in organization `org_01m124s1ppef0v4ygfgzssc4wb` service tier
`on_demand` on tokens per minute (TPM): Limit 8000, Used 6469, Requested 2737. Please
try again in 9.045s. Need more tokens? Upgrade to Dev Tier today at
https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}

Dia 6: DEBUG_ERROR: Groq overloaded: {"message":"Rate limit reached for model
`openai/gpt-oss-20b`... Used 6460, Requested 2737. Please try again in 8.9775s...",
"code":"rate_limit_exceeded"}
```

Capturado via debug temporário reintroduzido em `ai_reasoning` (mesmo padrão já usado
antes nesta mesma investigação) — deployado, testado, revertido e redeployado depois.
Código de produção não tem esse debug.

## Tempos

| Evento | Timestamp UTC | Delta |
|---|---|---|
| Perfil criado (form enviado) | 21:11:26.875 | — |
| Plano de nutrição pronto | 21:11:40.651 | +13.8s |
| Plano de treino pronto | 21:12:22.302 | +55.4s (desde o perfil) |

Bem abaixo do limite duro de 150s do Supabase Edge Functions — mesmo com 2 dias
esgotando 3 tentativas cada (backoff de até 9s entre elas).

## Contrato arquitetural — íntegro

```sql
select count(*) as total, count(*) filter (where e.exercise_id is null) as not_in_catalog
from training_plan_exercises tpe left join exercises e on e.exercise_id = tpe.exercise_id
where tpe.training_plan_id = (select training_plan_id from training_plans where id='790dd80f-94a3-479e-8e0e-2d18df7c9759');
-- total=30, not_in_catalog=0
```

**Zero exercícios fora do catálogo**, misturando slots de IA e determinístico. `sets_detail`
gravado nas 30 linhas, `load_kg` null em todas as 64 séries — nenhuma carga inventada. A
IA só escolhe dentro da lista de candidatos daquele slot específico (garantido em código,
`filledSlots` só aceita `aiPick` se está em `slot.candidates`); não valida isso via SQL
porque os candidatos por slot não são persistidos, mas o resultado bate.

## Apêndice — investigação complementar (mesmo dia, perfil de teste)

Depois do teste acima, medi 3 números adicionais com uma segunda rodada de debug
temporário (headers HTTP + `usage` da resposta do Groq, também já revertido):

**1. O retry hoje NÃO lê o `retry-after` real do Groq.** O código usa backoff fixo
(`attempt * 3000` = 3s, 6s) independente do que a API pede. Headers reais capturados:
`retry-after` variou entre **2s e 16s** ao longo de 9 tentativas em 3 dias que colidiram.
Em pelo menos 5 dessas 9, o backoff fixo era menor que o `retry-after` real — a tentativa
seguinte ainda caía dentro da janela saturada.

**2. Tokens reais por chamada** (campo `usage` da resposta Groq, não estimativa):
- Treino, por dia: prompt 980–1537, completion 244–322, **total 1302–1781** tokens.
- Nutrição, chamada única: prompt 3318, completion 295, **total 3613** tokens.
- O rate limiter do Groq reserva `prompt_tokens + max_completion_tokens` (1200) contra
  o teto no momento do envio, não o uso real após completar — confirmado batendo
  `remaining-tokens` observado com a conta exata (8000 − (3318+1200) = 3482, valor visto
  no header logo após a chamada de nutrição).
- Um plano de treino de 6 dias sozinho, sem nutrição nenhuma competindo, já soma
  ~14.700 tokens reservados se as 6 chamadas saírem em menos de 60s — quase o dobro do
  teto. Até 3 dias cabem com folga total mesmo com toda a reserva; a partir do 4º dia já
  há risco, mesmo sem qualquer disputa com a nutrição.

**3. Tempo serializado (nutrição termina, treino começa depois) — estimativa, não
medição direta**, porque hoje o client dispara as duas chamadas em paralelo
(`Promise.all` em `OnboardingPreLaunch.html`) e eu não implementei a versão sequencial:
nutrição sozinha (sem disputa) ≈ 1–3s; treino depois, com o teto livre nos primeiros
dias mas ainda sujeito a colidir consigo mesmo a partir do 4º dia (ver ponto 2) ≈ 25–35s.
Total estimado ≈ 27–38s, folgado dentro dos 150s mesmo dobrando a margem.

## As três correções aplicadas (2026-09-01)

1. **`max_completion_tokens`: 1200 → 500** nas duas functions
   (`ybytu-generate-training-plan`, `ybytu-generate-meal-plan`). Confirmado antes de
   aplicar: nenhuma resposta legítima já registrada chegou perto de 1200 — máximo real
   medido foi 322 tokens (completion). 500 dá ~55% de margem sobre esse máximo.
2. **`retry-after` real do header**, em vez do backoff fixo `attempt * 3000`, nas duas
   functions — mesmo código, mesmo ponto onde o `rate_limit_exceeded` é tratado.
3. **Serialização no client** (`OnboardingPreLaunch.html`): nutrição primeiro, `await`
   completo, só depois dispara o treino — trocado o `Promise.all` por duas chamadas
   sequenciais. **Editado no repositório, mas NÃO publicado** — o WordPress recebe esse
   arquivo colado manualmente, sem deploy automático. O teste "depois" abaixo rodou
   ainda com o `Promise.all` antigo ao vivo.

### Cálculo prévio (pedido antes de aplicar): mudança 1 sozinha cabe no teto?

Usando os prompts reais medidos (não estimativa): nutrição 3318+500=3818; treino 6 dias
a ~1300 de prompt médio, 6×(1300+500)=10800. Total paralelo ≈ 14618, **83% acima do teto
de 8000** — não cabe só com a mudança 1, mesmo no cenário mais favorável (6×(980+500) =
8880 só de treino, já estoura sozinho). Confirmado antes de implementar: dependia mesmo
das outras duas.

## Teste "depois" (2026-09-01) — mesmo perfil pesado

Onboarding real novo, mesmas escolhas do teste "antes" (6 dias, academia, iniciante,
5 refeições/dia, emagrecer) — conta nova (`auditoria.retry.31ago@ybytu.app`) pra não
reusar o perfil anterior.

**Resultado: 30 de 30 slots via IA no treino (100%), 0 no determinístico. Zero 429
observado no resultado final.** Nutrição também 30/30. Isso com o client ainda
disparando as duas chamadas em paralelo (mudança 3 não publicada).

| Evento | Timestamp UTC | Delta |
|---|---|---|
| Perfil criado | 07:09:06.964 | — |
| Plano de nutrição pronto | 07:09:12.585 | +5.6s |
| Plano de treino pronto | 07:10:05.831 | +58.9s (desde o perfil) |

### 🔴 Correção sobre este teste — a margem é menor do que 30/30 sugere

**Não confirmo mais "as mudanças 1+2 sozinhas eliminaram a colisão".** O tempo não bate
com isso: nutrição (1 chamada, sem disputa) levou 5.6s; treino (6 chamadas sequenciais,
"bem-sucedidas") levou **53.2s**. Se as 6 tivessem saído de primeira sem nenhum 429, o
esperado seria ~10-20s (Groq responde em <1s por chamada, código já documenta isso). A
diferença de ~35-45s só se explica por espera de `retry-after` acontecendo **dentro** de
tentativas que no fim contam como sucesso — o código só grava o resultado final, não
marca quando uma chamada precisou de 2ª ou 3ª tentativa, então essa espera fica invisível
no dado agregado.

**Não tenho os timestamps por chamada de dia desta rodada específica** (o debug granular
de headers/`retry-after` já tinha sido revertido antes deste teste) — não dá pra provar
com precisão cirúrgica, mas a aritmética do tempo total sustenta a leitura: o retry-after
correto (mudança 2) está absorvendo colisões reais, não evitando que elas aconteçam. Se
o Groq responder mais rápido num dia (menos tempo de rede = chamadas mais próximas no
tempo = a janela deslizante de 60s tem menos chance de liberar espaço entre uma e
outra), as mesmas 3 tentativas podem não bastar. **A serialização (mudança 3) deixa de
ser reforço opcional — é o que tira a disputa nutrição-vs-treino do caminho crítico de
verdade, em vez de depender de recuperação.**

**Contrato arquitetural, reconfirmado:**
```sql
select count(*) as total, count(*) filter (where e.exercise_id is null) as not_in_catalog
from training_plan_exercises tpe left join exercises e on e.exercise_id = tpe.exercise_id
where tpe.training_plan_id = (select training_plan_id from training_plans where id='7589286f-ccc6-4ecd-a4c8-85a572e38bcd');
-- total=30, not_in_catalog=0
```
Zero itens fora do catálogo, `sets_detail` gravado nas 30 linhas (64 séries), `load_kg`
null em todas — nada mudou aqui, como esperado (as 3 correções não tocam nessa parte).

### O que ainda falta pra fechar

A mudança 3 (serialização) não foi exercitada ao vivo — precisa que alguém cole o
`OnboardingPreLaunch.html` atualizado no WordPress (trecho exato preparado à parte).
Depois da publicação: teste com **dois onboardings simultâneos** (o cenário normal de
lançamento, não caso extremo — com `Promise.all` ainda no client, 4 fluxos disputam a
mesma janela). Esse teste é o que efetivamente fecha o item — o 30/30 de hoje mostrou
que o sistema se recupera de colisão, não que ela parou de acontecer.
