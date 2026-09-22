#!/usr/bin/env bash
# Retenção do backup no R2: 7 diários + 4 semanais.
# Uso: PREFIX=daily KEEP=7 scripts/backup/prune-r2.sh
#      PREFIX=weekly KEEP=4 scripts/backup/prune-r2.sh
# Espera aws-cli já configurado (env AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY apontando
# pro token do R2) e as variáveis R2_ENDPOINT_URL / R2_BACKUP_BUCKET exportadas.
set -euo pipefail

: "${PREFIX:?defina PREFIX=daily ou weekly}"
: "${KEEP:?defina KEEP (quantos manter)}"
: "${R2_ENDPOINT_URL:?}"
: "${R2_BACKUP_BUCKET:?}"

# Lista as chaves do prefixo, mais recentes primeiro (o nome do arquivo é
# ybytu-backup-YYYYMMDD-HHMMSS.tar.age -- ordem lexicográfica = ordem cronológica).
mapfile -t keys < <(aws s3api list-objects-v2 \
  --endpoint-url "$R2_ENDPOINT_URL" \
  --bucket "$R2_BACKUP_BUCKET" \
  --prefix "${PREFIX}/" \
  --query 'sort_by(Contents, &Key)[].Key' \
  --output text | tr '\t' '\n' | sort -r)

total=${#keys[@]}
echo "[$PREFIX] $total objeto(s), mantendo $KEEP mais recentes"

if (( total <= KEEP )); then
  echo "[$PREFIX] nada para apagar"
  exit 0
fi

for key in "${keys[@]:$KEEP}"; do
  echo "[$PREFIX] apagando $key"
  aws s3api delete-object --endpoint-url "$R2_ENDPOINT_URL" --bucket "$R2_BACKUP_BUCKET" --key "$key"
done
