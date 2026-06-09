# KTableData Migration Guide

Use this guide when moving a host app from Kongponents `KTableData` to `@kong-ui-public/table-data-grid`.

`TableDataGrid` is not a drop-in replacement for `KTableData`. `KTableData` wraps `KTableView` and owns SWRV-backed fetching, search query state, table preferences, and pagination state. `TableDataGrid` wraps AG Grid and exposes explicit fetch modes, controlled `tableConfig`, AG Grid-backed column mechanics, and wrapper-owned sort state forwarded to the host fetcher. Toolbar and slot composition remain familiar, but some slot names and slot props need migration.

For the full public API, use the package README. This guide focuses on migration decisions and reviewer checks.

## Pick the fetch mode first

Choose the mode before translating props. The fetch mode determines the fetcher params, pagination UI, refresh behavior, and how the host maps old `KTableData` pagination state.

| Existing `KTableData` shape | Recommended `TableDataGrid` mode | Notes |
| --- | --- | --- |
| Page-number API using `page` and `pageSize` | `pagination` | This is the closest match. Return `{ data, total }` when total is known. |
| Offset API where offset can be derived from `page` and `pageSize` | `pagination` | Compute `offset = (page - 1) * pageSize` in the host fetcher. |
| Cursor or next-offset API that loads sequential blocks | `infinite` | Map the API cursor or next offset to `cursor`; return `hasMore` when available. |
| `paginationAttributes.offset` with previous/next offset buttons | `infinite` or custom pagination UI | `KTableData` offset mode is a previous/next cursor-style pagination UI. `TableDataGrid` has numbered pagination and scroll-driven infinite loading, but no previous/next offset controls. |
| Local full dataset with `clientSort` | `pagination` with host-owned local sorting/slicing | `TableDataGrid` has no `clientSort` prop. Sort the local array inside the fetcher when sort params change. |

## Contract mapping

| `KTableData` | `TableDataGrid` | Migration note |
| --- | --- | --- |
| `KTableData` import from `@kong/kongponents` | `TableDataGrid` import from `@kong-ui-public/table-data-grid` | Update types and component imports together. |
| `TableDataHeader` | `TableDataGridHeader<Row>` | Header keys still drive cell slot names. |
| `headers[].hidable` | `headers[].hideable` | Rename the field. `hideable` defaults to true in `TableDataGrid`. |
| `headers[].useSortHandlerFunction` | No equivalent | Remove it. Sort UI/state comes from AG Grid, but the host fetcher owns the sorted result order. |
| `headers[].sortable` | `headers[].sortable` | Same intent, but the emitted sort payload differs. |
| Host-rendered filters in `#toolbar` | `headers[].filter` plus `v-model:filter-selection` | `TableDataGrid` has first-class `KFilterGroup` integration. Active filters are passed to the fetcher as `filterSelection`. |
| `headers[].tooltip` | `headers[].tooltip` | Supported as a string tooltip. Header tooltip slots are not a first-class migration target. |
| `headers[].key === 'actions'` plus `#action-items` | `actions` cell slot plus `disableRowClick: true` | Render action controls inside the column slot. Disable row click for action/control columns. |
| `rowKey` string or function | `rowKey` string field | `TableDataGrid` requires a stable row field. Add a real field before migrating function-based keys. |
| `rowAttrs(row)` | `rowAttrs(row)` | Same broad purpose. Return DOM attrs for the AG Grid row. |
| `cellAttrs({ headerKey, row, rowIndex, colIndex })` | `cellAttrs({ column, row, rowValue, rowIndex, colIndex })` | Use `column.key` instead of `headerKey`. |
| `tablePreferences` | `tableConfig` | Use `toTableDataGridConfig()` when migrating persisted `TablePreferences`. |
| `update:table-preferences` | `update:table-config` | Persist `TableDataGridConfig`, or convert it back with `toTablePreferences()` while the host still stores the old shape. |
| `fetcherCacheKey` | `refreshKey` or exposed `refresh()` | `refreshKey` is the closest prop-level replacement. |
| `cacheIdentifier` | No equivalent | `TableDataGrid` does not expose SWRV cache identity. Remove it. |
| `initialFetcherParams.pageSize` | `pageSize` or `tableConfig.pageSize` | `initialFetcherParams` is currently limited to initial search. |
| `initialFetcherParams.query` | `initialFetcherParams.search` | Rename only if the table needs an initial search value. |
| `searchInput` | Built-in search or toolbar slot `updateSearch()` | Use `enableSearch` for built-in search, or drive `updateSearch()` from a custom toolbar/outside slot. |
| `#toolbar` with `{ state }` | `#toolbar`, `#toolbar-left`, `#toolbar-right`, or `#outside-actions` | Toolbar slot props are different. Use the `state` event or host loading/error state if the toolbar needs table state. |
| `query` fetcher param | `search` fetcher param | Rename host API mapping from `query` to `search`. |
| Host-owned filter params | `filterSelection` fetcher param | Move filter state into `v-model:filter-selection` so table refreshes and fetcher params stay aligned. |
| `paginationAttributes.pageSizes` | `paginationPageSizeOptions` | Active page size is also tracked in `tableConfig.pageSize`. |
| `paginationAttributes.initialPageSize` | `pageSize` | Use `tableConfig.pageSize` when persisted preferences should win. |
| `paginationAttributes.offset` | `mode="infinite"` or host-derived offset in `pagination` mode | Numeric offsets can usually be derived from page/page size. Previous/next cursor-style offset controls need infinite mode or host-owned pagination UI. |
| `hidePagination` | `hidePagination` | Only relevant in pagination mode. |
| `hidePaginationWhenOptional` | `hidePaginationWhenOptional` | Same intent for pagination mode. |
| `hideToolbar` | `hideToolbar` | Built-in controls with outside targets can remain mounted. |
| `loading` | `loading` | Host-forced loading state is supported. |
| `error` | `error` | Host-forced error state is supported and should be used when visible error chrome is required. |
| `state` event | `state` event | Similar shape, but background refetch and infinite failures can preserve visible success state while rows remain. |
| `revalidate()` expose | `refresh()` expose | `refresh()` refetches the first page or rebuilds the infinite datasource. |

## Fetcher migration

`KTableData` fetchers receive `query`, optional `offset`, and optional page params:

```ts
import type { TableDataFetcherParams } from '@kong/kongponents'

const fetcher = async ({
  page = 1,
  pageSize = 15,
  query = '',
  sortColumnKey,
  sortColumnOrder,
}: TableDataFetcherParams) => {
  const response = await api.list({
    pageNumber: page,
    pageSize,
    filter: query,
    sort: sortColumnKey && sortColumnOrder
      ? `${sortColumnKey} ${sortColumnOrder}`
      : undefined,
  })

  return {
    data: response.data,
    total: response.total,
  }
}
```

`TableDataGrid` fetchers receive an explicit `mode` plus mode-specific params. For a page-number API, use pagination mode:

```ts
import type { TableDataGridFetcher } from '@kong-ui-public/table-data-grid'

const fetchRows: TableDataGridFetcher<UserRow> = async ({
  page = 1,
  pageSize,
  search = '',
  sortColumnKey,
  sortColumnOrder,
}) => {
  const response = await api.list({
    pageNumber: page,
    pageSize,
    filter: search,
    sort: sortColumnKey && sortColumnOrder
      ? `${sortColumnKey} ${sortColumnOrder}`
      : undefined,
  })

  return {
    data: response.data,
    total: response.total,
  }
}
```

For an offset API that still renders pagination, derive the offset in the host:

```ts
const fetchRows: TableDataGridFetcher<RequestRow> = async ({
  page = 1,
  pageSize,
  search,
}) => {
  const offset = (page - 1) * pageSize
  const response = await api.listRequests({ offset, limit: pageSize, search })

  return {
    data: response.results,
    total: response.total,
    hasMore: response.results.length === pageSize,
  }
}
```

For cursor or next-offset APIs, prefer infinite mode:

```ts
const fetchRows: TableDataGridFetcher<RequestRow> = async ({
  pageSize,
  startRow = 0,
  cursor,
}) => {
  const response = await api.listRequests({
    cursor,
    offset: startRow,
    limit: pageSize,
  })

  return {
    data: response.results,
    cursor: response.nextCursor,
    hasMore: response.hasMore,
  }
}
```

If the old `KTableData` fetcher caught errors and returned `undefined`, change that policy during migration. `TableDataGrid` fetchers should resolve to a result shape when the host wants to keep the table in a non-error state, or reject and let the wrapper emit fetch-error state. Set the `error` prop when the host wants visible error chrome.

## Search migration

`KTableData` accepts a `searchInput` prop and forwards it to the fetcher as `query`.

```vue
<KTableData
  :fetcher="fetcher"
  :headers="headers"
  :search-input="searchText"
>
  <template #toolbar>
    <KInput
      v-model.trim="searchText"
      type="search"
    />
  </template>
</KTableData>
```

For the built-in `TableDataGrid` search input, use `enableSearch`:

```vue
<TableDataGrid
  enable-search
  :fetcher="fetchRows"
  :headers="headers"
/>
```

For a custom search input, use a toolbar or outside slot and call `updateSearch()`:

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
>
  <template #toolbar-left="{ search, updateSearch }">
    <KInput
      :model-value="search"
      type="search"
      @update:model-value="updateSearch"
    />
  </template>
</TableDataGrid>
```

Use `initialFetcherParams.search` only for the initial search value. Do not use it as a controlled search prop.

## Filtering migration

`KTableData` does not have a first-class filtering contract. Host apps commonly render filters in the toolbar, keep filter state locally, and include those values in a custom `fetcherCacheKey` or fetcher closure.

`TableDataGrid` can render `KFilterGroup` from header definitions. Add `filter` to filterable headers, bind `v-model:filter-selection`, and read `filterSelection` from the fetcher params.

```vue
<script setup lang="ts">
import type { FilterGroupSelection } from '@kong/kongponents'
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
} from '@kong-ui-public/table-data-grid'
import { ref } from 'vue'

type UserRow = {
  id: string
  name: string
  status: string
}

const filterSelection = ref<FilterGroupSelection>({})

const headers: Array<TableDataGridHeader<UserRow>> = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    filter: {
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  },
]

const fetchRows: TableDataGridFetcher<UserRow> = async ({
  filterSelection,
  page = 1,
  pageSize,
}) => {
  const selectedStatus = filterSelection?.status?.value
  const response = await api.listUsers({
    pageNumber: page,
    pageSize,
    filter: selectedStatus
      ? {
        status: {
          eq: selectedStatus,
        },
      }
      : undefined,
  })

  return {
    data: response.data,
    total: response.total,
  }
}
</script>

<template>
  <TableDataGrid
    v-model:filter-selection="filterSelection"
    :fetcher="fetchRows"
    :headers="headers"
  />
</template>
```

Default `KFilterGroup` filters update `v-model:filter-selection` before the fetcher receives `filterSelection`. Custom filter slots named `filter-${header.key}` are still host-owned: the slot content must update the matching `filterSelection` entry when applying or clearing the filter.

## Table preferences migration

`KTableData` persists Kongponents `TablePreferences`. `TableDataGrid` persists `TableDataGridConfig`. The package exports helpers for hosts that need to read or write the old shape during migration.

```ts
import {
  toTableDataGridConfig,
  toTablePreferences,
  type TableDataGridConfig,
} from '@kong-ui-public/table-data-grid'
import type { TablePreferences } from '@kong/kongponents'

const tablePreferences = ref<TablePreferences>(loadPreferences())
const tableConfig = ref<TableDataGridConfig>(
  toTableDataGridConfig(tablePreferences.value),
)

const saveTableConfig = (config: TableDataGridConfig) => {
  tableConfig.value = config
  tablePreferences.value = toTablePreferences(config)
  savePreferences(tablePreferences.value)
}
```

Then bind the converted config:

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
  :table-config="tableConfig"
  @update:table-config="saveTableConfig"
/>
```

Review persisted defaults while migrating:

- Kongponents `TablePreferences.columnWidths` and `TablePreferences.columnVisibility` keys should still match header keys; `toTableDataGridConfig()` converts them to `TableDataGridConfig.columns[key].width` and `TableDataGridConfig.columns[key].visible`.
- `headers[].hidable` must be renamed to `headers[].hideable`.
- Use `headers[].visible = false` when a hideable column should start hidden by default. `tableConfig.columns[key].visible` is the current/persisted state and overrides that default after user or host changes.
- Visibility is not applicable to `hideable: false` columns; they resolve to visible regardless of `headers[].visible` or `tableConfig.columns[key].visible`.
- `pageSize` should be set through `pageSize` or `tableConfig.pageSize`, not `initialFetcherParams.pageSize`.
- `TableDataGridConfig` can also persist top-level `columnOrder` and `columns[key].pinned`; pinning does not exist in `KTableData` preferences.
- `columns[key].pinned = false` explicitly unpins a column even when the matching header has a default `pinned` value.

## Slots and interaction migration

Dynamic cell slots still use the header key as the slot name, but slot props differ.

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
>
  <template #email="{ row, rowValue, column }">
    <span :data-column="column.key">
      {{ rowValue || row.email }}
    </span>
  </template>
</TableDataGrid>
```

Action dropdowns should become normal cell content in an action column:

```ts
const headers: Array<TableDataGridHeader<UserRow>> = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'actions',
    label: 'Actions',
    hideLabel: true,
    disableRowClick: true,
    width: 120,
  },
]
```

```vue
<template #actions="{ row }">
  <KButton
    appearance="tertiary"
    size="small"
    @click="editUser(row)"
  >
    Edit
  </KButton>
</template>
```

Bulk actions require row selection:

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
  row-selection="multiple"
>
  <template #bulk-action-items="{ selectedRows }">
    <KDropdownItem @click="deleteUsers(selectedRows)">
      Delete selected
    </KDropdownItem>
  </template>
</TableDataGrid>
```

`row:click` payload order changes. `KTableData` handlers commonly receive `(event, row)`. `TableDataGrid` emits `(row, event)`.

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
  @row:click="(row, event) => openUser(row, event)"
/>
```

## Known non-equivalents

Some `KTableData` and inherited `KTableView` features do not have first-class `TableDataGrid` equivalents.

| `KTableData` behavior | Migration guidance |
| --- | --- |
| SWRV caching through `cacheIdentifier` | Remove the cache identifier. Use host cache state, `refreshKey`, or the exposed `refresh()` method for refetches. |
| `fetcherCacheKey` revalidation without visible loading from cached data | Use `refreshKey`; review loading UX because the behavior is not SWRV-backed. |
| `clientSort` and `sortHandlerFunction` | Move sorting into the host fetcher, even if the fetcher sorts and slices a local array. |
| `paginationAttributes.offset` previous/next events | Use infinite mode or write host-owned pagination UI. There is no direct `get-next-offset` or `get-previous-offset` event. |
| Function-based `rowKey` | Add a stable row identity field and pass that field name. |
| `rowLink` | Use `row:click` navigation or render links inside cells. |
| Expandable or nested rows | Review separately before migration. They are not a mechanical prop mapping. |
| Header content slots like `column-*` and tooltip slots like `tooltip-*` | Prefer header labels/tooltips. Use `agGridColumnOptions` only when lower-level AG Grid behavior is intentionally needed. |
| KTableView pagination events | `TableDataGrid` owns pagination and emits fetch/config/state events instead. |

## Migration review checklist

Use this checklist when reviewing a migrated table:

- Fetch mode matches the backend contract.
- Fetcher params were renamed from `query` to `search`.
- Built-in filters use `headers[].filter`, `v-model:filter-selection`, and the fetcher `filterSelection` param.
- Fetcher always resolves a valid result or intentionally rejects.
- `fetcherCacheKey` migration uses `refreshKey` or an explicit `refresh()` call.
- Search and filter changes refresh the expected rows and reset pagination as expected.
- Persisted `tablePreferences` are converted to `tableConfig`.
- Header fields were renamed from `hidable` to `hideable`.
- Action/control columns use `disableRowClick: true`.
- `row:click` handlers use the new `(row, event)` payload order.
- `cellAttrs` uses `column.key` instead of `headerKey`.
- Unsupported KTableData behavior was intentionally replaced, removed, or called out for follow-up.
