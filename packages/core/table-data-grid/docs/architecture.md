# Table Data Grid Architecture

`@kong-ui-public/table-data-grid` is a Vue wrapper around AG Grid for table data grids. Consumers provide typed headers, a fetcher, optional controlled table configuration, filter state, and slots. The package translates that public contract into AG Grid state, fetches rows, renders table chrome, and emits user-driven changes back to the host.

The core principle is:

> AG Grid owns the immediate grid mechanics; `tableConfig` and the fetcher contract are the public integration boundaries.

## Top-level dataflow

```mermaid
flowchart LR
  Host["Host app<br/>headers, fetcher, tableConfig,<br/>filterSelection, slots"]
  Component["TableDataGrid.vue<br/>public wrapper and orchestration"]
  Controls["TableDataGridControls.vue<br/>toolbar, outside controls, filters/search"]
  Body["TableDataGridBody.vue<br/>AG Grid and pagination surface"]
  Config["useTableDataGridConfig<br/>controlled config state"]
  FetchState["useTableDataGridFetchState<br/>shared fetch refs and flags"]
  PaginationFetch["useTableDataGridPaginationFetch<br/>pagination requests"]
  InfiniteFetch["useTableDataGridInfiniteFetch<br/>infinite datasource"]
  Columns["useTableDataGridColumnDefs<br/>headers to columnDefs"]
  Sizing["useTableDataGridColumnSizing<br/>fit, resize, width persistence"]
  Selection["useTableDataGridSelection<br/>row selection state"]
  Pagination["useTableDataGridPagination<br/>pagination gating"]
  Lifecycle["grid lifecycle / config sync / layout sync"]
  Grid["AG Grid"]
  Events["emits<br/>update:tableConfig, sort,<br/>row/cell/select/state/filter"]

  Host --> Component
  Component --> Controls
  Component --> Body
  Component --> Config
  Component --> FetchState
  Component --> PaginationFetch
  Component --> InfiniteFetch
  Component --> Sizing
  Component --> Selection
  Component --> Lifecycle
  FetchState --> PaginationFetch
  FetchState --> InfiniteFetch
  Controls --> Component
  Body --> Columns
  Body --> Pagination
  Body --> Grid
  Config --> Grid
  Columns --> Grid
  Sizing --> Grid
  PaginationFetch --> Grid
  InfiniteFetch --> Grid
  Selection --> Grid
  Lifecycle --> Grid
  Grid --> Component
  Component --> Events
  Events --> Host
```

## Main modules

| Area | File | Owns |
| --- | --- | --- |
| Wrapper orchestration | [`src/components/TableDataGrid.vue`](../src/components/TableDataGrid.vue) | Public props/emits/slots, top-level state wiring, refresh mode selection, and composable coordination |
| Controls surface | [`src/components/TableDataGridControls.vue`](../src/components/TableDataGridControls.vue) | Toolbar visibility, outside actions, Teleported search/filters, and toolbar slot props |
| Grid surface | [`src/components/TableDataGridBody.vue`](../src/components/TableDataGridBody.vue) | AG Grid instance, row model selection, pagination controls, AG Grid event forwarding |
| Toolbar rendering | [`src/components/TableDataGridToolbar.vue`](../src/components/TableDataGridToolbar.vue) | Toolbar layout, toolbar slots, bulk actions, filters/search placement, column visibility trigger |
| Filters and search | [`src/components/TableDataGridFilters.vue`](../src/components/TableDataGridFilters.vue), [`src/components/TableDataGridSearch.vue`](../src/components/TableDataGridSearch.vue) | KFilterGroup wiring, forwarded custom filter slots, search input |
| Public contract | [`src/types/index.ts`](../src/types/index.ts) | Header, config, fetcher, row key, selection, slot, and attribute types |
| Config state | [`src/composables/useTableDataGridConfig.ts`](../src/composables/useTableDataGridConfig.ts) | Internal active config, resolved config, applying config to AG Grid, emitting config updates |
| Config translation | [`src/utils/tableConfig.ts`](../src/utils/tableConfig.ts), [`src/utils/tablePreferencesInterop.ts`](../src/utils/tablePreferencesInterop.ts) | Defaults, normalization, semantic equality, AG Grid `ColumnState` conversion, table preference conversion |
| Fetch request helpers | [`src/utils/fetchers.ts`](../src/utils/fetchers.ts) | Pure sort, cursor-block, next-page, and infinite-last-row decisions |
| Fetch state | [`src/composables/useTableDataGridFetchState.ts`](../src/composables/useTableDataGridFetchState.ts) | Shared row, datasource, page, pending, fetched, next-page, and fetch-error flag refs used by both fetch modes and table state |
| Pagination fetch lifecycle | [`src/composables/useTableDataGridPaginationFetch.ts`](../src/composables/useTableDataGridPaginationFetch.ts) | Pagination requests, result commits, unknown-total next-page state, stale request guards |
| Infinite fetch lifecycle | [`src/composables/useTableDataGridInfiniteFetch.ts`](../src/composables/useTableDataGridInfiniteFetch.ts) | Infinite datasource creation, cursor tracking, sequential block gating, stale datasource guards |
| Grid sync helpers | [`src/utils/gridSync.ts`](../src/utils/gridSync.ts) | Pure layout snapshots, config-refresh params, visibility-change checks, selection-column checks |
| Grid lifecycle | [`src/composables/useTableDataGridGridLifecycle.ts`](../src/composables/useTableDataGridGridLifecycle.ts) | Grid-ready setup, initial config capture/application, exposed grid API, initial refresh |
| Config sync | [`src/composables/useTableDataGridConfigSync.ts`](../src/composables/useTableDataGridConfigSync.ts) | Sort/page-size config writes, config-change refresh dispatch, resolved config replay |
| Column layout sync | [`src/composables/useTableDataGridColumnLayoutSync.ts`](../src/composables/useTableDataGridColumnLayoutSync.ts) | AG Grid layout event classification, displayed column indexes, layout-driven refit scheduling |
| Column definitions | [`src/composables/useTableDataGridColumnDefs.ts`](../src/composables/useTableDataGridColumnDefs.ts) | Header order, `ColDef` creation, renderer context |
| Column sizing helpers | [`src/utils/columnSizing.ts`](../src/utils/columnSizing.ts) | Pure fit-width math, min/max width checks, layout-side-effect change-detection config |
| Column sizing | [`src/composables/useTableDataGridColumnSizing.ts`](../src/composables/useTableDataGridColumnSizing.ts) | `sizeColumnsToFit`, resize tracking, auto-fit width tracking, layout-side-effect persistence |
| Selection | [`src/composables/useTableDataGridSelection.ts`](../src/composables/useTableDataGridSelection.ts) | AG Grid row selection options, selected row tracking, public selection methods, selection renderer context |
| Pagination controls | [`src/composables/useTableDataGridPagination.ts`](../src/composables/useTableDataGridPagination.ts) | Page navigation rules for known and unknown totals |
| Cell renderer | [`src/components/TableDataGridCellRenderer.vue`](../src/components/TableDataGridCellRenderer.vue) | Column-key slots, cell attrs, selected slot state, AG Grid renderer refresh through `context.cells` |
| Header renderer | [`src/components/TableDataGridHeaderRenderer.vue`](../src/components/TableDataGridHeaderRenderer.vue) | Sort button, sort icon state from `context.sort`, tooltip rendering |
| Column visibility menu | [`src/components/TableDataGridColumnVisibilityMenu.vue`](../src/components/TableDataGridColumnVisibilityMenu.vue) | Hideable-column menu, search, toggle-all visibility updates |

## Public contracts

| Contract | Direction | Purpose |
| --- | --- | --- |
| `headers` | Host to table | Defines column identity, labels, sortability, initial/default visibility, sizing defaults, filters, pinning defaults, and AG Grid passthrough options |
| `fetcher` | Host to table | Loads rows for either pagination mode or infinite mode |
| `tableConfig` | Host to table | Optional controlled state for current and persisted table preferences |
| `update:tableConfig` | Table to host | Emits user or grid changes that should be persisted by the host |
| `v-model:filter-selection` | Two-way | Canonical active filter state passed to the fetcher |
| Slots by column key | Host to table | Custom cell rendering |
| Toolbar/filter/state slots | Host to table | Custom table chrome and empty/error states |
| Row/cell/select/filter/sort/state events | Table to host | Notifications for user interaction and table lifecycle |

`tableConfig` contains the state that can be persisted across sessions:

| Field | Meaning |
| --- | --- |
| `columnOrder` | Ordered header keys |
| `columns[key].visible` | Per-column visible boolean |
| `columns[key].width` | Per-column pixel width |
| `columns[key].pinned` | Per-column `'left'`, `'right'`, or `false` pin state |
| `sortColumnKey` | Active sort column key |
| `sortColumnOrder` | Active sort order |
| `pageSize` | Active page size |

Header options are defaults. `tableConfig` is the current state layer. For example, `headers[].visible = false` initializes a hideable column as hidden, while `tableConfig.columns[key].visible` records or overrides the current visibility state. Visibility is not configurable for `hideable: false` columns, so those columns resolve to visible regardless of header or config visibility values.

`columns[key].pinned = false` is meaningful. It represents an explicit unpin, which is different from omitting the field when a header has a default `pinned` value.

## Config lifecycle

```mermaid
sequenceDiagram
  participant Host
  participant Table as TableDataGrid.vue
  participant Config as useTableDataGridConfig
  participant Utils as tableConfig.ts
  participant Grid as AG Grid

  Host->>Table: tableConfig prop
  Table->>Config: tableConfig, headers, pageSize
  Config->>Utils: normalizeTableConfig + createResolvedTableConfig
  Config-->>Table: resolvedTableConfig
  Table->>Grid: applyColumnState(...)
  Grid-->>Table: column/sort/visibility/resize events
  Table->>Config: getGridConfig(api)
  Config->>Utils: normalizedTableConfigsEqual(...)
  Config-->>Host: update:tableConfig when meaningful
```

The config composable keeps two related shapes:

| Shape | Source | Role |
| --- | --- | --- |
| `activeTableConfig` | Prop or internal updates | The current user-controlled/raw config state |
| `resolvedTableConfig` | `activeTableConfig` plus headers/defaults | A full, valid config suitable for AG Grid |

The wrapper avoids feedback loops with `normalizedTableConfigsEqual`. This matters because reading AG Grid state and normalizing config creates fresh arrays and records. Reference equality would emit no-op updates forever.

Config changes are split by effect owner. `useTableDataGridConfigSync` owns sort/page-size config writes, refresh dispatch for config changes, and replaying resolved config into AG Grid. `useTableDataGridColumnLayoutSync` owns AG Grid layout event classification and asks sizing to persist or refit when move, pin, visibility, resize, or displayed-column changes are meaningful. `useTableDataGridGridLifecycle` owns grid-ready setup, initial config capture/application, and the initial refresh path.

## Fetch lifecycle

```mermaid
flowchart TD
  Refresh["refresh(options)"]
  Mode{"mode"}
  Page["fetchPage(page)"]
  Infinite["buildInfiniteDatasource()"]
  Fetcher["consumer fetcher(params)"]
  PageCommit["commitPaginationResult<br/>rowData, totalRows, currentPage"]
  GridCommit["AG Grid successCallback<br/>data, lastRow"]
  State["isFetching, hasFetched,<br/>hasFetchError, rowData"]

  Refresh --> Mode
  Mode -->|"pagination"| Page
  Mode -->|"infinite"| Infinite
  Page --> Fetcher
  Infinite -->|"AG Grid getRows(startRow,endRow)"| Fetcher
  Fetcher --> PageCommit
  Fetcher --> GridCommit
  PageCommit --> State
  GridCommit --> State
```

| Mode | AG Grid row model | Request params | Commit behavior |
| --- | --- | --- | --- |
| `pagination` | `clientSide` | `mode`, `page`, `pageSize`, `sortColumnKey`, `sortColumnOrder`, `search`, `filterSelection` | Stores returned `data` in `rowData`, stores `total`, updates `currentPage`, computes whether a next page exists when total is unknown, and only marks the table as fetched for the latest request |
| `infinite` | `infinite` | `mode`, `startRow`, `endRow`, `pageSize`, `cursor`, `sortColumnKey`, `sortColumnOrder`, `search`, `filterSelection` | Creates an AG Grid datasource, tracks block completion separately from cursor values, stores returned cursors by block, waits for the prior block before requesting the next one, calls `successCallback`, and copies the first block into `rowData` for state rendering |

Stale response protection is split by mode:

| Guard | Used by | Protects against |
| --- | --- | --- |
| `latestPaginationRequestId` | Pagination | Older page requests committing after a newer refresh |
| `latestInfiniteDatasourceId` | Infinite | Older datasource block requests resolving after sort/filter/mode changes |

Pure fetch decisions live in `src/utils/fetchers.ts`. `useTableDataGridFetchState` owns the reactive refs shared across modes. The mode-specific fetch composables own datasource construction, async request ordering, and commits into Vue/AG Grid state.

## Column definition and sizing split

Column definitions and column sizing are intentionally separate:

| Composable | Responsibility |
| --- | --- |
| `useTableDataGridColumnDefs` | Converts `headers` plus resolved column order into AG Grid `columnDefs` and renderer context |
| `useTableDataGridColumnSizing` | Runs `api.sizeColumnsToFit`, tracks generated widths, and persists meaningful width/config changes |
| `src/utils/columnSizing.ts` | Decides whether columns can fit and derives the width/config inputs for those decisions |

```mermaid
flowchart LR
  Headers["headers"]
  Config["resolvedTableConfig"]
  Defs["useTableDataGridColumnDefs"]
  Sizing["useTableDataGridColumnSizing"]
  Grid["AG Grid"]

  Headers --> Defs
  Config --> Defs
  Defs -->|"columnDefs, context"| Grid

  Headers --> Sizing
  Config --> Sizing
  Grid -->|"columnState, viewport width"| Sizing
  Sizing -->|"sizeColumnsToFit / config update"| Grid
```

Sizing has two kinds of widths:

| Width source | Meaning | How it is treated |
| --- | --- | --- |
| Consumer or user widths | Host-provided widths or widths from a finished user resize | Honored as real constraints and can allow horizontal overflow |
| Auto-fitted widths | Widths generated by the wrapper to fill available space | Tracked in `lastAutoFittedColumnWidths`; they should not block a later refit after displayed columns change |

Key sizing rules:

| Rule | Reason |
| --- | --- |
| Do not fit if resolved config already has column widths, unless fitting is forced | User or host widths should not be overwritten by automatic fitting |
| Before fitting, check visible headers, pinned columns, AG Grid-owned display columns, and min/max width limits | `sizeColumnsToFit` acts on all displayed columns, so the preflight must use the same width domain |
| Schedule fitting with `requestAnimationFrame` | AG Grid viewport measurements depend on browser layout, not just Vue DOM flush |
| Ignore layout-only width changes during pin/move/hide change detection | AG Grid may recalculate pixel widths as a side effect; those should not emit config changes unless order/pin/visibility changed |
| Persist fitted widths when fitting is part of a displayed-column change | The emitted config should match the grid the user now sees |

The boundary rule is: use utilities for deterministic calculations that only need arguments and return values; use composables for reactive state, Vue lifecycle hooks, browser scheduling, AG Grid calls, or emitted side effects.

## User action effects

| User action | Handler | Internal effect | External effect |
| --- | --- | --- | --- |
| Sort header | `onSortChange` | Reads grid config, patches sort fields | Emits `sort` and `update:tableConfig`; refreshes because config sort changed |
| Change page | `onPageChange` / `goToPage` | Calls `fetchPage(page)` when allowed | Calls the host fetcher |
| Change page size | `onPageSizeChange` | Patches `tableConfig.pageSize` | Emits `update:tableConfig`; refreshes page 1 |
| Apply built-in filter | `onFilterApply` | Updates `filterSelection`, refreshes | Emits `filter:apply` |
| Apply custom filter slot | `onFilterApply` | Leaves host-owned custom filter state intact, refreshes next tick | Emits `filter:apply` |
| Clear filter | `onFilterClear` | Same ownership rules as apply | Emits `filter:clear` |
| Toggle column visibility | `columnVisibilityModel` | Patches `columns[key].visible` and schedules a fit after displayed columns change | Emits `update:tableConfig` |
| Resize column | `onColumnResize` | Persists widths only for finished non-`sizeColumnsToFit` resizes | Emits `update:tableConfig` |
| Pin or move column | `onColumnPinned` / `onColumnLayoutChange` | Reads grid config while filtering layout-only width noise | Emits `update:tableConfig` when meaningful |
| Select row | `onSelectionChange` | Tracks rows and keys, refreshes changed cells | Emits `row:select` |
| Row click | `onRowClick` | No persistent state | Emits `row:click` unless disabled |
| Cell click | `onCellClick` | No persistent state | Emits `cell:click` |
| `refreshKey` changes | watcher | Calls `refresh()` | Calls the host fetcher |

## Rendering states

Visible table chrome and the public `state` event are related but intentionally separate. Visible chrome is controlled by the host-owned `loading` and `error` props first:

1. Host-forced `loading` shows the loading skeleton unless host-forced `error` is also true.
2. Host-forced `error` shows the error state.
3. Completed fetch with no rows shows the empty state.
4. Otherwise, the grid surface renders. AG Grid receives internal `isFetching` and shows grid-owned loading UI while requests are in flight.

`rowData` is still populated in infinite mode for the first block. That lets the wrapper decide whether to show empty/error states even though AG Grid owns infinite scrolling.

Fetcher rejections are caught and tracked as a boolean `hasFetchError` flag so the `state` event can report request failures without storing or exposing raw rejection values. The host app owns request error policy and should set the `error` prop when a fetch failure should render error chrome. A background fetch or later infinite block failure does not emit `loading` or `error` while existing rows remain rendered; the table remains in `success` with `hasData: true`.

| Emitted state value | Meaning |
| --- | --- |
| `loading` | Host-forced loading, or no data has rendered yet while the first fetch is pending |
| `error` | Host-forced error, or fetch failure with no rendered rows |
| `empty` | Fetch completed, no rows, no error |
| `success` | Data is available or the table has otherwise completed a non-empty state |

## Slot and renderer flow

```mermaid
flowchart LR
  Headers["headers"]
  Config["resolvedTableConfig"]
  Selection["useTableDataGridSelection"]
  ColumnDefs["useTableDataGridColumnDefs"]
  Context["typed AG Grid context<br/>cells, selection, sort"]
  Grid["AG Grid"]
  HeaderRenderer["TableDataGridHeaderRenderer"]
  SelectionRenderers["selection cell/header renderers"]
  CellRenderer["TableDataGridCellRenderer"]
  Slots["consumer slots by column key"]

  Headers --> ColumnDefs
  Config --> ColumnDefs
  Selection --> ColumnDefs
  ColumnDefs --> Context
  Context --> Grid
  Grid --> HeaderRenderer
  Grid --> SelectionRenderers
  Grid --> CellRenderer
  CellRenderer --> Slots
```

Cell rendering is slot-first. If the host provides a slot matching the header key, the cell renderer passes:

| Slot prop | Meaning |
| --- | --- |
| `row` | Row object |
| `rowValue` | Value from `row[column.key]` |
| `column` | Header definition |
| `rowIndex` | AG Grid row index |
| `selected` | Current AG Grid selected state |
| `refreshCell` | Forces this row cell to refresh |

If no matching slot exists, the raw cell value is rendered.

AG Grid renderers may receive AG Grid params, but package-owned behavior must flow through typed context sections:

| Context section | Owner | Consumers |
| --- | --- | --- |
| `context.cells` | `useTableDataGridColumnDefs` | Cell renderer column lookup, cell attrs, displayed column indexes, cell slots |
| `context.selection` | `useTableDataGridSelection` | Selection cell/header checkbox state, row toggle, select-all, header selection subscriptions |
| `context.sort` | `useTableDataGridColumnDefs` from resolved config | Header sort icon state and sort progression |

## Ownership guidelines

Components import internal composables through `src/composables/index.ts` as a namespace object. That indirection exists so Cypress component tests can stub package-local composables; do not replace it with direct imports unless the test strategy changes at the same time.

| If changing... | Keep the change near... | Notes |
| --- | --- | --- |
| Public props, emits, or exported types | `src/types/index.ts`, `TableDataGrid.vue`, README | Treat as public API unless intentionally breaking |
| Config normalization or equality | `src/utils/tableConfig.ts` | Preserve explicit `columns[key].pinned = false` semantics |
| Sort/page-size-driven refreshes | `useTableDataGridConfigSync` | Sort and page size are config changes that trigger fetch refresh |
| Pagination fetch behavior | `useTableDataGridPaginationFetch` | Preserve stale pagination request guards and commit rules |
| Infinite fetch behavior | `useTableDataGridInfiniteFetch` | Preserve cursor sequencing, block gating, and stale datasource guards |
| Column rendering | `useTableDataGridColumnDefs`, renderers | Keep sizing out of column definitions |
| Column fit/width behavior | `useTableDataGridColumnSizing` | This is the source of truth for auto-fit and configured-width decisions |
| Row selection behavior | `useTableDataGridSelection` | Selection state should refresh affected cells because cell slots receive `selected` |
| Filter ownership | `TableDataGrid.vue`, `TableDataGridFilters.vue` | Built-in filters update `filterSelection`; custom filter slots are host-owned |

## Verification focus

Column sizing and controlled config behavior are AG Grid integration points, so the Cypress component spec is the main regression surface for architecture changes. Important coverage areas include:

| Area | Why it matters |
| --- | --- |
| Initial config application | Avoid extra fetches and no-op config emits |
| Controlled config prop changes | Preserve host-owned state and avoid layout-only refetches |
| Pin/move/hide/resize | Persist meaningful grid changes without treating layout recalculation as user intent |
| Width reset and auto-fit | Distinguish real configured widths from wrapper-generated fitted widths |
| Pagination and infinite mode | Keep fetch params and stale response guards correct |
| Slot refresh and selection | Preserve renderer state when AG Grid reuses renderer instances |
| State events | Keep emitted `state` aligned with host-forced states, first-load fetch failures, and background-fetch success behavior |
