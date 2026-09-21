<template>
  <div
    class="kong-ui-public-table-data-grid"
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
      :cache-block-size="activePageSize"
      class="table-data-grid-grid"
      :column-defs="columnDefs"
      :context="gridContext"
      :datasource="datasource"
      :default-col-def="defaultColDef"
      :infinite-initial-row-count="1"
      :loading="isFetching"
      row-model-type="infinite"
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
  TableDataGridFetcher,
  TableDataGridHeader,
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
  InfiniteRowModelModule,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community'
import { computed, shallowRef, toRef, useSlots } from 'vue'
import { useEmitState } from '../composables/useEmitState'
import { useFetchInfinite } from '../composables/useFetchInfinite'
import { useTableDataGridColumnDefs } from '../composables/useTableDataGridColumnDefs'
import { useTableDataGridConfig } from '../composables/useTableDataGridConfig'
import { useTableDataGridInteractions } from '../composables/useTableDataGridInteractions'
import { useTableDataGridSort } from '../composables/useTableDataGridSort'
import useI18n from '../composables/useI18n'
import useFetchState from '../composables/useFetchState'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

const {
  error: hostError = false,
  fetcher,
  headers,
  pageSize = 25,
  refreshKey,
  tableConfig,
} = defineProps<{
  headers: Array<TableDataGridHeader<Row>>
  fetcher: TableDataGridFetcher<Row>
  error?: boolean
  pageSize?: number
  refreshKey?: string | number | boolean
  tableConfig?: TableDataGridConfig
}>()

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

const { i18n: { t } } = useI18n()

const slots = useSlots()

const gridApi = shallowRef<GridApi<Row>>()

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

const { columnDefs, gridContext } = useTableDataGridColumnDefs<Row>({
  headers: toRef(() => headers),
  slots,
  initialSort: activeSort.value,
})

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

const resetKey = computed(() => [
  fetcher,
  activePageSize.value,
  refreshKey,
  activeTableConfig.value.sortColumnKey,
  activeTableConfig.value.sortColumnOrder,
])

const {
  data,
  datasource,
  error: fetchError,
  isFetching,
} = useFetchInfinite({
  fetcher,
  resetKey,
  sort: activeSort,
})

const {
  fetchState,
  hasData,
  state: fetchLifecycleState,
} = useFetchState(data, fetchError, isFetching)

const shouldShowEmptyState = computed<boolean>(() => (
  fetchLifecycleState.value === fetchState.SUCCESS
  && !hasData.value
))

useEmitState({
  emitState: payload => emit('state', payload),
  fetchLifecycleState,
  hasData,
})

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
