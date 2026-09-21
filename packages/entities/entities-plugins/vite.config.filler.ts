import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/filler',
    emptyOutDir: false,
    lib: {
      entry: {
        'cypress/index': resolve(dirname(fileURLToPath(import.meta.url)), './src/filler/cypress/index.ts'),
        'playwright/index': resolve(dirname(fileURLToPath(import.meta.url)), './src/filler/playwright/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        '@kong-ui-public/freeform/filler/cypress',
        '@kong-ui-public/freeform/filler/playwright',
      ],
    },
  },
})
