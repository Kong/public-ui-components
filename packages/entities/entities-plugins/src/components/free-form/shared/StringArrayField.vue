<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    v-show="!hide"
    :data-testid="`ff-tag-${field.path.value}`"
  >
    <EnhancedInput
      v-bind="fieldAttrs"
      class="ff-tag-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="`ff-${field.path.value}`"
      :disabled="field.isInheritedDisabled.value"
      :model-value="rawInputValue ?? ''"
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
import { computed, ref, toRef, useAttrs, watch } from 'vue'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from './utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import type { SetFieldSchema } from '../../../types/plugins/form-schema'
import type { BaseFieldProps } from './types'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
interface StringFieldProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  multiline?: boolean
}

const {
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string[] | null]
}>()

const { value: fieldValue, hide, ...field } = useField<string[] | null, SetFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))
const noEmptyArray = computed(() => field.schema?.value?.len_min && field.schema.value.len_min > 0)

const rawInputValue = ref('')

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
</script>

<style lang="scss" scoped>
.ff-tag-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
