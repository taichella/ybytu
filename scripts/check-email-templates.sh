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
