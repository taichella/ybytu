#!/usr/bin/env node
/**
 * scripts/check-user-pwa-sync.mjs
 *
 * Garante que os arquivos compartilhados críticos entre o Dashboard do Staff
 * e o PWA do Usuário (tokens.css e media.js) permaneçam estritamente sincronizados.
 * 
 * Mesma abordagem preventiva de scripts/check-email-templates.sh:
 * - Normaliza CRLF -> LF antes de comparar.
 * - Falha com código 1 e imprime mensagem detalhada se houver qualquer divergência real.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PAIRS = [
  {
    name: 'tokens.css',
    source: path.join(root, 'apps/ybytu-dashboard/src/tokens.css'),
    target: path.join(root, 'apps/ybytu-user-pwa/src/tokens.css'),
  },
  {
    name: 'media.js',
    source: path.join(root, 'apps/ybytu-dashboard/src/lib/media.js'),
    target: path.join(root, 'apps/ybytu-user-pwa/src/lib/media.js'),
  },
];

let hasError = false;

for (const pair of PAIRS) {
  if (!fs.existsSync(pair.source)) {
    console.error(`ERRO: Arquivo de origem não encontrado: ${pair.source}`);
    hasError = true;
    continue;
  }
  if (!fs.existsSync(pair.target)) {
    console.error(`ERRO: Arquivo de destino não encontrado: ${pair.target}`);
    hasError = true;
    continue;
  }

  const srcContent = fs.readFileSync(pair.source, 'utf8').replace(/\r\n/g, '\n').trim();
  const tgtContent = fs.readFileSync(pair.target, 'utf8').replace(/\r\n/g, '\n').trim();

  if (srcContent !== tgtContent) {
    console.error(`\n❌ BLOQUEADO: ${pair.name} diverge entre apps/ybytu-dashboard e apps/ybytu-user-pwa!`);
    console.error(`   Origem:  ${pair.source}`);
    console.error(`   Destino: ${pair.target}`);
    console.error(`   Ação necessária: Re-sincronize o arquivo para manter regras de miniatura e tokens alinhados.\n`);
    hasError = true;
  } else {
    console.log(`✅ OK: ${pair.name} está perfeitamente sincronizado.`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('\nSincronização entre Dashboard e User PWA verificada com sucesso.');
  process.exit(0);
}
