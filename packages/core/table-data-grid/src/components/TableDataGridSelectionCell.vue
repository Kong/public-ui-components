<template>
  <span
    class="datatable-selection-cell"
    @click.stop
    @mousedown.stop
  >
    <KCheckbox
      aria-label="Select row"
      class="datatable-selection-checkbox"
      data-testid="table-data-grid-selection-checkbox"
      :disabled="!isSelectable"
      :model-value="isSelected"
      @change="onSelectionChange"
    />
  </span>
</template>

<script setup lang="ts">
import type { TableDataGridRendererContext } from '../types/internal'
import type { ICellRendererParams } from 'ag-grid-community'
import { KCheckbox } from '@kong/kongponents'
import { ref, shallowRef } from 'vue'

type SelectionCellParams<Row extends Record<string, any>> = ICellRendererParams<Row> & {
  context: TableDataGridRendererContext<Row>
}

const {
  params,
} = defineProps<{
  params: SelectionCellParams<Record<string, any>>
}>()

const currentParams = shallowRef(params)
const initialSelectionState = params.context.selection.getRowSelectionState(params.node)
const isSelected = ref(initialSelectionState.selected)
const isSelectable = ref(initialSelectionState.selectable)

const syncSelectionState = () => {
  const selectionState = currentParams.value.context.selection.getRowSelectionState(currentParams.value.node)
  isSelected.value = selectionState.selected
  isSelectable.value = selectionState.selectable
}

const onSelectionChange = (checked: boolean) => {
  currentParams.value.context.selection.setRowSelected({
    node: currentParams.value.node,
    selected: checked,
  })
  syncSelectionState()
}

defineExpose({
  refresh(nextParams: SelectionCellParams<Record<string, any>>) {
    currentParams.value = nextParams
    syncSelectionState()
    return true
  },
})
</script>

<style lang="scss" scoped>
.datatable-selection-cell {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
}

.datatable-selection-checkbox {
  margin: 0;
}
</style>
