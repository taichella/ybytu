# Encerramento — Sessão 1 (revisão de alergênicos + regras do personal)

**Data:** 2026-09-13. Quem retomar isso daqui a um mês: este documento é o resumo, os detalhes
técnicos e o histórico de decisão estão nos documentos linkados abaixo, não precisa reconstruir a
conversa.

---

## O que foi revisado e aplicado

### Seção A — Nutricionista (`docs/SESSAO_1_NUTRICIONISTA_PARA_ENVIO_20260905.md`)

Aplicada em produção 2026-09-13 (backup `foods_backup_20260904`/`food_restriction_tags_backup_20260904`,
2026-09-13 15:04:56 UTC). Script: `scripts/aplicacao_sessao1_20260904.sql`.

- **42 alimentos revisados:** 31 confirmados sem alergênico, 3 confirmados com alergênico (Bacon de
  peru + Peito de peru defumado = soja; Hambúrguer vegetal = soja/trigo/glúten), 5 registrados como
  `pendente_dado` (ver seção própria abaixo).
- **12 alimentos com alergênico em disputa** (Bloco 4): cadastro original confirmado como correto
  nos 12 — a segunda fonte externa que propunha remover tinha viés documentado de errar mais pra
  remover alergênico que deveria estar do que adicionar um que faltava.
- **`food_420` Whey:** mantido `soy` no cadastro (decisão tomada 2026-09-12, parecer preliminar sem
  CRN — ver nota de proveniência abaixo).
- **Piso mínimo de proteína:** decidido 20g padrão / 15g piloto / 10g piso absoluto — decisão
  registrada, **ainda não implementada em código** (fica pra quando essa mudança entrar em pauta).
- **Coco:** token `'coco'` e opção "Sem Coco" criados no onboarding (2026-09-13, SQL separado —
  `scripts/coco_token_e_opcao_onboarding_20260913.sql`), **`tree_nuts` nos 7 produtos de coco
  permanece intocado**. Nenhuma proteção existente foi removida.

**Números (verificados ao vivo, não estimados):**

| Métrica | Antes | Depois |
|---|---|---|
| Alimentos `unreviewed` (catálogo inteiro) | 232 | **195** |
| Refeições ativas com ingrediente não verificado | 82 | **18** |
| Refeições que passaram a mostrar alergênico real (não mais "não verificado") | — | **64** |

**Proveniência:** toda a Seção A roda sobre **parecer preliminar sem validação de CRN** — decisão
de aplicar mesmo assim tomada pela Taina, registrada no cabeçalho do script. Isso não muda até a
sessão 2 com a nutricionista real.

### Seção B — Personal (`docs/SESSAO_1_PERSONAL_PARA_ENVIO_20260905.md`)

Aplicada em produção 2026-09-13 (script `scripts/aplicacao_sessao1_secao_b_personal_20260913.sql`,
rodado separado da Seção A — ver nota técnica abaixo).

- **9 correções de `muscle_groups_ids`** (catálogo de exercícios) — 5 cópias incompletas
  confirmadas + 2 pares de duplicata (Flexão de braço pegada fechada, Wall ball) resolvidos por
  julgamento clínico do personal, aplicados nos dois `exercise_id` de cada par.
- **12 das 13 regras de caution/avoid confirmadas como `caution`**, incluindo a Regra 8 (dor no
  joelho, agachamento com carga) = Aviso. Regra 7 (`joint_problems_severe`) segue de fora,
  pendente da separação staff/aluno em `caution_warnings` (ver
  `docs/DEBITO_AVISO_STAFF_ONLY_CAUTION_20260906.md`).
- **14 opções de condição física no onboarding** (7 novas + 7 já existentes) — sem isso, 9 das 13
  regras não tinham nenhum aluno capaz de declarar a condição correspondente.

**Verificação pós-aplicação:** zero exercícios promovidos a `avoid` nesta rodada, zero alunos
expostos (nenhum plano ativo continha exercício recém-contraindicado).

---

## O que ficou pendente, e por quê

- **195 alimentos ainda `unreviewed`** — fora do escopo desta sessão de propósito: são os que não
  aparecem em nenhuma refeição ativa hoje (baixa urgência) ou fazem parte do lote maior de revisão
  completa do catálogo (486 alimentos), que é trabalho de uma próxima sessão, não descuido.
- **5 alimentos em `pendente_dado`** (Colágeno hidrolisado, Salgadinho de pacote, Purê de abóbora,
  Molho de tomate caseiro, Guacamole) — resposta honesta de "não dá pra saber com o dado que existe
  hoje", registrada com motivo em `foods_pendencia_dados_20260904`. Ficam **`unreviewed`** até:
  - Colágeno/Salgadinho: dado de fornecedor (fonte animal, versão do produto) — não tem como
    resolver sem contato com o fabricante.
  - Purê de abóbora/Molho de tomate/Guacamole: a receita usada de fato (leva laticínio ou não) —
    resolve com uma pergunta direta pra nutricionista ou o `ingredients_json` da receita, se um dia
    existir estrutura pra isso (hoje `foods` não tem essa coluna, só `meals` tem).
- **Coco como castanha:** decisão de manter `tree_nuts` fica pra sessão 2, com a nutricionista real
  — é a única decisão desta sessão que teria removido uma proteção existente, e por isso não foi
  tomada sem revisão clínica de verdade (mesmo com o token novo já cobrindo quem precisa declarar
  alergia isolada a coco).
- **Gap de cobertura pescetariano × café da manhã** (0 opções ativas) — já documentado desde
  2026-09-01 (`docs/PEDIDO_RECEITAS_NUTRICIONISTA_LACUNAS_COBERTURA_20260901.md`), não é novo, não
  foi causado por esta sessão, é questão de variedade de cardápio, não de segurança.
- **Regra 7 (`joint_problems_severe`)** — 40 exercícios afetados, decisão do personal foi "não
  promove a exclusão, mas o aviso deve ir só pro staff, não pro aluno" — isso não é nenhuma das
  opções que o script suporta hoje. Pendente até `caution_warnings` ganhar a mesma separação
  staff/aluno que `skipped_slots` já tem.
- **Piso mínimo de proteína (20g/15g/10g)** — decidido, não implementado em código ainda.

## Achados técnicos registrados durante a sessão (não relacionados à revisão em si)

- **Bug real corrigido no mesmo turno:** o `UPDATE` de `muscle_groups_ids` da Seção B gravava uuid
  em vez de slug texto por alguns minutos — hotfix aplicado e verificado
  (`scripts/hotfix_muscle_groups_ids_uuid_bug_20260913.sql`).
- **Achado sobre a ferramenta de execução:** `supabase db query --file` trata cada arquivo como uma
  única string multi-statement — um erro em qualquer ponto pula todo o resto sem tentar rodar, não
  só desfaz. Por isso a Seção A e a Seção B rodam como arquivos/invocações separadas, nunca juntas
  no mesmo arquivo enquanto uma das duas ainda pode ter placeholder pendente. Documentado em
  `[[feedback_db_access_via_supabase_cli]]`.
- **Merge do Antigravity revisado e integrado** (65 arquivos) — nenhuma correção recente foi
  revertida (resolver R2, paginação, badge de alérgeno, aviso de slot pulado, resumo de grupos
  musculares, todos intactos). `/campaign` e `/campaign/failed-plans` tiveram o gate de tela
  corrigido pra bater com o desenho já documentado no backend (visão operacional aberta a todo
  staff, não admin-only).
- **`docs/MODELO_DE_DADOS.md` corrigido** — descrevia um bloqueio automático de ingrediente
  `unreviewed` que não existe (mesmo mito já corrigido nos documentos da Sessão 1 antes).
- **Duplicação de templates de e-mail resolvida** — `ybytu-pwa-admin/emails/` é a pasta oficial.
- **Confirmação de e-mail no cadastro:** decisão de manter desligada, e por quê (ver
  `docs/PENDENCIAS_POS_PILOTO_20260913.md`).

## Documentos relevantes desta sessão

- `docs/SESSAO_1_NUTRICIONISTA_PARA_ENVIO_20260905.md` — enviado à nutricionista, aguardando resposta
- `docs/SESSAO_1_PERSONAL_PARA_ENVIO_20260905.md` — respondido e aplicado
- `docs/PENDENCIAS_POS_PILOTO_20260913.md` — confirmação de e-mail + fallback de WhatsApp
- `docs/DEBITO_AVISO_STAFF_ONLY_CAUTION_20260906.md` — Regra 7 e separação staff/aluno
- `docs/PEDIDO_RECEITAS_NUTRICIONISTA_LACUNAS_COBERTURA_20260901.md` — gap pescetariano/café-da-manhã
