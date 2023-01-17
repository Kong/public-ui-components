import { defineConfig } from 'cypress'
import sharedViteConfig from './vite.config.shared'

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        ...sharedViteConfig,
      },
    },
    supportFile: 'cypress/support/index.ts',
    specPattern: '**/src/**/*.cy.ts',
    excludeSpecPattern: '**/__template__/**/*.cy.ts',
  },
  includeShadowDom: true,
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  videoUploadOnPasses: false,
  retries: {
    runMode: 1,
  },
  trashAssetsBeforeRuns: false,
})
