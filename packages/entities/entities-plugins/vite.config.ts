import sharedViteConfig, { getApiProxies, sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'entities-plugins'
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
        '@kong-ui-public/entities-consumer-groups',
        '@kong-ui-public/entities-consumers',
        '@kong-ui-public/entities-gateway-services',
        '@kong-ui-public/entities-plugins-metadata',
        '@kong-ui-public/entities-routes',
        '@kong-ui-public/forms',
        'marked',
        'monaco-editor',
      ],
    },
  },
  server: {
    proxy: {
      // Add the API proxies to inject the Authorization header
      ...getApiProxies(),
    },
  },
}))

// If we are trying to preview a build of the local `package/entities-routes/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
}

export default config
