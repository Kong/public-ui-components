import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import monacoEditorPlugin from '@kong-ui-public/monaco-editor/vite-plugin'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'expressions'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    /**
     * Adds target: 'esnext' because Vite v7 bumps esbuild to 0.28.1, which breaks
     * `vite-plugin-top-level-await` fallback re-transform step when no explicit
     * build.target is set.
     */
    target: 'esnext',
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      formats: ['es'],
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(dirname(fileURLToPath(import.meta.url)), './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        '@kong-ui-public/core',
        '@kong-ui-public/forms',
        '@kong-ui-public/forms/dist/style.css',
        '@kong-ui-public/monaco-editor',
        '@kong/icons',
        'monaco-editor',
        'uuid',
      ],
    },
  },
  plugins: [
    wasm(),
    topLevelAwait({
      promiseExportName: 'asyncInit',
    }),
    monacoEditorPlugin({
      languages: ['json'],
    }),
  ],
}))

// If we are trying to preview a build of the local `package/expressions/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
