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
    '@stylistic/indentation': [2, { baseIndentLevel: 0 }],
    // Only allow @kong/design-tokens or `--kong-ui-*` CSS custom properties
    'custom-property-pattern': [
      // TODO: Remove allowed `K` prefix here once Kongponents theming variables are no longer supported
      '^(kui-|kong-ui-|K).+$',
      {
        message: "Expected custom property \"%s\" to be sourced from @kong/design-tokens with prefix '--kui-' or to have prefix '--kong-ui-'",
      },
    ],
    'custom-property-no-missing-var-function': true,
    // Disable the following rules
    'no-descending-specificity': null,
  },
}

