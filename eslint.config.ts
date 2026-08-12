import { defineConfig } from 'eslint/config'
// @ts-expect-error This package does not export types
import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
// @ts-expect-error This package does not export types
import eslintKongUiConfigCypress from '@kong/eslint-config-kong-ui/cypress'

export default defineConfig([
  ...eslintKongUiConfig,
  ...eslintKongUiConfigCypress.map((config: any) => ({
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
])
