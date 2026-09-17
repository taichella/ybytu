# Pós-piloto

Itens conscientemente adiados pra depois do piloto — não são bugs esquecidos,
são decisões de escopo registradas aqui pra não se perderem.

## Templates de e-mail (emails/) — revisão contra dado fabricado antes de ligar

9 dos 10 templates criados pelo Antigravity (`emails/01,02,04-10`, ver
`emails/README.md`) ainda não estão ligados a nenhuma function — são só design.
**Antes de ligar qualquer um deles**, repita a revisão que foi feita no `03`
(`03-plano-em-preparacao.html`, achado 2026-09-17): ele tinha uma barra de
progresso com percentual fixo ("Em andamento 65%") e um checklist ✓/⏳/○ que
não vinha de estado real nenhum — igual pra todo mundo, sempre. Mesmo padrão
de `docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md`. Foi removido e
substituído por uma lista de próximos passos sem estado nem percentual.

Checklist por template antes de ligar a uma function:
- [ ] Todo número/percentual/data visível tem uma variável real por trás, ou é texto fixo do design copiado sem revisão?
- [ ] Toda variável `{{ }}` do template tem uma coluna/consulta real de onde vir hoje? Se não tiver dado, a function deve recusar o envio e logar — nunca mandar `{{ variavel }}` literal pro destinatário (regra já aplicada no `03`, ver `ybytu-send-onboarding-email/index.ts`).
- [ ] Todo link/botão aponta pra uma URL que existe de verdade no produto? (`03` tinha um `{{ tracking_link }}` pra uma área logada que nunca existiu — removido.)
- [ ] O template foi embutido como string no `index.ts` da function (não lido do disco em runtime — `Deno.readTextFile` de asset bundlado deu 500 em produção, 2026-09-17), com um `scripts/check-<function>-templates.sh` no padrão de `scripts/check-email-templates.sh` chamado por `scripts/deploy-functions.sh`?

Templates pendentes dessa revisão: `01-confirmacao-conta`, `02-boas-vindas`,
`04-entrega-do-plano`, `05-desafio-15-dias`, `06-esqueci-senha`,
`07-senha-atualizada`, `08-convite-profissional`, `09-plano-aluno-a-validar`,
`10-plano-aluno-validado`.
