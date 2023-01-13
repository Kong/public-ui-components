# Creating a package

> Note: Docs are a work in-progress

- [Required: Use the provided CLI to scaffold your new package](#required-use-the-provided-cli-to-scaffold-your-new-package)
- [Package Structure](#package-structure)
- [Include a `package.json` file](#include-a-packagejson-file)
  - [`dependencies`](#dependencies)
  - [`peerDependencies`](#peerdependencies)
  - [`devDependencies`](#devdependencies)
  - [`scripts`](#scripts)
  - [`publishConfig`](#publishconfig)
  - [`files`](#files)
  - [`types`](#types)
- [Include `tsconfig` files](#include-tsconfig-files)
  - [`tsconfig.json`](#tsconfigjson)
  - [`tsconfig.build.json`](#tsconfigbuildjson)
- [Include a `README.md` file](#include-a-readmemd-file)
- [Implement your package within a `src/` directory](#implement-your-package-within-a-src-directory)
- [Component Requirements](#component-requirements)
  - [Styles](#styles)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Component Tests](#component-tests)
- [Integrate with CI](#integrate-with-ci)
  - [Publishing](#publishing)
- [Update `CODEOWNERS`](#update-codeowners)

## Required: Use the provided CLI to scaffold your new package

After running `pnpm install` to ensure your project is up-to-date and `pnpm run build` to make sure all dependent packages are available, you **must** use the provided CLI to create a new package.

```sh
pnpm run create-package
```

This will launch an interactive prompt that will first verify your desired package name is available and then scaffold the required package structure and files.

Once complete, the prompt will output the directory tree that was created and provide additional info on getting started.

```txt
Start Coding 🚀

Your new package comes with an interactive sandbox where you can
play with your new component.

Configure the component import and usage inside the
/packages/{workspace}/demo-component/sandbox/ directory.

# Start the dev server
$ pnpm --filter "@kong-ui/core-demo-component" run dev
```

## Package Structure

This monorepo comes pre-configured with config files and other settings that :sparkles: automatically  work :sparkles: for all packages when [created via the CLI](#required-use-the-provided-cli-to-scaffold-your-new-package). In order to take advantage of this shared setup, each project must be structured correctly, including:

- A `README.md` at the package root that explains the purpose of the package, usage instructions, etc. You can create additional `.md` files as needed for documentation, but please link to them from the package root `README.md`
- A `package.json` file in the package root. The package `name` must follow the pattern `@kong-ui/{workspace}-{package-name}` where `{workspace}` is the same as the child directory of `packages/` and `{package-name}` is the same as the directory name itself.
- A `tsconfig.json` that extends the root `tsconfig.json`
- A `tsconfig.build.json` that extends the local package `tsconfig.json`
- A `vite.config.ts` that extends (via `mergeConfig`) the root `vite.config.shared.ts`
- All code **must** be contained within the `{package-name}/src` directory
- A file at `src/index.ts` that exports all of the package exports.
- If utilizing **any** text strings, your package **must** utilize a `src/locales/{lang}.json` file for the text strings and incorporate the `useI18n` helper from `@kong-ui/core`
- All packages are initialized with their own fully-functional Vue sandbox.

## Include a `package.json` file

The `package.json` file is created automatically after running the CLI. Please consult the `package.json` files that are already within existing packages for a complete example.

Some important fields to consider when adding your `package.json` are:

### `dependencies`

Make sure to include all explicitly versioned runtime dependencies within this section. Packages that integrate or augment JS frameworks should not include the core framework dependencies in this section. Instead, these should be defined in [`peerDependencies`](#peerdependencies)

#### Depedencies on packages also managed within this monorepo

Add the dependency to your `package.json` file by package name using the _latest_ package version (as defined in its own `package.json` file). For example, if you are developing `@kong-ui/core-new-component` and `@kong-ui/core-demo-component` already exists as a package within `public-ui-components`, add the following to the `package.json` file of `@kong-ui/core-new-component`:

```json
"dependencies": {
  "@kong-ui/core-demo-component": "^1.6.2"
}
```

where `1.6.2` is the version that's currently listed in the `package.json` file of `@kong-ui/core-demo-component` within the `shared-ui-components` repo.

During local development, the local version of `@kong-ui/core-demo-component` will be symlinked and used within `@kong-ui/core-new-component`.
During our release automation, Lerna will ensure that the version of `@kong-ui/core-demo-component` required in the `package.json` of `@kong-ui/core-new-component` is kept up-to-date. That is, when a new version of `@kong-ui/core-demo-component` is released the `package.json` file of `@kong-ui/core-new-component` is also updated and thus a new version of `@kong-ui/core-new-component` is released.

### `peerDependencies`

Include loosely bounded (SemVer-wise) peer deps, i.e. `vue` or `vue-router`

### `devDependencies`

Common or shared `devDependencies` should be added within the monorepo root `package.json` file. `devDependencies` added within your specific package's `package.json` should only include `devDependencies` that only apply to your specific package.

To add common or shared `devDependencies`:

```bash
 pnpm add -wD @types/foo
```

To add package-specific `devDependencies`:

```bash
 pnpm --fiter="@kong-ui/core-demo-component" add -D @types/foo
```

### `scripts`

The following scripts should be defined within your package so that it's properly integrated within the monorepo development cycle (and CI/CD). Most of these are pre-configured when generating a new package via the CLI:

- `dev` to run the local sandbox of your component utilizing the files within the local `/sandbox/*` directory.
- `build` to compile/transpile your package into a `dist/` artifact
  - `build:package` (see existing examples)
  - `build:types` (see existing examples)
- `preview` to build your sandbox and build as if it was an app being built for production
  - `preview:package` (see existing examples)
- `lint` to validate your code style/formatting via ESLint
- `lint:fix` to automatically resolve basic code style/formatting issues with ESLint
- `typecheck` to validate typecheck the code
- `test:component` - to run Cypress component tests (if applicable)
- `test:unit` - to run Vitest unit tests (if applicable)

Your `scripts` section may also contain as many additional scripts as you'd like. However, please note that:

> All `scripts` MUST be executed from the root context of the monorepo

So, if you wanted to run lint the code in your package defined as the `lint` script command for a package named `@kong-ui/foo` you would run:

```sh
pnpm --filter "@kong-ui/core-demo-component" run lint
```

### `publishConfig`

The `publishConfig` field is important as it marks the package as public for the given organization scope (i.e. `@kong-ui/`) and leverages pnpm features to rewrite the `main` and `typings` fields at time of publish. It should look something like:

```json
"publishConfig": {
  "access": "public",
}
```

### `files`

The [`files`](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files) field specifies which files will be included in the published NPM package (note that some files are automatically included, see NPM docs). In general this should refer to at least the `dist/` directory, relative to the published package directory:

```json
"files": ["dist"]
```

### `types`

```json
"types": "dist/types/index.d.ts"
```

## Include `tsconfig` files

Please consult the `tsconfig.json` file that is already within existing packages for a complete example.

### `tsconfig.json`

Each package MUST have a `tsconfig.json` file that extends the **monorepo root** `tsconfig.json`. This file can add/override Typescript compiler options as needed by the package. The minimum required `tsconfig.json` is generated when running the CLI.

### `tsconfig.build.json`

Each package MUST have a `tsconfig.build.json` file that extends the local **package** `tsconfig.json` in order to exclude files and types that should be omitted from the build artifact. The minimum required `tsconfig.build.json` is generated when running the CLI.

## Include a `README.md` file

Each package SHOULD include a `README.md` file at the root of its package directory. This file should provide installation/usage documentation for consumers of the package. This file should be akin to the root `README` file that would exist if the package was a standalone Git repository.

The one exception is the `Development` section of the README. It is acceptable to omit that section or include a link/reference to the `Development` section of the monorepo root.

## Implement your package within a `src/` directory

All Vue and Typescript source code for your package should live within the `src/` directory of your package.

## Component Requirements

### Styles

#### Do not utilize Kongponents styles

Whenever possible, please **do not** utilize the "helper" classes provided by the Kongponents component library (e.g. `d-flex`, `w-100`, etc.). Components in this repository should truley be standalone as much as possible, and this requires writing in-component styles rather than depending on globally available styles.

The only exception is in utilizing CSS Variables for colors (e.g. `color: var(--blue-500, #1155cb));`); however, it is **required** to provide the native value as a fallback.

#### Styles must be scoped

In order to prevent component styles from leaking out into the consuming application, **all** component styles **MUST** adhere to one of the following rules:

1. (Preferred) All styles must be `scoped` within your components with `<style lang="scss" scoped>`.
   1. If you need to target nested components (e.g. Kongponents) to override styles, you'll need to utilize [deep selectors](https://vuejs.org/api/sfc-css-features.html#deep-selectors)

    ```html
    <style lang="scss" scoped>
    .your-component-class {
      :deep(.k-button) {
        /* KButton override styles go here */
        border-color: red;
      }
    }
    </style>
    ```

2. All component styles must be wrapped in a unique wrapper class so that styles do not leak out into the consuming application.

    The class name should follow the syntax `.kong-ui-{workspace}-{package-name}`

   This is a good practice even if you go with option one outlined above.

    ```html
    <style lang="scss">
    .kong-ui-core-demo-component {
      /* All other styles must go inside the wrapper */
    }
    </style>
    ```

#### Relative units

Styles should **never** use relative font units; specifically, do not use `rem` or `em` units.

We cannot control the `html` base font size and therefore these relative units are not predictable within a host application. Use `px` (pixels) or a similar unit instead.

#### CSS Variables

If your component exposes any CSS variables, they **must** be prefixed with your package name `--kong-ui-{workspace}-{package-name}`

For example, the `@kong-ui/core-app-layout` package exposes the following CSS variables:

```css
--kong-ui-core-app-sidebar-mobile-icon-color
```

## Testing

All packages should have substantial test coverage comprised of unit and/or component tests.

### Unit Tests

By convention, all unit tests MUST be included in the `src/` directory and follow the `*.spec.ts` filename pattern. A unit test can be defined as any test that does not require a visual UI running. Unit tests are run via [Vitest](https://vitest.dev/).

### Component Tests

By convention, component tests MUST be included in the `src/` directory and follow the `*.cy.ts` filename pattern. A component test can be defined as any test that DOES require a visual UI running. All components within this monorepo should have good component test coverage. Component tests are run via [Cypress Component Test Runner](https://docs.cypress.io/guides/component-testing/writing-your-first-component-test).

## Integrate with CI

By following this guide, CI integration should happen automatically. That is, your package will have the following out-of-the-box:

- Dependency Installation
- Linting & Code Validation
- Build
- Component & Unit Tests
- [Publishing](#publishing)

### Publishing

Packaging is automatic via the CI. Releases are done via lerna and follow semantic-versioning.

## Update `CODEOWNERS`

Please update the `CODEOWNERS` file at the root of the repository so that it includes your new package and specifies code owners for the package. This way, the code owners specified will automatically be added as reviewers to PRs that make contributions to your package.

Refer to the [Github Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) on `CODEOWNERS` for more information.

