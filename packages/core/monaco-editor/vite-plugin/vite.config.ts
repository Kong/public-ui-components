import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist/vite-plugin',
    minify: false,
    lib: {
      entry: resolve(__dirname, './index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        /^monaco-editor/,
      ],
    },
  },
})
