<script setup lang="ts">
import type { AnalyticsDatatableHeader } from '../types'
import type { ICellRendererParams } from 'ag-grid-community'
import type { Slots } from 'vue'
import { computed, defineComponent, h, shallowRef } from 'vue'

type DatatableCellContext<Row extends Record<string, any>> = {
  columnsByKey: Map<string, AnalyticsDatatableHeader<Row>>
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

const currentParams = shallowRef({ ...props.params })

const row = computed(() => currentParams.value.data ?? {})
const rowIndex = computed(() => currentParams.value.node.rowIndex ?? 0)
const column = computed(() => currentParams.value.context.columnsByKey.get(currentParams.value.colDef?.colId ?? '') ?? {
  key: currentParams.value.colDef?.colId ?? '',
  label: currentParams.value.colDef?.headerName ?? '',
})
const selected = computed(() => currentParams.value.node.isSelected())

defineExpose({
  refresh(nextParams: DatatableCellParams) {
    currentParams.value = { ...nextParams }
    return true
  },
})

const CellContent = defineComponent({
  name: 'AnalyticsDatatableCellContent',
  setup() {
    return () => {
      const cellSlot = currentParams.value.context.slots[column.value.key]

      if (cellSlot) {
        return cellSlot({
          column: column.value,
          row: row.value,
          rowIndex: rowIndex.value,
          selected: selected.value,
        })
      }

      return h('span', currentParams.value.value ?? '')
    }
  },
})
</script>

<template>
  <CellContent />
</template>
