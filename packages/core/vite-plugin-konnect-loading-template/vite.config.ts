import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'vite-plugin-konnect-loading-template'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      fileName: (format) => {
        if (format === 'es') {
          // Force the import as ESM
          // You can rename a file with the .mjs extension to use ESM instead: https://vitejs.dev/guide/troubleshooting#vite-cjs-node-api-deprecated
          return `${sanitizedPackageName}.${format}.mjs`
        }
        return `${sanitizedPackageName}.${format}.js`
      },
    },
  },
}))

// If we are trying to preview a build of the local `package/vite-plugin-konnect-loading-template/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
