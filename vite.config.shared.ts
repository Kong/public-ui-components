/// <reference types="vitest" />

/**
 * Shared Vite config settings for all components
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dns from 'dns'
import path, { join } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// You can set dns.setDefaultResultOrder('verbatim') to disable the reordering behavior. Vite will then print the address as localhost
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')

// Include the rollup-plugin-visualizer if the BUILD_VISUALIZER env var is set to "true"
const buildVisualizerPlugin = process.env.BUILD_VISUALIZER
  ? visualizer({
    filename: path.resolve(__dirname, `packages/${process.env.BUILD_VISUALIZER}/bundle-analyzer/stats-treemap.html`),
    template: 'treemap', // sunburst|treemap|network
    sourcemap: true,
    gzipSize: true,
  })
  : undefined

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    // Use this option to force Vite to always resolve listed dependencies to the same copy (from project root)
    dedupe: ['vue', 'vue-router', '@kong/kongponents'],
  },
  build: {
    outDir: './dist',
    cssCodeSplit: false,
    minify: true,
    sourcemap: true,
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      // If config.build.rollupOptions.external is also set at the package level, the arrays will be merged
      external: ['vue', 'vue-router', '@kong/kongponents'],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          vue: 'Vue',
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
  server: {
    fs: {
      /**
       * Allow serving files from one level up from the package root - IMPORTANT - since this is a monorepo
       */
      allow: [join(__dirname, '..')],
    },
  },
  // Change the root when utilizing the sandbox via USE_SANDBOX=true to use the `/sandbox/*` files
  // During the build process, the `/sandbox/*` files are not used and we should default to the package root.
  root: process.env.USE_SANDBOX ? './sandbox' : process.cwd(),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      registerNodeLoader: true, // Ensure modules are imported properly
    },
    include: ['**/src/**/*.spec.ts'],
    exclude: ['**/__template__/**/*.spec.ts'],
  },
})
