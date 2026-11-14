import { defineConfig } from 'cypress'
import sharedViteConfig from './vite.config.shared'

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        ...sharedViteConfig,
        define: {
          'process.env.VSCODE_TEXTMATE_DEBUG': false,
        },
      },
    },
    supportFile: 'cypress/support/index.ts',
    specPattern: '**/src/**/*.cy.ts',
    excludeSpecPattern: '**/__template__/**/*.cy.ts',
  },
  includeShadowDom: true,
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  setupNodeEvents(on: Cypress.PluginEvents) {
    on('before:browser:launch', (browser, launchOptions) => {
      if (browser.name === 'chrome') {
        // CrowdStrike disables CDP/CRI when Cypress tries to connect to the
        // Chrome instance's websocket. This only matters when you're running
        // it locally with the browser open (i.e. not headless). This
        // disconnect causes the browser window to spin forever depending on
        // how fast things connect/disconnect. Disabling all extensions (only
        // in the Chrome profile used by Cypress) dodges the issue.
        launchOptions.args.push('--disable-extensions')
        return launchOptions
      }
    })
  },
  video: true,
  videosFolder: 'cypress/videos',
  retries: {
    runMode: 1,
  },
  trashAssetsBeforeRuns: false,
})
