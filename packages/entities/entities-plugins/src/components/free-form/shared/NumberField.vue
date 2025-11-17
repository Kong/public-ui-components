<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <EnhancedInput
    v-else
    class="ff-number-field"
    v-bind="{
      ...fieldAttrs,
      min: between.min,
      max: between.max,
    }"
    :data-autofocus="isAutoFocus"
    :data-testid="`ff-${field.path.value}`"
    :model-value="modelValue"
    type="number"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info"
      #label-tooltip
    >
      <slot name="tooltip">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>
  </EnhancedInput>
</template>

<script setup lang="ts">
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import { computed, toRef } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'
import EnhancedInput from './EnhancedInput.vue'

export interface NumberFieldProps extends InputProps {
  name: string
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
}

const { name, ...props } = defineProps<NumberFieldProps>()
const { value: fieldValue, ...field } = useField<number | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const between = computed(() => {
  const schema = (field.schema?.value as NumberLikeFieldSchema)
  if (typeof schema.gt === 'number') {
    return { min: schema.type === 'integer' ? schema.gt + 1 : schema.gt }
  }
  const [min, max] = schema.between ?? []
  return {
    min: props.min ?? min,
    max: props.max ?? max,
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const initialValue = fieldValue!.value
const modelValue = computed(() => {
  if (fieldValue?.value != null && Number.isFinite(fieldValue.value)) {
    return `${fieldValue.value}`
  } else {
    return ''
  }
})

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && Number(value) !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = value === '' ? null : Number(value)
    emit('update:modelValue', value === '' ? null : Number(value))
  }
}

const isAutoFocus = useIsAutoFocus(field.ancestors)
</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
