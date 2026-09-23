<template>
  <div
    ref="rootElement"
    class="kong-ui-public-table-data-grid"
    :class="{ 'fit-to-content': fitToContent }"
    data-testid="table-data-grid"
  >
    <div
      v-if="hostError"
      class="table-error-state"
      data-testid="table-error-state"
    >
      <slot name="error-state">
        <KEmptyState
          icon-variant="error"
          :message="t('errorState.message')"
          :title="t('errorState.title')"
        />
      </slot>
    </div>

    <div
      v-else-if="shouldShowEmptyState"
      class="table-empty-state"
      data-testid="table-empty-state"
    >
      <slot name="empty-state">
        <KEmptyState
          :message="t('emptyState.message')"
          :title="t('emptyState.title')"
        />
      </slot>
    </div>

    <AgGridVue
      v-else
      :key="mode"
      :cache-block-size="mode === 'infinite' ? activePageSize : undefined"
      class="table-data-grid-grid"
      :column-defs="columnDefs"
      :context="gridContext"
      :datasource="mode === 'infinite' ? datasource : undefined"
      :default-col-def="defaultColDef"
      :dom-layout="fitToContent ? 'autoHeight' : 'normal'"
      :infinite-initial-row-count="mode === 'infinite' ? 1 : undefined"
      :loading="showLoadingOverlay"
      :row-data="mode === 'unpaginated' ? rowData : undefined"
      :row-model-type="mode === 'unpaginated' ? 'clientSide' : 'infinite'"
      :suppress-cell-focus="true"
      :suppress-multi-sort="true"
      :theme="themeQuartz"
      @cell-clicked="onCellClick"
      @grid-ready="onGridReady"
      @row-clicked="onRowClick"
      @sort-changed="onSortChanged"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends object">
import type {
  TableDataGridCellClickPayload,
  TableDataGridCellSlotProps,
  TableDataGridConfig,
  TableDataGridProps,
  TableDataGridSort,
  TableDataGridStatePayload,
} from '../types'
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
} from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import {
  AllCommunityModule,
  ClientSideRowModelModule,
  InfiniteRowModelModule,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community'
import { computed, onBeforeUnmount, onMounted, shallowRef, toRef, useSlots, watch } from 'vue'
import { useEmitState } from '../composables/useEmitState'
import { useFetchInfinite } from '../composables/useFetchInfinite'
import { useFetchUnpaginated } from '../composables/useFetchUnpaginated'
import { useTableDataGridColumnDefs } from '../composables/useTableDataGridColumnDefs'
import { useTableDataGridConfig } from '../composables/useTableDataGridConfig'
import { useTableDataGridInteractions } from '../composables/useTableDataGridInteractions'
import { useTableDataGridSort } from '../composables/useTableDataGridSort'
import useI18n from '../composables/useI18n'
import useFetchState from '../composables/useFetchState'

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, InfiniteRowModelModule])

const {
  fetcher,
  mode: providedMode,
  headers,
  error: hostError = false,
  pageSize = 25,
  refreshKey,
  tableConfig,
} = defineProps<TableDataGridProps<Row>>()
const mode = providedMode ?? 'infinite'

defineSlots<{
  'empty-state': () => unknown
  'error-state': () => unknown
  [columnKey: string]: (props: TableDataGridCellSlotProps<Row>) => unknown
}>()

const emit = defineEmits<{
  (e: 'grid:ready', api: GridReadyEvent<Row>['api']): void
  (e: 'state', payload: TableDataGridStatePayload): void
  (e: 'row:click', row: Row, event: RowClickedEvent<Row>): void
  (e: 'cell:click', payload: TableDataGridCellClickPayload<Row>): void
  (e: 'sort', payload: TableDataGridSort): void
  (e: 'update:tableConfig', payload: TableDataGridConfig): void
}>()

const { i18n } = useI18n()
const { t } = i18n

const slots = useSlots()

const gridApi = shallowRef<GridApi<Row>>()
const rootElement = shallowRef<HTMLElement>()

// Tooltips teleported to body are hidden while an ancestor is in native fullscreen.
const tooltipTarget = shallowRef<string | HTMLElement>('body')
const updateTooltipTarget = () => {
  const fullscreenElement = document.fullscreenElement
  tooltipTarget.value = fullscreenElement instanceof HTMLElement && fullscreenElement.contains(rootElement.value ?? null)
    ? fullscreenElement
    : 'body'
}

onMounted(() => {
  updateTooltipTarget()
  document.addEventListener('fullscreenchange', updateTooltipTarget)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', updateTooltipTarget)
})

const { activeTableConfig, activeSort, activePageSize, patchTableConfig } = useTableDataGridConfig<Row>({
  headers: toRef(() => headers),
  pageSize: toRef(() => pageSize),
  tableConfig: toRef(() => tableConfig),
  emitTableConfigUpdate: config => emit('update:tableConfig', config),
  onExternalConfigChange: (config) => {
    if (!gridApi.value) {
      return
    }
    // Apply the external sort configuration to the grid when it changes.
    applySortToGrid(gridApi.value, config)

    // add more gridApi.value pushes here as TableDataGridConfig grows
  },
})

const { onSortChanged, applySortToGrid } = useTableDataGridSort<Row>({
  activeSort,
  emitSort: sort => emit('sort', sort),
  patchTableConfig,
})

const fitToContent = computed(() => mode === 'unpaginated' && !!activeTableConfig.value.fitToContent)

const { onCellClick, onRowClick } = useTableDataGridInteractions<Row>({
  cellClick: payload => emit('cell:click', payload),
  headers: toRef(() => headers),
  rowClick: (row, event) => emit('row:click', row, event),
})

const defaultColDef: ColDef<Row> = {
  resizable: false,
  sortable: false,
  suppressMovable: true,
}

// AG Grid reloads infinite blocks on sort; the composable resets its cursor chain.
// Presentation-only config changes must not invalidate the fetch request.
const resetKey = computed(() => mode === 'unpaginated'
  ? [refreshKey]
  : [
    activePageSize.value,
    refreshKey,
  ])

const fetchResult = providedMode === 'unpaginated'
  ? useFetchUnpaginated({
    fetcher: toRef(() => fetcher),
    resetKey,
  })
  : useFetchInfinite({
    fetcher: toRef(() => fetcher),
    resetKey,
    sort: activeSort,
  })

const {
  data,
  error: fetchError,
  isFetching,
} = fetchResult
const { datasource } = fetchResult
const rowData = computed(() => data.value ? Array.from(data.value) : undefined)

const { columnDefs, gridContext } = useTableDataGridColumnDefs<Row>({
  headers: toRef(() => headers),
  locale: computed(() => i18n.locale),
  mode,
  rows: rowData,
  slots,
  tooltipTarget,
  initialSort: activeSort.value,
})

const {
  fetchState,
  hasData,
  state: fetchLifecycleState,
} = useFetchState(data, fetchError, isFetching, undefined, mode === 'unpaginated')

// Unpaginated refreshes keep the previous complete result visible until the replacement arrives.
const showLoadingOverlay = computed<boolean>(() => (
  isFetching.value && !(mode === 'unpaginated' && hasData.value)
))

const shouldShowEmptyState = computed<boolean>(() => (
  fetchLifecycleState.value === fetchState.SUCCESS
  && !hasData.value
))

useEmitState({
  emitState: payload => emit('state', payload),
  emitInitialState: mode === 'unpaginated',
  fetchLifecycleState,
  hasData,
})

// AG Grid discards a sort for columns it has not created yet, and infinite blocks
// are rejected while its sort model differs from activeSort. Reconcile after
// column defs reach the grid so both always converge.
watch([gridApi, activeSort, columnDefs], ([api, sort]) => {
  if (!api || api.isDestroyed()) {
    return
  }

  const sortedColumn = api.getColumnState().find(column => column.sort)
  if (sortedColumn?.colId === sort.sortColumnKey && (sortedColumn?.sort ?? undefined) === sort.sortColumnOrder) {
    return
  }

  applySortToGrid(api, sort)
}, { flush: 'post' })

const onGridReady = (event: GridReadyEvent<Row>) => {
  gridApi.value = event.api
  emit('grid:ready', event.api)
}
</script>

<style lang="scss" scoped>
.kong-ui-public-table-data-grid {
  border: none;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  width: 100%;

  &.fit-to-content {
    height: auto;

    // Auto-height grids default to a 150px body, even for a single row.
    :deep(.ag-grid-scrolling-rows) {
      min-height: 0;
    }
  }
}

.table-data-grid-grid {
  /* stylelint-disable custom-property-pattern -- AG Grid theme variables must use AG Grid's --ag-* namespace. */
  --ag-background-color: var(--kui-color-background, #{$kui-color-background});
  --ag-border-color: var(--kui-color-border, #{$kui-color-border});
  --ag-foreground-color: var(--kui-color-text, #{$kui-color-text});
  --ag-header-background-color: var(--kui-color-background, #{$kui-color-background});
  --ag-header-column-border: 1px solid var(--kui-color-border, #{$kui-color-border});
  --ag-header-column-border-height: 30%;
  --ag-header-column-resize-handle-color: transparent;
  --ag-header-font-weight: var(--kui-font-weight-semibold, #{$kui-font-weight-semibold});
  --ag-header-text-color: var(--kui-color-text-neutral, #{$kui-color-text-neutral});
  --ag-wrapper-border: none;
  --ag-wrapper-border-radius: 0;
  /* stylelint-enable custom-property-pattern */

  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.table-data-grid-grid :global(.ag-cell) {
  align-items: center;
  display: flex;
  min-width: 0;
}

.table-data-grid-grid :global(.ag-cell-wrapper),
.table-data-grid-grid :global(.ag-cell-value) {
  min-width: 0;
  width: 100%;
}
</style>
