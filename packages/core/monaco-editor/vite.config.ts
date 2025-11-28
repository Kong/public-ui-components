import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import Monaco from './vite-plugin'

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
      entry: {
        'monaco-editor': resolve(__dirname, './src/index.ts'),
        'vite-plugin': resolve(__dirname, './vite-plugin/index.ts'),
      },
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        /^monaco-editor/,
      ],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/mocks/monaco-editor-api.ts'],
  },
}))

// If we are trying to preview a build of the local `package/monaco-editor/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
  config.plugins.push(Monaco({
    languages: ['javascript', 'typescript', 'json', 'css', 'html'],
  }))
}

export default config
