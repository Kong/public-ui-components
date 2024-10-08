import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import sharedViteConfig, { getApiProxies, sanitizePackageName } from '../../../vite.config.shared'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'entities-routes'
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
    rollupOptions: {
      external: [
        '@kong-ui-public/expressions',
        'lodash.isequal',
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          '@kong-ui-public/expressions': 'kong-ui-public-expressions',
        },
      },
    },
  },
  ...(process.env.USE_SANDBOX
    ? {
      server: {
        proxy: {
          // Add the API proxies to inject the Authorization header
          ...getApiProxies(),
        },
      },
    }
    : {}),
  plugins: [
    // This plugin is only used in the sandbox & testing environment
    // It generates extra files in dist folder whitch are not need in library build
    ...(process.env.USE_SANDBOX
      ? [((monacoEditorPlugin as any).default as typeof monacoEditorPlugin)({})]
      : []),
  ],
}))

// If we are trying to preview a build of the local `package/entities-routes/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
