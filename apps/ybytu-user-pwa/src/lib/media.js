// Resolução de mídia do R2 (imagem/vídeo de exercício) pro dashboard.
//
// exercises.image_url / video_url guardam só a CHAVE do objeto no bucket R2
// (ex: "ARNOLD PRESS_2.jpg"); uma linha ainda não migrada continua com link de
// Drive completo (começa com http e é usado como está). A URL pública é
// montada aqui, nunca gravada no banco -- se o domínio mudar, muda só a base.
//
// Base: VITE_R2_PUBLIC_BASE (Vercel > Settings > Environment Variables). Sem a
// variável cai na Public Development URL atual, então nada quebra por falta de
// configuração. Ver docs/MIGRACAO_VIDEOS_CLOUDFLARE_20260904.md.
//
// Espelha supabase/functions/_shared/buildPlanPayload.ts (resolveR2Media /
// resolveR2Thumb): não dá pra importar módulo Deno de dentro do bundle Vite,
// então a regra existe nos dois lugares -- mudou aqui, muda lá.

const DEFAULT_R2_PUBLIC_BASE = 'https://pub-b8a8c93fcde740fcb7ad36f410c9737f.r2.dev';

export const R2_PUBLIC_BASE = String(import.meta.env?.VITE_R2_PUBLIC_BASE || DEFAULT_R2_PUBLIC_BASE).replace(/\/+$/, '');

// Miniatura ~200px de largura: arquivo À PARTE no mesmo bucket, com este sufixo
// antes da extensão ("ARNOLD PRESS_2.jpg" -> "ARNOLD PRESS_2_w200.jpg"). Nunca
// substitui o original.
export const R2_THUMB_SUFFIX = '_w200';

export function resolveR2Media(value) {
  if (!value) return null;
  if (value.startsWith('http')) return value; // link de Drive (ou URL completa): usa como está
  return `${R2_PUBLIC_BASE}/${encodeURIComponent(value)}`; // encodeURIComponent: nomes têm espaço/parêntese
}

export function resolveR2Thumb(value) {
  if (!value || value.startsWith('http')) return null; // link de Drive não tem miniatura
  const dot = value.lastIndexOf('.');
  const key = dot > 0 ? `${value.slice(0, dot)}${R2_THUMB_SUFFIX}${value.slice(dot)}` : `${value}${R2_THUMB_SUFFIX}`;
  return `${R2_PUBLIC_BASE}/${encodeURIComponent(key)}`;
}

// Fontes em ordem de preferência pra um <ExerciseThumb>: miniatura primeiro,
// original depois. (Miniatura pode ainda não ter sido enviada ao bucket.)
export function thumbSources(imageKey) {
  return [resolveR2Thumb(imageKey), resolveR2Media(imageKey)].filter(Boolean);
}

// Só o original (cards grandes, onde a miniatura de 200px ficaria borrada).
export function fullSources(imageKey) {
  return [resolveR2Media(imageKey)].filter(Boolean);
}
