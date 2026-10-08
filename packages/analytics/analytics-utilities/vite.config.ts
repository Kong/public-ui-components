import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'analytics-utilities'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      // separate vue dependent code into its own entry point so that kanalytics
      // can use the main entry point without needing vue
      entry: {
        main: resolve(dirname(fileURLToPath(import.meta.url)), './src/index.ts'),
        coordination: resolve(dirname(fileURLToPath(import.meta.url)), './src/coordination/index.ts'),
      },
      fileName: (format, entryName) => {
        const base = entryName === 'main' ? sanitizedPackageName : `${sanitizedPackageName}-${entryName}`
        return format === 'cjs' ? `${base}.${format}` : `${base}.${format}.js`
      },
      cssFileName: 'style',
      // UMD is not supported by Vite for multiple entry points
      formats: ['es', 'cjs'],
    },
  },
  test: {
    // Include regular `*.spec.ts` files as well as timezone-specific unit test files `*.spec.tz.ts`
    include: ['**/src/**/*.spec(.tz)?.ts'],
  },
}))

// If we are trying to preview a build of the local `package/analytics-utilities/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
