/// <reference types="vitest" />

/**
 * Shared Vite config settings for all components
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dns from 'dns'
import path, { join } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// You can set dns.setDefaultResultOrder('verbatim') to disable the reordering behavior. Vite will then print the address as localhost
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')

// Include the rollup-plugin-visualizer if the BUILD_VISUALIZER env var is set to "true"
const buildVisualizerPlugin = process.env.BUILD_VISUALIZER
  ? visualizer({
    filename: path.resolve(__dirname, `packages/${ process.env.BUILD_VISUALIZER }/bundle-analyzer/stats-treemap.html`),
    template: 'treemap', // sunburst|treemap|network
    sourcemap: true,
    gzipSize: true,
  })
  : undefined

/**
 * Sanitize package/filename to exclude undesired strings
 * IMPORANT: If this function is changed, you **must** change the function in `/packages/core/cli/src/core/package.ts` as well.
 * @param {string} packageName The string to sanitize
 * @returns {string} The sanitized package/filename string
 */
export const sanitizePackageName = (packageName: string): string => {
  // Add additional replace rules as needed

  // Replace any variation of string 'Analytics' in assets and chunks. These are in order to preserve capitalization.
  // (Some adblock filter lists deny requests for files starting with "assets/analytics".  See MA-926 for more context.)
  const sanitizedName = (packageName || '').replace(/Analytics/g, 'Vitals').replace(/analytics/gi, 'vitals')

  return sanitizedName
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    // Use this option to force Vite to always resolve listed dependencies to the same copy (from project root)
    dedupe: ['vue', 'vue-router', '@kong/kongponents'],
    alias: {
      '@entities-shared-sandbox': path.resolve(__dirname, 'packages/entities/entities-shared/sandbox/shared'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Inject the @kong/design-tokens SCSS variables to make them available for all components.
        additionalData: '@import "@kong/design-tokens/tokens/scss/variables";',
      },
    },
  },
  build: {
    outDir: './dist',
    cssCodeSplit: false,
    minify: true,
    sourcemap: !!process.env.BUILD_VISUALIZER,
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      // If config.build.rollupOptions.external is also set at the package level, the arrays will be merged
      external: ['vue', 'vue-router', '@kong/kongponents', '@kong-ui-public/i18n', 'axios'],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          '@kong-ui-public/i18n': 'kong-ui-public-i18n',
          '@kong/kongponents': 'Kongponents',
          axios: 'axios',
        },
        exports: 'named',
      },
      plugins: [
        // visualizer must remain last in the list of plugins
        buildVisualizerPlugin,
      ],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
    ],
  },
  // Change the root when utilizing the sandbox via USE_SANDBOX=true to use the `/sandbox/*` files
  // During the build process, the `/sandbox/*` files are not used and we should default to the package root.
  root: process.env.USE_SANDBOX ? './sandbox' : process.cwd(),
  // Sets the Vite envDir to point to the repository root `.env.*` files.
  // Please do NOT add other .env files in child directories.
  envDir: '../../../../',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      optimizer: {
        web: {
          // https://github.com/vitest-dev/vitest/issues/4074
          exclude: ['vue'],
        },
      },
    },
    include: ['**/src/**/*.spec.ts'],
    exclude: [
      '**/dist/**',
      '**/__template__/**',
      '**/node_modules/**',
      'packages/core/cli/**',
    ],
  },
})

/**
 * Define the server.proxy rules for various shared APIs
 * These utilize the `VITE_KONNECT_PAT` Konnect PAT token located in `/.env.development.local`
 * @param pathToRoot The path to the repository root, from the package directory, where your .env.development.local file is located. Defaults to `../../../.' which works for most packages.
 * @returns Object of API proxies to pass to the vite `config.server.proxy`
 */
export const getApiProxies = (pathToRoot: string = '../../../.') => {
  // Import env variables from the root
  // Hard-coded to 'development' since we are only using the env variables in the local dev server
  const env = loadEnv('development', pathToRoot, '')

  const konnectAuthHeader = env.VITE_KONNECT_PAT
    ? {
      authorization: `Bearer ${ env.VITE_KONNECT_PAT }`,
    }
    : undefined

  const kongManagerAuthHeader = env.VITE_KONG_MANAGER_TOKEN
    ? {
      'kong-admin-token': env.VITE_KONG_MANAGER_TOKEN,
    }
    : undefined

  // Add additional regions as they become available
  const availableRegions = ['au', 'eu', 'us']
  const regionalProxies = {}
  // Build the regional API proxies
  for (const region of availableRegions) {
    // @ts-ignore
    regionalProxies[`^/${ region }/kong-api/konnect-api`] = {
      target: (env.VITE_KONNECT_API ?? '').replace(/\{geo\}/, region),
      rewrite: (path: string) => path.replace(`/${ region }/kong-api`, ''),
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader,
      },
    }
  }

  return {
    // Add Konnect API proxies
    ...regionalProxies,

    /**
     * /kong-ui/config JSON
     */
    '^/kong-ui/config': {
      target: env.VITE_KONNECT_CONFIG,
      changeOrigin: true,
    },

    // KAuth v1 APIs
    '^/kauth': {
      target: env.VITE_KONNECT_KAUTH,
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader,
      },
    },

    // Global v2 APIs
    '^/kong-api/v2': {
      target: env.VITE_KONNECT_GLOBAL,
      rewrite: (path: string) => path.replace('/kong-api', ''),
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader,
      },
    },

    /**
     * KONG MANAGER PROXIES
     */
    '^/kong-manager': {
      target: env.VITE_KONG_MANAGER_API,
      rewrite: (path: string) => path.replace('/kong-manager', ''),
      changeOrigin: true,
      headers: {
        ...kongManagerAuthHeader,
      },
    },
  }
}
