<template>
  <div
    ref="datatableElement"
    class="kong-ui-public-table-data-grid"
    data-testid="table-data-grid"
  >
    <TableDataGridControls
      v-model:filter-selection="filterSelection"
      v-model:search="searchQuery"
      :column-visibility="resolvedColumnVisibility"
      :enable-search="enableSearch"
      :headers="headers"
      :hide-bulk-actions="hideBulkActions"
      :hide-column-visibility="hideColumnVisibility"
      :outside-filters="outsideFilters"
      :outside-search="outsideSearch"
      :row-selection="rowSelection"
      :selected-rows="selectedRows"
      :show-toolbar="!loading && !hideToolbar"
      @filter:apply="onFilterApply"
      @filter:clear="onFilterClear"
      @filter:close="onFilterClose"
      @filter:open="onFilterOpen"
      @refresh="refresh"
      @update:column-visibility="columnVisibility => patchTableConfig({ columnVisibility })"
    >
      <template
        v-for="(_, slotName) in $slots"
        :key="slotName"
        #[slotName]="slotProps"
      >
        <slot
          :name="slotName"
          v-bind="slotProps ?? {}"
        />
      </template>
    </TableDataGridControls>

    <KSkeleton
      v-if="loading"
      data-testid="table-data-grid-loading"
      type="table"
    />

    <slot
      v-else-if="shouldShowErrorState"
      name="error-state"
    >
      <KEmptyState
        data-testid="table-data-grid-error"
        icon-variant="error"
        :message="i18n.t('datatable.errorMessage')"
        :title="i18n.t('datatable.errorTitle')"
      />
    </slot>

    <template v-else>
      <slot
        v-if="isEmpty"
        name="empty-state"
      >
        <KEmptyState
          data-testid="table-data-grid-empty"
          :title="i18n.t('datatable.emptyTitle')"
        />
      </slot>

      <TableDataGridBody
        v-else
        :active-page-size="activePageSize"
        :ag-grid-options="agGridOptions"
        :column-defs="columnDefs"
        :current-page="currentPage"
        :datasource="datasource"
        :fetch-page="fetchPage"
        :get-row-id="getAgGridRowId"
        :grid-context="gridContext"
        :has-fetched="hasFetched"
        :has-next-page-when-total-unknown="hasNextPageWhenTotalUnknown"
        :hide-pagination="hidePagination"
        :hide-pagination-when-optional="hidePaginationWhenOptional"
        :is-fetching="isFetching"
        :mode="mode"
        :pagination-page-size-options="paginationPageSizeOptions"
        :process-row-post-create="onRowPostCreate"
        :row-data="rowData"
        :row-selection-config="rowSelectionConfig"
        :total-rows="totalRows"
        @cell-clicked="onCellClick"
        @column-moved="onColumnLayoutChange"
        @column-pinned="onColumnPinned"
        @column-resized="onColumnResize"
        @column-visible="onColumnVisibilityChange"
        @displayed-columns-changed="onDisplayedColumnsChange"
        @grid-ready="onGridReady"
        @model-updated="onModelUpdated"
        @page-size-change="onPageSizeChange"
        @row-clicked="onRowClick"
        @selection-changed="onSelectionChange"
        @sort-changed="onSortChange"
      />
    </template>
  </div>
</template>

<script lang="ts">
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25
const DEFAULT_ROW_KEY = 'id'
</script>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  TableDataGridCellAttrs,
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridMode,
  TableDataGridRowAttrs,
  TableDataGridRowKey,
  TableDataGridRowSelectionMode,
  TableDataGridSort,
  TableDataGridStatePayload,
  TableDataGridToolbarSlotProps,
  TableDataGridTeleportTarget,
} from '../types'
import type {
  GridApi,
  RowClickedEvent,
} from 'ag-grid-community'
import type { FilterGroupSelection } from '@kong/kongponents'
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, ref, toRef } from 'vue'
import TableDataGridBody from './TableDataGridBody.vue'
import TableDataGridControls from './TableDataGridControls.vue'
import composables from '../composables'

const {
  headers,
  fetcher,
  mode = 'pagination',
  rowKey,
  pageSize = DEFAULT_PAGE_SIZE,
  initialFetcherParams = {},
  loading = false,
  error = false,
  enableSearch = false,
  outsideSearch,
  outsideFilters,
  hideToolbar = false,
  hideBulkActions = false,
  hideColumnVisibility = false,
  hidePagination = false,
  hidePaginationWhenOptional = false,
  rowSelection = 'none',
  agGridOptions = {},
  paginationPageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  refreshKey,
  rowAttrs,
  cellAttrs,
  tableConfig,
} = defineProps<{
  headers: Array<TableDataGridHeader<Row>>
  fetcher: TableDataGridFetcher<Row>
  mode?: TableDataGridMode
  rowKey?: TableDataGridRowKey<Row>
  pageSize?: number
  initialFetcherParams?: {
    search?: string
  }
  loading?: boolean
  error?: boolean
  enableSearch?: boolean
  outsideSearch?: TableDataGridTeleportTarget
  outsideFilters?: TableDataGridTeleportTarget
  hideToolbar?: boolean
  hideBulkActions?: boolean
  hideColumnVisibility?: boolean
  hidePagination?: boolean
  hidePaginationWhenOptional?: boolean
  rowSelection?: TableDataGridRowSelectionMode
  agGridOptions?: TableDataGridGridOptions<Row>
  paginationPageSizeOptions?: number[]
  refreshKey?: string | number
  rowAttrs?: TableDataGridRowAttrs<Row>
  cellAttrs?: TableDataGridCellAttrs<Row>
  tableConfig?: TableDataGridConfig
}>()
const filterSelection = defineModel<FilterGroupSelection>('filterSelection', { default: () => ({}) })

const slots = defineSlots<{
  'bulk-action-items': (props: { selectedRows: Row[] }) => any
  'empty-state': () => any
  'error-state': () => any
  'outside-actions': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-left': (props: TableDataGridToolbarSlotProps<Row>) => any
  'toolbar-right': (props: TableDataGridToolbarSlotProps<Row>) => any
  [key: string]: (props: any) => any
}>()

const emit = defineEmits<{
  (e: 'row:click', row: Row, event: RowClickedEvent<Row>): void
  (e: 'cell:click', payload: { row: Row, columnKey: string, value: any }): void
  (e: 'row:select', selectedRows: Row[]): void
  (e: 'update:tableConfig', config: TableDataGridConfig): void
  (e: 'sort', sort: TableDataGridSort): void
  (e: 'state', payload: TableDataGridStatePayload): void
  (e: 'grid:ready', api: GridApi<Row>): void
  (e: 'filter:apply', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:clear', filterKey: string, selection: FilterGroupSelection): void
  (e: 'filter:open', filterKey: string): void
  (e: 'filter:close', filterKey: string): void
}>()

const { i18n } = composables.useI18n()
const datatableElement = ref<HTMLElement>()
const { width: datatableWidth } = useElementSize(datatableElement, { width: 0, height: 0 }, { box: 'border-box' })
const searchQuery = ref(initialFetcherParams.search ?? '')
const gridApi = ref<GridApi<Row>>()
const isApplyingInitialColumnState = ref(false)
const isApplyingTableConfig = ref(false)
const resolvedRowKey = computed<TableDataGridRowKey<Row>>(() => rowKey ?? DEFAULT_ROW_KEY as TableDataGridRowKey<Row>)

const {
  activePageSize,
  applyTableConfig,
  captureGridConfig,
  getGridConfig,
  patchTableConfig,
  resolvedColumnVisibility,
  resolvedSort,
  resolvedTableConfig,
  updateTableConfig,
} = composables.useTableDataGridConfig<Row>({
  emitTableConfigUpdate: nextConfig => emit('update:tableConfig', nextConfig),
  headers: toRef(() => headers),
  pageSize: toRef(() => pageSize),
  tableConfig: toRef(() => tableConfig),
})

const {
  currentPage,
  datasource,
  fetchError,
  fetchPage,
  hasFetched,
  hasNextPageWhenTotalUnknown,
  isFetching,
  resetFetched,
  refresh,
  rowData,
  totalRows,
} = composables.useTableDataGridFetch<Row>({
  fetcher: toRef(() => fetcher),
  params: {
    mode: toRef(() => mode),
    pageSize: activePageSize,
    search: searchQuery,
    sortColumnKey: computed(() => resolvedTableConfig.value.sortColumnKey),
    sortColumnOrder: computed(() => resolvedTableConfig.value.sortColumnOrder),
    filterSelection,
  },
})

const {
  deselectAll,
  onSelectionChange,
  rowSelectionConfig,
  selectedRows,
  selectionColumnDef,
  selectRowByKey,
} = composables.useDatatableSelection<Row>({
  config: {
    agGridOptions: toRef(() => agGridOptions),
    rowKey: resolvedRowKey,
    rowSelection: toRef(() => rowSelection),
  },
  emit: {
    rowSelect: selectedRows => emit('row:select', selectedRows),
  },
  grid: {
    gridApi,
  },
})

const sizing = composables.useDatatableColumnSizing<Row>({
  config: {
    headers: toRef(() => headers),
    isApplyingTableConfig,
    resolvedTableConfig,
    tableConfig: toRef(() => tableConfig),
    updateTableConfig,
  },
  element: {
    datatableElement,
    datatableWidth,
  },
  grid: {
    getGridConfig,
    gridApi,
  },
})

const {
  displayedColumnIndexesByKey,
  onColumnLayoutChange,
  onColumnPinned,
  onColumnResize,
  onColumnVisibilityChange,
  onDisplayedColumnsChange,
  onModelUpdated,
  updateDisplayedColumnIndexes,
} = composables.useTableDataGridColumnLayoutSync<Row>({
  gridApi,
  isApplyingInitialColumnState,
  mode: toRef(() => mode),
  rowSelection: toRef(() => rowSelection),
  sizing,
})

const {
  applyResolvedTableConfig,
  onGridReady,
} = composables.useTableDataGridGridLifecycle<Row>({
  applyTableConfig,
  captureGridConfig,
  emitGridReady: api => emit('grid:ready', api),
  gridApi,
  isApplyingInitialColumnState,
  isApplyingTableConfig,
  refresh,
  resetFetched,
  resolvedSort,
  sizing,
  updateDisplayedColumnIndexes,
})

const {
  onPageSizeChange,
  onSortChange,
} = composables.useTableDataGridConfigSync<Row>({
  activePageSize,
  applyResolvedTableConfig,
  emitSort: sortValue => emit('sort', sortValue),
  getGridConfig,
  gridApi,
  mode: toRef(() => mode),
  patchTableConfig,
  refresh,
  resolvedTableConfig,
  sizing,
})

const {
  columnDefs,
  gridContext,
} = composables.useDatatableColumnDefs<Row>({
  config: {
    cellAttrs: toRef(() => cellAttrs),
    headers: toRef(() => headers),
    resolvedTableConfig,
  },
  grid: {
    displayedColumnIndexesByKey,
  },
  selection: {
    selectionColumnDef,
  },
  slots: {
    slots,
  },
})

const {
  isEmpty,
  shouldShowErrorState,
} = composables.useTableDataGridState<Row>({
  emit: {
    state: payload => emit('state', payload),
  },
  fetch: {
    fetchError,
    hasFetched,
    isFetching,
    rowData,
  },
  inputs: {
    error: toRef(() => error),
    loading: toRef(() => loading),
  },
})

const {
  getAgGridRowId,
  onCellClick,
  onRowClick,
  onRowPostCreate,
} = composables.useTableDataGridInteractions<Row>({
  emit: {
    cellClick: payload => emit('cell:click', payload),
    rowClick: (row, event) => emit('row:click', row, event),
  },
  inputs: {
    agGridOptions: toRef(() => agGridOptions),
    headers: toRef(() => headers),
    rowAttrs: toRef(() => rowAttrs),
    rowKey: resolvedRowKey,
  },
})

const onFilterApply = (filterKey: string, selectionValue: FilterGroupSelection) => {
  emit('filter:apply', filterKey, selectionValue)
  void nextTick(refresh)
}

const onFilterClear = (filterKey: string, selectionValue: FilterGroupSelection) => {
  emit('filter:clear', filterKey, selectionValue)
  void nextTick(refresh)
}

const onFilterOpen = (filterKey: string) => {
  emit('filter:open', filterKey)
}

const onFilterClose = (filterKey: string) => {
  emit('filter:close', filterKey)
}

composables.useTableDataGridRefreshTriggers({
  element: {
    datatableWidth,
  },
  fetch: {
    refresh,
  },
  inputs: {
    enableSearch: toRef(() => enableSearch),
    refreshKey: toRef(() => refreshKey),
  },
  models: {
    searchQuery,
  },
  sizing: {
    handleDatatableWidthChange: sizing.handleDatatableWidthChange,
  },
})

defineExpose<{
  refresh: () => void
  selectRowByKey: (key: string) => void
  deselectAll: () => void
  getGridApi: () => GridApi<Row> | undefined
}>({
  refresh,
  selectRowByKey,
  deselectAll,
  getGridApi: () => gridApi.value,
})

</script>

<style lang="scss" scoped>
.kong-ui-public-table-data-grid {
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

</style>
