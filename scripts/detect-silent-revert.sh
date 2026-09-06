#!/usr/bin/env bash
# Uso: scripts/detect-silent-revert.sh <ref-base> <ref-pr>
# Ex:  scripts/detect-silent-revert.sh origin/main origin/feature/minha-branch
#
# Avisa quando uma PR remove uma linha que a ref-base tambem tocou depois
# que a branch da PR divergiu -- o sinal de "isto pode estar desfazendo, sem
# querer, algo que entrou em main depois que a branch foi cortada."
#
# IMPORTANTE (achado rodando isto pela primeira vez, PR #20 2026-09-04):
# comparar direto `git diff ref-base ref-pr` (sem antes achar o merge-base)
# da falso positivo em QUALQUER branch atrasada -- mistura "o que a PR
# mudou" com "o que main mudou sozinho depois, sem relacao com a PR". Um
# merge de verdade (3-way, squash ou rebase) so aplica o que a PR muda
# RELATIVO AO PONTO DE DIVERGENCIA -- entao e essa a comparacao que importa
# pra saber o que vai acontecer de verdade ao mergear.

set -euo pipefail

BASE_REF="${1:?uso: detect-silent-revert.sh <ref-base> <ref-pr>}"
PR_REF="${2:?uso: detect-silent-revert.sh <ref-base> <ref-pr>}"

MERGE_BASE=$(git merge-base "$BASE_REF" "$PR_REF")

echo "merge-base: $MERGE_BASE"
echo "checando o que $PR_REF muda de verdade (relativo ao merge-base), nao a ponta atual de $BASE_REF"
echo

CHANGED_FILES=$(git diff --name-only "$MERGE_BASE" "$PR_REF")

if [ -z "$CHANGED_FILES" ]; then
  echo "Sem arquivos mudados (relativo ao merge-base)."
  exit 0
fi

FOUND=0

while IFS= read -r FILE; do
  [ -z "$FILE" ] && continue
  # so faz sentido checar historico de linha se o arquivo ja existia no merge-base
  git cat-file -e "$MERGE_BASE:$FILE" 2>/dev/null || continue

  # ranges de linha REMOVIDOS pela PR, na numeracao do arquivo no merge-base
  # (hunk "@@ -START,LEN +... @@"; LEN omitido = 1 linha; LEN=0 = so adicao)
  while read -r START LEN; do
    [ -z "$START" ] && continue
    LEN=${LEN:-1}
    [ "$LEN" -eq 0 ] && continue
    END=$((START + LEN - 1))

    HITS=$(git log --format='%H|%ad|%s' --date=format:'%Y-%m-%d %H:%M' \
      -L"${START},${END}:${FILE}" "${MERGE_BASE}..${BASE_REF}" 2>/dev/null \
      | grep -E '^[0-9a-f]{40}\|' || true)

    if [ -n "$HITS" ]; then
      FOUND=1
      echo "AVISO: $FILE, linhas $START-$END (removidas por $PR_REF) foram tocadas em $BASE_REF depois da divergencia:"
      while IFS='|' read -r HASH DATE SUBJECT; do
        echo "  - ${HASH:0:8} ($DATE) $SUBJECT"
      done <<< "$HITS"
      echo
    fi
  done < <(git diff -U0 "$MERGE_BASE" "$PR_REF" -- "$FILE" \
    | grep -E '^@@' \
    | sed -E 's/^@@ -([0-9]+)(,([0-9]+))? \+.*/\1 \3/')

done <<< "$CHANGED_FILES"

if [ "$FOUND" -eq 1 ]; then
  echo "Confirme se essas remocoes sao intencionais antes de mergear -- podem estar desfazendo algo que entrou em $BASE_REF depois que esta branch foi cortada."
  exit 1
else
  echo "Nenhuma linha removida por $PR_REF foi tocada em $BASE_REF depois da divergencia. Sem sinal de reversao silenciosa."
  exit 0
fi
