<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div v-else>
    <KInput
      v-bind="fieldAttrs"
      class="ff-string-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="field.path.value"
      :model-value="value ?? ''"
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
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, useAttrs } from 'vue'
import { KInput, type LabelAttributes } from '@kong/kongponents'

import * as utils from './utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import type { ArrayLikeFieldSchema } from 'src/types/plugins/form-schema'

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
}

const {
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string[] | null]
}>()

const { value: fieldValue, ...field } = useField<string[] | null, ArrayLikeFieldSchema>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))
const noEmptyArray = computed(() => field.schema?.value?.len_min && field.schema.value.len_min > 0)

function handleUpdate(value: string) {
  const values = value.trim().split(',').map(item => item.trim()).filter(Boolean)
  const finalValue = (!values.length && noEmptyArray.value) ? null : values
  fieldValue!.value = finalValue
  emit('update:modelValue', finalValue)
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})

const value = computed(() => {
  if (fieldValue?.value == null) {
    return undefined
  }
  return fieldValue?.value.join(', ')
})
</script>

<style lang="scss" scoped>
.ff-string-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
