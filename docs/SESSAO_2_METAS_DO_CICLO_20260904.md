# Sessão 2 (bloco avulso) — texto de expectativa das Metas do Ciclo

Contexto: este texto aparece no documento do aluno (tela e PDF) — "Metas do Ciclo", uma frase fixa
por objetivo dizendo quando resultados costumam aparecer. Foi escrito e aprovado numa sessão de
2026-07-28, **antes de existir qualquer gate de revisão profissional na plataforma**. Achado
2026-09-04 corrigindo um bug de layout (o texto aparecia como título, invertido com o nome do
objetivo) — a correção de layout já foi feita e já está no ar; esta pergunta é só sobre o
conteúdo, não muda com a resposta.

**Não é urgente pro piloto** — o texto já está no ar há mais de um mês sem incidente relatado.
Fica pra sua próxima sessão, sem prazo.

Formato de resposta por linha: `[ ] Confirmo, mantém como está` ou `[ ] Ajustar: ____` (pode
reescrever a frase inteira, só trocar a janela de tempo, ou pedir remoção do número de semanas).

---

## Bloco 1 — Nutricionista (`weight_loss`)

| # | Texto atual | Janela | Sua decisão |
|---|---|---|---|
| 1 | Ajustes no peso corporal costumam começar a ser percebidos já nas primeiras 3 a 4 semanas de adesão consistente. | 3–4 semanas | [ ] Confirmo, mantém como está [ ] Ajustar: ____ |
| 2 | Resultados mais consolidados costumam aparecer a partir de 8 a 12 semanas. | 8–12 semanas | [ ] Confirmo, mantém como está [ ] Ajustar: ____ |

---

## Bloco 2 — Personal (`hypertrophy` + `conditioning`)

| # | Objetivo | Texto atual | Janela | Sua decisão |
|---|---|---|---|---|
| 1 | Ganhar massa muscular | Ganhos de força tendem a aparecer já nas primeiras 2 a 3 semanas. | 2–3 semanas | [ ] Confirmo, mantém como está [ ] Ajustar: ____ |
| 2 | Ganhar massa muscular | Mudanças visíveis de massa muscular costumam se consolidar a partir de 8 a 12 semanas de adesão consistente. | 8–12 semanas | [ ] Confirmo, mantém como está [ ] Ajustar: ____ |
| 3 | Melhorar o condicionamento físico | Melhoras de disposição e resistência costumam ser percebidas já nas primeiras 2 a 4 semanas de adesão consistente. | 2–4 semanas | [ ] Confirmo, mantém como está [ ] Ajustar: ____ |

---

## Bloco 3 — Nutricionista E Personal (`health_routine`)

Objetivo "Criar uma rotina saudável" toca os dois domínios (energia/sono/bem-estar são tanto
dietéticos quanto de treino) — os dois confirmam independentemente. Se divergirem, a frase fica
pendente até alinharem entre vocês.

| # | Texto atual | Janela | Decisão nutricionista | Decisão personal |
|---|---|---|---|---|
| 1 | Benefícios de uma rotina consistente — energia, sono, bem-estar — costumam aparecer já nas primeiras semanas. | primeiras semanas | [ ] Confirmo [ ] Ajustar: ____ | [ ] Confirmo [ ] Ajustar: ____ |
| 2 | Consolidação costuma ocorrer ao longo de 8 a 12 semanas. | 8–12 semanas | [ ] Confirmo [ ] Ajustar: ____ | [ ] Confirmo [ ] Ajustar: ____ |

---

**Fonte do texto atual:** `supabase/functions/_shared/buildPlanPayload.ts`, tabela
`CYCLE_EXPECTATIONS_BY_GOAL` (linhas 81–97). Qualquer ajuste aprovado aqui precisa ser aplicado
lá — texto fixo por objetivo, não por plano nem por aluno.
