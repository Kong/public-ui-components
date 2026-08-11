# TableDataGrid

Reusable Vue wrapper around AG Grid for Kong table data grids.

This package currently supports AG Grid infinite row loading with a cursor-first
fetcher contract, basic column definitions, empty/error presentation states, and
state lifecycle emits.

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
| `pageSize` | `number` | No | `25` | AG Grid cache block size and fetcher request size. |
| `refreshKey` | `string \| number \| boolean` | No | - | Parent invalidation signal that rebuilds the datasource from the beginning. |

## Fetcher Contract

`TableDataGrid` uses AG Grid's infinite row model internally. The public fetcher
receives only the stable cursor-first request shape:

```ts
type TableDataGridInfiniteFetcherParams = {
  mode: 'infinite'
  pageSize: number
  cursor?: unknown
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

## Events

| Event | Payload | When it fires |
| --- | --- | --- |
| `grid:ready` | `GridApi<Row>` | AG Grid is ready. |
| `state` | `{ state: 'loading' \| 'success' \| 'error', hasData: boolean }` | Internal fetch lifecycle changes after the datasource starts requesting rows. |

## Slots

| Slot | Purpose |
| --- | --- |
| `empty-state` | Replaces the default empty state after a successful empty first block. |
| `error-state` | Replaces the default visible error state when `error` is true. |

## Exports

- `TableDataGrid`
- `TableDataGridMode`
- `TableDataGridState`
- `TableDataGridStatePayload`
- `TableDataGridHeader`
- `TableDataGridInfiniteFetcherParams`
- `TableDataGridFetcherResult`
- `TableDataGridFetcher`
- `TableDataGridReadyPayload`
