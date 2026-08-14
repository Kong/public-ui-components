import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/filler',
    emptyOutDir: false,
    lib: {
      entry: {
        'cypress/index': resolve(dirname(fileURLToPath(import.meta.url)), './src/components/free-form/filler/cypress/index.ts'),
        'playwright/index': resolve(dirname(fileURLToPath(import.meta.url)), './src/components/free-form/filler/playwright/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'cypress',
        '@playwright/test',
        'lodash-es',
      ],
    },
  },
})
