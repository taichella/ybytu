// Remedição do PDF do plano público com as miniaturas _w200 no bucket (2026-09-22).
// Uso: node scripts/medir-pdf-plano.mjs <url-do-plano> <arquivo-de-saida.pdf>
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const [, , url, outFile] = process.argv;
if (!url || !outFile) { console.error('uso: node medir-pdf-plano.mjs <url> <saida.pdf>'); process.exit(1); }

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const page = await browser.newPage();
const imgSizes = [];
page.on('response', async (res) => {
  const u = res.url();
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)) {
    try {
      const body = await res.body();
      imgSizes.push({ url: u, bytes: body.length, status: res.status() });
    } catch {}
  }
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500); // margem pro React terminar de montar depois do networkidle
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: outFile, printBackground: true, format: 'A4' });
await browser.close();

const pdfBytes = fs.statSync(outFile).size;
const totalImgBytes = imgSizes.reduce((n, i) => n + i.bytes, 0);
const thumbs = imgSizes.filter((i) => i.url.includes('_w200'));
const originals = imgSizes.filter((i) => !i.url.includes('_w200') && /r2\.dev/.test(i.url));
const non200 = imgSizes.filter((i) => i.status !== 200);

console.log(JSON.stringify({
  pdf_bytes: pdfBytes,
  pdf_mb: (pdfBytes / 1024 / 1024).toFixed(2),
  imagens_baixadas: imgSizes.length,
  imagens_bytes_total: totalImgBytes,
  imagens_mb_total: (totalImgBytes / 1024 / 1024).toFixed(2),
  miniaturas_w200_baixadas: thumbs.length,
  originais_r2_baixados_sem_ser_w200: originals.length,
  imagens_status_nao_200: non200.map((i) => ({ url: i.url, status: i.status })),
}, null, 2));
