import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      // Switch to inline config with dynamic imports to avoid CJS path errors
      viteConfig: async () => {
        const vue = await import('@vitejs/plugin-vue')

        return {
          plugins: [vue.default()],
          define: {
            'process.env.VSCODE_TEXTMATE_DEBUG': false,
          },
          css: {
            preprocessorOptions: {
              scss: {
                api: 'modern',
                additionalData: '@use "@kong/design-tokens/tokens/scss/variables" as *;',
              },
            },
          },
        }
      },
    },
    supportFile: 'cypress/support/index.ts',
    specPattern: '**/src/**/*.cy.ts',
    excludeSpecPattern: '**/__template__/**/*.cy.ts',
  },
  includeShadowDom: true,
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  video: true,
  videosFolder: 'cypress/videos',
  retries: {
    runMode: 1,
  },
  trashAssetsBeforeRuns: false,
})
