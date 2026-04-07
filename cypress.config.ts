import { defineConfig } from 'cypress'
import sharedViteConfig from './vite.config.shared'

const cypressPeerDistStylePattern = /^@kong-ui-public\/.+\/dist\/.+\.css$/

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        ...sharedViteConfig,
        plugins: [
          ...(sharedViteConfig.plugins ?? []),
          {
            name: 'cypress-peer-style-stub',
            enforce: 'pre',
            resolveId(id: string) {
              if (cypressPeerDistStylePattern.test(id)) {
                return '\0cypress-peer-style-stub.css'
              }

              return null
            },
            load(id: string) {
              if (id === '\0cypress-peer-style-stub.css') {
                return ''
              }

              return null
            },
          },
        ],
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
  video: true,
  videosFolder: 'cypress/videos',
  retries: {
    runMode: 1,
  },
  trashAssetsBeforeRuns: false,
})
