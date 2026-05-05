import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
import eslintKongUiConfigCypress from '@kong/eslint-config-kong-ui/cypress'
import { defineConfig as packageConstraints } from '@kumahq/eslint-package-constraints'

export default [

  ...eslintKongUiConfig,
  ...eslintKongUiConfigCypress.map(config => ({
    ...config,
    files: [
      '**/cypress/**',
      '**/*.cy.{js,ts,jsx,tsx}',
    ],
  })),
  ...packageConstraints({
    workspaceRoot: false,
    dependencyIgnorePatterns: {
      'dependencies': {
        'react': {
          '$ref': '#/definitions/exactOnlyVersion',
        },
        'react-dom': {
          '$ref': '#/definitions/exactOnlyVersion',
        },
        'swagger-client': {
          '$ref': '#/definitions/exactOnlyVersion',
        },
        'swagger-ui': {
          '$ref': '#/definitions/exactOnlyVersion',
        },
      },
    },
  }),
  {
    ignores: ['**/__template__/**', 'packages/core/monaco-editor/sandbox/assets/**'],
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
