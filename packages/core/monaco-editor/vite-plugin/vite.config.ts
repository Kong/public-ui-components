import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  build: {
    outDir: 'dist/vite-plugin',
    minify: false,
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), './index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        /^monaco-editor/,
        /^shiki/,
      ],
    },
  },
})
