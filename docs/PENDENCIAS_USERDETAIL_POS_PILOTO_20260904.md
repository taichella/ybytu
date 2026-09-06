# Pendências de UsuarioDetalhe.dc.html — adiadas para depois do piloto (2026-09-04)

Divergências entre a tela atual (`UserDetail.jsx`) e o design (`UsuarioDetalhe.dc.html`),
levantadas na comparação de 2026-09-04. Duas já foram corrigidas na mesma data (Metas do Ciclo
invertida, botão Editar flutuante movido pro card) — commit `5c32d7b3`, deployado. As três abaixo
ficam pra depois do piloto, com prioridades diferentes entre si.

## 1. Aderência (30 dias) no card "Plano Ativo" — grande, sem prazo definido

**O que falta:** porcentagem de aderência, barra de progresso, "X de Y treinos/registros" e
"Semana N de M" dentro de cada card de plano ativo — hoje não existe nenhum desses campos.

**Por que não é achado novo:** já confirmado por decisão anterior — adesão/streak precisa de
schema de rastreamento (treino/refeição concluído por dia) que não existe hoje, ver
`[[project_userdetail_design_gaps_product_decisions]]`. Esta entrada só reafirma o tamanho.

**Tamanho:** grande — infraestrutura de dado nova (tabela de conclusão de treino/refeição), não
reorganização de tela.

## 2. Badge "Desatualizado" no Documento do Aluno — pequena, fazer logo após o lançamento

**O que falta:** comparar quando o plano foi editado pela última vez contra quando o PDF foi
gerado pela última vez, e mostrar "Desatualizado"/"Alterado" quando divergir — a parte do mockup
que só precisa saber SE mudou, não precisa do arquivo em si.

**Tamanho: pequeno.** Dois passos: (1) `updated_at` em `training_plans` e `meal_plans` — hoje
nenhuma das duas tem essa coluna, confirmado via `information_schema.columns`; (2) uma linha por
evento de entrega (`user_id`, `entregue_em`, versão do treino e da nutrição naquele momento) pra
comparar contra o `updated_at` atual. Zero armazenamento de arquivo, zero decisão de produto —
puramente técnico. Prioridade: logo depois do lançamento, não é bloqueador de piloto mas é barato
o bastante pra não ficar pendurado muito tempo.

## 3. Congelar o payload no momento da entrega — decisão de responsabilidade, antes de ESCALAR o piloto

**O que falta:** guardar uma cópia do payload (o JSON que já alimenta a tela e o PDF, não o
arquivo binário) no momento em que o plano é efetivamente entregue ao aluno, pra poder mostrar
depois exatamente o que ele recebeu — mesmo que o plano tenha sido editado várias vezes desde
então.

**Por que pesa mais do que parece:** personal e nutricionista assinam parecer aprovando um plano
especifico. Sem um registro congelado do que foi entregue naquele momento, essa assinatura não
protege ninguém depois de uma edição — nem o aluno (que pode ter recebido algo diferente do que
foi aprovado), nem o profissional (que não tem como provar que aprovou o que foi de fato
enviado). Se houver reação alérgica ou lesão, hoje não existe forma de reconstruir o que o aluno
efetivamente recebeu — só o estado atual do plano, que pode já ter mudado. Isso pesa mais neste
produto do que num app de treino genérico, exatamente por causa do gate profissional que
construímos: a assinatura promete algo que o sistema hoje não consegue provar que foi cumprido.

**Tamanho: barato de construir** (o JSON já existe, é gravar uma cópia num evento — não é
decisão técnica difícil), **mas é decisão de responsabilidade, não de engenharia** — decide se
cada entrega vira registro permanente e quem tem acesso a ele.

**Prioridade: antes de ESCALAR o piloto, não antes de LANÇAR.** Com poucos alunos e
acompanhamento próximo, dá pra conviver sem isso por enquanto. Com volume, não — o intervalo
entre "algo deu errado" e "alguém percebeu" cresce, e é exatamente aí que a ausência desse
registro pesa.
