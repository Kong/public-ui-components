import sharedViteConfig, { getApiProxies, sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'entities-redis-configurations'
const sanitizedPackageName = sanitizePackageName(packageName)
const peerStyleImportsToStub = new Set([
  '@kong-ui-public/entities-shared/dist/style.css',
  '@kong-ui-public/entities-vaults/dist/style.css',
])
const shouldStubPeerStylesForTests =
  !!process.env.VITEST ||
  process.env.BABEL_ENV === 'cypress' ||
  process.env.npm_lifecycle_event === 'test:component'

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  ...(shouldStubPeerStylesForTests
    ? {
      plugins: [{
        name: 'vitest-peer-style-stub',
        enforce: 'pre',
        resolveId(id) {
          if (peerStyleImportsToStub.has(id)) {
            return '\0vitest-peer-style-stub.css'
          }

          return null
        },
        load(id) {
          if (id === '\0vitest-peer-style-stub.css') {
            return ''
          }

          return null
        },
      }],
    }
    : {}),
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
        '@kong-ui-public/entities-plugins-icon',
        '@kong-ui-public/entities-vaults',
        '@kong-ui-public/forms',
      ],
      output: {
        globals: {
          '@kong-ui-public/entities-plugins-icon': 'kong-ui-public-entities-plugins-icon',
          '@kong-ui-public/entities-vaults': 'kong-ui-public-entities-vaults',
        },
      },
    },
  },
  server: {
    proxy: {
      // Add the API proxies to inject the Authorization header
      ...getApiProxies(),
    },
  },
}))

// If we are trying to preview a build of the local `package/entities-redis-configurations/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
