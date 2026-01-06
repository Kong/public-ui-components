export default {
  extends: [
    'stylelint-config-html',
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss',
  ],
  plugins: [
    'stylelint-order',
    '@kong/design-tokens/stylelint-plugin',
    '@stylistic/stylelint-plugin',
  ],
  ignoreFiles: [
    'packages/cli/src/__template__/**/*',
  ],
  rules: {
    // Disallow relative font units
    'unit-disallowed-list': ['rem', 'em'],
    'order/properties-alphabetical-order': true,
    '@kong/design-tokens/use-proper-token': true,
    '@kong/design-tokens/token-var-usage': [true, { severity: 'warning' }],
    '@stylistic/indentation': [2, { baseIndentLevel: 0 }],
    // Only allow @kong/design-tokens or `--kong-ui-*` CSS custom properties
    'custom-property-pattern': [
      '^(kui-|kong-ui-).+$',
      {
        message: "Expected custom property \"%s\" to be sourced from @kong/design-tokens with prefix '--kui-' or to have prefix '--kong-ui-'",
      },
    ],
    'custom-property-no-missing-var-function': true,
    'rule-empty-line-before': ['always', { ignore: ['after-comment', 'first-nested'] }],
    '@stylistic/block-opening-brace-space-before': 'always',
    '@stylistic/declaration-colon-space-after': 'always',
    '@stylistic/media-feature-colon-space-after': 'always',
    // Disable the following rules
    'no-descending-specificity': null,
  },
}

