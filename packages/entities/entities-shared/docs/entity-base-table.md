# EntityBaseTable.vue

A base table component for entity list views.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `tableHeaders`

- type: `Object as PropType<BaseTableHeaders>`
- required: `true`
- default: `{}`

Table header configurations.

#### `cellAttributes`

- type: `Function as PropType<(params: Record<string, any>) => Object>`
- required: `false`
- default: `() => ({})`

A function for applying attributes to cells.

#### `rowAttributes`

- type: `Function as PropType<(row: Record<string, any>) => Object>`
- required: `false`
- default: `() => ({})`

A function for applying attributes to rows.

#### `fetcher`

- type: `Function as PropType<(params: FetcherParams) => Promise<FetcherResponse>>`
- required: `true`
- default: `async () => ({ data: [] })`

The fetcher function passed to `<KTable>`.

#### `cacheIdentifier`

- type: `String`
- required: `false`
- default: `''`

A unique identifier for the table's entry in the cache. This should be unique across the Vue App.
If not provided, will default to the `preferencesStorageKey`.

#### `fetcherCacheKey`

- type: `Number`
- required: `false`
- default: `1`

Cache key for the fetcher. Passed to `<KTable>`.

#### `isLoading`

- type: `Boolean`
- required: `false`
- default: `false`

A Boolean to indicate the loading state of the table.

#### `query`

- type: `String`
- required: `false`
- default: `''`

Search query.

#### `enableEntityActions`

- type: `Boolean`
- required: `false`
- default: `true`

A Boolean to indicate whether to show the actions column.

#### `emptyStateOptions`

- type: `Object as PropType<EmptyStateOptions>`
- required: `false`
- default: `{}`

Options for the empty state.

#### `errorMessage`

- type: `String`
- required: `false`
- default: `''`

Error message to show in the error state.

#### `preferencesStorageKey`

- type: `String`
- required: `true`
- default: `''`

Table key to use for user table preferences. If empty, will fallback to use default preferences.

#### `title`

The table is rendered inside a `KCard`. `tttle` text is displayed in the upper left corner of the `KCard` above the table.

#### `disableRowClick`
Controls whether the table rows are clickable or not. Defaults to `false`. Setting to `true` will suppress the `click:row` event even if a `@click:row` handler is provided.

### Slots

#### `toolbar-filter`

This slot displays content left-aligned directly above the table. Typically a Search input is placed here.
Note: This slot is automatically hidden while the table is loading for the first time.

#### `toolbar-button`

This slot displays content right-aligned directly above the table. Typically a Create button is placed here.
Note: This slot is automatically hidden while the table is loading for the first time.

#### Cell Content

[`KTable`'s cell slots](https://kongponents.konghq.com/components/table.html#column-cell) are surfaced for use.

### Events

#### click:row

A `@click:row` event is emitted when a table row is clicked. The event payload contains the row item.

#### empty-state-cta-clicked

A `@empty-state-cta-clicked` event is emitted when the CTA button in the empty state is clicked.

#### clear-search-input

A `@clear-search-input` event is emitted when the clear button in the empty state is clicked.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityBaseTablePage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-base-table.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseTableHeaders,
  EmptyStateOptions,
  FetcherParams,
  FetcherResponse,
  InternalHeader,
} from '@kong-ui-public/entities-shared'
```
