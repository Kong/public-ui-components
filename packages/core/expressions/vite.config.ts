import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'
import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'expressions'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      formats: ['es'],
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
    },
    rollupOptions: {
      external: ['monaco-editor'],
    },
  },
  plugins: [
    wasm(),
    topLevelAwait({
      promiseExportName: 'asyncInit',
    }),
    // We don't need this plugin to bundle the library. Only for sandbox previews.
    // See: https://github.com/vdesjs/vite-plugin-monaco-editor/issues/21
    ...process.env.USE_SANDBOX
      ? [((monacoEditorPlugin as any).default as typeof monacoEditorPlugin)({})]
      : [],
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
