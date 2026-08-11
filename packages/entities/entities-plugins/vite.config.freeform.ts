import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import sharedViteConfig from '../../../vite.config.shared'

export default mergeConfig(sharedViteConfig, defineConfig({
  build: {
    outDir: 'dist/freeform',
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), './src/freeform.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'lodash-es',
        'marked',
        'dompurify',
        '@kong-ui-public/forms',
        '@vueuse/core',
        '@kong/design-tokens',
      ],
    },
  },
}))
