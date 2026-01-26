import { defineConfig } from 'cypress'

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      // Cypress 15.x early validation triggers Vite's deprecated CJS Node API
      // Dynamic import avoids CJS path and loads in proper ESM context
      viteConfig: async () => {
        const sharedViteConfig = await import('./vite.config.shared')
        return {
          ...sharedViteConfig.default,
          define: {
            'process.env.VSCODE_TEXTMATE_DEBUG': false,
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
