#!/usr/bin/env bash
# Uso: scripts/deploy-functions.sh [nome-da-function] [outras flags do supabase]
# Ex:  scripts/deploy-functions.sh ybytu-generate-training-plan
#      scripts/deploy-functions.sh                              # deploy de todas
#
# Substitui `npx supabase functions deploy` — nao um passo extra pra lembrar
# de rodar antes, o comando em si. Antes de deployar, recusa se:
#   1. o codigo da function (ou de _shared/, que toda function usa) tem
#      mudanca nao commitada
#   2. o commit que contem a versao atual do codigo nao chegou em origin/main
#      (commitado localmente mas nao empurrado tambem conta como "nao esta
#      no git" pra quem clona limpo)
#
# Motivo (2026-09-06): dois geradores de plano + o webhook do WhatsApp com
# validacao HMAC ficaram rodando em producao por 1-6 dias sem existir no
# repositorio -- descoberto so numa varredura manual de arquivos nao
# commitados, nao por nenhum aviso automatico. `supabase functions deploy`
# manda o que esta em disco, sem nunca checar se aquele disco tem relacao
# com o que esta versionado. Ver docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md.
#
# Bypass de emergencia (documentar o motivo pro time, nao usar em silencio):
#   ALLOW_DIRTY_DEPLOY=1 scripts/deploy-functions.sh <nome>

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FUNC_NAME=""
for arg in "$@"; do
  if [[ "$arg" != -* ]]; then
    FUNC_NAME="$arg"
    break
  fi
done

if [ -n "$FUNC_NAME" ]; then
  TARGET_PATHS=("supabase/functions/$FUNC_NAME" "supabase/functions/_shared")
  SCOPE_DESC="supabase/functions/$FUNC_NAME e supabase/functions/_shared (compartilhado por toda function)"
else
  TARGET_PATHS=("supabase/functions")
  SCOPE_DESC="supabase/functions (deploy sem nome = todas as functions)"
fi

if [ -n "$FUNC_NAME" ] && [ ! -d "supabase/functions/$FUNC_NAME" ]; then
  echo "ERRO: supabase/functions/$FUNC_NAME nao existe neste checkout." >&2
  exit 1
fi

# ── Checagem 1: working tree limpo no escopo ─────────────────────────────────
DIRTY=$(git status --porcelain -- "${TARGET_PATHS[@]}")
if [ -n "$DIRTY" ]; then
  echo "BLOQUEADO: ha mudanca nao commitada em $SCOPE_DESC:" >&2
  echo "$DIRTY" >&2
  echo >&2
  echo "Isto e exatamente o que aconteceu em 2026-09-06: codigo deployado que" >&2
  echo "nao existe no git. Commite (ou descarte) antes de deployar." >&2
  if [ "${ALLOW_DIRTY_DEPLOY:-0}" = "1" ]; then
    echo >&2
    echo "ALLOW_DIRTY_DEPLOY=1 setado -- prosseguindo mesmo assim." >&2
  else
    exit 1
  fi
fi

# ── Checagem 2: HEAD (o que vai ser deployado) ja chegou no remoto ──────────
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")
if [ -n "$UPSTREAM" ]; then
  UNPUSHED=$(git log "${UPSTREAM}..HEAD" --oneline -- "${TARGET_PATHS[@]}")
  if [ -n "$UNPUSHED" ]; then
    echo "BLOQUEADO: ha commit(s) tocando $SCOPE_DESC que ainda nao chegaram em $UPSTREAM:" >&2
    echo "$UNPUSHED" >&2
    echo >&2
    echo "Commitado local nao e commitado de verdade -- quem clonar de origin hoje" >&2
    echo "nao pega isto. De um 'git push' antes de deployar." >&2
    if [ "${ALLOW_DIRTY_DEPLOY:-0}" = "1" ]; then
      echo >&2
      echo "ALLOW_DIRTY_DEPLOY=1 setado -- prosseguindo mesmo assim." >&2
    else
      exit 1
    fi
  fi
else
  echo "AVISO: branch atual sem upstream configurado -- nao foi possivel checar se o commit foi empurrado." >&2
fi

# ── Checagem 3: template de e-mail sincronizado (só quando afeta essa function) ──
# ybytu-send-onboarding-email lê supabase/functions/ybytu-send-onboarding-email/
# template.html, que é uma cópia de deploy de emails/03-plano-em-preparacao.html
# (a fonte da verdade, versionada, fora do bundle da function). Deployar com
# as duas divergentes manda pro ar um e-mail diferente do que foi revisado.
if [ -z "$FUNC_NAME" ] || [ "$FUNC_NAME" = "ybytu-send-onboarding-email" ]; then
  "$REPO_ROOT/scripts/check-email-templates.sh"
fi

echo "OK: $SCOPE_DESC limpo e sincronizado com o remoto. Deployando..."
echo
exec npx supabase functions deploy "$@"
