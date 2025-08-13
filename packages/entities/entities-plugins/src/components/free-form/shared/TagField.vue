<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    :data-testid="`ff-tag-${field.path.value}`"
  >
    <EnhancedInput
      v-bind="fieldAttrs"
      class="ff-tag-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="`ff-${field.path.value}`"
      :error="!meta.isValid"
      :error-message="meta.errors?.join(', ')"
      :model-value="rawInputValue ?? ''"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRef, useAttrs, watch } from 'vue'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from './utils'
import { useField, useFieldAttrs, useFieldValidator, useIsAutoFocus, type ValidatorFns } from './composables'
import type { SetFieldSchema } from '../../../types/plugins/form-schema'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
interface StringFieldProps {
  name: string
  labelAttributes?: LabelAttributes
  multiline?: boolean
  type?: string
  validator?: ValidatorFns<string[] | null>
}

const {
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string[] | null]
}>()

const { value: fieldValue, ...field } = useField<string[] | null, SetFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))
const noEmptyArray = computed(() => field.schema?.value?.len_min && field.schema.value.len_min > 0)

const rawInputValue = ref('')

const {
  meta,
  handleMount,
  handleFocus,
  handleChange,
  handleBlur,
} = useFieldValidator(field.path!, toRef(() => props.validator))

function arrToStr(arr: string[]) {
  return arr.map(item => item.trim()).filter(Boolean).join(', ')
}

function strToArr(str: string) {
  return str.trim().split(',').map(item => item.trim()).filter(Boolean)
}

function handleUpdate(value: string) {
  rawInputValue.value = value
  const values = strToArr(value)
  const finalValue = (!values.length && noEmptyArray.value) ? null : values
  fieldValue!.value = finalValue
  handleChange(finalValue)
  emit('update:modelValue', finalValue)
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})

// sync fieldValue to rawInputValue ONLY when their formatted value are different.
watch(fieldValue!, newValue => {
  const nv = newValue ? arrToStr(newValue) : ''
  const ov = arrToStr(strToArr(rawInputValue.value))
  if (ov !== nv) {
    rawInputValue.value = nv
  }
}, { immediate: true })

onMounted(() => {
  if (!field.error) {
    handleMount(fieldValue!.value)
  }
})
</script>

<style lang="scss" scoped>
.ff-tag-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
