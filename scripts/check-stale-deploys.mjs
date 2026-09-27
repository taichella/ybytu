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
// Duas perguntas SEPARADAS por function (desde 2026-09-27):
//   - STALE (propria): a pasta da function tem commit mais novo que o deploy.
//     Falso positivo confirmado (Caso 8/CRLF) vai pra scripts/stale-allowlist.txt,
//     com hash SO da pasta.
//   - STALE via _shared/<arquivo>: um arquivo de _shared/ que ela importa tem
//     commit mais novo que o deploy. Mudanca em _shared/ conscientemente nao
//     deployada vai pra scripts/stale-shared-ack.txt (por arquivo + hash do
//     conteudo, com except= pras functions que PRECISAM do deploy).
// Motivo da separacao: o commit do CORS de 2026-09-27 (2 origens novas, sem
// deploy de proposito) acendeu 27 STALE de uma vez -- e um deploy esquecido de
// verdade ficaria invisivel no meio deles.
//
// Uso: node scripts/check-stale-deploys.mjs  (ou scripts/check-stale-deploys.sh)
//      node scripts/check-stale-deploys.mjs --print-hash <function>        (allowlist)
//      node scripts/check-stale-deploys.mjs --print-shared-hash <arquivo>  (ack, ex: cors.ts)
// Quando rodar: antes de qualquer teste com aluno real, e depois de
// qualquer sessao que tenha mexido em edge function -- ver README.

import { execSync } from 'node:child_process'
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const REPO_ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
const FUNCTIONS_DIR = join(REPO_ROOT, 'supabase', 'functions')
const ALLOWLIST_PATH = join(REPO_ROOT, 'scripts', 'stale-allowlist.txt')
const SHARED_ACK_PATH = join(REPO_ROOT, 'scripts', 'stale-shared-ack.txt')

function run(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

// ── 2. Functions que existem localmente (pastas em supabase/functions/, exceto _shared) ──
//      (antes do passo 1 porque --print-hash/--print-shared-hash nao precisam do Supabase)
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

// ── 3b. Hashes de conteudo, CRLF normalizado pra LF (checkout local usa CRLF, o
//       Supabase guarda LF -- Caso 8). Deliberadamente NAO ha supressao por nome:
//       qualquer edicao de conteudo (1 byte que seja) muda o hash e o aviso volta.
//   - hashFunctionContent: SO a pasta da function (todos os arquivos -- inclui
//     deno.json/import_map se existir, ver whatsapp-webhook). _shared/ ficou de
//     fora de proposito desde 2026-09-27: mudanca em _shared/ e a outra pergunta
//     (stale-shared-ack.txt), e mistura-las fazia 1 commit em cors.ts invalidar
//     todas as confirmacoes de CRLF de uma vez.
//   - hashSharedFile: 1 arquivo de _shared/, pro stale-shared-ack.txt.
function hashFiles(files) {
  const hash = createHash('sha256')
  for (const { rel, abs } of files) {
    hash.update(rel + '\n')
    hash.update(readFileSync(abs, 'utf8').replace(/\r\n/g, '\n'))
    hash.update('\0')
  }
  return hash.digest('hex').slice(0, 16)
}

function hashFunctionContent(slug) {
  const dir = join(FUNCTIONS_DIR, slug)
  const localFiles = readdirSync(dir)
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort()
    .map((f) => ({ rel: `${slug}/${f}`, abs: join(dir, f) }))
  return hashFiles(localFiles)
}

function hashSharedFile(file) {
  return hashFiles([{ rel: `_shared/${file}`, abs: join(FUNCTIONS_DIR, '_shared', file) }])
}

function dataLines(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
}

// Formato: <function> <hash-pasta-16hex> <data> <motivo>
function loadAllowlist() {
  const map = new Map()
  for (const line of dataLines(ALLOWLIST_PATH)) {
    const [slug, hash, date, ...motivoParts] = line.split(/\s+/)
    if (!slug || !hash) continue
    map.set(slug, { hash, date, motivo: motivoParts.join(' ') || '(sem motivo registrado)' })
  }
  return map
}

// Formato: <arquivo em _shared/> <hash-arquivo-16hex> <data> [except=fn1,fn2] <motivo>
function loadSharedAck() {
  const map = new Map()
  for (const line of dataLines(SHARED_ACK_PATH)) {
    const [rawFile, hash, date, ...rest] = line.split(/\s+/)
    if (!rawFile || !hash) continue
    const file = rawFile.replace(/^_shared\//, '')
    let except = []
    if (rest[0]?.startsWith('except=')) except = rest.shift().slice('except='.length).split(',').filter(Boolean)
    map.set(file, { hash, date, except, motivo: rest.join(' ') || '(sem motivo registrado)' })
  }
  return map
}

// --print-hash <slug>: utilitario pra preencher/atualizar scripts/stale-allowlist.txt
// depois de confirmar por conteudo (diff --strip-trailing-cr) que um STALE e falso positivo.
if (process.argv[2] === '--print-hash') {
  const slug = process.argv[3]
  if (!slug || !localSlugs.includes(slug)) {
    console.error(`Uso: node scripts/check-stale-deploys.mjs --print-hash <function>`)
    process.exit(2)
  }
  console.log(hashFunctionContent(slug))
  process.exit(0)
}

// --print-shared-hash <arquivo>: utilitario pra scripts/stale-shared-ack.txt.
if (process.argv[2] === '--print-shared-hash') {
  const file = (process.argv[3] || '').replace(/^_shared\//, '')
  if (!file || !existsSync(join(FUNCTIONS_DIR, '_shared', file))) {
    console.error(`Uso: node scripts/check-stale-deploys.mjs --print-shared-hash <arquivo em _shared/, ex: cors.ts>`)
    process.exit(2)
  }
  console.log(hashSharedFile(file))
  process.exit(0)
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

const allowlist = loadAllowlist()
const sharedAck = loadSharedAck()

// ── 4. Working tree sujo conta como "pior que stale" -- deploy-functions.sh ja bloqueia
//      isso no momento do deploy, mas aqui reportamos tambem pra dar o quadro completo. ──
function isDirty(targets) {
  const out = run(`git status --porcelain -- ${targets.join(' ')}`)
  return out.trim().length > 0
}

// ── 5. Commit mais recente (epoch, segundos) de um conjunto de caminhos ──
function lastCommitEpoch(targets) {
  const out = run(`git log -1 --format=%at -- ${targets.join(' ')}`).trim()
  return out ? Number(out) : null
}

// Janela de tolerancia: o fluxo normal deste projeto e deploy-entao-commit
// no MESMO turno (mesmo conteudo, commit so registra o que ja foi
// deployado segundos/minutos antes) -- sem isso, toda function deployada
// e commitada do jeito certo aparece como "stale" por 20-60s de diferenca
// de timestamp, e o sinal real (dias de atraso) se perde no meio do ruido.
// 1h cobre folgado o padrao observado (maior gap real medido: ~18min) sem
// chegar perto do caso real que motivou o script (~120h).
const GRACE_SECONDS = 3600

const sharedHashCache = new Map()
const currentSharedHash = (file) => {
  if (!sharedHashCache.has(file)) sharedHashCache.set(file, hashSharedFile(file))
  return sharedHashCache.get(file)
}

const rows = []
const suppressedRows = []
const ackedBy = new Map() // arquivo -> [slugs pendentes so por ele, reconhecido]
const allowlistUsed = new Set()
const sharedStaleAnywhere = new Set() // arquivos de _shared/ mais novos que o deploy de ALGUMA function

for (const slug of localSlugs) {
  const dep = deployedBySlug.get(slug)
  const targets = targetsFor(slug)
  const dirty = isDirty(targets)

  if (!dep) {
    rows.push({ slug, status: dirty ? 'NUNCA DEPLOYADA + SUJA' : 'NUNCA DEPLOYADA', detail: 'existe no repo, nao existe no Supabase' })
    continue
  }
  if (dirty) {
    rows.push({ slug, status: 'SUJA', detail: 'mudanca nao commitada -- deploy-functions.sh ja bloquearia isso na hora de deployar' })
    continue
  }
  const deployEpoch = Math.floor(dep.updated_at / 1000)

  // Pergunta 1: a pasta da propria function
  const ownEpoch = lastCommitEpoch([`supabase/functions/${slug}`])
  let ownProblem = null
  let ownSuppressed = null
  if (ownEpoch !== null && ownEpoch - deployEpoch > GRACE_SECONDS) {
    const gapHours = Math.round((ownEpoch - deployEpoch) / 3600)
    const contentHash = hashFunctionContent(slug)
    const allow = allowlist.get(slug)
    if (allow && allow.hash === contentHash) {
      allowlistUsed.add(slug)
      ownSuppressed = `pasta: STALE suprimido (allowlist ${allow.date}, hash ${contentHash} confere): ${allow.motivo}`
    } else {
      ownProblem = `pasta com commit ${gapHours}h mais novo que o ultimo deploy${allow ? ' (allowlist existe mas hash NAO confere -- conteudo mudou desde a confirmacao)' : ''}`
    }
  }

  // Pergunta 2: cada arquivo de _shared/ que ela importa
  const sharedProblems = []
  const sharedAcked = []
  for (const file of sharedFilesUsedBy(slug).sort()) {
    const fileEpoch = lastCommitEpoch([`supabase/functions/_shared/${file}`])
    if (fileEpoch === null || fileEpoch - deployEpoch <= GRACE_SECONDS) continue
    sharedStaleAnywhere.add(file)
    const gapHours = Math.round((fileEpoch - deployEpoch) / 3600)
    const ack = sharedAck.get(file)
    if (!ack) {
      sharedProblems.push(`_shared/${file} ${gapHours}h mais novo que o deploy`)
    } else if (ack.hash !== currentSharedHash(file)) {
      sharedProblems.push(`_shared/${file} ${gapHours}h mais novo que o deploy (reconhecimento existe mas hash NAO confere -- arquivo mudou desde ${ack.date})`)
    } else if (ack.except.includes(slug)) {
      sharedProblems.push(`_shared/${file} ${gapHours}h mais novo que o deploy (reconhecimento ${ack.date} EXCLUI esta function: precisa do deploy)`)
    } else {
      sharedAcked.push(file)
    }
  }
  for (const file of sharedAcked) {
    if (!ackedBy.has(file)) ackedBy.set(file, [])
    ackedBy.get(file).push(slug)
  }

  if (ownProblem) {
    const extra = sharedProblems.length ? `; tambem ${sharedProblems.join('; ')}` : ''
    rows.push({ slug, status: 'STALE (propria)', detail: ownProblem + extra })
  } else if (sharedProblems.length) {
    const files = sharedProblems.map((p) => p.split(' ')[0].replace('_shared/', '')).join(',')
    rows.push({ slug, status: `STALE via _shared/${files}`, detail: sharedProblems.join('; ') })
  } else if (ownSuppressed) {
    suppressedRows.push({ slug, detail: ownSuppressed })
  } else if (sharedAcked.length) {
    // so aparece na linha de resumo do reconhecimento
  } else {
    rows.push({ slug, status: 'OK', detail: 'deploy cobre o commit mais recente' })
  }
  // STALE (propria) ou via _shared nao vai pra lista de suprimidos mesmo se a pasta
  // estiver na allowlist: o problema real tem prioridade; o detalhe ja diz o motivo.
}

// ── 5b. Deployada no Supabase mas sumiu do repo local (ex: rename, remocao acidental) ──
for (const dep of deployed) {
  if (!localSlugs.includes(dep.slug)) {
    rows.push({ slug: dep.slug, status: 'SEM CORRESPONDENCIA LOCAL', detail: 'deployada no Supabase, pasta nao existe neste checkout -- confirme se e intencional' })
  }
}

// ── 5c. Entradas que nao servem mais pra nada -- pode remover ──
const obsolete = []
for (const [file, ack] of sharedAck) {
  if (!existsSync(join(FUNCTIONS_DIR, '_shared', file))) {
    obsolete.push(`stale-shared-ack.txt: _shared/${file} -- arquivo nao existe mais`)
  } else if (!sharedStaleAnywhere.has(file)) {
    obsolete.push(`stale-shared-ack.txt: _shared/${file} (${ack.date}) -- todas as functions que importam o arquivo ja foram deployadas depois dele`)
  }
}
for (const [slug, allow] of allowlist) {
  if (!allowlistUsed.has(slug)) {
    obsolete.push(`stale-allowlist.txt: ${slug} (${allow.date}) -- nao suprime nada hoje (redeployada, removida ou conteudo mudou)`)
  }
}

// ── Saida ──
const width = Math.max(...rows.map((r) => r.slug.length), ...suppressedRows.map((r) => r.slug.length), 'FUNCTION'.length) + 2
const statusWidth = Math.max(28, ...rows.map((r) => r.status.length + 2))

console.log('FUNCTION'.padEnd(width) + 'STATUS'.padEnd(statusWidth) + 'DETALHE')
console.log('-'.repeat(width + statusWidth + 40))
for (const r of [...rows].sort((a, b) => (a.status === 'OK') - (b.status === 'OK'))) {
  console.log(r.slug.padEnd(width) + r.status.padEnd(statusWidth) + r.detail)
}
console.log()

for (const [file, slugs] of ackedBy) {
  const ack = sharedAck.get(file)
  console.log(`RECONHECIDO: ${slugs.length} function(s) pendentes so por _shared/${file} (stale-shared-ack.txt ${ack.date}: ${ack.motivo})`)
  console.log(`  deploy natural limpa cada uma; except= fica listado acima como STALE. Functions: ${slugs.sort().join(' ')}`)
  console.log()
}

if (suppressedRows.length > 0) {
  console.log(`SUPPRESSED (${suppressedRows.length}) -- STALE da pasta confirmado como falso positivo, hash ainda bate com a allowlist:`)
  for (const r of suppressedRows) console.log('  ' + r.slug.padEnd(width) + r.detail)
  console.log()
}

if (obsolete.length > 0) {
  console.log(`OBSOLETO (${obsolete.length}) -- entrada que nao suprime/reconhece mais nada, pode remover:`)
  for (const o of obsolete) console.log('  ' + o)
  console.log()
}

const staleCount = rows.filter((r) => r.status.startsWith('STALE')).length
if (staleCount > 0) {
  console.log('AVISO: STALE indica suspeita por timestamp, NAO confirmacao de gap real.')
  console.log('Confirme por conteudo antes de redeployar qualquer coisa -- pegadinha ja')
  console.log('confirmada 2026-09-14: checkout local usa CRLF, o que sai do Supabase vem em')
  console.log('LF, entao `diff` comum marca o arquivo inteiro como diferente mesmo sem')
  console.log('nenhuma mudanca de conteudo (quase redeployamos 6 functions sem necessidade).')
  console.log('Pra cada STALE, rode:')
  console.log('  npx supabase functions download <nome> --use-api --project-ref <ref>')
  console.log('  diff --strip-trailing-cr supabase/functions/<nome>/index.ts <baixado>/index.ts')
  console.log('So redeploye (scripts/deploy-functions.sh <nome>) se o diff mostrar diferenca de verdade.')
  console.log('STALE (propria), falso positivo confirmado -> scripts/stale-allowlist.txt:')
  console.log('  node scripts/check-stale-deploys.mjs --print-hash <nome>')
  console.log('STALE via _shared, mudanca conscientemente nao deployada -> scripts/stale-shared-ack.txt:')
  console.log('  node scripts/check-stale-deploys.mjs --print-shared-hash <arquivo>')
  console.log()
}

const problems = rows.filter((r) => r.status !== 'OK')
const ackedCount = [...ackedBy.values()].reduce((n, s) => n + s.length, 0)
if (problems.length === 0) {
  console.log(`OK: nenhuma function com problema (${suppressedRows.length} suprimida(s) por allowlist, ${ackedCount} pendencia(s) de _shared/ reconhecida(s)).`)
  process.exit(0)
} else {
  console.log(`ATENCAO: ${problems.length} function(s) com problema -- ver acima (${suppressedRows.length} suprimida(s), ${ackedCount} pendencia(s) de _shared/ reconhecida(s)).`)
  process.exit(1)
}
