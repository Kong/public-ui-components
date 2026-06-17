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
      :cache-block-size="pageSize"
      class="table-data-grid-grid"
      :column-defs="columnDefs"
      :datasource="datasource"
      :default-col-def="defaultColDef"
      :infinite-initial-row-count="1"
      :loading="isFetching"
      row-model-type="infinite"
      :suppress-cell-focus="true"
      :theme="themeQuartz"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends object">
import type {
  TableDataGridFetcher,
  TableDataGridHeader,
  TableDataGridStatePayload,
} from '../types'
import type { ColDef, GridReadyEvent } from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import {
  AllCommunityModule,
  InfiniteRowModelModule,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community'
import { computed } from 'vue'
import { useEmitState } from '../composables/useEmitState'
import { useFetchInfinite } from '../composables/useFetchInfinite'
import useI18n from '../composables/useI18n'
import useFetchState from '../composables/useFetchState'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

const {
  error: hostError = false,
  fetcher,
  headers,
  pageSize = 25,
  refreshKey,
} = defineProps<{
  headers: Array<TableDataGridHeader<Row>>
  fetcher: TableDataGridFetcher<Row>
  error?: boolean
  pageSize?: number
  refreshKey?: string | number | boolean
}>()

defineSlots<{
  'empty-state': () => unknown
  'error-state': () => unknown
}>()

const emit = defineEmits<{
  (e: 'grid:ready', api: GridReadyEvent<Row>['api']): void
  (e: 'state', payload: TableDataGridStatePayload): void
}>()

const { i18n: { t } } = useI18n()

const defaultColDef: ColDef<Row> = {
  resizable: false,
  sortable: false,
  suppressMovable: true,
}

const columnDefs = computed<Array<ColDef<Row>>>(() => headers.map((header) => {
  const columnDef: ColDef<Row> = {
    colId: header.key,
    // Headers without explicit width constraints should fill available space.
    flex: !header.width && !header.maxWidth ? 1 : undefined,
    headerName: header.label,
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    valueGetter: params => params.data?.[header.key],
    width: header.width,
  }

  return columnDef
}))

const resetKey = computed(() => [fetcher, pageSize, refreshKey])
const {
  data,
  datasource,
  error: fetchError,
  isFetching,
} = useFetchInfinite({
  fetcher,
  resetKey,
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
  emit('grid:ready', event.api)
}
</script>

<style lang="scss" scoped>
.kong-ui-public-table-data-grid {
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
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
  --ag-header-background-color: var(--kui-color-background, #{$kui-color-background});
  --ag-header-column-border: 1px solid var(--kui-color-border, #{$kui-color-border});
  --ag-header-column-resize-handle-color: transparent;
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
}
</style>
