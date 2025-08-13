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
    :error="!meta.isValid"
    :error-message="meta.errors?.join(', ')"
    :model-value="modelValue"
    type="number"
    @blur="handleBlur"
    @focus="handleFocus"
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
import type { LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useFieldValidator, useIsAutoFocus, type ValidatorFns } from './composables'
import { computed, onMounted, toRef } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'
import EnhancedInput from './EnhancedInput.vue'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export interface InputProps {
  name: string
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
  validator?: ValidatorFns<number | null>
}

const { name, ...props } = defineProps<InputProps>()
const { value: fieldValue, ...field } = useField<number | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const {
  meta,
  handleMount,
  handleFocus,
  handleChange,
  handleBlur,
} = useFieldValidator(field.path!, toRef(() => props.validator))

const between = computed(() => {
  const schema = (field.schema?.value as NumberLikeFieldSchema)
  if (schema.gt) {
    return { min: schema.gt }
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
    handleChange(null)
    emit('update:modelValue', null)
  } else {
    const normalizedValue = value === '' ? null : Number(value)
    fieldValue!.value = normalizedValue
    handleChange(normalizedValue)
    emit('update:modelValue', normalizedValue)
  }
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

onMounted(() => {
  if (!field.error) {
    handleMount(initialValue)
  }
})
</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
