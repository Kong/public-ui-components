<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <KInput
    v-else
    class="ff-number-field"
    v-bind="{
      ...fieldAttrs,
      min: between.min,
      max: between.max,
    }"
    :model-value="field.value.value ?? ''"
    type="number"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info"
      #label-tooltip
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="fieldAttrs.labelAttributes.info" />
    </template>
  </KInput>
</template>

<script setup lang="ts">
import { KInput, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from './composables'
import { computed, toRef } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export interface InputProps {
  name: string
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
}

const { name, ...props } = defineProps<InputProps>()
const field = useField<number | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const between = computed(() => {
  const [min, max] = (field.schema?.value as NumberLikeFieldSchema).between ?? []
  return {
    min: props.min ?? min,
    max: props.max ?? max,
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const initialValue = field.value!.value

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && Number(value) !== initialValue) {
    field.value!.value = null
    emit('update:modelValue', null)
  } else {
    field.value!.value = Number(value)
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
