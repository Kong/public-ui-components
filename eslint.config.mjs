import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
import eslintKongUiConfigJson from '@kong/eslint-config-kong-ui/json'
import eslintKongUiConfigCypress from '@kong/eslint-config-kong-ui/cypress'

export default [
  ...eslintKongUiConfig,
  // Only apply the shared JSON config to files that match the given pattern
  ...eslintKongUiConfigJson.map(config => ({
    ...config,
    files: ['tokens/**/*.json'],
  })),
  ...eslintKongUiConfigCypress.map(config => ({
    ...config,
    files: [
      '**/cypress/**',
      '**/*.cy.{js,ts,jsx,tsx}',
    ],
  })),
  {
    ignores: ['**/__template__/**'],
  },
  {
    files: [
      'packages/portal/document-viewer/src/components/**/*.vue',
    ],
    rules: {
      'vue/multi-word-component-names': ['off'],
    },
  },
]
