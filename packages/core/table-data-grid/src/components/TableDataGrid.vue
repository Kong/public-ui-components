<template>
  <div
    class="kong-ui-public-table-data-grid"
    data-testid="table-data-grid"
  >
    <AgGridVue
      class="table-data-grid-grid"
      :column-defs="columnDefs"
      :grid-options="agGridOptions"
      :row-data="rowData"
      :suppress-cell-focus="true"
      :theme="themeQuartz"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup lang="ts" generic="Row extends object">
import type {
  TableDataGridFetcher,
  TableDataGridGridOptions,
  TableDataGridHeader,
} from '../types'
import type { ColDef, GridReadyEvent } from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { computed, ref, shallowRef, toRef, watch } from 'vue'

ModuleRegistry.registerModules([AllCommunityModule])

const {
  agGridOptions = {},
  fetcher,
  headers,
  pageSize = 25,
} = defineProps<{
  headers: Array<TableDataGridHeader<Row>>
  fetcher: TableDataGridFetcher<Row>
  pageSize?: number
  agGridOptions?: TableDataGridGridOptions<Row>
}>()

const emit = defineEmits<{
  (e: 'grid:ready', api: GridReadyEvent<Row>['api']): void
}>()

const rowData = shallowRef<Row[]>([])
const latestFetchId = ref(0)

const columnDefs = computed<Array<ColDef<Row>>>(() => headers.map((header) => {
  const columnDef: ColDef<Row> = {
    colId: header.key,
    headerName: header.label,
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    valueGetter: params => params.data?.[header.key],
    width: header.width,
  }

  return columnDef
}))

const fetchRows = async () => {
  const fetchId = latestFetchId.value + 1
  latestFetchId.value = fetchId

  try {
    const result = await fetcher({
      mode: 'infinite',
      offset: 0,
      pageSize,
    })

    if (fetchId === latestFetchId.value) {
      rowData.value = result.data
    }
  } catch (error) {
    if (fetchId === latestFetchId.value) {
      rowData.value = []
    }
    console.error(error)
  }
}

const onGridReady = (event: GridReadyEvent<Row>) => {
  emit('grid:ready', event.api)
}

watch(
  [
    toRef(() => fetcher),
    toRef(() => pageSize),
  ],
  () => {
    fetchRows()
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.kong-ui-public-table-data-grid {
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  display: flex;
  flex-direction: column;
  min-height: 360px;
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

  flex: 1 1 360px;
  min-height: 360px;
  width: 100%;
}

.table-data-grid-grid :global(.ag-cell) {
  align-items: center;
  display: flex;
}
</style>
