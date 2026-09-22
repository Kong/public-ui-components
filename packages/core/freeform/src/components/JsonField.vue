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
    :data-testid="`ff-json-${field.path.value}`"
  >
    <EnhancedInput
      v-bind="fieldAttrs"
      class="ff-json-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="autofocus ? 'true' : undefined"
      :data-testid="`ff-${field.path.value}`"
      :disabled="isDisabled"
      :model-value="rawInputValue ?? ''"
      multiline
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
import { isEqual } from 'lodash-es'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from '../utils'
import { useField, useFieldAttrs } from '../composables'
import type { JsonFieldSchema } from '../form-schema'
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
}

type ValueType = Record<string, any> | string | EmptyValue

const {
  autofocus,
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: ValueType]
}>()

const { value: fieldValue, hide, versionInfo, ...field } = useField<ValueType, JsonFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

const isDisabled = computed(() => !!attrs.disabled || !!versionInfo?.value)

const rawInputValue = ref('')

function handleUpdate(value: string) {
  rawInputValue.value = value
  let finalValue: ValueType = value === '' ? field.emptyValue!.value : value
  try {
    const parsedValue = JSON.parse(value)
    if (parsedValue && typeof parsedValue === 'object') {
      finalValue = parsedValue
    }
  } catch {
    // noop
  }
  fieldValue!.value = finalValue
  emit('update:modelValue', finalValue)
}
const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})

watch(fieldValue!, (newValue) => {
  if (newValue && typeof newValue === 'object') {
    try {
      const parsedRawInputValue = JSON.parse(rawInputValue.value)
      if (!isEqual(parsedRawInputValue, newValue)) {
        // sync fieldValue to rawInputValue when they are different
        rawInputValue.value = JSON.stringify(newValue, null, 2)
      }
    } catch {
      // sync fieldValue to rawInputValue when rawInputValue is not valid JSON
      rawInputValue.value = JSON.stringify(newValue, null, 2)
    }
    return
  }
  rawInputValue.value = newValue || ''
}, { immediate: true })
</script>

<style lang="scss" scoped>
.ff-json-field {
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
