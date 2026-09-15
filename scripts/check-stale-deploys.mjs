#!/usr/bin/env node
// Auditoria da direção OPOSTA à que scripts/deploy-functions.sh protege.
//
// deploy-functions.sh recusa DEPLOYAR codigo nao commitado/nao empurrado --
// mas so roda no MOMENTO do deploy. Se ninguem chamar deploy depois de um
// commit, nao ha momento nenhum em que essa checagem dispara -- o commit
// fica limpo, empurrado, correto, e a producao continua rodando a versao
// velha, indefinidamente, sem nenhum aviso. Achado 2026-09-14 (Caso 9,
// ver docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md): o commit
// 1d4c964d (token 'coco' no mapa de badge) foi criado de proposito ANTES do
// dado ir pro ar, pra nunca existir janela quebrada -- e a metade que fecha
// o ciclo (rodar o deploy) nunca aconteceu. 5 dias rodando a versao antiga
// com o dado novo ja liberado pro aluno usar.
//
// Este script e uma AUDITORIA, nao um gate -- roda a qualquer momento,
// varre TODAS as functions de uma vez, nao bloqueia nada. Compara o
// commit mais recente que toca cada function (ou _shared/, usado por
// todas) contra o timestamp de deploy real (supabase functions list).
//
// Uso: node scripts/check-stale-deploys.mjs  (ou scripts/check-stale-deploys.sh)
// Quando rodar: antes de qualquer teste com aluno real, e depois de
// qualquer sessao que tenha mexido em edge function -- ver README.

import { execSync } from 'node:child_process'
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
const FUNCTIONS_DIR = join(REPO_ROOT, 'supabase', 'functions')

function run(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

// ── 1. Deploy real de cada function (Supabase, fonte de verdade sobre o que ta no ar) ──
let deployed
try {
  const raw = run('npx supabase functions list --output-format json')
  deployed = JSON.parse(raw).functions ?? JSON.parse(raw)
} catch (err) {
  console.error('ERRO: nao consegui listar functions deployadas (supabase functions list).')
  console.error(err.message)
  process.exit(2)
}
const deployedBySlug = new Map(deployed.map((f) => [f.slug, f]))

// ── 2. Functions que existem localmente (pastas em supabase/functions/, exceto _shared) ──
const localSlugs = readdirSync(FUNCTIONS_DIR)
  .filter((name) => name !== '_shared' && statSync(join(FUNCTIONS_DIR, name)).isDirectory())

// ── 3. Quais arquivos de _shared/ a function REALMENTE importa -- crucial.
//      Tratar "qualquer mudanca em _shared/" como relevante pra TODA function
//      (o mesmo desenho, deliberadamente conservador, de deploy-functions.sh)
//      faz uma auditoria virar ruido: um commit em buildPlanPayload.ts nao diz
//      nada sobre ybytu-admin-equipments, que nunca importa esse arquivo.
//      deploy-functions.sh pode dar-se ao luxo de ser conservador demais (so
//      atrasa UM deploy manual); uma auditoria que aponta problema em 26 de
//      29 functions de uma vez enterra o sinal real no meio do ruido.
function sharedFilesUsedBy(slug) {
  const dir = join(FUNCTIONS_DIR, slug)
  const tsFiles = readdirSync(dir).filter((f) => f.endsWith('.ts'))
  const found = new Set()
  const importRe = /from\s+['"]\.\.\/_shared\/([\w.-]+)['"]/g
  for (const file of tsFiles) {
    const content = readFileSync(join(dir, file), 'utf8')
    for (const match of content.matchAll(importRe)) found.add(match[1])
  }
  return [...found]
}

function targetsFor(slug) {
  const shared = sharedFilesUsedBy(slug).map((f) => `supabase/functions/_shared/${f}`)
  return [`supabase/functions/${slug}`, ...shared]
}

// ── 4. Working tree sujo conta como "pior que stale" -- deploy-functions.sh ja bloqueia
//      isso no momento do deploy, mas aqui reportamos tambem pra dar o quadro completo. ──
function isDirty(targets) {
  const out = run(`git status --porcelain -- ${targets.join(' ')}`)
  return out.trim().length > 0
}

// ── 5. Commit mais recente (epoch, segundos) que toca a function OU os
//      arquivos de _shared/ que ela de fato importa (nao _shared/ inteiro) ──
function lastCommitEpoch(targets) {
  const out = run(`git log -1 --format=%at -- ${targets.join(' ')}`).trim()
  return out ? Number(out) : null
}

const rows = []
for (const slug of localSlugs) {
  const dep = deployedBySlug.get(slug)
  const targets = targetsFor(slug)
  const commitEpoch = lastCommitEpoch(targets)
  const dirty = isDirty(targets)

  if (!dep) {
    rows.push({ slug, status: dirty ? 'NUNCA DEPLOYADA + SUJA' : 'NUNCA DEPLOYADA', detail: 'existe no repo, nao existe no Supabase' })
    continue
  }
  if (dirty) {
    rows.push({ slug, status: 'SUJA', detail: 'mudanca nao commitada -- deploy-functions.sh ja bloquearia isso na hora de deployar' })
    continue
  }
  if (commitEpoch === null) {
    rows.push({ slug, status: 'OK', detail: 'sem historico de commit pro escopo (normal se nunca mudou)' })
    continue
  }
  const deployEpoch = Math.floor(dep.updated_at / 1000)
  // Janela de tolerancia: o fluxo normal deste projeto e deploy-entao-commit
  // no MESMO turno (mesmo conteudo, commit so registra o que ja foi
  // deployado segundos/minutos antes) -- sem isso, toda function deployada
  // e commitada do jeito certo aparece como "stale" por 20-60s de diferenca
  // de timestamp, e o sinal real (dias de atraso) se perde no meio do ruido.
  // 1h cobre folgado o padrao observado (maior gap real medido: ~18min) sem
  // chegar perto do caso real que motivou o script (~120h).
  const GRACE_SECONDS = 3600
  if (commitEpoch - deployEpoch > GRACE_SECONDS) {
    const gapHours = Math.round((commitEpoch - deployEpoch) / 3600)
    rows.push({
      slug,
      status: 'STALE',
      detail: `commit ${gapHours}h mais novo que o ultimo deploy -- rodar: bash scripts/deploy-functions.sh ${slug}`,
    })
  } else {
    rows.push({ slug, status: 'OK', detail: 'deploy cobre o commit mais recente' })
  }
}

// ── 5. Deployada no Supabase mas sumiu do repo local (ex: rename, remocao acidental) ──
for (const dep of deployed) {
  if (!localSlugs.includes(dep.slug)) {
    rows.push({ slug: dep.slug, status: 'SEM CORRESPONDENCIA LOCAL', detail: 'deployada no Supabase, pasta nao existe neste checkout -- confirme se e intencional' })
  }
}

// ── Saida ──
const problems = rows.filter((r) => r.status !== 'OK')
const width = Math.max(...rows.map((r) => r.slug.length), 'FUNCTION'.length) + 2

console.log('FUNCTION'.padEnd(width) + 'STATUS'.padEnd(28) + 'DETALHE')
console.log('-'.repeat(width + 28 + 40))
for (const r of rows.sort((a, b) => (a.status === 'OK') - (b.status === 'OK'))) {
  console.log(r.slug.padEnd(width) + r.status.padEnd(28) + r.detail)
}
console.log()

if (problems.length === 0) {
  console.log(`OK: todas as ${rows.length} functions com deploy cobrindo o commit mais recente.`)
  process.exit(0)
} else {
  console.log(`ATENCAO: ${problems.length} de ${rows.length} function(s) com problema -- ver acima.`)
  process.exit(1)
}
