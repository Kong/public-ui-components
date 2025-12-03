# Package Publishing

- [Conventional Commits](#conventional-commits)
- [Versioning](#versioning)
  - [New Packages](#new-packages)
  - [Approvals](#approvals)
  - [Releasing 1.x.x](#releasing-1xx)
  - [Breaking Changes](#breaking-changes)
- [Automation in CI](#automation-in-ci)

## Conventional Commits

This repo enforces the usage of [Conventional Commits](https://www.conventionalcommits.org/). Doing so enables us to completely automate the versioning/release of packages in CI. To help with crafting conventional commits, you can use `pnpm commit` when ready to commit which walks you through a CLI-based commit wizard.

## Versioning

Versioning is done via the [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version) command using the conventional commits setting. During CI, Lerna will diff the commit history and resolve all required version updates based on conventional commit messages and the topology of the dependency graph. For each new package version, Lerna will create a commit updating the respective `package.json` file as well as creating a git tag and GitHub release.

### New Packages

A new package must first be published manually, and then configured for OIDC trusted publishing.
Please reach out to #ask-eng-enablement-guild for assistance.

Packages are versioned using conventional commits and semantic versioning. When a package is first created it should have `0.0.1` in its `package.json`, which leads to the `0.1.0` being the first package version published during CI given a `feat` commit is used.

When a package is in `0.x.x` stage, any breaking changes will only bump the minor version. It is __STRONGLY SUGGESTED__ to keep new packages in this versioning stage for a period of __at least 6 months__. Breaking changes are inevitable in the early stages of a new package and it takes time for consumers to become more familiar with the package API.

### Approvals

- All pull requests require review and approval from authorized team members.
- Automated approvals through workflows are strictly prohibited.
  - There is an exception for automated pull request approvals originating from generated dependency updates that satisfy status checks and other requirements.
- Protected branches require at least one approval from code owners.
- All status checks must pass before a pull request may be merged.

### Releasing 1.x.x

Outside of package creation, the only time the `version` field of a package's `package.json` file is manually changed is when the maintainer intends to release the inaugural `1.x.x` major version. When a package is ready to be promoted to `1.x.x`, open a PR that bumps the `version` field to `1.0.0`.

Once a package is released at `1.x.x`, any additional breaking changes committed to the package will result in a major version bump (i.e. `1.0.4` -> `2.0.0`).

### Breaking Changes

Conventional Commits are used to indicate to the versioning system when a breaking change occurs in a package as well as documenting the change. This is done by including a `BREAKING CHANGE:` line in the footer of the commit message ([example](https://www.conventionalcommits.org/en/v1.0.0/#commit-message-with-description-and-breaking-change-footer)). Note that by using `pnpm commit`, you'll automatically be prompted for any breaking changes and the CLI tool will format the commit message properly for you.

In general, the above consideration is all that is required when making a breaking change. However, there are times where the breaking change is excessively large and/or it hinges on a new major version of a framework like `vue`. In this case, it can become very costly for consuming applications to upgrade to the latest version of the package. Some applications may be legacy and not have any plans to upgrade the associated framework to the required peer version.

When this is the case, we can do the following in order to ensure that consuming applications are not forced to upgrade the package when critical updates such as hotfixes or security patches are made to the package:

1. Ensure that the breaking change bumps the _major_ version of the package. A manual commit is required here only when the package is currently in its `0.x.x` versioning stage.
2. Prior to merging the PR that introduces the breaking change, create a new branch off of the current `main` branch. For example, if `@kong-ui-public/i18n` is going to be bumped from `1.3.2` -> `2.0.0`, create a branch called `i18n-1.x`.
3. Merge the PR introducing the breaking change into `main`, thereby releasing the next major version of the package.
4. If the package has a critical defect or vulnerability that needs to be patched, the PR to do so can be made against _both_ `main` and `i18n-1.x` (or either).
5. Package maintainers can then manually release `1.x.x` patch/minor releases from the `i18n-1.x` branch by using `lerna` and `pnpm` directly on their workstation.

The need for the above strategy should be rare, but nonetheless it gives us an out to keep applications whose dependencies are less up-to-date compliant and bug free.

<!-- TODO: Update for `public-ui-components` if desired; we currently do not expose this command -->
<!-- ## Publishing

Publishing versioned packages is actually a very simple task. From the monorepo root run:

```bash
pnpm run publish
```

This command will run the [`pnpm publish`](https://pnpm.io/cli/publish) command recursively in all packages. Fortunately, the command is smart and will compare the semver contained in each package's `package.json` at `HEAD` against the latest semver of the package that's published to the NPM registry. If the package version is not already published, `pnpm` will publish the new package version to the registry. Otherwise, the package is skipped. -->

## Automation in CI

Package versioning and publishing is handled automatically by our [CI](../.github/workflows/ci.yaml). When a PR is merged into `main`, the CI workflow will:

1. Run Tests / Validate / Lint / etc
2. Create publishable artifacts
3. Create new versions of affected packages. This includes:
    - `CHANGELOG.md` generation
    - Creating/Pushing commits back to `main` updating the `version` field in `package.json` files
    - Creating/Pushing git tags / GH releases
4. Publish all newly versioned packages to NPM
