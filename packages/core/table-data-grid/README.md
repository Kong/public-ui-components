# TableDataGrid

Reusable Vue wrapper around AG Grid for Kong table data grids.

This initial package version supports a basic first-page fetcher and AG Grid rendering.

## Usage

```vue
<template>
  <TableDataGrid
    :fetcher="fetchRows"
    :headers="headers"
    @grid:ready="onGridReady"
  />
</template>

<script setup lang="ts">
import type { TableDataGridFetcher, TableDataGridHeader } from '@kong-ui-public/table-data-grid'
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

const rows: Row[] = [
  { id: 'row-1', name: 'Gateway service', status: 'Active' },
]

const fetchRows: TableDataGridFetcher<Row> = async ({ mode, page, pageSize }) => ({
  data: rows,
  total: rows.length,
})
</script>
```

## Props

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `headers` | `Array<TableDataGridHeader<Row>>` | Yes | - | Basic column definitions mapped to AG Grid columns. |
| `fetcher` | `TableDataGridFetcher<Row>` | Yes | - | Async row loader called with the initial first-page fetch params. |
| `pageSize` | `number` | No | `25` | Page size sent to the basic fetcher. No pagination controls are rendered in this PR. |
| `agGridOptions` | `TableDataGridGridOptions<Row>` | No | `{}` | Pass-through for lower-level AG Grid options. Keep this narrow until the package owns more grid behavior. |

## Fetcher Contract

The initial fetcher mirrors the package's future pagination-oriented shape but only performs the first fetch.

```ts
type TableDataGridFetcherParams = {
  mode: 'pagination'
  page: number
  pageSize: number
}

type TableDataGridFetcherResult<Row> = {
  data: Row[]
  total?: number
}

type TableDataGridFetcher<Row> = (
  params: TableDataGridFetcherParams,
) => Promise<TableDataGridFetcherResult<Row>>
```

## Header Options

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | `Extract<keyof Row, string>` | Yes | Row property read for the cell value and used as the AG Grid column id. |
| `label` | `string` | Yes | Header label rendered by AG Grid. |
| `width` | `number` | No | Initial AG Grid column width in pixels. |
| `minWidth` | `number` | No | Minimum AG Grid column width in pixels. |
| `maxWidth` | `number` | No | Maximum AG Grid column width in pixels. |

## Events

| Event | Payload | When it fires |
| --- | --- | --- |
| `grid:ready` | `GridApi<Row>` | AG Grid is ready. |

## Slots

No slots are part of the initial public contract.

## Exports

- `TableDataGrid`
- `TableDataGridMode`
- `TableDataGridHeader`
- `TableDataGridFetcherParams`
- `TableDataGridFetcherResult`
- `TableDataGridFetcher`
- `TableDataGridGridOptions`
- `TableDataGridReadyPayload`
