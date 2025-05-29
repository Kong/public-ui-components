import { resolve } from 'path'
import { defineConfig, mergeConfig, type UserConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'from-lua'
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
      external: ['prettier'],
    },
  },
  resolve: {
    alias: [
      {
        find: '@prettier/plugins/typescript',
        replacement: 'prettier/plugins/typescript',
      },
      {
        find: '@prettier/plugins/babel',
        replacement: 'prettier/plugins/babel',
      },
      {
        find: '@prettier/plugins/estree',
        replacement: 'prettier/plugins/estree',
      },
      {
        find: 'prettier',
        replacement: 'prettier/standalone',
      },
    ],
  },
  plugins: [
    nodePolyfills({
      include: ['path', 'process'],
    }),
  ],
} as UserConfig))

// If we are trying to preview a build of the local `package/from-lua/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
