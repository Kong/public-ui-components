<template>
  <KInput
    class="ff-number-field"
    v-bind="props"
    :model-value="modelValue ?? ''"
    type="number"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="props.labelAttributes?.info"
      #label-tooltip
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="props.labelAttributes?.info" />
    </template>
  </KInput>
</template>

<script setup lang="ts">
import { KInput, type LabelAttributes } from '@kong/kongponents'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export interface InputProps {
  labelAttributes?: LabelAttributes
  modelValue?: number | null
}

const { modelValue, ...props } = defineProps<InputProps>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const initialValue = modelValue

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && Number(value) !== initialValue) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', Number(value))
  }
}
</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
