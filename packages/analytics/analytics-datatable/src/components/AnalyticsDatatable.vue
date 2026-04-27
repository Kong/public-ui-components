<template>
  <div
    ref="datatableElement"
    class="kong-ui-public-analytics-datatable"
    data-testid="analytics-datatable"
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
      <AnalyticsDatatableSearch v-model="searchQuery" />
    </Teleport>

    <Teleport
      v-if="showOutsideFilters"
      defer
      :to="outsideFilters"
    >
      <AnalyticsDatatableFilters
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
      </AnalyticsDatatableFilters>
    </Teleport>

    <KSkeleton
      v-if="loading"
      data-testid="analytics-datatable-loading"
      type="table"
    />

    <slot
      v-else-if="shouldShowErrorState"
      name="error-state"
    >
      <KEmptyState
        data-testid="analytics-datatable-error"
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

            <!-- region: filters -->
            <AnalyticsDatatableFilters
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
            </AnalyticsDatatableFilters>

            <!-- region: search -->
            <AnalyticsDatatableSearch
              v-if="showToolbarSearch"
              v-model="searchQuery"
            />
          </div>

          <div class="datatable-toolbar-secondary">
            <slot
              name="toolbar-right"
              v-bind="toolbarSlotProps"
            />

            <!-- region: column visibility -->
            <AnalyticsColumnVisibilityMenu
              v-if="showColumnVisibility"
              v-model:column-visibility="columnVisibilityModel"
              :headers="headers"
            />

            <!-- region: bulk actions -->
            <div
              v-if="showBulkActions"
              class="datatable-toolbar-selection"
            >
              <KDropdown
                class="datatable-bulk-actions-dropdown"
                data-testid="analytics-datatable-bulk-actions-dropdown"
                :disabled="!selectedRows.length"
                :kpop-attributes="{ placement: 'bottom-start' }"
              >
                <KButton
                  appearance="secondary"
                  class="datatable-bulk-actions-trigger"
                  data-testid="analytics-datatable-bulk-actions-trigger"
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
      </div>

      <slot
        v-if="isEmpty"
        name="empty-state"
      >
        <KEmptyState
          data-testid="analytics-datatable-empty"
          :title="i18n.t('datatable.emptyTitle')"
        />
      </slot>

      <template v-else>
        <!-- region: grid -->
        <AgGridVue
          :key="mode"
          :always-show-vertical-scroll="agGridOptions.alwaysShowVerticalScroll ?? true"
          :cache-block-size="activePageSize"
          class="analytics-datatable-grid"
          :col-resize-default="agGridOptions.colResizeDefault ?? 'shift'"
          :column-defs="columnDefs"
          :context="gridContext"
          :datasource="datasource"
          :get-row-id="getAgGridRowId"
          :grid-options="agGridOptions"
          :infinite-initial-row-count="1"
          :loading="isFetching"
          :process-row-post-create="onRowPostCreate"
          :row-buffer="0"
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
          data-testid="analytics-datatable-pagination"
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
const ROW_ATTR_CLASSES = new WeakMap<HTMLElement, string[]>()
</script>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  AnalyticsDatatableCellAttrs,
  AnalyticsDatatableConfig,
  AnalyticsDatatableFetcher,
  AnalyticsDatatableGridOptions,
  AnalyticsDatatableHeader,
  AnalyticsDatatableMode,
  AnalyticsDatatableRowAttrs,
  AnalyticsDatatableRowKey,
  AnalyticsDatatableRowSelectionMode,
  AnalyticsDatatableSort,
  AnalyticsDatatableState,
  AnalyticsDatatableStatePayload,
  AnalyticsDatatableToolbarSlotProps,
  AnalyticsDatatableTeleportTarget,
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
import AnalyticsColumnVisibilityMenu from './AnalyticsColumnVisibilityMenu.vue'
import AnalyticsDatatableFilters from './AnalyticsDatatableFilters.vue'
import AnalyticsDatatableSearch from './AnalyticsDatatableSearch.vue'
import { getRowKeyValue } from '../utils/rowKey'
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
  disableRowClick = false,
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
  headers: Array<AnalyticsDatatableHeader<Row>>
  fetcher: AnalyticsDatatableFetcher<Row>
  mode?: AnalyticsDatatableMode
  rowKey?: AnalyticsDatatableRowKey<Row>
  pageSize?: number
  initialFetcherParams?: {
    search?: string
  }
  loading?: boolean
  error?: boolean
  enableSearch?: boolean
  outsideSearch?: AnalyticsDatatableTeleportTarget
  outsideFilters?: AnalyticsDatatableTeleportTarget
  hideToolbar?: boolean
  hideBulkActions?: boolean
  hideColumnVisibility?: boolean
  disableRowClick?: boolean
  hidePagination?: boolean
  hidePaginationWhenOptional?: boolean
  rowSelection?: AnalyticsDatatableRowSelectionMode
  agGridOptions?: AnalyticsDatatableGridOptions<Row>
  paginationPageSizeOptions?: number[]
  refreshKey?: string | number
  rowAttrs?: AnalyticsDatatableRowAttrs<Row>
  cellAttrs?: AnalyticsDatatableCellAttrs<Row>
  tableConfig?: AnalyticsDatatableConfig
}>()
const filterSelection = defineModel<FilterGroupSelection>('filterSelection', { default: () => ({}) })

const slots = defineSlots<{
  'bulk-action-items': (props: { selectedRows: Row[] }) => any
  'empty-state': () => any
  'error-state': () => any
  'outside-actions': (props: AnalyticsDatatableToolbarSlotProps<Row>) => any
  'toolbar': (props: AnalyticsDatatableToolbarSlotProps<Row>) => any
  'toolbar-left': (props: AnalyticsDatatableToolbarSlotProps<Row>) => any
  'toolbar-right': (props: AnalyticsDatatableToolbarSlotProps<Row>) => any
  [key: string]: (props: any) => any
}>()

const emit = defineEmits<{
  (e: 'row:click', row: Row, event: RowClickedEvent<Row>): void
  (e: 'cell:click', payload: { row: Row, columnKey: string, value: any }): void
  (e: 'row:select', selectedRows: Row[]): void
  (e: 'update:tableConfig', config: AnalyticsDatatableConfig): void
  (e: 'sort', sort: AnalyticsDatatableSort): void
  (e: 'state', payload: AnalyticsDatatableStatePayload): void
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
const resolvedRowKey = computed<AnalyticsDatatableRowKey<Row>>(() => rowKey ?? DEFAULT_ROW_KEY as AnalyticsDatatableRowKey<Row>)
const searchQuery = ref(initialFetcherParams.search ?? '')
// Assigned after gridSync is initialized; captured by useAnalyticsDatatableConfig through closure.
let handleTableConfigChange = (_nextConfig: AnalyticsDatatableConfig, _previousConfig: AnalyticsDatatableConfig) => {}

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
} = composables.useAnalyticsDatatableConfig<Row>({
  tableConfig: toRef(() => tableConfig),
  emitTableConfigUpdate: config => emit('update:tableConfig', config),
  headers: toRef(() => headers),
  pageSize: toRef(() => pageSize),
  onTableConfigChange: (nextConfig, previousConfig) => handleTableConfigChange(nextConfig, previousConfig),
})

const {
  currentPage,
  datasource,
  fetchPage,
  fetchError,
  hasFetched,
  hasNextPageWhenTotalUnknown,
  isFetching,
  refresh,
  rowData,
  totalRows,
} = composables.useAnalyticsDatatableFetchers<Row>({
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
  hasFetched,
  patchTableConfig,
  refresh,
  resolvedSort,
  resolvedTableConfig,
  rowSelection: toRef(() => rowSelection),
})
handleTableConfigChange = gridSync.handleTableConfigChange

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
const getFilterSlotName = (filterKey: string) => `filter-${filterKey}`

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
const toolbarSlotProps = computed<AnalyticsDatatableToolbarSlotProps<Row>>(() => ({
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
const datatableState = computed<AnalyticsDatatableState>(() => {
  if (loading || isFetching.value) {
    return 'loading'
  }

  if (error || fetchError.value) {
    return 'error'
  }

  if (isEmpty.value) {
    return 'empty'
  }

  if (!hasFetched.value && !hasRows.value) {
    return 'loading'
  }

  return 'success'
})

const getAgGridRowId = ({ data }: { data: Row }) => {
  return getRowKeyValue(data, resolvedRowKey.value)
}

const applyDomAttrs = (element: HTMLElement | undefined, attrs: Record<string, unknown>) => {
  if (!element) {
    return
  }

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      const previousClasses = ROW_ATTR_CLASSES.get(element) ?? []
      element.classList.remove(...previousClasses)
      const nextClasses = value == null || value === false ? [] : String(value).split(' ').filter(Boolean)
      element.classList.add(...nextClasses)
      ROW_ATTR_CLASSES.set(element, nextClasses)
      return
    }

    if (value == null || value === false) {
      element.removeAttribute(key)
      return
    }

    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value)
      return
    }

    element.setAttribute(key, String(value))
  })
}

const onRowPostCreate = (params: ProcessRowParams<Row>) => {
  agGridOptions.processRowPostCreate?.(params)

  if (!params.node.data || !rowAttrs) {
    return
  }

  const attrs = rowAttrs(params.node.data)
  applyDomAttrs(params.eRow, attrs)
  applyDomAttrs(params.ePinnedLeftRow, attrs)
  applyDomAttrs(params.ePinnedRightRow, attrs)
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
  if (event.data && !disableRowClick) {
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
.kong-ui-public-analytics-datatable {
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

.analytics-datatable-grid {
  flex: 1 1 420px;
  min-height: 0;
  width: 100%;

  :deep(.ag-header-cell) {
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
