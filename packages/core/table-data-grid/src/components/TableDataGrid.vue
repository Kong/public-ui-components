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
      v-if="loading && !error"
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
        :cell-attrs="cellAttrs"
        :current-page="currentPage"
        :datasource="datasource"
        :displayed-column-indexes-by-key="displayedColumnIndexesByKey"
        :fetch-page="fetchPage"
        :has-fetched="hasFetched"
        :has-next-page-when-total-unknown="hasNextPageWhenTotalUnknown"
        :headers="headers"
        :hide-pagination="hidePagination"
        :hide-pagination-when-optional="hidePaginationWhenOptional"
        :is-fetching="isFetching"
        :mode="mode"
        :pagination-page-size-options="paginationPageSizeOptions"
        :resolved-table-config="resolvedTableConfig"
        :row-attrs="rowAttrs"
        :row-data="rowData"
        :row-key="resolvedRowKey"
        :row-selection="rowSelection"
        :row-selection-config="rowSelectionConfig"
        :selection-renderer-context="selectionRendererContext"
        :total-rows="totalRows"
        @cell-click="payload => emit('cell:click', payload)"
        @column-moved="onColumnLayoutChange"
        @column-pinned="onColumnPinned"
        @column-resized="onColumnResize"
        @column-visible="onColumnVisibilityChange"
        @displayed-columns-changed="onDisplayedColumnsChange"
        @grid-ready="onGridReady"
        @model-updated="onModelUpdated"
        @page-size-change="onPageSizeChange"
        @row-click="(row, event) => emit('row:click', row, event)"
        @selection-changed="onSelectionChange"
        @sort-changed="onSortChange"
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
      </TableDataGridBody>
    </template>
  </div>
</template>

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
import type { TableDataGridFetchParams } from '../types/internal'
import type { RefreshOptions } from '../utils/fetchers'

const DEFAULT_PAGE_SIZE = 25
const DEFAULT_ROW_KEY = 'id'

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
  paginationPageSizeOptions = [10, 15, 25, 50, 100],
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

defineSlots<{
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

const fetchState = composables.useTableDataGridFetchState<Row>()

const {
  currentPage,
  datasource,
  hasFetched,
  hasFetchError,
  hasNextPageWhenTotalUnknown,
  isFetching,
  rowData,
  totalRows,
} = fetchState

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

const fetchParams: TableDataGridFetchParams = {
  mode: toRef(() => mode),
  pageSize: activePageSize,
  search: searchQuery,
  sortColumnKey: computed(() => resolvedTableConfig.value.sortColumnKey),
  sortColumnOrder: computed(() => resolvedTableConfig.value.sortColumnOrder),
  filterSelection,
}

const {
  fetchPage,
  invalidatePaginationRequests,
} = composables.useTableDataGridPaginationFetch<Row>({
  fetcher: toRef(() => fetcher),
  params: fetchParams,
  state: fetchState,
})

const {
  refreshInfinite,
} = composables.useTableDataGridInfiniteFetch<Row>({
  fetcher: toRef(() => fetcher),
  params: fetchParams,
  state: fetchState,
})

const refresh = (options: RefreshOptions = {}) => {
  if (mode === 'pagination') {
    datasource.value = undefined
    void fetchPage(1, options)
    return
  }

  // Invalidates any in-flight pagination request before swapping to a datasource.
  invalidatePaginationRequests()
  refreshInfinite(options)
}

const {
  deselectAll,
  onSelectionChange,
  rowSelectionConfig,
  selectedRows,
  selectionRendererContext,
  selectRowByKey,
} = composables.useTableDataGridSelection<Row>({
  gridApi,
  rowKey: resolvedRowKey,
  rowSelect: selectedRows => emit('row:select', selectedRows),
  rowSelection: toRef(() => rowSelection),
})

const sizing = composables.useTableDataGridColumnSizing<Row>({
  datatableElement,
  datatableWidth,
  getGridConfig,
  gridApi,
  headers: toRef(() => headers),
  isApplyingTableConfig,
  resolvedTableConfig,
  tableConfig: toRef(() => tableConfig),
  updateTableConfig,
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
  resetFetched: fetchState.resetFetched,
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
  isEmpty,
  shouldShowErrorState,
} = composables.useTableDataGridState<Row>({
  emitState: payload => emit('state', payload),
  error: toRef(() => error),
  hasFetchError,
  hasFetched,
  isFetching,
  loading: toRef(() => loading),
  rowData,
})

composables.useTableDataGridRefreshTriggers({
  datatableWidth,
  enableSearch: toRef(() => enableSearch),
  handleDatatableWidthChange: sizing.handleDatatableWidthChange,
  refresh,
  refreshKey: toRef(() => refreshKey),
  searchQuery,
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
