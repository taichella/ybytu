# Backup do banco — piloto no plano Free

**Status em 2026-09-22: PROPOSTA, não agendado.** O workflow existe em
`.github/workflows/backup-db.yml`, mas só dispara manualmente (aba Actions), sem `schedule:`.
Falta: a Taina criar os 6 secrets (lista abaixo) e rodar uma vez manualmente para validar de
verdade; só depois disso o `schedule:` é ligado. Teste de restauração real ainda não foi feito —
ver seção "O que falta" no fim.

## Por que existe

O piloto continua no plano Free do Supabase durante esta fase (decisão da Taina, 2026-09-21).
O Free não tem backup automático da Supabase (ver `ROLLBACK_PILOTO.md`, seção "Backup do banco
inteiro" — `supabase backups list` devolve `backups: []`, sem PITR). Sem isso, qualquer erro
humano ou bug de UPDATE/DELETE sem WHERE é irreversível.

## O que é

Um GitHub Action diário que:
1. Faz `supabase db dump` de **esquema**, **dados** (`public` + `auth`) e **roles** contra o
   banco de produção, via `SUPABASE_DB_URL` (Session Pooler, porta 5432 — a porta do pooler de
   transação, 6543, quebra o `pg_dump`; [confirmado na documentação da
   Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)).
2. Confere que os 3 arquivos não são um "sucesso" vazio (`scripts/backup/validate-dump.sh`):
   tamanho mínimo e presença de `public.profiles`/`auth.users` no schema e no data dump.
3. Empacota os 3 num `.tar`, confere o conteúdo do tar.
4. Criptografa com [`age`](https://github.com/FiloSottile/age) usando só a **chave pública**
   (nunca a privada, que fica só com a Taina, fora do GitHub).
5. Envia pro R2, num bucket **privado**, separado do bucket público de vídeos/miniaturas,
   prefixo `daily/`; aos domingos, também copia pra `weekly/` (mesmo arquivo, sem gerar dump de
   novo).
6. Confere que o objeto chegou ao R2 com o tamanho certo (`head-object`).
7. Aplica a retenção: mantém os 7 `daily/` e os 4 `weekly/` mais recentes, apaga o resto
   (`scripts/backup/prune-r2.sh`).
8. **Se qualquer passo acima falhar**, abre uma issue no GitHub (label `backup-failure`,
   `GITHUB_TOKEN` padrão, sem secret extra) com o link do log — ou comenta na issue já aberta,
   pra não empilhar uma por dia se ficar quebrado. Nunca falha em silêncio: um passo que não
   roda por erro anterior falha o job inteiro (`set -euo pipefail` em cada step).

Horário proposto: `0 2 * * *` (UTC) ≈ 03h/04h em Paris, pouco uso.

## Por que `age` e não `gpg`

`age` com par de chaves assimétrico: o GitHub só guarda a chave **pública** (inofensiva se
vazar — só permite criptografar, não descriptografar). Com `gpg` simétrico, o segredo que
descriptografa teria que existir como secret no GitHub, ou seja, qualquer vazamento de secrets
do repositório exporia os backups. Com `age`, mesmo isso não bastaria.

## Secrets que a Taina precisa criar (GitHub → Settings → Secrets and variables → Actions)

Nomes exatos — a Claude nunca vê nem registra os valores, só os nomes abaixo:

| Secret | O que é | Onde pegar |
|---|---|---|
| `SUPABASE_DB_URL` | Connection string do **Session Pooler** (porta 5432) | Supabase → Project Settings → Database → Connection string (a aba/opção que a própria tela indica pra ferramentas como `pg_dump`/migrações, não a de "Transaction pooler" porta 6543) |
| `BACKUP_AGE_PUBLIC_KEY` | Chave pública `age` (começa com `age1...`) | Gerar uma vez: `age-keygen -o chave-privada-backup.txt` (instala com `choco install age` ou baixa o binário). O comando imprime a chave pública no terminal — copia só essa linha pro secret. **A chave PRIVADA (o arquivo `.txt`) nunca vai pro GitHub nem pra Claude** — guarda num gerenciador de senhas ou local seguro; sem ela, nenhum backup se restaura. |
| `R2_BACKUP_ACCOUNT_ID` | Account ID da Cloudflare | Cloudflare Dashboard → R2 → o ID aparece na URL/overview |
| `R2_BACKUP_ACCESS_KEY_ID` | Access key de um token do R2 | Cloudflare → R2 → Manage API tokens → criar um token novo, com permissão **só no bucket privado de backup** (não reusar o token do bucket público de vídeos — se ele vazar, não deve dar acesso aos backups) |
| `R2_BACKUP_SECRET_ACCESS_KEY` | Secret key do mesmo token | Mesma tela, aparece uma vez só na criação |
| `R2_BACKUP_BUCKET` | Nome do bucket privado novo | Criar um bucket R2 novo, ex. `ybytu-db-backups` — **privado**, sem domínio público habilitado |

Nenhum destes é o mesmo token/bucket já usado pros vídeos — criar tudo novo, escopado.

## Como restaurar

**Espaço em disco:** o Docker Desktop e os dumps/backups locais ficam em `E:\` (`E:\DockerData` e
`E:\ybytu-backups`, movidos de C: em 2026-09-22 porque o disco C: da máquina de desenvolvimento ficou sem espaço
livre). Manter assim — não apontar de volta pro C:.

**Teste local (não toca produção), quando o Docker estiver ligado:**
```bash
scripts/backup/restore-local.sh ybytu-backup-20260922-020000.tar.age chave-privada-backup.txt
```
Isso decripta, extrai, sobe um Postgres 17 descartável em container, restaura roles → schema →
dados, e mostra contagens de tabelas-chave pra conferir contra o esperado do dia do dump. O
container e os arquivos temporários são removidos no fim (`trap cleanup EXIT`), com ou sem erro.

**Restauração de verdade num projeto Supabase novo** (cenário de desastre — perda do projeto
atual): mesmos passos 1-2 do script acima (decriptar, extrair) e então usar
`supabase db push`/`psql` contra o `SUPABASE_DB_URL` do projeto novo, na ordem
`roles.sql` → `schema.sql` → `data.sql`. Fazer isso **sempre** num projeto novo/vazio, nunca
sobrepor um projeto com dados reais sem confirmar antes com a Taina.

## Retenção e o que ela cobre

7 backups diários (última semana) + 4 semanais (último mês) = no pior caso, até ~5 semanas de
distância entre o backup mais antigo disponível e hoje. Não é um PITR (não recupera "o estado
exato 3 horas atrás") — é recuperação de desastre (banco perdido, corrompido, ou erro grave
percebido dias depois).

## O que falta (2026-09-22)

- **Secrets**: nenhum criado ainda — a Taina cria, a Claude nunca vê os valores.
- **Primeira rodada manual**: só depois dos secrets existirem, disparar
  `workflow_dispatch` uma vez e conferir que os 8 passos completam.
- **Teste real de restauração**: não foi possível fazer agora — depende de Docker (mesmo
  bloqueio do dump manual completo, ver `ROLLBACK_PILOTO.md`). Planejado para junto da sessão em
  que a Taina ligar o Docker para o dump manual do `piloto-v1.0`: usar esse mesmo dump real para
  rodar `restore-local.sh` de ponta a ponta e confirmar as contagens.
- **Ligar o `schedule:`**: só depois dos dois itens acima passarem.
