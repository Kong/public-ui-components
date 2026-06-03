<template>
  <!-- region: grid -->
  <AgGridVue
    :key="mode"
    :always-show-vertical-scroll="agGridOptions.alwaysShowVerticalScroll ?? false"
    :cache-block-size="activePageSize"
    class="table-data-grid-grid"
    :col-resize-default="agGridOptions.colResizeDefault ?? 'shift'"
    :column-defs="columnDefs"
    :context="gridContext"
    :datasource="datasource"
    :get-row-id="getAgGridRowId"
    :grid-options="agGridOptions"
    :infinite-initial-row-count="1"
    :loading="isFetching"
    :process-row-post-create="onRowPostCreate"
    :row-data="mode === 'pagination' ? rowData : undefined"
    :row-model-type="mode === 'infinite' ? 'infinite' : 'clientSide'"
    :row-selection="rowSelectionConfig"
    :suppress-cell-focus="true"
    :suppress-drag-leave-hides-columns="agGridOptions.suppressDragLeaveHidesColumns ?? true"
    :theme="themeQuartz"
    @cell-clicked="onCellClick"
    @column-moved="emitColumnMoved"
    @column-pinned="emitColumnPinned"
    @column-resized="emitColumnResized"
    @column-visible="emitColumnVisible"
    @displayed-columns-changed="emitDisplayedColumnsChanged"
    @grid-ready="emitGridReady"
    @model-updated="emitModelUpdated"
    @row-clicked="onRowClick"
    @selection-changed="emitSelectionChanged"
    @sort-changed="emitSortChanged"
  />

  <!-- region: pagination -->
  <div
    v-if="shouldShowPagination"
    class="datatable-pagination"
    data-testid="table-data-grid-pagination"
  >
    <KPagination
      :key="paginationKey"
      class="datatable-pagination-control"
      :current-page="hasKnownTotalRows ? currentPage : null"
      :disable-page-jump="!hasKnownTotalRows"
      :initial-page-size="activePageSize"
      :offset="!hasKnownTotalRows"
      :offset-next-button-disabled="!canGoNextPage || isFetching"
      :offset-previous-button-disabled="!canGoPreviousPage || isFetching"
      :page-sizes="resolvedPaginationPageSizeOptions"
      :total-count="totalRows"
      @get-next-offset="goToPage(currentPage + 1)"
      @get-previous-offset="goToPage(currentPage - 1)"
      @page-change="onPageChange"
      @page-size-change="emitPageSizeChange"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridMode,
  TableDataGridRowAttrs,
  TableDataGridRowKey,
} from '../types'
import type {
  ColDef,
  ColumnMovedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  DisplayedColumnsChangedEvent,
  GridReadyEvent,
  IDatasource,
  ModelUpdatedEvent,
  RowClickedEvent,
  RowSelectionOptions,
  SelectionChangedEvent,
  SortChangedEvent,
} from 'ag-grid-community'
import type { PageSizeChangeData } from '@kong/kongponents'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, InfiniteRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { computed, toRef } from 'vue'
import composables from '../composables'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

const props = defineProps<{
  mode: TableDataGridMode
  agGridOptions: TableDataGridGridOptions<Row>
  activePageSize: number
  columnDefs: Array<ColDef<Row>>
  gridContext: object
  datasource?: IDatasource
  headers: Array<TableDataGridHeader<Row>>
  isFetching: boolean
  rowAttrs?: TableDataGridRowAttrs<Row>
  rowData: Row[]
  rowKey: TableDataGridRowKey<Row>
  rowSelectionConfig?: RowSelectionOptions
  currentPage: number
  fetchPage: (page: number) => Promise<void> | void
  hasFetched: boolean
  hasNextPageWhenTotalUnknown: boolean
  hidePagination: boolean
  hidePaginationWhenOptional: boolean
  paginationPageSizeOptions: number[]
  totalRows?: number
}>()

const emit = defineEmits<{
  (e: 'cell-click', payload: { row: Row, columnKey: string, value: any }): void
  (e: 'column-moved', event: ColumnMovedEvent<Row>): void
  (e: 'column-pinned', event: ColumnPinnedEvent<Row>): void
  (e: 'column-resized', event: ColumnResizedEvent<Row>): void
  (e: 'column-visible', event: ColumnVisibleEvent<Row>): void
  (e: 'displayed-columns-changed', event: DisplayedColumnsChangedEvent<Row>): void
  (e: 'grid-ready', event: GridReadyEvent<Row>): void
  (e: 'model-updated', event: ModelUpdatedEvent<Row>): void
  (e: 'row-click', row: Row, event: RowClickedEvent<Row>): void
  (e: 'selection-changed', event: SelectionChangedEvent<Row>): void
  (e: 'sort-changed', event: SortChangedEvent<Row>): void
  (e: 'page-size-change', event: PageSizeChangeData): void
}>()

const {
  getAgGridRowId,
  onCellClick,
  onRowClick,
  onRowPostCreate,
} = composables.useTableDataGridInteractions<Row>({
  emit: {
    cellClick: payload => emit('cell-click', payload),
    rowClick: (row, event) => emit('row-click', row, event),
  },
  inputs: {
    agGridOptions: toRef(() => props.agGridOptions),
    headers: toRef(() => props.headers),
    rowAttrs: toRef(() => props.rowAttrs),
    rowKey: toRef(() => props.rowKey),
  },
})

const {
  hasKnownTotalRows,
  canGoPreviousPage,
  canGoNextPage,
  goToPage,
  onPageChange,
} = composables.useDatatablePagination({
  activePageSize: toRef(() => props.activePageSize),
  isFetching: toRef(() => props.isFetching),
  fetchPage: page => props.fetchPage(page),
  currentPage: toRef(() => props.currentPage),
  totalRows: toRef(() => props.totalRows),
  hasNextPageWhenTotalUnknown: toRef(() => props.hasNextPageWhenTotalUnknown),
})

const resolvedPaginationPageSizeOptions = computed(() => (
  [...new Set([...props.paginationPageSizeOptions, props.activePageSize])].sort((a, b) => a - b)
))
// Kongponents reads initialPageSize only on mount, so remount pagination when
// page-size options change to keep its internal selection aligned.
const paginationKey = computed(() => `${props.activePageSize}:${resolvedPaginationPageSizeOptions.value.join(',')}`)

const shouldShowPaginationWhenOptional = computed(() => {
  if (props.totalRows == null) {
    return props.currentPage > 1 || props.hasNextPageWhenTotalUnknown
  }

  return props.totalRows > props.activePageSize
})
const shouldShowPagination = computed(() => (
  props.mode === 'pagination'
    && props.hasFetched
    && !props.hidePagination
    && (!props.hidePaginationWhenOptional || shouldShowPaginationWhenOptional.value)
))

const emitColumnMoved = (event: ColumnMovedEvent<Row>) => emit('column-moved', event)
const emitColumnPinned = (event: ColumnPinnedEvent<Row>) => emit('column-pinned', event)
const emitColumnResized = (event: ColumnResizedEvent<Row>) => emit('column-resized', event)
const emitColumnVisible = (event: ColumnVisibleEvent<Row>) => emit('column-visible', event)
const emitDisplayedColumnsChanged = (event: DisplayedColumnsChangedEvent<Row>) => emit('displayed-columns-changed', event)
const emitGridReady = (event: GridReadyEvent<Row>) => emit('grid-ready', event)
const emitModelUpdated = (event: ModelUpdatedEvent<Row>) => emit('model-updated', event)
const emitSelectionChanged = (event: SelectionChangedEvent<Row>) => emit('selection-changed', event)
const emitSortChanged = (event: SortChangedEvent<Row>) => emit('sort-changed', event)
const emitPageSizeChange = (event: PageSizeChangeData) => emit('page-size-change', event)
</script>

<style lang="scss" scoped>
.table-data-grid-grid {
  /* stylelint-disable custom-property-pattern -- AG Grid theme variables must use AG Grid's --ag-* namespace. */
  --ag-background-color: var(--kui-color-background, #{$kui-color-background});
  --ag-border-color: var(--kui-color-border, #{$kui-color-border});
  --ag-header-background-color: var(--kui-color-background, #{$kui-color-background});
  --ag-header-column-border: 1px solid var(--kui-color-border, #{$kui-color-border});
  --ag-header-column-resize-handle-color: transparent;
  --ag-selected-row-background-color: var(--kui-color-background-primary-weakest, #{$kui-color-background-primary-weakest});
  --ag-wrapper-border: none;
  --ag-wrapper-border-radius: 0;
  /* stylelint-enable custom-property-pattern */

  flex: 1 1 420px;
  min-height: 0;
  width: 100%;
}

.datatable-pagination {
  background: var(--kui-color-background, $kui-color-background);
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding: var(--kui-space-20, $kui-space-20) var(--kui-space-50, $kui-space-50) var(--kui-space-30, $kui-space-30);
}

.datatable-pagination-control {
  margin-top: 0;
  padding: 0;
  width: 100%;
}

.datatable-pagination-control :global(.pagination-text.large-screen) {
  padding-left: var(--kui-space-40, $kui-space-40);
}

.table-data-grid-grid :global(.ag-header-cell[col-id="ag-Grid-SelectionColumn"]) {
  /* stylelint-disable-next-line custom-property-pattern -- AG Grid theme variables must use AG Grid's --ag-* namespace. */
  --ag-header-column-border: none;

  border-right: 0;
  gap: 0;
}

.table-data-grid-grid :global(.ag-cell) {
  align-items: center;
  display: flex;
}

.table-data-grid-grid :global(.ag-cell-wrapper),
.table-data-grid-grid :global(.ag-cell-value),
.table-data-grid-grid :global(.datatable-cell-content) {
  align-items: center;
  display: flex;
  height: 100%;
  min-width: 0;
  width: 100%;
}

.datatable-pagination-control :global(.pagination-button.placeholder) {
  box-sizing: border-box;
}
</style>
