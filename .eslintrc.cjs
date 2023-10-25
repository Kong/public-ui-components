/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')
const kongponentsUtilityClasses = require('./utilities/disallowed-utility-classes')

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    'plugin:vue/vue3-recommended',
    '@vue/standard',
    'plugin:cypress/recommended', // if this is missing, it looks like type errors
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    indent: 'off',
    semi: ['error', 'never'],
    'space-before-function-paren': 'off',
    quotes: ['error', 'single', {avoidEscape: true}],
    'no-multi-spaces': 'error',
    'no-unused-vars': 'off',
    'no-trailing-spaces': 'error',
    'padded-blocks': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': [process.env.NODE_ENV === 'production' ? 'warn' : 'off', {
      code: 120,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    }],
    '@typescript-eslint/space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
    }],
    // Ensures ESLint understands that `defineEmits<{ ... }>()` does _not_ fail this rule.
    'func-call-spacing': 'off',
    '@typescript-eslint/func-call-spacing': ['error', 'never'],
    'vue/attributes-order': ['error', {
      alphabetical: true,
    }],
    'vue/multiline-html-element-content-newline': ['error', {
      ignoreWhenEmpty: true,
      ignores: ['code', 'pre', 'textarea', 'a', 'span', 'router-link'],
    }],
    // Disallow Kongponents utility classes
    'vue/no-restricted-class': ['error', ...kongponentsUtilityClasses],
    // This rule is too restrictive: https://github.com/vuejs/eslint-plugin-vue/issues/2259
    'vue/no-setup-props-destructure': 'off',
    'vue/no-restricted-static-attribute': ['error',
      {
        key: 'data-test-id',
        message: 'Using "data-test-id" is not allowed. Use "data-testid" instead.',
      },
    ],
    'vue/no-restricted-v-bind': ['error',
      {
        argument: 'data-test-id',
        message: 'Using "data-test-id" is not allowed. Use "data-testid" instead.',
      },
    ],
  },
  overrides: [
    {
      files: [
        'cypress/integration/**.spec.{js,ts,jsx,tsx}',
        'cypress/integration/**.cy.{js,ts,jsx,tsx}',
      ],
      extends: [
        'plugin:cypress/recommended',
      ],
    },
    {
      files: [
        'packages/portal/document-viewer/src/components/**/*.vue',
      ],
      rules: {
        'vue/multi-word-component-names': ['off'],
      },
    },
  ],
}
