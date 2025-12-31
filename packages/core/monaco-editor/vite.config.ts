import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import Monaco from './vite-plugin'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'monaco-editor'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    outDir: 'dist/runtime',
    cssCodeSplit: false, // Inline component CSS into the JS bundle so consumers don’t need to import styles manually
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__dirname, './src/index.ts'),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`,
    },
    rollupOptions: {
      external: [
        /^monaco-editor/,
        /^@shikijs\//,
        /^shiki/,
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          'monaco-editor': 'monaco',
          'shiki': 'shiki',
        },
      },
    },
  },
  test: {
    // Use projects to separate different test environments
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'runtime',
          environment: 'jsdom',
          setupFiles: ['./src/tests/setup.ts'],
          include: ['**/src/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'vite-plugin',
          environment: 'node',
          include: ['**/vite-plugin/**/*.spec.ts'],
        },
      },
    ],
  },
}))

// If we are trying to preview a build of the local `package/monaco-editor/sandbox` directory,
// unset the lib, rollupOptions.external and rollupOptions.output.globals properties
if (process.env.USE_SANDBOX) {
  config.build.lib = undefined
  config.build.rollupOptions.external = undefined
  config.build.rollupOptions.output.global = undefined
  config.plugins.push(Monaco({
    languages: ['javascript', 'typescript', 'json', 'css', 'html', 'yaml', 'markdown'],
  }))
}

export default config
