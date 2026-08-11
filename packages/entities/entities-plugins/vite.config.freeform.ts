import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import sharedViteConfig from '../../../vite.config.shared'

export default mergeConfig(sharedViteConfig, defineConfig({
  build: {
    outDir: 'dist/freeform',
    lib: {
      entry: resolve(__dirname, './src/freeform.ts'),
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
