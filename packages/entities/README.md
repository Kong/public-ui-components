# public-ui-components/packages/entities/*

> **Note**: Docs are a work in-progress

- [Getting Started](#getting-started)
  - [Add proxy rules](#add-proxy-rules)
- [Package `dependencies`](#package-dependencies)
- [Package `peerDependencies`](#package-peerdependencies)
- [Package Exports](#package-exports)
- [Strings / i18n](#strings--i18n)
- [List Components](#list-components)
  - [Component HTML](#component-html)
  - [Emits](#emits)
  - [Props](#props)
  - [Fetching / Filtering](#fetching--filtering)
  - [Sorting Table Columns](#sorting-table-columns)
- [Gotchas](#gotchas)

## Getting Started

Before starting to code your new entity component, it's recommended that you check out our [`entities-shared`](https://github.com/Kong/public-ui-components/tree/main/packages/entities/entities-shared) package to see what utilities we provide out of the box.

All components should be created in the `entities` package, follow the naming standard `entities-<entity-type-pluralized>`, ie. `entities-gateway-services`.

After pulling the latest from `main` and running `pnpm install`, create the new entity using the CLI:

- `pnpm run create-package`
- [CLI Usage Instructions](https://github.com/Kong/public-ui-components/blob/main/docs/creating-a-package.md#required-use-the-provided-cli-to-scaffold-your-new-package)

### Add proxy rules

You will need to add the following code to the default `vite.config.ts` file in your package to set up the API proxies:

```ts
// only showing the relevant code
import sharedViteConfig, { getApiProxies } from '../../../vite.config.shared'

const config = mergeConfig(sharedViteConfig, defineConfig({
  // === ADD THIS SECTION === //
  server: {
    proxy: {
      // Add the API proxies to inject the Authorization header
      ...getApiProxies(),
    },
  },
  // ^^^ ADD THIS SECTION ^^^ //
}))
```

## Package `dependencies`

All entities packages should likely have a dependency on the `@kong-ui-public/entities-shared` package. From the repo root, you can run:

```shell
pnpm --filter "@kong-ui-public/entities-{package-name}" add @kong-ui-public/entities-shared
```

## Package `peerDependencies`

Make sure the following packages are added as peer dependencies.

- `vue`
- `vue-router`
- `@kong/kongponents`
- `@kong-ui-public/i18n`
- `axios`

From the repo root, you can run:

```shell
pnpm --filter "@kong-ui-public/entities-{package-name}" add --save-peer vue vue-router @kong/kongponents @kong-ui-public/i18n axios
```

## Package Exports

We should not be exporting any of these packages as a Vue plugin, so make sure to remove the related code for that from your generated `src/index.ts` file.

## Strings / i18n

Each entity should make use of `@kong-ui-public/i18n` for any text strings (ex. table headings, action menu button labels), added as a [`peerDependency`](#package-peerdependencies)

## List Components

### Component HTML

Every list entity's HTML template will consist of a containing `div` and an instance of `EntityBaseTable` and `EntityDeleteModal`

Slots:

- `#toolbar-filter` - contains an instance of `EntityFilter`
- `#toolbar-button` - this is the create button and should consist of a `KButton` wrapped in a `PermissionsWrapper`
- `#<column-key>` - special formatting for table columns
- `#actions` - the action menu column will always support four actions: `Copy ID`, `View Details`, `Edit`, `Delete` (each action is wrapped in a `PermissionsWrapper`)

### Emits

Each list entity will emit the following events to be handled in the parent application to hook into:

- `error`
- `loading`
- `copy-id:success`
- `copy-id:error`
- `delete:success`

### Props

Each list entity will take the following props:

- `config`
- `canCreate`
- `canDelete`
- `canEdit`
- `canRetrieve`

### Fetching / Filtering

- Each entity should have computeds for `fetcherBaseUrl` (passed to the `useFetcher` composable) and `filterConfig` (check the KM UI to determine which fields should support filtering in KM)
- Each entity should correctly handle empty, loading, and error states
- Each entity will have event handlers for `Copy ID`, `Row Click`, `View Details`, `Edit`, `Delete`

### Sorting Table Columns

We have decided to disable sorting of columns in Konnect until Koko supports it rather than do a mixture of backend pagination and client side sorting

Please make sure column sorting is only enabled for the KM version of the table.

## Gotchas

- Please take some time to read through the [component requirements](https://github.com/Kong/public-ui-components/blob/main/docs/creating-a-package.md#component-requirements) (it's short, I promise)
- New components should use `setup` syntax
- Remember to follow the new best practice of using the `t()` function for i18n instead of creating a `helpText` variable
  - ex. `t('routes.list.table_headers.name')`
- Do not explicitly import Kongponents
- **DO NOT USE KONGPONENTS HELPER CLASSES** (see component requirements for explanation)
