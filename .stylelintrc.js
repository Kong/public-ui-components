module.exports = {
  extends: [
    'stylelint-config-html',
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss'
  ],
  ignoreFiles: [
    'packages/cli/src/__template__/**/*'
  ],
  overrides: [
    {
      files: [
        'packages/**/src/**/*.{css,scss,sass,less,styl,vue}',
      ],
      rules: {
        // Disallow relative font units
        'unit-disallowed-list': ['rem', 'em'],
        // Disable the following rules
        'custom-property-no-missing-var-function': null,
        'no-descending-specificity': null,
        // Only allow @kong/design-tokens or `--kong-ui-*` CSS custom properties
        'custom-property-pattern': [
          "^(kui-|kong-ui-).+$",
          {
            "message": "Expected custom property \"%s\" to have prefix '--kong-ui-' or be sourced from @kong/design-tokens with prefix '--kui-'",
          }
        ],
        'custom-property-no-missing-var-function': true
      }
    }
  ],
  plugins: [ 'stylelint-order' ],
  rules: { 'order/properties-alphabetical-order': true }
}
