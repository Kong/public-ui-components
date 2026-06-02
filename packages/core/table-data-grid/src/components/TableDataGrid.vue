<template>
  <div
    ref="datatableElement"
    class="kong-ui-public-table-data-grid"
    data-testid="table-data-grid"
  >
    <div
      aria-hidden="true"
      class="datatable-outside-actions-host"
      inert
    >
      <slot
        name="outside-actions"
        v-bind="toolbarSlotProps"
      />
    </div>

    <Teleport
      v-if="showOutsideSearch"
      defer
      :to="outsideSearch"
    >
      <TableDataGridSearch v-model="searchQuery" />
    </Teleport>

    <Teleport
      v-if="showOutsideFilters"
      defer
      :to="outsideFilters"
    >
      <TableDataGridFilters
        v-model="filterSelection"
        :filters="filterGroupFilters"
        :forwarded-filter-slot-names="getForwardedFilterSlotNames()"
        @apply="onFilterApply"
        @clear="onFilterClear"
        @close="onFilterClose"
        @open="onFilterOpen"
      >
        <template
          v-for="slotName in getForwardedFilterSlotNames()"
          :key="slotName"
          #[slotName]
        >
          <slot :name="slotName" />
        </template>
      </TableDataGridFilters>
    </Teleport>

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
      <TableDataGridToolbar
        v-if="!hideToolbar"
        v-model:column-visibility="columnVisibilityModel"
        v-model:filter-selection="filterSelection"
        v-model:search="searchQuery"
        :filters="filterGroupFilters"
        :forwarded-filter-slot-names="getForwardedFilterSlotNames()"
        :headers="headers"
        :show-bulk-actions="showBulkActions"
        :show-column-visibility="showColumnVisibility"
        :show-toolbar-filters="showToolbarFilters"
        :show-toolbar-search="showToolbarSearch"
        :toolbar-slot-props="toolbarSlotProps"
        @filter:apply="onFilterApply"
        @filter:clear="onFilterClear"
        @filter:close="onFilterClose"
        @filter:open="onFilterOpen"
      >
        <template
          v-if="$slots.toolbar"
          #toolbar="slotProps"
        >
          <slot
            name="toolbar"
            v-bind="slotProps"
          />
        </template>

        <template #toolbar-left="slotProps">
          <slot
            name="toolbar-left"
            v-bind="slotProps"
          />
        </template>

        <template #toolbar-right="slotProps">
          <slot
            name="toolbar-right"
            v-bind="slotProps"
          />
        </template>

        <template #bulk-action-items="slotProps">
          <slot
            name="bulk-action-items"
            v-bind="slotProps"
          />
        </template>

        <template
          v-for="slotName in getForwardedFilterSlotNames()"
          :key="slotName"
          #[slotName]
        >
          <slot :name="slotName" />
        </template>
      </TableDataGridToolbar>

      <slot
        v-if="isEmpty"
        name="empty-state"
      >
        <KEmptyState
          data-testid="table-data-grid-empty"
          :title="i18n.t('datatable.emptyTitle')"
        />
      </slot>

      <template v-else>
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
          :theme="themeQuartz"
          @cell-clicked="onCellClick"
          @column-moved="onColumnLayoutChange"
          @column-pinned="onColumnPinned"
          @column-resized="onColumnResize"
          @column-visible="onColumnVisibilityChange"
          @displayed-columns-changed="onDisplayedColumnsChange"
          @grid-ready="onGridReady"
          @model-updated="onModelUpdated"
          @row-clicked="onRowClick"
          @selection-changed="onSelectionChange"
          @sort-changed="onSortChange"
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
            @page-size-change="onPageSizeChange"
          />
        </div>
      </template>
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
  TableDataGridState,
  TableDataGridStatePayload,
  TableDataGridToolbarSlotProps,
  TableDataGridTeleportTarget,
} from '../types'
import type {
  CellClickedEvent,
  GridApi,
  ProcessRowParams,
  RowClickedEvent,
} from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, InfiniteRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import { useElementSize, watchDebounced } from '@vueuse/core'
import { computed, nextTick, ref, toRef, watch } from 'vue'
import TableDataGridFilters from './TableDataGridFilters.vue'
import TableDataGridSearch from './TableDataGridSearch.vue'
import TableDataGridToolbar from './TableDataGridToolbar.vue'
import { getFilterSlotName } from '../utils/headers'
import { getRowKeyValue } from '../utils/rowKey'
import { patchRowAttrs } from '../utils/rowAttrs'
import composables from '../composables'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

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
const gridApi = ref<GridApi<Row>>()
const isApplyingTableConfig = ref(false)
const resolvedRowKey = computed<TableDataGridRowKey<Row>>(() => rowKey ?? DEFAULT_ROW_KEY as TableDataGridRowKey<Row>)
const searchQuery = ref(initialFetcherParams.search ?? '')

// Access through the composables bag keeps Cypress stubs working for package component tests.
const {
  activePageSize,
  applyTableConfig,
  getGridConfig,
  resolvedColumnVisibility,
  resolvedSort,
  resolvedTableConfig,
  captureGridConfig,
  patchTableConfig,
  updateTableConfig,
} = composables.useTableDataGridConfig<Row>({
  tableConfig: toRef(() => tableConfig),
  emitTableConfigUpdate: config => emit('update:tableConfig', config),
  headers: toRef(() => headers),
  pageSize: toRef(() => pageSize),
})

const {
  currentPage,
  datasource,
  fetchPage,
  fetchError,
  hasFetched,
  hasNextPageWhenTotalUnknown,
  isFetching,
  resetFetched,
  refresh,
  rowData,
  totalRows,
} = composables.useTableDataGridFetchers<Row>({
  fetcher: toRef(() => fetcher),
  fetcherParams: {
    mode: toRef(() => mode),
    pageSize: activePageSize,
    search: searchQuery,
    sortColumnKey: computed(() => resolvedTableConfig.value.sortColumnKey),
    sortColumnOrder: computed(() => resolvedTableConfig.value.sortColumnOrder),
    filterSelection: filterSelection,
  },
})
const {
  hasKnownTotalRows,
  canGoPreviousPage,
  canGoNextPage,
  goToPage,
  onPageChange,
} = composables.useDatatablePagination({
  activePageSize,
  isFetching,
  fetchPage,
  currentPage,
  totalRows,
  hasNextPageWhenTotalUnknown,
})

const {
  selectedRows,
  rowSelectionConfig,
  selectionColumnDef,
  selectRowByKey,
  deselectAll,
  onSelectionChange,
} = composables.useDatatableSelection<Row>({
  gridApi,
  rowSelection: toRef(() => rowSelection),
  agGridOptions: toRef(() => agGridOptions),
  rowKey: resolvedRowKey,
  emitRowSelect: selected => emit('row:select', selected),
})

const {
  emitGridConfigChange,
  fitColumnsOnGridReady,
  handleDatatableWidthChange,
  scheduleColumnsToFit,
  scheduleColumnsToFitAfterDisplayedColumnsChange,
  scheduleColumnsToFitAfterRenderedRowsChange,
  shouldRefitColumnsAfterConfigChange,
  startResizeTracking,
} = composables.useDatatableColumnSizing<Row>({
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
  onGridReady,
  onModelUpdated,
  onPageSizeChange,
  onSortChange,
} = composables.useDatatableGridSync<Row>({
  config: {
    activePageSize,
    applyTableConfig,
    captureGridConfig,
    isApplyingTableConfig,
    patchTableConfig,
    resolvedSort,
    resolvedTableConfig,
  },
  fetch: {
    mode: toRef(() => mode),
    resetFetched,
    refresh,
  },
  grid: {
    emitGridReady: api => emit('grid:ready', api),
    emitSort: sort => emit('sort', sort),
    getGridConfig,
    gridApi,
  },
  selection: {
    rowSelection: toRef(() => rowSelection),
  },
  sizingHandlers: {
    emitGridConfigChange,
    fitColumnsOnGridReady,
    scheduleColumnsToFit,
    scheduleColumnsToFitAfterDisplayedColumnsChange,
    scheduleColumnsToFitAfterRenderedRowsChange,
    shouldRefitColumnsAfterConfigChange,
    startResizeTracking,
  },
})

const {
  columnDefs,
  gridContext,
} = composables.useDatatableColumnDefs<Row>({
  headers: toRef(() => headers),
  cellAttrs: toRef(() => cellAttrs),
  displayedColumnIndexesByKey,
  resolvedTableConfig,
  selectionColumnDef,
  slots,
})

const resolvedPaginationPageSizeOptions = computed(() => (
  [...new Set([...paginationPageSizeOptions, activePageSize.value])].sort((a, b) => a - b)
))
// Kongponents reads initialPageSize only on mount, so remount pagination when
// page-size options change to keep its internal selection aligned.
const paginationKey = computed(() => `${activePageSize.value}:${resolvedPaginationPageSizeOptions.value.join(',')}`)

const filterGroupFilters = computed<FilterGroupFilters>(() => Object.fromEntries(
  headers
    .filter(header => header.filter)
    .map(header => [header.key, header.filter]),
) as FilterGroupFilters)

const getForwardedFilterSlotNames = () => Object.keys(filterGroupFilters.value)
  .map(getFilterSlotName)
  .filter(slotName => Boolean(slots[slotName]))

const updateFilterSelection = (selection: FilterGroupSelection) => {
  filterSelection.value = { ...selection }
  refresh()
}
const updateSearch = (search: string) => {
  searchQuery.value = search
}
const toolbarSlotProps = computed<TableDataGridToolbarSlotProps<Row>>(() => ({
  selectedRows: selectedRows.value,
  filterSelection: filterSelection.value,
  filters: filterGroupFilters.value,
  search: searchQuery.value,
  updateFilterSelection,
  updateSearch,
  refresh,
}))
const hasFilters = computed(() => headers.some(header => header.filter != null))
const hasOutsideFiltersTarget = computed(() => Boolean(outsideFilters))
const hasOutsideSearchTarget = computed(() => Boolean(outsideSearch))
const showOutsideFilters = computed(() => hasFilters.value && hasOutsideFiltersTarget.value)
const showOutsideSearch = computed(() => enableSearch && hasOutsideSearchTarget.value)
const showBulkActions = computed(() => rowSelection !== 'none' && !hideBulkActions)
const showToolbarFilters = computed(() => hasFilters.value && !hasOutsideFiltersTarget.value)
const showToolbarSearch = computed(() => enableSearch && !hasOutsideSearchTarget.value)
const showColumnVisibility = computed(() => !hideColumnVisibility)
const columnVisibilityModel = computed({
  get: () => resolvedColumnVisibility.value,
  set: (columnVisibility: Record<string, boolean>) => {
    patchTableConfig({ columnVisibility })
  },
})

const hasRows = computed(() => rowData.value.length > 0)
const shouldShowErrorState = computed(() => error || (Boolean(fetchError.value) && !hasRows.value))
const shouldEmitLoadingState = computed(() => loading || (!hasRows.value && (!hasFetched.value || isFetching.value)))
const isEmpty = computed(() => hasFetched.value && !isFetching.value && !hasRows.value && !shouldShowErrorState.value)
const shouldShowPaginationWhenOptional = computed(() => {
  if (totalRows.value == null) {
    return currentPage.value > 1 || hasNextPageWhenTotalUnknown.value
  }

  return totalRows.value > activePageSize.value
})
const shouldShowPagination = computed(() => (
  mode === 'pagination'
    && hasFetched.value
    && !hidePagination
    && (!hidePaginationWhenOptional || shouldShowPaginationWhenOptional.value)
))
const datatableState = computed<TableDataGridState>(() => {
  if (shouldEmitLoadingState.value) {
    return 'loading'
  }

  if (shouldShowErrorState.value) {
    return 'error'
  }

  if (isEmpty.value) {
    return 'empty'
  }

  return 'success'
})

const getAgGridRowId = ({ data }: { data: Row }) => {
  return getRowKeyValue(data, resolvedRowKey.value)
}

const rowClickDisabledColumnKeys = computed(() => new Set(
  headers
    .filter(header => header.disableRowClick)
    .map(header => header.key),
))

const getClickedColumnKey = (event: RowClickedEvent<Row>): string | undefined => {
  const target = event.event?.target

  if (!(target instanceof Element)) {
    return undefined
  }

  return target.closest('.ag-cell')?.getAttribute('col-id') ?? undefined
}

const isRowClickDisabledForColumn = (event: RowClickedEvent<Row>): boolean => {
  const columnKey = getClickedColumnKey(event)

  return Boolean(columnKey && rowClickDisabledColumnKeys.value.has(columnKey))
}

const onRowPostCreate = (params: ProcessRowParams<Row>) => {
  agGridOptions.processRowPostCreate?.(params)

  if (!params.node.data || !rowAttrs) {
    return
  }

  const attrs = rowAttrs(params.node.data)
  patchRowAttrs(params.eRow, attrs)
  patchRowAttrs(params.ePinnedLeftRow, attrs)
  patchRowAttrs(params.ePinnedRightRow, attrs)
}

const onFilterApply = (filterKey: string, selection: FilterGroupSelection) => {
  emit('filter:apply', filterKey, selection)
  void nextTick(refresh)
}

const onFilterClear = (filterKey: string, selection: FilterGroupSelection) => {
  emit('filter:clear', filterKey, selection)
  void nextTick(refresh)
}

const onFilterOpen = (filterKey: string) => {
  emit('filter:open', filterKey)
}

const onFilterClose = (filterKey: string) => {
  emit('filter:close', filterKey)
}

const onRowClick = (event: RowClickedEvent<Row>) => {
  if (event.data && !isRowClickDisabledForColumn(event)) {
    emit('row:click', event.data, event)
  }
}

const onCellClick = (event: CellClickedEvent<Row>) => {
  // AG Grid can emit cell clicks without row data or a stable column id.
  if (!event.data || !event.colDef.colId) {
    return
  }

  emit('cell:click', {
    row: event.data,
    columnKey: event.colDef.colId,
    value: event.value,
  })
}

const searchDebounceMs = computed(() => searchQuery.value ? 350 : 0)

watch(() => refreshKey, (nextKey, previousKey) => {
  if (nextKey === previousKey) {
    return
  }

  refresh()
})

watch(datatableState, state => emit('state', {
  state,
  hasData: hasRows.value,
}), { immediate: true })

watch(datatableWidth, handleDatatableWidthChange)

watch(() => enableSearch, (isEnabled) => {
  if (isEnabled || !searchQuery.value) {
    return
  }

  searchQuery.value = ''
})

watchDebounced(searchQuery, () => {
  refresh()
}, {
  debounce: searchDebounceMs,
  // Without sync flush, outside-actions slot calls to updateSearch() can miss
  // the immediate debounce window and refetch with the previous search value.
  flush: 'sync',
  maxWait: 1000,
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

.datatable-outside-actions-host {
  height: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  width: 0;
}

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
