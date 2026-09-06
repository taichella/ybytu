# Decisão — Fase B: manter só o aviso, não implementar bloqueio (2026-09-03)

## Contexto

"Fase B" era o nome dado a um bloqueio automático planejado: refeição com ingrediente
`allergen_review_status='unreviewed'` não seria distribuída a nenhum aluno. Descoberto em
2026-09-03 que **isso nunca foi implementado** — nenhuma RPC de matching (`ybytu_match_meals`/
`ybytu_match_meal_plans`) lê `allergen_review_status`. Vários documentos em `docs/` tratavam
essa trava como fato consumado; todos corrigidos na mesma data (ver
`docs/SESSAO_1_NUTRICIONISTA_20260902.md` pro relato completo do achado).

Com o achado, a pergunta deixou de ser "quando terminamos de implementar a Fase B" e passou a
ser "ainda faz sentido implementar, agora que existe o badge de exibição ao vivo (deployado
2026-09-02)?".

## Decisão: manter só o aviso do badge. Não implementar bloqueio automático.

## Motivo

O bloqueio fazia sentido quando a alternativa era zero informação — sem exibição nenhuma,
impedir a entrega era a única forma de não servir alérgeno errado às cegas. Isso não é mais
verdade: o badge já entrega a informação real (ou a ausência honesta dela) direto pro aluno.

Bloquear agora trocaria um risco visível e corrigível por um invisível e pior pro produto. A
auditoria de cobertura de catálogo já mostrou que várias combinações de preferência × tipo de
refeição são frágeis — algumas com 1 opção ativa, uma com zero
(`docs/PEDIDO_RECEITAS_NUTRICIONISTA_LACUNAS_COBERTURA_20260901.md`). Um ingrediente comum
como azeite de oliva (9 refeições ativas) ficando `unreviewed` por mais um dia derrubaria 9
refeições do ar de uma vez — não por serem perigosas, por não terem sido revisadas ainda. Isso
cria pressão pra revisar rápido só pra destravar cobertura, o oposto do que a Sessão 1 tentou
construir (revisar com cuidado, sem prazo artificial).

O badge já faz o trabalho de segurança que importa — avisa quem precisa saber, no momento em
que precisa saber. Bloquear a mais seria proteção contra um risco que a exibição já cobre, ao
custo real de disponibilidade de cardápio.

## Meio-termo registrado como opção futura, não recomendação pra agora

Bloqueio **por aluno**, não por catálogo inteiro: quem declarou uma restrição específica não
recebe nada tageado com o token correspondente (`unreviewed` incluso), mas o resto do catálogo
circula normal pra quem não tem essa restrição. Resolveria o caso mais grave (aluno com
alergia real recebendo o que teme) sem penalizar quem não tem a restrição.

Não é o que a Fase B original propunha (que bloqueava globalmente) e é bem mais complexo de
construir — precisa cruzar a restrição declarada do usuário com o ingrediente no momento da
geração, não só olhar o status do alimento isoladamente. Registrado aqui caso o badge sozinho
se mostre insuficiente na prática, não como próximo passo definido.
