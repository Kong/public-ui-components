# @kong-ui-public/analytics-datatable

Reusable AG Grid based datatable wrapper for analytics-style Vue tables.

## Core Features

- Server-driven pagination with known or unknown total row counts
- Infinite cursor loading for scroll-driven datasets
- Typed headers and fetcher contracts
- Slotted cell rendering by column key
- Controlled or internal table configuration state
- Column ordering, visibility, pinning, sorting, sizing, and fit-to-width behavior
- Row click, cell click, single-row selection, multi-row selection, and disabled selection modes
- Bulk action slot for selected rows
- Header-driven `KFilterGroup` filters
- Opt-in server-driven search
- Composable toolbar slots for host-owned controls
- Row and cell attribute hooks for test ids, accessibility, and integration-specific metadata
- Built-in loading, empty, and error states with override slots
- Table preference and sort payload conversion helpers
- `agGridOptions` escape hatch for lower-level AG Grid configuration

## Dependencies

Install the package in the host application:

```sh
pnpm add @kong-ui-public/analytics-datatable
```

Host applications must provide these peer dependencies:

- `vue`
- `@kong-ui-public/i18n`
- `@kong/icons`
- `@kong/kongponents`

The package depends directly on these AG Grid packages, so consumers do not need to install them separately:

- `ag-grid-community`
- `ag-grid-vue3`

## Usage

### Basic Paginated Table

```vue
<template>
  <AnalyticsDatatable
    v-model:filter-selection="filterSelection"
    :fetcher="fetchRows"
    :headers="headers"
    mode="pagination"
    row-key="id"
    row-selection="multiple"
    :table-config="tableConfig"
    @row:select="selectedRows = $event"
    @update:table-config="tableConfig = $event"
  >
    <template #status="{ row }">
      <KBadge :appearance="row.status >= 500 ? 'danger' : 'success'">
        {{ row.status }}
      </KBadge>
    </template>
  </AnalyticsDatatable>
</template>

<script setup lang="ts">
import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableFetcher,
  AnalyticsDatatableHeader,
} from '@kong-ui-public/analytics-datatable'
import type { FilterGroupSelection } from '@kong/kongponents'
import { ref } from 'vue'
import { AnalyticsDatatable } from '@kong-ui-public/analytics-datatable'

type Row = {
  id: string
  route: string
  status: number
  latency: number
}

const headers: Array<AnalyticsDatatableHeader<Row>> = [
  { key: 'route', label: 'Route', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: 120 },
  { key: 'latency', label: 'Latency', sortable: true, tooltip: 'Latency in milliseconds' },
]

const tableConfig = ref<AnalyticsDatatableConfig>()
const filterSelection = ref<FilterGroupSelection>({})
const selectedRows = ref<Row[]>([])

const fetchRows: AnalyticsDatatableFetcher<Row> = async ({
  page = 1,
  pageSize,
  sortColumnKey,
  sortColumnOrder,
  filterSelection,
}) => {
  const response = await fetch('/api/requests', {
    method: 'POST',
    body: JSON.stringify({ page, pageSize, sortColumnKey, sortColumnOrder, filterSelection }),
  })

  return response.json()
}
</script>
```

The fetcher must return `{ data, total?, cursor?, hasMore? }`. Paginated tables use `page`, `pageSize`, `sortColumnKey`, `sortColumnOrder`, `search`, and `filterSelection`; infinite tables use `startRow`, `endRow`, `cursor`, `pageSize`, `sortColumnKey`, `sortColumnOrder`, `search`, and `filterSelection`.

### Infinite Loading

```vue
<AnalyticsDatatable
  :fetcher="fetchRows"
  :headers="headers"
  mode="infinite"
  row-key="id"
/>
```

```ts
const fetchRows: AnalyticsDatatableFetcher<Row> = async ({ startRow = 0, pageSize, cursor }) => {
  const result = await fetchRequests({ cursor, limit: pageSize, offset: startRow })

  return {
    data: result.items,
    cursor: result.nextCursor,
    hasMore: result.hasMore,
  }
}
```

### Filterable Headers

Headers can include `filter?: Filter` from `@kong/kongponents`. When at least one header has a filter definition, the table renders `KFilterGroup` in the toolbar.

```ts
const headers: Array<AnalyticsDatatableHeader<Row>> = [
  {
    key: 'status',
    label: 'Status',
    filter: {
      label: 'Status',
      multiple: true,
      options: [
        { label: '200', value: '200' },
        { label: '500', value: '500' },
      ],
    },
  },
]
```

Applied and cleared default filters update `v-model:filter-selection` and are passed to the fetcher as `filterSelection`.

Pass `outside-filters` to move the built-in filters to a Vue Teleport target instead of rendering them in the toolbar.

```vue
<div id="analytics-filter-bar" />

<AnalyticsDatatable
  v-model:filter-selection="filterSelection"
  :fetcher="fetchRows"
  :headers="headers"
  outside-filters="#analytics-filter-bar"
/>
```

`AnalyticsDatatable` forwards KFilterGroup custom slots named `filter-${header.key}`. These slots follow the [Kongponents KFilterGroup filter content contract](https://kongponents.konghq.com/components/filter-group.html#filter-content): use the matching filter key to target the `filter-*` slot, and when custom content is provided, KFilterGroup cannot determine that filter's selected value.

This means custom filter slots are host-owned. The custom slot receives no slot props, and the host app must update that filter's `selection.*` entry in `v-model:filter-selection`. For custom filter slots, update the model from the host's `filter:apply` listener. `AnalyticsDatatable` also treats custom filter clears as host-owned so apply and clear follow the same contract and the wrapper does not overwrite custom state with a built-in selection payload.

```vue
<AnalyticsDatatable
  v-model:filter-selection="filterSelection"
  :fetcher="fetchRows"
  :headers="headers"
  @filter:apply="handleFilterApply"
  @filter:clear="handleFilterClear"
>
  <template #filter-method>
    <KButton
      v-for="method in ['GET', 'POST', 'PUT', 'DELETE']"
      :key="method"
      @click="selectedMethod = method"
    >
      {{ method }}
    </KButton>
  </template>
</AnalyticsDatatable>
```

```ts
const handleFilterApply = (filterKey: string) => {
  if (filterKey !== 'method') {
    return
  }

  filterSelection.value = {
    ...filterSelection.value,
    method: {
      operator: 'eq',
      text: selectedMethod.value,
      value: selectedMethod.value,
    },
  }
}

const handleFilterClear = (filterKey: string) => {
  if (filterKey !== 'method') {
    return
  }

  filterSelection.value = {
    ...filterSelection.value,
    method: undefined,
  }
}
```

`filter:apply` and `filter:clear` are notifications. `v-model:filter-selection` remains the canonical state for active filters and fetcher input.

### Search

Set `enable-search` to render a `KInput` search control. Search changes are debounced before refreshing the fetcher, and the fetcher receives the current value as `search`.

```vue
<AnalyticsDatatable
  enable-search
  :fetcher="fetchRows"
  :headers="headers"
/>
```

Pass `outside-search` to move the built-in search control to a Vue Teleport target instead of rendering it in the toolbar.

```vue
<div id="analytics-search-bar" />

<AnalyticsDatatable
  enable-search
  :fetcher="fetchRows"
  :headers="headers"
  outside-search="#analytics-search-bar"
/>
```

### Controlled Table Config

The table owns internal config state when `table-config` is omitted. Provide `table-config` and listen for `update:table-config` when the host needs to initialize, track, or persist user table preferences.

```vue
<AnalyticsDatatable
  :fetcher="fetchRows"
  :headers="headers"
  :table-config="tableConfig"
  @update:table-config="saveTableConfig"
/>
```

```ts
const saveTableConfig = (config: AnalyticsDatatableConfig) => {
  tableConfig.value = config
  localStorage.setItem('requests-table-config', JSON.stringify(config))
}
```

Config fields are optional overrides. For example, `columnVisibility: { latency: false }` hides only that column while the rest default to visible.

`tableConfig` intentionally keeps the analytics component naming. Host applications can map Kongponents `tablePreferences` into `tableConfig` with the exported conversion helpers:

```ts
import {
  toAnalyticsTableConfig,
  toTablePreferences,
  toTableSortPayload,
} from '@kong-ui-public/analytics-datatable'
```

### Row Selection And Bulk Actions

```vue
<AnalyticsDatatable
  :fetcher="fetchRows"
  :headers="headers"
  row-selection="multiple"
  @row:select="selectedRows = $event"
>
  <template #bulk-action-items="{ selectedRows }">
    <KDropdownItem @click="deleteRows(selectedRows)">
      Delete {{ selectedRows.length }} rows
    </KDropdownItem>
  </template>
</AnalyticsDatatable>
```

Use `row-selection="single"` for click-based single row selection, `row-selection="multiple"` for checkbox-backed multi-row selection, and `row-selection="none"` to disable selection UI and selection events.

### Custom States

```vue
<AnalyticsDatatable
  :error="hasError"
  :fetcher="fetchRows"
  :headers="headers"
>
  <template #empty-state>
    <KEmptyState title="No requests found" />
  </template>

  <template #error-state>
    <KEmptyState
      icon-variant="error"
      title="Requests failed to load"
    />
  </template>
</AnalyticsDatatable>
```

### Toolbar Composition

```vue
<AnalyticsDatatable
  :fetcher="fetchRows"
  :headers="headers"
  :hide-bulk-actions="true"
>
  <template #toolbar-left>
    <EntityFilter />
  </template>

  <template #toolbar-right>
    <KButton @click="downloadRows">
      Download
    </KButton>
  </template>
</AnalyticsDatatable>
```

Use `toolbar` to replace the whole toolbar, or `toolbar-left` / `toolbar-right` to compose host controls alongside built-in search, filters, bulk actions, and the column visibility menu.

Use `outside-search` and `outside-filters` to move built-in controls to Teleport targets. Use `outside-actions` for custom toolbar-adjacent controls that must stay mounted outside the visible table toolbar. The slot is mounted even when `hideToolbar` is true and while the table is loading, empty, or in an error state.

```vue
<AnalyticsDatatable
  enable-search
  :fetcher="fetchRows"
  :headers="headers"
  hide-toolbar
>
  <template
    #outside-actions="{
      refresh,
      search,
      selectedRows,
      updateSearch,
    }"
  >
    <Teleport to="#kong-ui-app-page-header-action-button">
      <KInput
        :model-value="search"
        type="search"
        @update:model-value="updateSearch"
      />

      <KButton @click="refresh">
        Refresh {{ selectedRows.length ? `(${selectedRows.length})` : '' }}
      </KButton>
    </Teleport>
  </template>
</AnalyticsDatatable>
```

## Props

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `headers` | `Array<AnalyticsDatatableHeader<Row>>` | Yes | - | Column definitions used to build AG Grid columns, slots, filters, and table config defaults. |
| `fetcher` | `AnalyticsDatatableFetcher<Row>` | Yes | - | Async function called whenever the table needs rows. |
| `mode` | `'pagination' \| 'infinite'` | No | `'pagination'` | Controls whether the table renders pagination or an infinite datasource. |
| `rowKey` | `Extract<keyof Row, string>` | No | `'id'` | Row field used for AG Grid row identity and exposed selection methods. |
| `pageSize` | `number` | No | `25` | Default page or block size when `tableConfig.pageSize` is not set. |
| `initialFetcherParams` | `{ search?: string }` | No | `{}` | Initial fetcher params currently limited to `search`. |
| `loading` | `boolean` | No | `false` | Shows the table skeleton before rendering the grid. |
| `error` | `boolean` | No | `false` | Shows the error state instead of the grid. |
| `enableSearch` | `boolean` | No | `false` | Renders the built-in search input and passes debounced search changes to the fetcher. |
| `outsideSearch` | `string \| HTMLElement` | No | - | Vue Teleport target for the built-in search input. |
| `outsideFilters` | `string \| HTMLElement` | No | - | Vue Teleport target for the built-in filters. |
| `hideToolbar` | `boolean` | No | `false` | Hides toolbar-rendered search, filters, selected-row actions, and the column visibility menu. Built-in controls with outside targets remain mounted. |
| `hideBulkActions` | `boolean` | No | `false` | Hides the selected-row actions dropdown while leaving the rest of the toolbar visible. |
| `hideColumnVisibility` | `boolean` | No | `false` | Hides the column visibility menu while leaving the rest of the toolbar visible. |
| `disableRowClick` | `boolean` | No | `false` | Prevents `row:click` emission without changing selection behavior. |
| `hidePagination` | `boolean` | No | `false` | Hides pagination controls in pagination mode. |
| `hidePaginationWhenOptional` | `boolean` | No | `false` | Hides pagination controls when the loaded dataset fits on one page. |
| `rowSelection` | `'none' \| 'single' \| 'multiple'` | No | `'none'` | Enables no selection, click-based single selection, or checkbox-backed multi-selection. |
| `agGridOptions` | `AnalyticsDatatableGridOptions<Row>` | No | `{}` | Pass-through for lower-level AG Grid options. The wrapper still owns its documented behavior. |
| `paginationPageSizeOptions` | `number[]` | No | `[10, 15, 25, 50, 100]` | Page size choices shown in pagination mode. The active page size is included if missing. |
| `refreshKey` | `string \| number` | No | - | Refetches when the key changes. |
| `rowAttrs` | `(row: Row) => Record<string, unknown>` | No | - | Applies DOM attributes to rendered AG Grid rows. |
| `cellAttrs` | `({ row, rowValue, column, rowIndex, colIndex }) => Record<string, unknown>` | No | - | Applies DOM attributes to rendered cell content. |
| `tableConfig` | `AnalyticsDatatableConfig` | No | Internal state | Optional controlled table state for column order, visibility, widths, pinning, sort, and page size. |

## Models

| Model | Type | Default | Notes |
| --- | --- | --- | --- |
| `v-model:filter-selection` | `FilterGroupSelection` | `{}` | Canonical active filter state. Default filters update it when applied or cleared. Custom filter slots are host-owned, so the host must update this model on custom apply and clear. Passed to the fetcher as `filterSelection`. |

## Events

| Event | Payload | When it fires |
| --- | --- | --- |
| `row:click` | `(row: Row, event: RowClickedEvent<Row>)` | A row is clicked and the row has data. |
| `cell:click` | `{ row: Row, columnKey: string, value: any }` | A cell is clicked and the cell has row data and a column id. |
| `row:select` | `Row[]` | The selected row set changes. |
| `update:tableConfig` | `AnalyticsDatatableConfig` | User interaction or wrapper-managed refitting changes table config state. |
| `sort` | `{ sortColumnKey?: string, sortColumnOrder?: 'asc' \| 'desc' }` | Sort state changes before the updated table config is emitted. |
| `state` | `{ state: 'loading' \| 'error' \| 'success' \| 'empty', hasData: boolean }` | The table loading, error, success, or empty state changes. |
| `grid:ready` | `GridApi<Row>` | AG Grid is ready and the wrapper has applied initial column state. |
| `filter:apply` | `(filterKey: string, selection: FilterGroupSelection)` | KFilterGroup emits apply. Default filters update `v-model:filter-selection`; custom filter slots must write their selected value to the model in the host. |
| `filter:clear` | `(filterKey: string, selection: FilterGroupSelection)` | KFilterGroup emits clear. Default filters update `v-model:filter-selection`; custom filter slots must clear their value from the model in the host. |
| `filter:open` | `filterKey: string` | A KFilterGroup filter popover opens. |
| `filter:close` | `filterKey: string` | A KFilterGroup filter popover closes. |

## Slots

| Slot | Props | Notes |
| --- | --- | --- |
| `[header.key]` | `{ row, rowValue, column, rowIndex, refreshCell, selected }` | Dynamic cell slot for the matching column key. Call `refreshCell()` when async slot content changes internal loading or display state. |
| `bulk-action-items` | `{ selectedRows }` | Dropdown items rendered inside the selected-row actions dropdown. |
| `toolbar` | `{ selectedRows, filterSelection, filters, search, updateFilterSelection, updateSearch, refresh }` | Replaces the entire toolbar. |
| `toolbar-left` | `{ selectedRows, filterSelection, filters, search, updateFilterSelection, updateSearch, refresh }` | Renders before built-in bulk actions, search, and filters. |
| `toolbar-right` | `{ selectedRows, filterSelection, filters, search, updateFilterSelection, updateSearch, refresh }` | Renders before the built-in column visibility menu. |
| `outside-actions` | `{ selectedRows, filterSelection, filters, search, updateFilterSelection, updateSearch, refresh }` | Always-mounted renderless slot for custom controls that host apps Teleport outside the visible table toolbar. |
| `filter-${header.key}` | None | Forwards custom filter popover content to the built-in KFilterGroup. The host app must update `v-model:filter-selection` when custom filter values are applied or cleared. |
| `empty-state` | None | Replaces the default empty state. |
| `error-state` | None | Replaces the default error state. |

## Exposed Methods

Use a template ref on `AnalyticsDatatable` to call these methods.

| Method | Signature | Notes |
| --- | --- | --- |
| `refresh` | `() => void` | Refetches the first page or rebuilds the infinite datasource. |
| `selectRowByKey` | `(key: string) => void` | Selects the row with the matching `rowKey` value when it is currently loaded. |
| `deselectAll` | `() => void` | Clears AG Grid selection and emits `row:select` with `[]`. |
| `getGridApi` | `() => GridApi<Row> \| undefined` | Returns the underlying AG Grid API after `grid:ready`. |

## Exported Types

- `AnalyticsDatatableMode`
- `AnalyticsDatatableSort`
- `AnalyticsDatatableSortColumnOrder`
- `AnalyticsDatatablePinnedState`
- `AnalyticsDatatableState`
- `AnalyticsDatatableStatePayload`
- `AnalyticsDatatableConfig`
- `AnalyticsDatatableHeader`
- `AnalyticsDatatableFetcherParams`
- `AnalyticsDatatableFetcherResult`
- `AnalyticsDatatableFetcher`
- `AnalyticsDatatableRowSelectionMode`
- `AnalyticsDatatableRowKey`
- `AnalyticsDatatableTeleportTarget`
- `AnalyticsDatatableCellSlotProps`
- `AnalyticsDatatableRowAttrs`
- `AnalyticsDatatableCellAttrs`
- `AnalyticsDatatableGridOptions`

## Sandbox

Run the package sandbox to test the interactive mock-data playground:

```sh
pnpm --filter @kong-ui-public/analytics-datatable run dev
```
