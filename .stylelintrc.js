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
        'packages/*/src/**/*.{css,scss,sass,less,styl,vue}',
      ],
      rules: {
        // Disallow relative font units
        'unit-disallowed-list': ['rem', 'em'],
        indentation: [2, {
          baseIndentLevel: 0,
        }],
        // Disable the following rules
        'custom-property-no-missing-var-function': null,
        'no-descending-specificity': null,
      }
    }
  ]
}
