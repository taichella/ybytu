#!/usr/bin/env bash
# Confere que o dump não é um "sucesso" vazio ou parcial antes de criptografar/enviar --
# pg_dump pode sair com exit 0 e ainda assim ter dumpado quase nada (ex: URL errada,
# schema sem permissão, --schema mal escrito). Sem isso, um backup corrompido só seria
# descoberto no dia da restauração de verdade.
set -euo pipefail

SCHEMA_FILE="${1:?uso: validate-dump.sh schema.sql data.sql roles.sql}"
DATA_FILE="${2:?}"
ROLES_FILE="${3:?}"

fail() { echo "VALIDACAO FALHOU: $1" >&2; exit 1; }

# Tamanho mínimo plausível -- ajustar se o catálogo crescer muito além do esperado hoje
# (298 exercicios, 486 foods, ~300 meal_plans, moldes). Pego bem abaixo do observado
# localmente pra não disparar falso positivo com crescimento normal do catálogo.
[ "$(stat -c%s "$SCHEMA_FILE" 2>/dev/null || stat -f%z "$SCHEMA_FILE")" -gt 20000 ] || fail "schema.sql menor que 20KB"
[ "$(stat -c%s "$DATA_FILE" 2>/dev/null || stat -f%z "$DATA_FILE")" -gt 200000 ] || fail "data.sql menor que 200KB"
[ -s "$ROLES_FILE" ] || fail "roles.sql vazio"

# Confere que as DUAS schemas pedidas (public e auth) realmente vieram, não só uma.
grep -q 'CREATE TABLE "public"\."profiles"' "$SCHEMA_FILE" || fail "schema.sql sem public.profiles"
grep -q 'CREATE TABLE "auth"\."users"' "$SCHEMA_FILE" || fail "schema.sql sem auth.users"
grep -qE '^(COPY|INSERT INTO) "public"\."exercises"' "$DATA_FILE" || fail "data.sql sem dados de public.exercises"
grep -qE '^(COPY|INSERT INTO) "auth"\."users"' "$DATA_FILE" || fail "data.sql sem dados de auth.users"

echo "validate-dump: ok ($SCHEMA_FILE, $DATA_FILE, $ROLES_FILE)"
