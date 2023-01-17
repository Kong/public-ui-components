/// <reference types="vitest" />

/**
 * Shared Vite config settings for all components
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dns from 'dns'
import { join } from 'path'

// You can set dns.setDefaultResultOrder('verbatim') to disable the reordering behavior. Vite will then print the address as localhost
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim')

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
      // make sure to externalize deps that shouldn't be bundled into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          vue: 'Vue',
        },
        exports: 'named',
      },
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
