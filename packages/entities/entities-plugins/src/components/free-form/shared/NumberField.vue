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
    :data-autofocus="isAutoFocus"
    :error="!!inputHelp"
    :help="inputHelp"
    :model-value="fieldValue ?? ''"
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
  </KInput>
</template>

<script setup lang="ts">
import { KInput, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import { computed, inject, ref, toRef, watch } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'
import { INLINE_VALIDATION_HANDLER } from './formValidation'

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
const { value: fieldValue, ...field } = useField<number | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)
const touched = ref(false)
const inputHelp = ref('')
const fieldValidationHandler = inject(INLINE_VALIDATION_HANDLER)

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

const initialValue = fieldValue!.value

function handleUpdate(value: string) {
  touched.value = true
  if (initialValue !== undefined && value === '' && Number(value) !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = Number(value)
    emit('update:modelValue', Number(value))
  }
}

const inputHelpHandler = (help: string | undefined) => {
  if (help) {
    //
    inputHelp.value = help || ''
  } else {
    inputHelp.value = ''
  }
}

watch(touched, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    console.log('subscribe to field validation')
    fieldValidationHandler?.subscriptField(field.path!.value, inputHelpHandler)
  }
})

const isAutoFocus = useIsAutoFocus(field.ancestors)
</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
