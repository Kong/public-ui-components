<template>
  <div
    ref="datatableElement"
    class="kong-ui-public-analytics-datatable"
    data-testid="analytics-datatable"
  >
    <KSkeleton
      v-if="loading"
      data-testid="analytics-datatable-loading"
      type="table"
    />

    <slot
      v-else-if="error"
      name="error-state"
    >
      <KEmptyState
        data-testid="analytics-datatable-error"
        icon-variant="error"
        :message="i18n.t('datatable.errorMessage')"
        :title="i18n.t('datatable.errorTitle')"
      />
    </slot>

    <slot
      v-else-if="isEmpty"
      name="empty-state"
    >
      <KEmptyState
        data-testid="analytics-datatable-empty"
        :title="i18n.t('datatable.emptyTitle')"
      />
    </slot>

    <template v-else>
      <!-- region: toolbar -->
      <div
        v-if="!hideToolbar"
        class="datatable-toolbar"
      >
        <div class="datatable-toolbar-primary">
          <!-- region: bulk actions -->
          <div
            v-if="rowSelection !== 'none'"
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
                :aria-label="i18n.t('datatable.selectedRowActions')"
                class="datatable-bulk-actions-trigger"
                data-testid="analytics-datatable-bulk-actions-trigger"
                :disabled="!selectedRows.length"
                icon
                size="small"
              >
                <MoreIcon decorative />
                <span
                  v-if="rowSelection === 'multiple'"
                  class="datatable-bulk-actions-count"
                >
                  {{ selectedRows.length }}
                </span>
              </KButton>

              <template #items>
                <slot
                  name="bulk-action-items"
                  :selected-rows="selectedRows"
                />
              </template>
            </KDropdown>
          </div>

          <!-- region: filters -->
          <KFilterGroup
            v-if="hasFilters"
            v-model="filterSelection"
            :filters="filterGroupFilters"
            @apply="onFilterSelectionChange"
            @clear="onFilterSelectionChange"
          />
        </div>

        <!-- region: column visibility -->
        <AnalyticsColumnVisibilityMenu
          v-model:column-visibility="columnVisibilityModel"
          :headers="headers"
        />
      </div>

      <!-- region: grid -->
      <AgGridVue
        :key="mode"
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
        @grid-ready="onGridReady"
        @row-clicked="onRowClick"
        @selection-changed="onSelectionChange"
        @sort-changed="onSortChange"
      />

      <!-- region: pagination -->
      <div
        v-if="mode === 'pagination' && hasFetched"
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
  </div>
</template>

<script lang="ts">
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25
const DEFAULT_ROW_KEY = 'id'
</script>

<script setup lang="ts" generic="Row extends Record<string, any>">
import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableCellSlotProps,
  AnalyticsDatatableFetcher,
  AnalyticsDatatableGridOptions,
  AnalyticsDatatableHeader,
  AnalyticsDatatableMode,
  AnalyticsDatatableRowKey,
  AnalyticsDatatableRowSelectionMode,
} from '../types'
import type {
  CellClickedEvent,
  ColumnPinnedEvent,
  ColumnResizedEvent,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
} from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, InfiniteRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { MoreIcon } from '@kong/icons'
import type { FilterGroupFilters, FilterGroupSelection, PageSizeChangeData } from '@kong/kongponents'
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import AnalyticsColumnVisibilityMenu from './AnalyticsColumnVisibilityMenu.vue'
import { getSortKey, normalizedTableConfigsEqual } from '../utils/tableConfig'
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
  hideToolbar = false,
  rowSelection = 'none',
  agGridOptions = {},
  paginationPageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
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
  hideToolbar?: boolean
  rowSelection?: AnalyticsDatatableRowSelectionMode
  agGridOptions?: AnalyticsDatatableGridOptions<Row>
  paginationPageSizeOptions?: number[]
  tableConfig?: AnalyticsDatatableConfig
}>()
const filterSelection = defineModel<FilterGroupSelection>('filterSelection', { default: () => ({}) })

const slots = defineSlots<{
  'bulk-action-items': (props: { selectedRows: Row[] }) => any
  'empty-state': () => any
  'error-state': () => any
  [key: string]: (props: AnalyticsDatatableCellSlotProps<Row> & { selectedRows: Row[] }) => any
}>()

const emit = defineEmits<{
  (e: 'row:click', row: Row, event: RowClickedEvent<Row>): void
  (e: 'cell:click', payload: { row: Row, columnKey: string, value: any }): void
  (e: 'row:select', selectedRows: Row[]): void
  (e: 'update:tableConfig', config: AnalyticsDatatableConfig): void
  (e: 'sort', sort: AnalyticsDatatableConfig['sort']): void
  (e: 'grid:ready', api: GridApi<Row>): void
}>()

const { i18n } = composables.useI18n()
const datatableElement = ref<HTMLElement>()
const gridApi = ref<GridApi<Row>>()
const resolvedRowKey = computed<AnalyticsDatatableRowKey<Row>>(() => rowKey ?? DEFAULT_ROW_KEY as AnalyticsDatatableRowKey<Row>)
const isApplyingTableConfig = ref(false)
const isApplyingInitialColumnState = ref(false)

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
  onTableConfigChange: (nextConfig, previousConfig) => {
    if (!gridApi.value) {
      return
    }

    refreshForConfigChange(nextConfig, previousConfig)
  },
})

const {
  currentPage,
  datasource,
  fetchPage,
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
    search: computed(() => initialFetcherParams.search),
    sort: computed(() => resolvedTableConfig.value.sort),
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

const sortedPaginationPageSizeOptions = computed(() => [...paginationPageSizeOptions].sort((a, b) => a - b))
const resolvedPaginationPageSizeOptions = computed(() => {
  if (sortedPaginationPageSizeOptions.value.includes(activePageSize.value)) {
    return sortedPaginationPageSizeOptions.value
  }

  return [...sortedPaginationPageSizeOptions.value, activePageSize.value].sort((a, b) => a - b)
})
const paginationKey = computed(() => `${activePageSize.value}:${resolvedPaginationPageSizeOptions.value.join(',')}`)

const filterGroupFilters = computed<FilterGroupFilters>(() => headers.reduce<FilterGroupFilters>((filters, header) => {
  if (header.filter) {
    filters[header.key] = header.filter
  }

  return filters
}, {}))
const hasFilters = computed(() => headers.some(header => header.filter != null))
const columnVisibilityModel = computed({
  get: () => resolvedColumnVisibility.value,
  set: (columnVisibility: Record<string, boolean>) => {
    patchTableConfig({ columnVisibility })
  },
})

const isEmpty = computed(() => hasFetched.value && !isFetching.value && !rowData.value.length && mode === 'pagination')

const getAgGridRowId = ({ data }: { data: Row }) => {
  return String(data[resolvedRowKey.value] ?? '')
}

const emitConfigFromGrid = ({ ignoreColumnWidths = false }: { ignoreColumnWidths?: boolean } = {}) => {
  if (!gridApi.value || isApplyingTableConfig.value) {
    return
  }

  const nextConfig = getGridConfig(gridApi.value)
  const comparableNextConfig = ignoreColumnWidths
    ? { ...nextConfig, columnWidths: resolvedTableConfig.value.columnWidths }
    : nextConfig
  if (normalizedTableConfigsEqual(comparableNextConfig, resolvedTableConfig.value)) {
    return
  }

  updateTableConfig(nextConfig)
}

const {
  columnDefs,
  gridContext,
  fitColumnsToGrid,
} = composables.useDatatableColumnDefs<Row>({
  headers: toRef(() => headers),
  resolvedTableConfig,
  slots,
})
let fitColumnsAnimationFrame = 0
let resizeObserver: ResizeObserver | undefined
let datatableWidth: number | undefined

const scheduleColumnsToFit = ({
  api = gridApi.value,
  emitConfigAfterFit = false,
}: {
  api?: GridApi<Row>
  emitConfigAfterFit?: boolean
} = {}) => {
  if (!api) {
    return
  }

  if (fitColumnsAnimationFrame) {
    cancelAnimationFrame(fitColumnsAnimationFrame)
  }

  fitColumnsAnimationFrame = requestAnimationFrame(() => {
    fitColumnsAnimationFrame = 0
    fitColumnsToGrid(api, { force: true })
    if (emitConfigAfterFit) {
      emitConfigFromGrid()
    }
  })
}

const startResizeObserver = () => {
  if (!datatableElement.value || resizeObserver) {
    return
  }

  datatableWidth = datatableElement.value.offsetWidth
  resizeObserver = new ResizeObserver(([entry]) => {
    const nextWidth = entry.target instanceof HTMLElement ? entry.target.offsetWidth : 0
    if (datatableWidth === nextWidth) {
      return
    }

    datatableWidth = nextWidth
    scheduleColumnsToFit()
  })
  resizeObserver.observe(datatableElement.value)
}

const applyResolvedTableConfig = (api: GridApi<Row>) => {
  isApplyingTableConfig.value = true
  try {
    applyTableConfig(api)
  } finally {
    isApplyingTableConfig.value = false
  }
}

const refreshForConfigChange = (
  nextConfig: AnalyticsDatatableConfig,
  previousConfig: AnalyticsDatatableConfig,
) => {
  const sortChanged = getSortKey(nextConfig.sort) !== getSortKey(previousConfig.sort)
  const pageSizeChanged = nextConfig.pageSize !== previousConfig.pageSize

  if (!sortChanged && !pageSizeChanged) {
    return
  }

  refresh({
    ...(pageSizeChanged && typeof nextConfig.pageSize === 'number' ? { pageSize: nextConfig.pageSize } : {}),
    ...(sortChanged ? { sort: nextConfig.sort } : {}),
  })
}

const columnVisibilityChanged = (
  nextConfig: AnalyticsDatatableConfig,
  previousConfig: AnalyticsDatatableConfig,
) => !recordsEqual(nextConfig.columnVisibility ?? {}, previousConfig.columnVisibility ?? {})

const onGridReady = (event: GridReadyEvent<Row>) => {
  hasFetched.value = false
  isApplyingInitialColumnState.value = true
  applyResolvedTableConfig(event.api)
  fitColumnsToGrid(event.api)
  captureGridConfig(event.api)
  gridApi.value = event.api
  emit('grid:ready', event.api)
  refresh({ sort: resolvedSort.value })
  requestAnimationFrame(() => {
    isApplyingInitialColumnState.value = false
    startResizeObserver()
  })
}

const onColumnPinned = (event: ColumnPinnedEvent<Row>) => {
  if (event.source === 'api') {
    return
  }

  emitConfigFromGrid({ ignoreColumnWidths: true })
}

const onColumnLayoutChange = () => {
  emitConfigFromGrid({ ignoreColumnWidths: true })
}

const onColumnVisibilityChange = () => {
  emitConfigFromGrid({ ignoreColumnWidths: true })
  if (isApplyingInitialColumnState.value) {
    return
  }

  scheduleColumnsToFit({ emitConfigAfterFit: true })
}

const onColumnResize = (event: ColumnResizedEvent<Row>) => {
  if (event.source !== 'sizeColumnsToFit' && event.finished !== false) {
    emitConfigFromGrid()
  }
}

const onSortChange = () => {
  if (!gridApi.value) {
    return
  }

  const nextConfig = getGridConfig(gridApi.value)
  const sortChanged = getSortKey(nextConfig.sort) !== getSortKey(resolvedTableConfig.value.sort)
  if (!sortChanged) {
    return
  }

  emit('sort', nextConfig.sort)
  patchTableConfig({ sort: nextConfig.sort })
}

const onPageSizeChange = ({ pageSize: nextPageSize }: PageSizeChangeData) => {
  if (nextPageSize === activePageSize.value) {
    return
  }

  patchTableConfig({ pageSize: nextPageSize })
}

const onFilterSelectionChange = (_filterKey: string, selection: FilterGroupSelection) => {
  filterSelection.value = { ...selection }
  refresh()
}

const onRowClick = (event: RowClickedEvent<Row>) => {
  if (event.data) {
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

watch(() => resolvedTableConfig.value, () => {
  if (!gridApi.value) {
    return
  }

  if (normalizedTableConfigsEqual(getGridConfig(gridApi.value), resolvedTableConfig.value)) {
    return
  }

  const shouldRefitColumns = columnVisibilityChanged(resolvedTableConfig.value, getGridConfig(gridApi.value))
  applyResolvedTableConfig(gridApi.value)
  if (shouldRefitColumns) {
    scheduleColumnsToFit({ emitConfigAfterFit: true })
  }
})

onBeforeUnmount(() => {
  if (fitColumnsAnimationFrame) {
    cancelAnimationFrame(fitColumnsAnimationFrame)
  }
  resizeObserver?.disconnect()
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

const recordsEqual = <Value>(left: Record<string, Value>, right: Record<string, Value>) => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  return leftKeys.length === rightKeys.length && leftKeys.every(key => left[key] === right[key])
}
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

.datatable-toolbar-primary {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: var(--kui-space-40, $kui-space-40);
  min-width: 0;
}

.datatable-toolbar-selection {
  align-items: center;
  display: flex;
  min-width: 0;
}

.datatable-bulk-actions-trigger {
  gap: var(--kui-space-0, $kui-space-0);
}

.datatable-bulk-actions-count {
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  margin-right: var(--kui-space-20, $kui-space-20);
  min-width: 2ch;
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
