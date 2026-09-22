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
      :data-autofocus="autofocus ? 'true' : undefined"
      :data-testid="`ff-${field.path.value}`"
      :disabled="isDisabled"
      :model-value="rawInputValue ?? ''"
      @update:model-value="handleUpdate"
    >
      <template
        v-if="fieldAttrs.labelAttributes?.info || versionInfo"
        #label-tooltip
      >
        <slot name="tooltip">
          <p
            v-if="versionInfo"
            class="ff-version-compatibility-note"
          >
            {{ versionInfo.tooltip }}
          </p>
          <!-- eslint-disable-next-line vue/no-v-html, vue/max-attributes-per-line -->
          <div v-if="fieldAttrs.labelAttributes?.info" class="ff-label-tooltip-info" v-html="fieldAttrs.labelAttributes.info" />
        </slot>
      </template>
    </EnhancedInput>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, useAttrs, watch } from 'vue'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from '../utils'
import { useField, useFieldAttrs } from '../composables'
import type { SetFieldSchema } from '../form-schema'
import type { BaseFieldProps, EmptyValue } from '../types'

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
  autofocus,
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string[] | EmptyValue]
}>()

const { value: fieldValue, hide, versionInfo, ...field } = useField<string[] | EmptyValue, SetFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))
const noEmptyArray = computed(() => field.schema?.value?.len_min && field.schema.value.len_min > 0)

const isDisabled = computed(() => !!attrs.disabled || !!versionInfo?.value)

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
  const finalValue = (!values.length && noEmptyArray.value) ? field.emptyValue!.value : values
  fieldValue!.value = finalValue
  emit('update:modelValue', finalValue)
}
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

  // Separate the description from a preceding version-compatibility note with a
  // blank line — only when both are present (the description is otherwise the sole line).
  :deep(.k-tooltip .ff-version-compatibility-note + .ff-label-tooltip-info) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
