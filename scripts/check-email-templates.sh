#!/usr/bin/env bash
# Uso: scripts/check-email-templates.sh
#
# Compara emails/03-plano-em-preparacao.html (fonte da verdade, versionada)
# contra supabase/functions/ybytu-send-onboarding-email/template.html (cópia
# de deploy -- existe só porque o deploy do Supabase empacota apenas a pasta
# da própria function + _shared/, emails/ na raiz não viaja no bundle).
# Normaliza CRLF->LF antes de comparar (checkout Windows usa CRLF, git blob
# guarda LF -- mesma pegadinha do Caso 8/CRLF nos outros scripts).
#
# Sai com erro se as duas divergirem -- reproduzir a duplicata "template.html
# desatualizado, ninguém percebeu" seria o mesmo padrão do achado de
# 2026-09-13 (10 templates de e-mail em duas cópias, uma delas esquecida).
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SOURCE="emails/03-plano-em-preparacao.html"
DEPLOYED="supabase/functions/ybytu-send-onboarding-email/template.html"

if [ ! -f "$SOURCE" ]; then
  echo "ERRO: $SOURCE não existe." >&2
  exit 1
fi
if [ ! -f "$DEPLOYED" ]; then
  echo "ERRO: $DEPLOYED não existe." >&2
  exit 1
fi

if ! diff -q --strip-trailing-cr "$SOURCE" "$DEPLOYED" >/dev/null 2>&1; then
  echo "BLOQUEADO: $SOURCE e $DEPLOYED divergem (diferença de conteúdo real, não só CRLF)." >&2
  echo >&2
  echo "Resincronize antes de deployar:" >&2
  echo "  cp $SOURCE $DEPLOYED" >&2
  echo >&2
  diff --strip-trailing-cr "$SOURCE" "$DEPLOYED" >&2 || true
  exit 1
fi

echo "OK: $SOURCE e $DEPLOYED idênticos."
