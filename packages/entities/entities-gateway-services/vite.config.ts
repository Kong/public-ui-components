import sharedViteConfig, { getApiProxies, sanitizePackageName } from '../../../vite.config.shared'
import { defineConfig, mergeConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'entities-gateway-services'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(dirname(fileURLToPath(import.meta.url)), './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      // Externalize @peculiar/x509 (only used to parse the CA certificate issuer
      // for Kong Manager, imported on demand) so its ~500KB does not inflate this
      // package's bundle. It is a regular dependency, resolved by the consumer.
      external: ['@peculiar/x509'],
      output: {
        globals: {
          '@peculiar/x509': 'x509',
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

// If we are trying to preview a build of the local `package/entities-gateway-services/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
