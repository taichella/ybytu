// Config só do harness de preview (pasta preview/) -- não afeta o build da
// app, que continua usando vite.config.js. Existe porque o ambiente local não
// consegue autenticar staff (CORS, ver docs/DEBITO_AMBIENTE_LOCAL_20260901.md),
// então a única forma de ver a tela renderizada é injetar um service de fixture
// no lugar do real.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '../services/exerciseService.js',
        replacement: path.resolve(__dirname, 'preview/fixture.js'),
      },
    ],
  },
})
