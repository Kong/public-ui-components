import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'analytics-chart'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-{package-name}`
      // Example: name: 'kong-ui-demo-component'
      name: `kong-ui-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
    },
  },
  server: {
    open: true,
  },
}))

// If we are trying to preview a build of the local `package/analytics-chart/sandbox` directory,
// unset the external and lib properties
if (process.env.PREVIEW_SANDBOX) {
  config.build.rollupOptions.external = undefined
  config.build.lib = undefined
}

export default config
