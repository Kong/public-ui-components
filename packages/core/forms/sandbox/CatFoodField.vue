<template>
  <div class="cat-food-field">
    <div class="diets-checkboxes">
      <KCheckbox
        label="Dairy-Free Diet"
        :model-value="isDairyFreeDiet"
        @update:model-value="val => onDietHabitUpdate('dairy-free', val)"
      />

      <KCheckbox
        label="Fish-Free Diet"
        :model-value="isFishFreeDiet"
        @update:model-value="val => onDietHabitUpdate('fish-free', val)"
      />
    </div>

    <KMultiselect
      :items="items"
      :model-value="multiSelectValue"
      @update:model-value="onSelectionUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from 'vue'
import composables from '../src/composables'

import type { MultiselectItem } from '@kong/kongponents'

const props = defineProps<{
  disabled?: boolean
  formOptions?: Record<string, any>
  model?: Record<string, any>
  schema: Record<string, any>
  vfg: Record<string, any>
  errors?: Array<any>
  hint?: string
}>()

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

const isDairyFreeDiet = ref<boolean>(false)
const isFishFreeDiet = ref<boolean>(false)

const items = computed<MultiselectItem[]>(() => [
  { label: 'Chicken', value: 'chicken' },
  { label: 'Liver', value: 'liver' },
  { label: 'Tuna', value: 'tuna', disabled: isFishFreeDiet.value },
  { label: 'Salmon', value: 'salmon', disabled: isFishFreeDiet.value },
  { label: 'Shrimp', value: 'shrimp', disabled: isFishFreeDiet.value },
  { label: 'Milk', value: 'milk', disabled: isDairyFreeDiet.value },
  { label: 'Cheese', value: 'cheese', disabled: isDairyFreeDiet.value },
])

const { clearValidationErrors, value: foodList } = composables.useAbstractFields({
  model: toRef(() => props.model),
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
  externalValidator: (...args): string[] => {
    console.log('externalValidator', ...args)
    return []
  },
})

const multiSelectValue = computed(() => {
  return foodList.value.filter((food: string) => {
    const item = items.value.find((item) => item.value === food)
    return !!item
  })
})

const onSelectionUpdate = (value: string[]): void => {
  foodList.value = []

  if (isDairyFreeDiet.value) {
    foodList.value.push('dairy-free diet')
  }

  if (isFishFreeDiet.value) {
    foodList.value.push('fish-free diet')
  }

  foodList.value = foodList.value.concat(value)
}

const onDietHabitUpdate = (habit: 'dairy-free' | 'fish-free', val: boolean) => {
  if (habit === 'dairy-free') {
    isDairyFreeDiet.value = val
  } else if (habit === 'fish-free') {
    isFishFreeDiet.value = val
  }

  const nextMultiSelectItems = foodList.value.filter((food: string) => {
    const item = items.value.find((item) => item.value === food)
    return item && !item.disabled
  })

  onSelectionUpdate(nextMultiSelectItems)
}

// sync outer foodList change => UI state, multi select items are automatically updated
watch(foodList, () => {
  if (foodList.value.includes('dairy-free diet') !== isDairyFreeDiet.value) {
    isDairyFreeDiet.value = foodList.value.includes('dairy-free diet')
  }

  if (foodList.value.includes('fish-free diet') !== isFishFreeDiet.value) {
    isFishFreeDiet.value = foodList.value.includes('fish-free diet')
  }
})

defineExpose({
  clearValidationErrors,
})
</script>

<style lang="scss" scoped>
.cat-food-field {
  width: 100%;
}

.diets-checkboxes {
  display: flex;
  gap: 1rem;
  margin-bottom: 8px;
}
</style>
