import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'monaco-editor'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
    },
  },
  test: {
    environment: 'jsdom',
    deps: {
      inline: ['@vueuse/core'],
      external: ['monaco-editor'],
    },
    alias: {
      'monaco-editor': resolve(__dirname, './src/tests/mocks/monaco-editor.ts'),
    },
  },
  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.worker?worker': 'virtual:monaco-worker-mock',
      'monaco-editor/esm/vs/language/json/json.worker?worker': 'virtual:monaco-worker-mock',
      'monaco-editor/esm/vs/language/css/css.worker?worker': 'virtual:monaco-worker-mock',
      'monaco-editor/esm/vs/language/html/html.worker?worker': 'virtual:monaco-worker-mock',
      'monaco-editor/esm/vs/language/typescript/ts.worker?worker': 'virtual:monaco-worker-mock',
    },
  },
  plugins: [
    {
      name: 'mock-monaco-workers',
      resolveId(id) {
        if (id === 'virtual:monaco-worker-mock') return id
      },
      load(id) {
        if (id === 'virtual:monaco-worker-mock') {
          return 'export default class WorkerMock { constructor() {} postMessage() {} }'
        }
      },
    },
  ],
}))

// If we are trying to preview a build of the local `package/monaco-editor/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
