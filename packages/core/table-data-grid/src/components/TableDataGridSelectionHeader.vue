<template>
  <span
    class="datatable-selection-header"
    @click.stop
    @mousedown.stop
  >
    <KCheckbox
      aria-label="Select all rows"
      class="datatable-selection-checkbox"
      data-testid="table-data-grid-selection-header-checkbox"
      :disabled="!selectableRowCount"
      :indeterminate="isIndeterminate"
      :model-value="isChecked"
      @change="onSelectionChange"
    />
  </span>
</template>

<script setup lang="ts">
import type { IHeaderParams } from 'ag-grid-community'
import { KCheckbox } from '@kong/kongponents'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

type SelectionHeaderParams<Row extends Record<string, any>> = IHeaderParams<Row>

const props = defineProps<{
  params: SelectionHeaderParams<Record<string, any>>
}>()

const currentParams = shallowRef(props.params)
const selectableRowCount = ref(0)
const selectedRowCount = ref(0)
const isChecked = ref(false)
const isIndeterminate = ref(false)

const syncSelectionState = () => {
  let nextSelectableRowCount = 0
  let nextSelectedRowCount = 0

  currentParams.value.api.forEachNode((node) => {
    if (!node.selectable) {
      return
    }

    nextSelectableRowCount += 1
    if (node.isSelected()) {
      nextSelectedRowCount += 1
    }
  })

  selectableRowCount.value = nextSelectableRowCount
  selectedRowCount.value = nextSelectedRowCount
  isChecked.value = nextSelectableRowCount > 0 && nextSelectedRowCount === nextSelectableRowCount
  isIndeterminate.value = nextSelectedRowCount > 0 && nextSelectedRowCount < nextSelectableRowCount
}

const onSelectionChange = (checked: boolean) => {
  if (checked) {
    currentParams.value.api.selectAll()
  } else {
    currentParams.value.api.deselectAll()
  }

  syncSelectionState()
}

const onGridSelectionChange = () => {
  syncSelectionState()
}

onMounted(() => {
  syncSelectionState()
  currentParams.value.api.addEventListener('selectionChanged', onGridSelectionChange)
  currentParams.value.api.addEventListener('modelUpdated', onGridSelectionChange)
})

onBeforeUnmount(() => {
  currentParams.value.api.removeEventListener('selectionChanged', onGridSelectionChange)
  currentParams.value.api.removeEventListener('modelUpdated', onGridSelectionChange)
})

defineExpose({
  refresh(nextParams: SelectionHeaderParams<Record<string, any>>) {
    currentParams.value.api.removeEventListener('selectionChanged', onGridSelectionChange)
    currentParams.value.api.removeEventListener('modelUpdated', onGridSelectionChange)
    currentParams.value = nextParams
    nextParams.api.addEventListener('selectionChanged', onGridSelectionChange)
    nextParams.api.addEventListener('modelUpdated', onGridSelectionChange)
    syncSelectionState()
    return true
  },
})
</script>

<style lang="scss" scoped>
.datatable-selection-header {
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
