module.exports = {
  extends: ['@commitlint/config-conventional'],
  // ignore dependabot version bump commits
  ignores: [(message) => /^Bumps \[.+]\(.+\) from .+ to .+\.$/m.test(message)],
  rules: {
    'header-max-length': [2, 'always', 108],
  },
  helpUrl: 'https://github.com/Kong/public-ui-components#committing-changes',
}
