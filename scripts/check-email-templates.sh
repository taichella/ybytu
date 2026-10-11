#!/usr/bin/env bash
# Uso: scripts/check-email-templates.sh
#
# Compara emails/03-plano-em-preparacao.html (fonte da verdade, versionada)
# contra o HTML embutido em
# supabase/functions/ybytu-send-onboarding-email/index.ts (entre os
# marcadores TEMPLATE_HTML_START/END). Normaliza CRLF->LF antes de comparar
# (checkout Windows usa CRLF, git blob guarda LF -- mesma pegadinha do
# Caso 8/CRLF nos outros scripts).
#
# Embutido como string, não lido do disco em runtime: Deno.readTextFile de
# um arquivo bundlado deu 500 em produção (achado 2026-09-17 -- o bundler
# do deploy do Supabase não inclui .html como asset legível em runtime).
# Sai com erro se as duas divergirem -- reproduzir a duplicata "cópia
# desatualizada, ninguém percebeu" seria o mesmo padrão do achado de
# 2026-09-13 (10 templates de e-mail em duas cópias, uma delas esquecida).
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SOURCE="emails/03-plano-em-preparacao.html"
FUNCTION_FILE="supabase/functions/ybytu-send-onboarding-email/index.ts"

if [ ! -f "$SOURCE" ]; then
  echo "ERRO: $SOURCE não existe." >&2
  exit 1
fi
if [ ! -f "$FUNCTION_FILE" ]; then
  echo "ERRO: $FUNCTION_FILE não existe." >&2
  exit 1
fi

EMBEDDED=$(awk '/\/\/ TEMPLATE_HTML_START/{flag=1; next} /\/\/ TEMPLATE_HTML_END/{flag=0} flag' "$FUNCTION_FILE" \
  | sed -e '1{/^const TEMPLATE_HTML = `$/d}' -e '$s/`$//')

SOURCE_NORM=$(tr -d '\r' < "$SOURCE")
EMBEDDED_NORM=$(printf '%s' "$EMBEDDED" | tr -d '\r')

if [ "$SOURCE_NORM" != "$EMBEDDED_NORM" ]; then
  echo "BLOQUEADO: $SOURCE e o HTML embutido em $FUNCTION_FILE divergem (diferença de conteúdo real, não só CRLF)." >&2
  echo >&2
  echo "Resincronize: gere de novo o bloco entre TEMPLATE_HTML_START/END a partir de $SOURCE." >&2
  echo >&2
  diff <(printf '%s' "$SOURCE_NORM") <(printf '%s' "$EMBEDDED_NORM") >&2 || true
  exit 1
fi

echo "OK: $SOURCE e o HTML embutido em $FUNCTION_FILE são idênticos."

# Templates das notificações por e-mail (2026-10-11): ficam juntos em
# _shared/emailTemplates.ts, um bloco por template, com a const na mesma linha
# do backtick de abertura (`export const NOME = \`<!DOCTYPE ...`).
SHARED_FILE="supabase/functions/_shared/emailTemplates.ts"
check_shared_template() {
  local source="$1" marker="$2"
  if [ ! -f "$source" ]; then echo "ERRO: $source não existe." >&2; exit 1; fi
  local embedded
  embedded=$(awk "/\/\/ ${marker}_START/{flag=1; next} /\/\/ ${marker}_END/{flag=0} flag" "$SHARED_FILE" \
    | sed -e '1s/^export const [A-Z_]* = `//' -e '$s/`$//')
  local source_norm embedded_norm
  source_norm=$(tr -d '\r' < "$source")
  embedded_norm=$(printf '%s' "$embedded" | tr -d '\r')
  if [ "$source_norm" != "$embedded_norm" ]; then
    echo "BLOQUEADO: $source e o bloco $marker em $SHARED_FILE divergem." >&2
    diff <(printf '%s' "$source_norm") <(printf '%s' "$embedded_norm") >&2 || true
    exit 1
  fi
  echo "OK: $source e o bloco $marker em $SHARED_FILE são idênticos."
}
check_shared_template "emails/04-entrega-do-plano.html" "TEMPLATE_04"
check_shared_template "emails/09-plano-aluno-a-validar.html" "TEMPLATE_09"
