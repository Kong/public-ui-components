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
      :disabled="isDisabled"
      :indeterminate="isIndeterminate"
      :model-value="isChecked"
      @change="onSelectionChange"
    />
  </span>
</template>

<script setup lang="ts">
import type { TableDataGridRendererContext } from '../types/internal'
import type { IHeaderParams } from 'ag-grid-community'
import { KCheckbox } from '@kong/kongponents'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

type SelectionHeaderParams<Row extends Record<string, any>> = IHeaderParams<Row, TableDataGridRendererContext<Row>>

const {
  params,
} = defineProps<{
  params: SelectionHeaderParams<Record<string, any>>
}>()

// AG Grid refreshes reused renderers through the exposed refresh hook, not by
// updating Vue props. Keep only the top-level params reference reactive.
const currentParams = shallowRef(params)
const isChecked = ref(false)
const isIndeterminate = ref(false)
const isDisabled = ref(false)
let unsubscribeFromSelectionState: (() => void) | undefined

const syncSelectionState = () => {
  const selectionState = currentParams.value.context.selection.getHeaderSelectionState(currentParams.value.api)
  isChecked.value = selectionState.checked
  isDisabled.value = selectionState.disabled
  isIndeterminate.value = selectionState.indeterminate
}

const onSelectionChange = (checked: boolean) => {
  currentParams.value.context.selection.setAllRowsSelected({
    api: currentParams.value.api,
    selected: checked,
  })

  syncSelectionState()
}

const onGridSelectionChange = () => {
  syncSelectionState()
}

const subscribeToSelectionState = () => {
  unsubscribeFromSelectionState = currentParams.value.context.selection.subscribeToHeaderSelectionState({
    api: currentParams.value.api,
    onChange: onGridSelectionChange,
  })
}

onMounted(() => {
  syncSelectionState()
  subscribeToSelectionState()
})

onBeforeUnmount(() => {
  unsubscribeFromSelectionState?.()
})

// AG Grid calls this hook when reusing the selection header renderer instance,
// so subscription state and checkbox state stay aligned with the latest params.
defineExpose({
  refresh(nextParams: SelectionHeaderParams<Record<string, any>>) {
    const currentApi = currentParams.value.api
    currentParams.value = nextParams
    if (nextParams.api !== currentApi) {
      unsubscribeFromSelectionState?.()
      subscribeToSelectionState()
    }
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
