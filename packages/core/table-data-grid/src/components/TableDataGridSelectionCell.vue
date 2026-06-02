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
import type { ICellRendererParams } from 'ag-grid-community'
import { KCheckbox } from '@kong/kongponents'
import { ref, shallowRef } from 'vue'

type SelectionCellParams<Row extends Record<string, any>> = ICellRendererParams<Row>

const props = defineProps<{
  params: SelectionCellParams<Record<string, any>>
}>()

const currentParams = shallowRef(props.params)
const isSelected = ref(Boolean(props.params.node.isSelected()))
const isSelectable = ref(props.params.node.selectable)

const syncSelectionState = () => {
  isSelected.value = Boolean(currentParams.value.node.isSelected())
  isSelectable.value = currentParams.value.node.selectable
}

const onSelectionChange = (checked: boolean) => {
  currentParams.value.node.setSelected(checked)
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
