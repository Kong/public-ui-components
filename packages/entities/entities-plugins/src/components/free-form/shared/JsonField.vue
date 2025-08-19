<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    :data-testid="`ff-json-${field.path.value}`"
  >
    <EnhancedInput
      v-bind="fieldAttrs"
      class="ff-json-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="`ff-${field.path.value}`"
      :model-value="rawInputValue ?? ''"
      multiline
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
import { computed, ref, toRef, useAttrs } from 'vue'
import { watchOnce } from '@vueuse/core'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from './utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import type { JsonFieldSchema } from '../../../types/plugins/form-schema'

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
}

type ValueType = Record<string, any> | string | null

const {
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: ValueType]
}>()

const { value: fieldValue, ...field } = useField<ValueType, JsonFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

const rawInputValue = ref('')

function handleUpdate(value: string) {
  rawInputValue.value = value
  let finalValue: ValueType = value || null
  try {
    finalValue = JSON.parse(value)
  } catch {
    // noop
  }
  fieldValue!.value = finalValue
  emit('update:modelValue', finalValue)
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})

watchOnce(fieldValue!, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    rawInputValue.value = JSON.stringify(newValue, null, 2)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.ff-json-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
