<script setup lang="ts">
import type { AnalyticsDatatableCellAttrs, AnalyticsDatatableHeader } from '../types'
import type { ICellRendererParams } from 'ag-grid-community'
import type { ShallowRef, Slots } from 'vue'
import { computed, shallowRef, toRaw } from 'vue'

type DatatableCellContext<Row extends Record<string, any>> = {
  cellAttrs?: AnalyticsDatatableCellAttrs<Row>
  columnsByKey: Map<string, AnalyticsDatatableHeader<Row>>
  displayedColumnIndexesByKey: Readonly<ShallowRef<Map<string, number>>>
  slots: Slots
}

type DatatableCellParams = ICellRendererParams<Record<string, any>> & {
  context: DatatableCellContext<Record<string, any>>
}

defineOptions({
  name: 'AnalyticsDatatableCellRenderer',
})

const props = defineProps<{
  params: DatatableCellParams
}>()

const currentParams = shallowRef(props.params)

const row = computed(() => currentParams.value.data ?? {})
const rowIndex = computed(() => currentParams.value.node.rowIndex ?? 0)
const column = computed(() => currentParams.value.context.columnsByKey.get(currentParams.value.colDef?.colId ?? '') ?? {
  key: currentParams.value.colDef?.colId ?? '',
  label: currentParams.value.colDef?.headerName ?? '',
})
const rowValue = computed(() => currentParams.value.value)
const colIndex = computed(() => (
  toRaw(currentParams.value.context).displayedColumnIndexesByKey.value.get(column.value.key) ?? -1
))
const selected = computed(() => currentParams.value.node.isSelected())
const cellAttrs = computed(() => currentParams.value.context.cellAttrs?.({
  column: column.value,
  colIndex: colIndex.value,
  row: row.value,
  rowIndex: rowIndex.value,
  rowValue: rowValue.value,
}) ?? {})
const refreshCell = () => {
  currentParams.value.api.refreshCells({
    force: true,
    rowNodes: [currentParams.value.node],
  })
}
const cellSlot = computed(() => currentParams.value.context.slots[column.value.key])
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

// AG Grid calls refresh on reused renderer instances so slot content receives
// the latest cell params without remounting the component.
defineExpose({
  refresh(nextParams: DatatableCellParams) {
    currentParams.value = nextParams
    return true
  },
})
</script>

<template>
  <span
    v-bind="cellAttrs"
    :class="['datatable-cell-content', cellAttrs.class]"
  >
    <RenderCellSlot />
  </span>
</template>

<style lang="scss" scoped>
.datatable-cell-content {
  align-items: center;
  display: flex;
  height: 100%;
  min-width: 0;
  width: 100%;
}
</style>
