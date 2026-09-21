# TableDataGrid

Reusable Vue wrapper around AG Grid for Kong table data grids.

This package currently supports AG Grid infinite row loading with a cursor-first
fetcher contract, basic column definitions, single-column sorting, empty/error
presentation states, and state lifecycle emits.

## Peer Dependencies

Consumers must provide `vue` and `@kong/kongponents`. The host app should
register Kongponents and load its styles because TableDataGrid presentation
states render Kongponents components.

```ts
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

app.use(Kongponents)
```

## Usage

`TableDataGrid` fills the height of its parent container by default. Place it in
a parent with an explicit height, or in a flex layout where the parent owns the
available height, so the grid can expand and shrink with its container.

```vue
<template>
  <div class="rows-panel">
    <KButton @click="refreshRows">
      Refresh rows
    </KButton>

    <TableDataGrid
      :fetcher="fetchRows"
      :headers="headers"
      :page-size="25"
      :refresh-key="refreshKey"
      @state="handleState"
    >
      <template #empty-state>
        <KEmptyState
          message="Try changing filters or refreshing the dataset."
          title="No rows found"
        />
      </template>
    </TableDataGrid>
  </div>
</template>

<script setup lang="ts">
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridInfiniteFetcherParams,
  TableDataGridStatePayload,
} from '@kong-ui-public/table-data-grid'
import { ref } from 'vue'
import { TableDataGrid } from '@kong-ui-public/table-data-grid'

type Row = {
  id: string
  name: string
  status: string
}

const headers: Array<TableDataGridHeader<Row>> = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const refreshKey = ref(0)
const lastState = ref<TableDataGridStatePayload>()

const fetchRows: TableDataGridFetcher<Row> = async ({
  pageSize,
  cursor,
}: TableDataGridInfiniteFetcherParams) => {
  const response = await getRows({
    size: pageSize,
    cursor,
  })

  return {
    data: response.data,
    cursor: response.cursor,
    hasMore: response.hasMore,
  }
}

const refreshRows = () => {
  refreshKey.value += 1
}

const handleState = (payload: TableDataGridStatePayload) => {
  lastState.value = payload
}
</script>

<style scoped>
.rows-panel {
  display: flex;
  flex-direction: column;
  height: 480px;
  min-height: 0;
}
</style>
```

## Props

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `headers` | `Array<TableDataGridHeader<Row>>` | Yes | - | Basic column definitions mapped to AG Grid columns. |
| `fetcher` | `TableDataGridFetcher<Row>` | Yes | - | Async row loader called by the AG Grid infinite datasource. |
| `error` | `boolean` | No | `false` | Host-controlled visible error state. Internal fetch failures emit state but do not render error UI unless this prop is true. |
| `pageSize` | `number` | No | `25` | AG Grid cache block size and fetcher request size. `tableConfig.pageSize` wins when present. |
| `refreshKey` | `string \| number \| boolean` | No | - | Parent invalidation signal that rebuilds the datasource from the beginning. |
| `tableConfig` | `TableDataGridConfig` | No | - | Host-controlled current sort and page size. Restores a previously-chosen sort on mount, or moves it after mount, without a click. Uncontrolled (internal state) when omitted. |

## Fetcher Contract

`TableDataGrid` uses AG Grid's infinite row model internally. The public fetcher
receives only the stable cursor-first request shape:

```ts
type TableDataGridInfiniteFetcherParams = {
  mode: 'infinite'
  pageSize: number
  cursor?: unknown
  sort?: TableDataGridSort
}

type TableDataGridFetcherResult<Row> = {
  data: Row[]
  cursor?: unknown
  total?: number
  hasMore?: boolean
}

type TableDataGridFetcher<Row> = (
  params: TableDataGridInfiniteFetcherParams,
) => Promise<TableDataGridFetcherResult<Row>>
```

`cursor` is an opaque token returned by the previous response. The first request
uses `cursor: undefined`; later requests receive the previous response cursor.

`sort` carries the current single-column sort, with `sortColumnKey` and
`sortColumnOrder` left `undefined` when nothing is sorted. A sort change is a
request-context change like `refreshKey` or `pageSize`: it rebuilds the
datasource and restarts the cursor chain from the beginning, because a cursor
produced under one sort order is not valid under another.

AG Grid range details are datasource internals. Consumers should not depend on,
or return, datasource request positions or AG Grid row-count callback values in
the public fetcher contract.

`total` gives AG Grid an explicit row count when the backend knows it. If `total`
is omitted, `hasMore: false` or a response shorter than `pageSize` marks the last
loaded row as the end of the dataset.

## Refresh Behavior

`refreshKey` is a parent-owned invalidation signal. Changing it rebuilds the
infinite datasource, clears stored cursors, and starts again from the first
block with `cursor: undefined`.

This reset is required for cursor APIs because cursor values are only valid
relative to the response and query chain that produced them. Reusing a later
cursor after the parent changes request context could fetch the wrong rows.

## Presentation States

`TableDataGrid` keeps the grid mounted while internal fetches are running so AG
Grid can request rows and show its own loading treatment.

Visible error UI is host-controlled through the `error` prop. A rejected fetch
emits an error state, but it does not render error chrome by itself.

An empty state renders after the first successful block resolves with no rows.
Use the `empty-state` slot to replace the default empty content. Use the
`error-state` slot to replace the default host-controlled error content.

```vue
<TableDataGrid
  :error="showError"
  :fetcher="fetchRows"
  :headers="headers"
>
  <template #empty-state>
    <KEmptyState
      message="Adjust the source data and refresh."
      title="No matching rows"
    />
  </template>

  <template #error-state>
    <KEmptyState
      icon-variant="error"
      message="Refresh or try again later."
      title="Rows could not be loaded"
    />
  </template>
</TableDataGrid>
```

## Header Options

Columns without a `width` or `maxWidth` fill the available table width by
default. Use `width` for an explicit initial pixel width, `minWidth` for a
lower bound on either flexible or fixed columns, and `maxWidth` when a column
should opt out of the default flexible fill behavior.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | `Extract<keyof Row, string>` | Yes | Row property read for the cell value and used as the AG Grid column id. |
| `label` | `string` | Yes | Header label rendered by AG Grid. |
| `width` | `number` | No | Explicit initial AG Grid column width in pixels. Columns with `width` do not receive default flex sizing. |
| `minWidth` | `number` | No | Minimum AG Grid column width in pixels. Columns with only `minWidth` still fill available width by default. |
| `maxWidth` | `number` | No | Maximum AG Grid column width in pixels. Columns with `maxWidth` do not receive default flex sizing. |
| `disableRowClick` | `boolean` | No | Suppresses `row:click` for clicks landing in this column's cells, e.g. an actions column. `cell:click` still fires. |
| `sortable` | `boolean` | No | Enables sorting on this column via AG Grid's built-in header sort control. Only one column can be sorted at a time. |
| `showSortIcon` | `boolean` | No | Shows the unsorted sort icon on this column even when it isn't the active sort, instead of only on hover or once sorted. Only relevant when `sortable` is true. |

## Sorting

`TableDataGrid` supports sorting by a single column at a time. Mark a column
sortable with `header.sortable`, and AG Grid renders its built-in sort icon
and handles the click. Sorting a second column replaces the first; AG Grid's
shift-click multi-sort gesture is disabled.

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ]"
  :table-config="tableConfig"
  @sort="handleSort"
  @update:table-config="tableConfig = $event"
/>
```

The current sort lives in `tableConfig` (`sortColumnKey`, `sortColumnOrder`),
alongside `pageSize`. Pass `tableConfig` to restore a previously-chosen sort
on mount, or to move the sort after mount without a click; omit it to let the
component own the sort internally. A sort change emits `sort` (the narrower,
sort-only payload) and then `update:tableConfig` (the full current config),
and rebuilds the infinite datasource from the beginning — a cursor produced
under one sort order is not valid under another.

## Custom Cell Content

Columns render custom cell content through a slot named after `header.key`.
Columns without a matching slot render their raw `rowValue`.

```vue
<TableDataGrid
  :fetcher="fetchRows"
  :headers="headers"
>
  <template #status="{ rowValue }">
    <KBadge :appearance="rowValue === 'active' ? 'success' : 'neutral'">
      {{ rowValue }}
    </KBadge>
  </template>
</TableDataGrid>
```

| Field | Type | Notes |
| --- | --- | --- |
| `row` | `Row` | The full row record backing this cell. |
| `rowValue` | `unknown` | `row[header.key]`. |
| `column` | `TableDataGridHeader<Row>` | The header definition for this column. |
| `rowIndex` | `number` | The row's index in the currently loaded block. |
| `selected` | `boolean` | Whether the row is currently selected. |
| `refreshCell` | `() => void` | Forces AG Grid to re-render this cell. |

## Events

| Event | Payload | When it fires |
| --- | --- | --- |
| `grid:ready` | `GridApi<Row>` | AG Grid is ready. |
| `state` | `{ state: 'loading' \| 'success' \| 'error', hasData: boolean }` | Internal fetch lifecycle changes after the datasource starts requesting rows. |
| `row:click` | `(row: TableDataGridRowClickPayload<Row>, event: RowClickedEvent<Row>)` | A row is clicked, unless the click landed in a `disableRowClick` column. |
| `cell:click` | `TableDataGridCellClickPayload<Row>` | Any cell is clicked, including cells in `disableRowClick` columns. |
| `sort` | `TableDataGridSort` | The current single-column sort changes. Fires before `update:tableConfig`. |
| `update:tableConfig` | `TableDataGridConfig` | A meaningful change to the current table configuration (sort or page size). |

## Slots

| Slot | Purpose |
| --- | --- |
| `empty-state` | Replaces the default empty state after a successful empty first block. |
| `error-state` | Replaces the default visible error state when `error` is true. |
| `[columnKey]` | Renders custom cell content for the column matching `header.key`. See [Custom Cell Content](#custom-cell-content). |

## Exports

- `TableDataGrid`
- `TableDataGridMode`
- `TableDataGridState`
- `TableDataGridStatePayload`
- `TableDataGridRowClickPayload`
- `TableDataGridCellClickPayload`
- `TableDataGridCellSlotProps`
- `TableDataGridHeader`
- `TableDataGridInfiniteFetcherParams`
- `TableDataGridFetcherResult`
- `TableDataGridFetcher`
- `TableDataGridReadyPayload`
- `TableDataGridSortDirection`
- `TableDataGridSort`
- `TableDataGridConfig`
