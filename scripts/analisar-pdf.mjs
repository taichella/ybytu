// Quebra o peso de um PDF por tipo de stream interno (imagem, fonte, conteúdo de página,
// outros), sem depender de qpdf/mutool/pdfinfo (nenhum instalado nesta máquina). Lê os
// objetos indiretos "N 0 obj ... endobj" na marra via regex -- não decodifica object
// streams comprimidos (/Type /ObjStm), então o que sobrar em "não atribuído" pode incluir
// objetos dentro de ObjStm (normalmente pequenos: dicionários de página, catálogo etc.).
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('uso: node analisar-pdf.mjs <arquivo.pdf>'); process.exit(1); }
const buf = fs.readFileSync(file);
const total = buf.length;
const text = buf.toString('latin1'); // 1 byte = 1 char, preserva offsets binários

const objRe = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;
const streamRe = /stream\r?\n/;
const endstreamRe = /endstream/;

const buckets = { imagem: 0, fonte: 0, conteudo_pagina: 0, outros_stream: 0, sem_stream: 0 };
const detalhe = { imagem: [], fonte: [] };
let attributed = 0;
let m;
while ((m = objRe.exec(text))) {
  const [whole, num, body] = m;
  const sIdx = body.search(streamRe);
  if (sIdx === -1) { buckets.sem_stream += 0; continue; } // dicionário puro, sem stream binário -- peso desprezível, ignora
  const dict = body.slice(0, sIdx);
  const afterStreamStart = body.slice(sIdx).replace(streamRe, '');
  const eIdx = afterStreamStart.search(endstreamRe);
  if (eIdx === -1) continue;
  const streamLen = eIdx; // bytes reais entre "stream" e "endstream" no arquivo (já comprimido como está no PDF)
  attributed += streamLen;

  let cat = 'outros_stream';
  if (/\/Subtype\s*\/Image/.test(dict)) {
    cat = 'imagem';
    const filter = (dict.match(/\/Filter\s*\/(\w+)/) || [, '?'])[1];
    const wh = dict.match(/\/Width\s+(\d+).*?\/Height\s+(\d+)/s);
    detalhe.imagem.push({ obj: num, bytes: streamLen, filter, w: wh?.[1], h: wh?.[2] });
  } else if (/\/FontFile[0-9]?\b/.test(dict) || /\/Type\s*\/Font(Descriptor)?/.test(dict)) {
    cat = 'fonte';
    const subtype = (dict.match(/\/Subtype\s*\/(\w+)/) || [, '?'])[1];
    detalhe.fonte.push({ obj: num, bytes: streamLen, subtype });
  } else if (/\/Type\s*\/XObject/.test(dict) && /\/Subtype\s*\/Form/.test(dict)) {
    cat = 'conteudo_pagina'; // form XObject: normalmente conteúdo vetorial/desenho, não imagem
  } else if (/\/Type\s*\/ObjStm/.test(dict)) {
    cat = 'outros_stream';
  } else if (!dict.includes('/Type')) {
    cat = 'conteudo_pagina'; // stream de conteúdo de página (sem /Type explícito é o padrão pra content stream)
  }
  buckets[cat] += streamLen;
}

const naoAtribuido = total - attributed;
console.log(JSON.stringify({
  arquivo: file,
  total_bytes: total,
  total_mb: (total / 1024 / 1024).toFixed(2),
  buckets_bytes: buckets,
  buckets_mb: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, (v / 1024 / 1024).toFixed(2)])),
  nao_atribuido_bytes: naoAtribuido,
  nao_atribuido_mb: (naoAtribuido / 1024 / 1024).toFixed(2),
  qtd_imagens: detalhe.imagem.length,
  qtd_fontes: detalhe.fonte.length,
}, null, 2));
console.log('--- imagens (maiores primeiro) ---');
console.log(detalhe.imagem.sort((a, b) => b.bytes - a.bytes).slice(0, 15));
console.log('--- fontes (maiores primeiro) ---');
console.log(detalhe.fonte.sort((a, b) => b.bytes - a.bytes).slice(0, 15));
