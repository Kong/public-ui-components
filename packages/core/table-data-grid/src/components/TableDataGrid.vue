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
      <!-- region: toolbar -->
      <div
        v-if="!hideToolbar"
        class="datatable-toolbar"
      >
        <slot
          name="toolbar"
          v-bind="toolbarSlotProps"
        >
          <div class="datatable-toolbar-primary">
            <slot
              name="toolbar-left"
              v-bind="toolbarSlotProps"
            />

            <!-- region: search -->
            <TableDataGridSearch
              v-if="showToolbarSearch"
              v-model="searchQuery"
            />

            <!-- region: filters -->
            <TableDataGridFilters
              v-if="showToolbarFilters"
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
          </div>

          <div class="datatable-toolbar-secondary">
            <slot
              name="toolbar-right"
              v-bind="toolbarSlotProps"
            />

            <!-- region: bulk actions -->
            <div
              v-if="showBulkActions"
              class="datatable-toolbar-selection"
            >
              <KDropdown
                class="datatable-bulk-actions-dropdown"
                data-testid="table-data-grid-bulk-actions-dropdown"
                :disabled="!selectedRows.length"
                :kpop-attributes="{ placement: 'bottom-start' }"
              >
                <KButton
                  appearance="secondary"
                  class="datatable-bulk-actions-trigger"
                  data-testid="table-data-grid-bulk-actions-trigger"
                  :disabled="!selectedRows.length"
                  size="large"
                >
                  ({{ selectedRows.length }}) {{ i18n.t('datatable.bulkActions') }}
                </KButton>

                <template #items>
                  <slot
                    name="bulk-action-items"
                    :selected-rows="selectedRows"
                  />
                </template>
              </KDropdown>
            </div>
          </div>
        </slot>

        <!-- region: column visibility -->
        <TableDataGridColumnVisibilityMenu
          v-if="showColumnVisibility"
          v-model:column-visibility="columnVisibilityModel"
          :headers="headers"
        />
      </div>

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
          :always-show-vertical-scroll="agGridOptions.alwaysShowVerticalScroll ?? true"
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
          :selection-column-def="selectionColumnDef"
          :suppress-cell-focus="true"
          :theme="themeQuartz"
          @cell-clicked="onCellClick"
          @column-moved="onColumnLayoutChange"
          @column-pinned="onColumnPinned"
          @column-resized="onColumnResize"
          @column-visible="onColumnVisibilityChange"
          @displayed-columns-changed="onDisplayedColumnsChange"
          @grid-ready="onGridReady"
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
import sortBy from 'lodash-es/sortBy'
import union from 'lodash-es/union'
import TableDataGridColumnVisibilityMenu from './TableDataGridColumnVisibilityMenu.vue'
import TableDataGridFilters from './TableDataGridFilters.vue'
import TableDataGridSearch from './TableDataGridSearch.vue'
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

const gridSync = composables.useDatatableGridSync<Row>({
  activePageSize,
  captureGridConfig,
  applyTableConfig,
  emitGridReady: api => emit('grid:ready', api),
  emitSort: sort => emit('sort', sort),
  getGridConfig,
  gridApi,
  mode: toRef(() => mode),
  patchTableConfig,
  resetFetched,
  refresh,
  resolvedSort,
  resolvedTableConfig,
  rowSelection: toRef(() => rowSelection),
})

const {
  columnDefs,
  gridContext,
} = composables.useDatatableColumnDefs<Row>({
  headers: toRef(() => headers),
  cellAttrs: toRef(() => cellAttrs),
  displayedColumnIndexesByKey: gridSync.displayedColumnIndexesByKey,
  resolvedTableConfig,
  slots,
})

const {
  emitGridConfigChange,
  fitColumnsOnGridReady,
  handleDatatableWidthChange,
  scheduleColumnsToFit,
  scheduleColumnsToFitAfterDisplayedColumnsChange,
  shouldRefitColumnsAfterConfigChange,
  startResizeTracking,
} = composables.useDatatableColumnSizing<Row>({
  datatableElement,
  datatableWidth,
  getGridConfig,
  gridApi,
  headers: toRef(() => headers),
  isApplyingTableConfig: gridSync.isApplyingTableConfig,
  resolvedTableConfig,
  tableConfig: toRef(() => tableConfig),
  updateTableConfig,
})

gridSync.connectSizing({
  emitGridConfigChange,
  fitColumnsOnGridReady,
  scheduleColumnsToFit,
  scheduleColumnsToFitAfterDisplayedColumnsChange,
  shouldRefitColumnsAfterConfigChange,
  startResizeTracking,
})

const resolvedPaginationPageSizeOptions = computed(() => sortBy(union(paginationPageSizeOptions, [activePageSize.value])))
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
  if (!event.data || !event.colDef.colId) {
    return
  }

  emit('cell:click', {
    row: event.data,
    columnKey: event.colDef.colId,
    value: event.value,
  })
}

const onGridReady = gridSync.onGridReady
const onColumnPinned = gridSync.onColumnPinned
const onColumnLayoutChange = gridSync.onColumnLayoutChange
const onColumnVisibilityChange = gridSync.onColumnVisibilityChange
const onDisplayedColumnsChange = gridSync.onDisplayedColumnsChange
const onColumnResize = gridSync.onColumnResize
const onSortChange = gridSync.onSortChange
const onPageSizeChange = gridSync.onPageSizeChange
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
  flush: 'sync',
  immediate: false,
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

.datatable-toolbar {
  align-items: center;
  background: var(--kui-color-background, $kui-color-background);
  border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: space-between;
  padding: var(--kui-space-30, $kui-space-30);
}

.datatable-outside-actions-host {
  height: 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  width: 0;
}

.datatable-toolbar-primary {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: var(--kui-space-40, $kui-space-40);
  min-width: 0;
}

.datatable-toolbar-secondary {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: var(--kui-space-40, $kui-space-40);
  min-width: 0;
}

.datatable-toolbar-selection {
  align-items: center;
  display: flex;
  min-width: 0;
}

.datatable-bulk-actions-dropdown {
  :deep(.k-button.datatable-bulk-actions-trigger) {
    border-width: var(--kui-border-width-10, $kui-border-width-10);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    width: 140px;
  }
}

.table-data-grid-grid {
  flex: 1 1 420px;
  min-height: 0;
  width: 100%;

  :deep(.ag-header-cell) {
    background-color: var(--kui-color-background, $kui-color-background);
    border-right: 1px solid var(--kui-color-border, $kui-color-border);
  }

  :deep(.ag-header-cell[col-id="ag-Grid-SelectionColumn"]) {
    border-right: 0;
    gap: 0;
  }

  :deep(.ag-header-cell-resize::after) {
    display: none;
  }

  :deep(.ag-root-wrapper) {
    border: 0;
    border-radius: 0;
  }

  :deep(.ag-cell) {
    align-items: center;
    display: flex;
  }

  :deep(.ag-cell-wrapper),
  :deep(.ag-cell-value) {
    align-items: center;
    display: flex;
    height: 100%;
    min-width: 0;
    width: 100%;
  }
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

  :deep(.pagination-text.large-screen) {
    padding-left: var(--kui-space-40, $kui-space-40);
  }

  :deep(.pagination-button.placeholder) {
    align-items: center;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
  }
}
</style>
