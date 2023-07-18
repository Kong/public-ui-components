# Moving packages to the public or private repo

This document outlines the suggested process for moving packages between [`Kong/shared-ui-components`](https://github.com/Kong/shared-ui-components) and [`Kong/public-ui-components`](https://github.com/Kong/public-ui-components).

This process can be followed regardless of which repository is the source or destination.

- [Copying a package](#copying-a-package)
- [Package checklist](#package-checklist)
  - [`package.json` \> `name`](#packagejson--name)
  - [`package.json` \> `version`](#packagejson--version)
  - [`package.json` \> `publishConfig`](#packagejson--publishconfig)
  - [`package.json` \> `license`](#packagejson--license)
  - [`package.json` \> script environment variables](#packagejson--script-environment-variables)
  - [Repository paths](#repository-paths)
  - [Update local package references](#update-local-package-references)
  - [Install package dependencies](#install-package-dependencies)
  - [Build dependent packages](#build-dependent-packages)
  - [Update dependent packages](#update-dependent-packages)
  - [Cleanup old package](#cleanup-old-package)

## Copying a package

While [creating a new package](./creating-a-package.md) is still **required** to go through the included CLI, since the two repositories are structured almost identically in terms of the nested workspaces, the easiest way to **move** a package is to simply copy/paste the package directory into its new location.

Once you have copied the package structure and verified it is located in the proper workspace, please go through the checklist below to ensure a smooth migration.

## Package checklist

### `package.json` > `name`

Update the `name` of your package for the **required** npm scope.

Repository | NPM scope
---------|----------
`shared-ui-components` | `@kong-ui`
`public-ui-components` | `@kong-ui-public`

For example, if your package is moving from the private repo to the public repo:

```txt
// Old name
@kong-ui/analytics-utilities

// New name
@kong-ui-public/analytics-utilities
```

**Once you update the package name, search the new repository for any instances of the _old_ package name and replace accordingly.**

### `package.json` > `version`

The `version` of your package, now that it will be published under a new NPM scope, can remain the same, or you can choose to increment or reset the version.

At a minimum, you should bump the `patch` version of the package; however, you may want to bump the major version to provide a clear division of when the package was changed to public/private.

To update the `version`, manually change the version number in the `package.json` file.

### `package.json` > `publishConfig`

Update the `publishConfig.access` property for to publish the package as private or public.

Repository | `publishConfig.access` property
---------|----------
`shared-ui-components` | `restricted`
`public-ui-components` | `public`

For example, if your package is moving from the private repo to the public repo:

```jsonc
// Old config
"publishConfig": {
  "access": "restricted"
}

// New config
"publishConfig": {
  "access": "public"
}
```

### `package.json` > `license`

If moving into the public repository, you **must** add an Apache-2.0 license to the root of your package ([here's an example](https://github.com/Kong/public-ui-components/blob/main/LICENSE)), as well as update the `license` entry in your package's `package.json` file to `"license": "Apache-2.0"`.

If you are moving into the private repository, make sure to _remove_ the LICENSE file and update the `license` entry in your package's `package.json` file to `"license": "UNLICENSED"`.

### `package.json` > script environment variables

Some of the scripts utilized in your package's `package.json` file are likely set to the workspace path, e.g. `BUILD_VISUALIZER`.

Please ensure this path is still correct in the new repository, especially if your package was moved to a different workspace name.

### `vite.config.ts` > `build.lib.name`

In public-ui-components, the name starts with `kong-ui-public-`.  In `shared-ui-components`, it starts with `kong-ui-`.

### `CODEOWNERS`

If needed, update `CODEOWNERS`.

### Repository paths

There are references to the repository URL in the `package.json` file of your package and possibly in your package's documentation.

Search your package for any instances of the **old** repository path and replace it with the **new** path; including the `package.json` file, docs, etc.

For example, in the `package.json` file, the `homepage` and `repository.url` values need to be updated.

### Update local package references

Your package may have been dependent on other packages in its old host repository, referenced by `workspace` versions in the `package.json` file.

Since your package has been moved out of the same repository as the dependency, you will need to update the value for the package version.

As an example, maybe your package depends on `@kong-ui-public/core` package:

```jsonc
"@kong-ui-public/core": "workspace:^0.17.0",
```

In the new repository, since this package is no longer locally available, you will need to update to the actual published version:

```jsonc
// Assuming that 1.2.3 is the latest version
"@kong-ui-public/core": "^1.2.3",
```

The same logic applies for packages that were **not** previously available in the repository workspace, but now **are** available.

You'll want to update to utilize the workspace version by applying the inverse of the example above.

#### Utilize the install command

If you are unsure what version/workspace version should be installed, you can run the normal install command and let pnpm do the work for you:

```sh
pnpm --filter "{your package name}" add {dependency package name}
```

For example:

```sh
pnpm --filter "@kong-ui/entities-shared" add @kong-ui-public/core@latest
```

### Install package dependencies

After making the updates outlined above, you will want to install your package's dependencies in the new repository.

From the root of the new repository, run the install command

```sh
pnpm install
```

### Build dependent packages

If your package depends on other **local** packages in the same repository, you will want to build those packages in order to prepare them for consumption by your new package.

For example:

```sh
pnpm --filter "@kong-ui-public/core" run build
```

### Update dependent packages

Create Pull Requests in any consuming Kong project(s) to replace the old package with the new, keeping in mind the package name and version will be different.

### Cleanup old package

Once you have merged your new package into its new repository, you will want to **remove** the package from the old repo.

1. Checkout a new branch in the old repository
2. Delete the old package directory from its workspace folder (if your old package was the only one in the workspace, **leave the workspace folder in place**)
3. Check the old repository for root `package.json` dependencies that were **only** utilized by your package. If they are no longer needed, utilize the proper `pnpm` command to remove them (be 100% certain here as this can break other packages)
4. Run `pnpm install` to remove any dependencies and update the lockfile accordingly
5. Push up a Pull Request to remove the code
6. Decide if the old package should be unpublished or deprecated from NPM. **One or the other must be completed as part of this process**
