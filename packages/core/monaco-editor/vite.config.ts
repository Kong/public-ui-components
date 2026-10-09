import sharedViteConfig, { sanitizePackageName } from '../../../vite.config.shared'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import Monaco from './vite-plugin'

// Package name MUST always match the kebab-case package name inside the component's package.json file and the name of your `/packages/{package-name}` directory
const packageName = 'monaco-editor'
const sanitizedPackageName = sanitizePackageName(packageName)

// Merge the shared Vite config with the local one defined below
const config = mergeConfig(sharedViteConfig, defineConfig({
  build: {
    outDir: 'dist/runtime',
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: {
        index: resolve(dirname(fileURLToPath(import.meta.url)), './src/index.ts'),
        // IMPORTANT: Splitting singletons as the language-specific entries import
        // the singletons and they are also code split.
        singletons: resolve(dirname(fileURLToPath(import.meta.url)), './src/singletons/index.ts'),
        // Language-specific entry points for code-splitting.
        'languages/json': resolve(dirname(fileURLToPath(import.meta.url)), './src/languages/json/index.ts'),
        'languages/yaml': resolve(dirname(fileURLToPath(import.meta.url)), './src/languages/yaml/index.ts'),
      },
      fileName: (format, entryName) => {
        if (entryName === 'index') {
          return `${sanitizedPackageName}.${format}.js`
        }
        return `${entryName}.${format}.js`
      },
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        /^monaco-editor/,
        /^@shikijs\//,
        /^shiki/,
        // `monaco-loader.ts`'s virtual specifier for its own trimmed shiki import, like the
        // real 'shiki' above, this package never bundles it itself; it's left external so
        // whichever consuming app applies our own vite-plugin resolves it.
        'virtual:@kong-ui-public/monaco-editor/shiki',
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          'monaco-editor': 'monaco',
          'shiki': 'shiki',
          'virtual:@kong-ui-public/monaco-editor/shiki': 'shiki',
        },
      },
    },
  },
  test: {
    // Use projects to separate different test environments
    projects: [
      {
        extends: './vite.config.ts',
        plugins: [
          // `monaco-loader.ts` imports its own trimmed shiki bundle via a virtual specifier
          // that only our own vite-plugin can resolve. Vite's import-analysis fails outright on an unresolvable
          // specifier before a spec file's `vi.mock(...)` for it ever gets a chance to run, so
          // stub it here to resolve.
          {
            name: 'stub-monaco-editor-shiki-virtual-specifier',
            resolveId(id: string) {
              if (id === 'virtual:@kong-ui-public/monaco-editor/shiki') {
                return '\0virtual:@kong-ui-public/monaco-editor/shiki'
              }
            },
            load(id: string) {
              if (id === '\0virtual:@kong-ui-public/monaco-editor/shiki') {
                return 'export default {}'
              }
            },
          },
        ],
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
