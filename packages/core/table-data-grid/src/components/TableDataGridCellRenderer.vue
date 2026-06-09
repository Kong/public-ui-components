<template>
  <span
    v-bind="boundCellAttrs"
    :class="cellClass"
  >
    <RenderCellSlot />
  </span>
</template>

<script setup lang="ts">
import type { TableDataGridRendererContext } from '../types/internal'
import type { ICellRendererParams } from 'ag-grid-community'
import { computed, shallowRef, toRaw } from 'vue'

type DatatableCellParams = ICellRendererParams<Record<string, any>> & {
  context: TableDataGridRendererContext<Record<string, any>>
}

defineOptions({
  name: 'TableDataGridCellRenderer',
})

const {
  params,
} = defineProps<{
  params: DatatableCellParams
}>()

// AG Grid refreshes reused renderers through the exposed refresh hook, not by
// updating Vue props. Keep only the top-level params reference reactive.
const currentParams = shallowRef(params)

const row = computed(() => currentParams.value.data ?? {})
const rowIndex = computed(() => currentParams.value.node.rowIndex ?? 0)
const cellContext = computed(() => currentParams.value.context.cells)
const column = computed(() => cellContext.value.columnsByKey.get(currentParams.value.colDef?.colId ?? '') ?? {
  key: currentParams.value.colDef?.colId ?? '',
  label: currentParams.value.colDef?.headerName ?? '',
})
const rowValue = computed(() => currentParams.value.value)
const colIndex = computed(() => (
  toRaw(cellContext.value).displayedColumnIndexesByKey.value.get(column.value.key) ?? -1
))
const selected = computed(() => currentParams.value.node.isSelected())
const cellAttrs = computed(() => cellContext.value.cellAttrs?.({
  column: column.value,
  colIndex: colIndex.value,
  row: row.value,
  rowIndex: rowIndex.value,
  rowValue: rowValue.value,
}) ?? {})
const boundCellAttrs = computed(() => {
  const attrs = { ...cellAttrs.value }
  delete attrs.class

  return attrs
})
const cellClass = computed(() => ['datatable-cell-content', cellAttrs.value.class])
const refreshCell = () => {
  currentParams.value.api.refreshCells({
    force: true,
    rowNodes: [currentParams.value.node],
  })
}
const cellSlot = computed(() => cellContext.value.slots[column.value.key])
const slotPayload = computed(() => ({
  column: column.value,
  refreshCell,
  row: row.value,
  rowValue: rowValue.value,
  rowIndex: rowIndex.value,
  selected: selected.value,
}))
const RenderCellSlot = () => cellSlot.value
  ? cellSlot.value(slotPayload.value)
  : currentParams.value.value ?? ''

// AG Grid calls this hook when reusing the renderer instance for new cell
// params, so slot content receives updated values without a remount.
defineExpose({
  refresh(nextParams: DatatableCellParams) {
    currentParams.value = nextParams
    return true
  },
})
</script>

<style lang="scss" scoped>
.datatable-cell-content {
  align-items: center;
  display: flex;
  height: 100%;
  min-width: 0;
  width: 100%;
}
</style>
