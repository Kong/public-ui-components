<template>
  <KFilterGroup
    v-model="filterSelection"
    :filters="filters"
    @apply="handleApply"
    @clear="handleClear"
    @close="filterKey => emit('close', filterKey)"
    @open="filterKey => emit('open', filterKey)"
  >
    <template
      v-for="slotName in forwardedFilterSlotNames"
      :key="slotName"
      #[slotName]
    >
      <slot :name="slotName" />
    </template>
  </KFilterGroup>
</template>

<script setup lang="ts">
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import { getFilterSlotName } from '../utils/headers'

const props = defineProps<{
  filters: FilterGroupFilters
  forwardedFilterSlotNames: string[]
}>()

const filterSelection = defineModel<FilterGroupSelection>({ required: true })

const emit = defineEmits<{
  (e: 'apply', filterKey: string, selection: FilterGroupSelection): void
  (e: 'clear', filterKey: string, selection: FilterGroupSelection): void
  (e: 'open', filterKey: string): void
  (e: 'close', filterKey: string): void
}>()

const isHostManagedFilter = (filterKey: string) => props.forwardedFilterSlotNames.includes(getFilterSlotName(filterKey))
const commitBuiltInFilterSelection = (filterKey: string, selection: FilterGroupSelection) => {
  if (isHostManagedFilter(filterKey)) {
    return
  }

  filterSelection.value = { ...selection }
}

const handleApply = (filterKey: string, selection: FilterGroupSelection) => {
  commitBuiltInFilterSelection(filterKey, selection)
  emit('apply', filterKey, selection)
}

const handleClear = (filterKey: string, selection: FilterGroupSelection) => {
  commitBuiltInFilterSelection(filterKey, selection)
  emit('clear', filterKey, selection)
}
</script>
