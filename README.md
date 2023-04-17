# public-ui-components

> **Note**: Docs are a work in-progress

Monorepo for **open-source** Kong UI components and utilities.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

- [What goes here](#what-goes-here)
- [Creating a package](#creating-a-package)
- [Package Publishing](#package-publishing)
- [Development](#development)
  - [Requirements](#requirements)
  - [Setup](#setup)
  - [Dev Server](#dev-server)
  - [Stylelint](#stylelint)
  - [ESLint](#eslint)
  - [Type Checking](#type-checking)
  - [Testing](#testing)
  - [Preview sandbox build](#preview-sandbox-build)
  - [Build for production](#build-for-production)
  - [Committing Changes](#committing-changes)
- [Preview components](#preview-components)
- [Running consuming application with local copy of the package](#running-consuming-application-with-local-copy-of-the-package)

## What goes here

Here are some criteria to help figure out if your code belongs to this mono-repository. If all of the following are true, you are welcome to create a new package:

- Your code is open-source and/or at a minimum available to the public, and UI-related. If you are writing the code to be used privately at Kong, then [shared-ui-components](https://github.com/Kong/shared-ui-components) is the better choice.

## Creating a package

[View the guide on creating a new package within the monorepo here](./docs/creating-a-package.md)

## Package Publishing

[View the reference on how packages are versioned and published independently within the monorepo here](./docs/package-publishing.md)

## Development

All packages must be created utilizing the `pnpm run create-package` CLI. [See here for more details.](./docs/creating-a-package.md#required-use-the-provided-cli-to-scaffold-your-new-package)

Be sure to familiarize yourself with the [Component Requirements](./docs/creating-a-package.md#component-requirements), including style rules.

### Requirements

- [NodeJS >= 18.x](https://nodejs.org/en/download/)
- [pnpm 7.x](https://pnpm.io/installation) ([_Why pnpm?_](./docs/why-pnpm.md))

It is recommended to also _globally_ install [`lerna`](https://lerna.js.org/) with `pnpm` (though not absolutely required)

### Setup

To get started, install dependencies

```sh
pnpm install
```

Next, make sure all dependent packages (from the monorepo itself) are built and available

```sh
pnpm run build
```

You can also run `pnpm install-completion` to integrate `pnpm` autocompletion into your command line tools.

### Dev Server

Run the dev server in your `packages/{workspace}/{package-name}/sandbox/` directory with hot-module reload

```sh
pnpm --filter "@kong-ui-public/{package-name}" run dev
```

### Stylelint

Stylelint package files

```sh
# Lint only
pnpm --filter "@kong-ui-public/{package-name}" run stylelint

# Lint and fix
pnpm --filter "@kong-ui-public/{package-name}" run stylelint:fix
```

### ESLint

Lint package files

```sh
# Lint only
pnpm --filter "@kong-ui-public/{package-name}" run lint

# Lint and fix
pnpm --filter "@kong-ui-public/{package-name}" run lint:fix
```

### Type Checking

Type check your package

```sh
pnpm --filter "@kong-ui-public/{package-name}" run typecheck
```

### Testing

Run Component or Unit tests

```sh
# Component tests
pnpm --filter "@kong-ui-public/{package-name}" run test:component

# Component tests (with UI)
pnpm --filter "@kong-ui-public/{package-name}" run test:open

# Unit tests
pnpm --filter "@kong-ui-public/{package-name}" run test:unit

# Unit tests (with UI)
pnpm --filter "@kong-ui-public/{package-name}" run test:unit:open
```

### Preview sandbox build

Build your `packages/{package-name}/sandbox/` directory for production and serve locally

```sh
pnpm --filter "@kong-ui-public/{package-name}" run preview
```

### Build for production

```sh
pnpm --filter "@kong-ui-public/{package-name}" run build
```

### Committing Changes

This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). [Commitizen](https://github.com/commitizen/cz-cli) and [Commitlint](https://github.com/conventional-changelog/commitlint) are used to help build and enforce commit messages.

It is **highly recommended** to use the following command in order to create your commits:

```sh
pnpm commit
```

For more information on different components that compose our commit messages, please reference the [Package Publishing docs](./docs/package-publishing.md#conventional-commits)

#### Enforcing Commit Format

[Lefthook](https://github.com/evilmartians/lefthook) is used to manage Git Hooks within the repo.

- A `commit-msg` hook is automatically setup that enforces commit message stands with `commitlint`, see [`lefthook.yml`](./lefthook.yaml)
- A `pre-push` hook is used that runs `stylelint` and `eslint` before allowing you to push your changes to the repository

Additionally, CI will use `commitlint` to validate the commits associated with a PR in the `Lint and Validate` job.


## Preview components

You are working on the PR and changing component project. Let's say `@kong-ui-public/i18n`. You want to try to deploy consuming application (`khcp-ui` for example) that uses your changed code without merging your changes to main and publishing new version of `@kong-ui-public/i18n`. Here are the steps:

1. Look at your PR where your changes for `@kong-ui-public/i18n`. Every time PR is getting built, NPM  preview of package is getting deployed, and there is an updated PR comment created:

```text
Preview components from this PR in consuming application

In consuming application project install preview versions of shared packages generated by this PR:

// we are adding the version tagged on npm with your PR number
@kong-ui-public/i18n@pr-456

```

Install the preview version of the package in consuming application, let that PR be deployed, and see PR preview of consuming application utilizing `@kong-ui-public/i18n` code from your shared-ui-components PR branch.

_Never merge consuming application code that uses preview version of the package. PR versions will be deprecated and unpublished when your PR is closed._

## Running consuming application with local copy of the package

You are developing shared component (let's say `@kong-ui-public/forms`) and you need to run consuming application with the current version of the code you have locally in your `public-ui-components/packages/{workspace}/forms` branch. Here is how to do it:

1. in the folder `public-ui-components/packages/{workspace}/forms` run

    ```sh
    yarn link
    ```

2. make sure your package is getting build in watch mode, for this in in the folder `public-ui-components/packages/{workspace}/forms` run:

    ```sh
    pnpm build:package --watch
    ```

3. In the root folder of the host application/package run:

    ```sh
    yarn link "@kong-ui-public/forms"
    ```

4. Run your consuming application as usual and enjoy your forms code changes visible in your local env immediately.

    ```sh
    yarn run dev
    ```

In some cases HMR (hot module reloading) is not working out of the box in this configuration, to force it you might need following changes in `vite.config.ts` of consuming application:

1. add `watch: ignored` into the `server` config:

    ```ts
      server: {
          watch: {
            ignored: ['!**/node_modules/@kong-ui-public/forms/**']
          },
    ```

1. add `optimizeDeps` into the root of the config:

    ```ts
        optimizeDeps: {
          exclude: ['@kong-ui-public/forms']
        },
    ```

    _Please do not commit these changes_

    And finally, when you done working with local (linked copy) of your `public-ui-components` package, unlink it:

1. In the folder `public-ui-components/packages/{workspace}/forms` run

    ```sh
    yarn unlink
    ```

1. In the root folder of the host application/package run:

    ```sh
    yarn unlink "@kong-ui-public/forms"
    yarn install --force --frozen-lockfile
    ```

