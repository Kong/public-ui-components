# @kong-ui-public/analytics-datatable

Reusable ag-grid based datatable wrapper for analytics-style tables.

## Features

- Slotted cell content by column key
- Reorderable, resizable, pinnable, and hideable columns
- Optional table config state through `table-config` and `update:table-config`
- Clickable rows and single or multi-row selection
- Pagination and infinite cursor loading modes
- Optional KFilterGroup-powered server-side filters from header definitions
- Reusable column visibility menu

## Usage

```vue
<template>
  <AnalyticsDatatable
    :fetcher="fetchRows"
    :headers="headers"
    mode="pagination"
    row-key="id"
    row-selection="multiple"
    :table-config="tableConfig"
    v-model:filter-selection="filterSelection"
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
```

The table owns sensible defaults when `table-config` is omitted. Defaults use header order, make every column visible, use the `pageSize` prop for paginated tables, and fit columns to the available width on first render.

Consumers can provide `table-config` when they want to initialize, track, or persist table state, and listen for `update:table-config` to receive user-driven changes. Config fields are optional and behave as overrides: for example, `columnVisibility: { latency: false }` hides only that column while the rest default to visible. Persistence is host-owned, so consumers can store that object in local storage, Pinia, or backend preferences.

When row selection is enabled, the table renders a compact selected-row actions dropdown in the built-in toolbar. Consumers can provide dropdown items with the narrow `#bulk-action-items="{ selectedRows }"` slot.

Headers can include `filter?: Filter` from `@kong/kongponents`. When at least one header has a filter definition, the table renders `KFilterGroup` in the toolbar. Filter selection is optional, controlled through `v-model:filter-selection`, and passed to the fetcher as `filterSelection` so consumers can apply the selection in server requests.

Set `hideable: false` on a header to keep that column visible and omit it from the column visibility menu.

Visible table chrome strings are provided through the package i18n locale.

## Fetching Modes

`mode="pagination"` renders a single wrapper-owned pagination footer under the grid. Page navigation and page-size changes are translated into fetcher calls.

`mode="infinite"` disables pagination and loads additional blocks when the grid scrolls. Cursor values returned from one block are passed to the next block request.

## Sandbox

Run the package sandbox to test the interactive mock-data playground:

```sh
pnpm --filter @kong-ui-public/analytics-datatable run dev
```
