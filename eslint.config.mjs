import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
import eslintKongUiConfigCypress from '@kong/eslint-config-kong-ui/cypress'
import designTokens from '@kong/design-tokens/eslint-plugin'

export default [
  ...eslintKongUiConfig,
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
  {
    files: ['**/*.vue'],
    plugins: {
      '@kong/design-tokens': designTokens,
    },
    rules: {
      '@kong/design-tokens/token-constant-requires-css-var': 'error',
    },
  },
]
