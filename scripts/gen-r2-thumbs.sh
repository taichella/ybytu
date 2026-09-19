#!/usr/bin/env bash
# Gera as miniaturas de ~200px de largura (sufixo _w200) a partir de r2_thumbnails/.
# Os originais NUNCA são alterados nem apagados: a miniatura é um arquivo à parte, no
# mesmo bucket R2, com o sufixo antes da extensão ("ARNOLD PRESS_2.jpg" ->
# "ARNOLD PRESS_2_w200.jpg"). Mesma regra de apps/ybytu-dashboard/src/lib/media.js e de
# supabase/functions/_shared/buildPlanPayload.ts (resolveR2Thumb) -- se mudar o sufixo,
# mude nos três.
#
# Uso: scripts/gen-r2-thumbs.sh            (lê r2_thumbnails/, escreve r2_thumbnails_w200/)
# Depois: arrastar o CONTEÚDO de r2_thumbnails_w200/ pra raiz do bucket `videos` no painel
# da Cloudflare (mesmo procedimento dos originais, ver docs/MIGRACAO_VIDEOS_CLOUDFLARE_20260904.md).
# Requer ffmpeg no PATH.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
SRC=r2_thumbnails
DST=r2_thumbnails_w200
WIDTH=200
mkdir -p "$DST"
n=0
for f in "$SRC"/*; do
  b="$(basename "$f")"; ext="${b##*.}"; base="${b%.*}"
  ffmpeg -loglevel error -y -i "$f" -vf "scale='min($WIDTH,iw)':-2" -q:v 5 "$DST/${base}_w${WIDTH}.${ext}" </dev/null
  n=$((n+1))
done
echo "$n miniaturas em $DST/ ($(du -sk "$DST" | cut -f1) KB; originais: $(du -sk "$SRC" | cut -f1) KB)"
