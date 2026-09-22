#!/usr/bin/env bash
# Restaura um backup .tar.age num Postgres LOCAL descartável (Docker), pra testar que o
# backup é válido sem tocar o banco de produção. Não escreve em nada do Supabase.
#
# Uso: scripts/backup/restore-local.sh <backup.tar.age> <chave-privada-age.txt>
#
# Precisa: Docker rodando, `age` instalado (choco install age / brew install age).
set -euo pipefail

ARCHIVE="${1:?uso: restore-local.sh <backup.tar.age> <chave-privada-age.txt>}"
KEYFILE="${2:?}"
WORKDIR="$(mktemp -d)"
CONTAINER=ybytu-restore-test
PORT=55432

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "1/5 decriptando..."
age -d -i "$KEYFILE" -o "$WORKDIR/backup.tar" "$ARCHIVE"

echo "2/5 extraindo..."
tar -xf "$WORKDIR/backup.tar" -C "$WORKDIR"
ls -la "$WORKDIR"/*.sql

echo "3/5 subindo Postgres 17 local descartável na porta $PORT..."
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -p "$PORT:5432" postgres:17 >/dev/null
for i in $(seq 1 30); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

export PGPASSWORD=postgres
DBURL="postgresql://postgres@127.0.0.1:$PORT/postgres"

echo "4/5 restaurando roles -> schema -> dados..."
psql "$DBURL" -v ON_ERROR_STOP=0 -f "$WORKDIR/roles.sql" >/dev/null   # ON_ERROR_STOP=0: roles do sistema (postgres, supabase_admin etc.) já existem no container, "already exists" é esperado aqui
psql "$DBURL" -v ON_ERROR_STOP=1 -c 'create schema if not exists auth;'
psql "$DBURL" -v ON_ERROR_STOP=1 -f "$WORKDIR/schema.sql"
psql "$DBURL" -v ON_ERROR_STOP=1 -f "$WORKDIR/data.sql"

echo "5/5 conferindo contagens contra o esperado (cole o total real do dia do dump pra comparar)..."
psql "$DBURL" -c "select 'exercises' t, count(*) from exercises union all select 'foods', count(*) from foods union all select 'meal_plans', count(*) from meal_plans union all select 'training_plans', count(*) from training_plans union all select 'auth.users', count(*) from auth.users;"

echo "OK -- restauração rodou sem erro. Confira as contagens acima contra o que o dump deveria ter."
