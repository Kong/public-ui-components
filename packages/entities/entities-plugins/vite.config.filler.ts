import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/filler',
    emptyOutDir: false,
    lib: {
      entry: {
        'cypress/index': resolve(__dirname, './src/components/free-form/filler/cypress/index.ts'),
        'playwright/index': resolve(__dirname, './src/components/free-form/filler/playwright/index.ts'),
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
