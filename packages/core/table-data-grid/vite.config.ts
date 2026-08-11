import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

const packageName = 'table-data-grid'
const sanitizedPackageName = sanitizePackageName(packageName)

const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      cssFileName: 'style',
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
    },
    rollupOptions: {
      external: [
        'ag-grid-community',
        'ag-grid-vue3',
      ],
      output: {
        globals: {
          'ag-grid-community': 'agGridCommunity',
          'ag-grid-vue3': 'AgGridVue',
        },
      },
    },
  },
}))

if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.globals = undefined
}

export default config
