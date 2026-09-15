#!/usr/bin/env bash
# Uso: scripts/check-stale-deploys.sh
#
# Auditoria (nao bloqueia nada) -- compara o commit mais recente de cada
# edge function (git) contra o timestamp real de deploy (Supabase). Avisa
# quando existe commit mais novo que o deploy: codigo correto no repo,
# producao rodando a versao velha, ninguem avisado. Direcao oposta a
# scripts/deploy-functions.sh (que bloqueia deploy de codigo nao commitado/
# nao empurrado) -- ver comentario em check-stale-deploys.mjs e Caso 9 em
# docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md.
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
exec node "$REPO_ROOT/scripts/check-stale-deploys.mjs"
