<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <KCheckbox
    v-else
    v-show="!hide"
    v-bind="fieldAttrs"
    class="ff-boolean-field"
    :data-testid="`ff-${field.path.value}`"
    :disabled="field.isInheritedDisabled.value"
    :model-value="fieldValue ?? false"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info"
      #tooltip
    >
      <slot name="tooltip">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>
  </KCheckbox>
</template>

<script setup lang="ts">
import { KCheckbox, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from './composables'
import { toRef } from 'vue'
import type { BaseFieldProps } from './types'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Props other than `labelAttributes` and `modelValue` here are passed down to the
// `KCheckbox` via attribute fallthrough.
interface InputProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  modelValue?: boolean
}

const { name, ...props } = defineProps<InputProps>()
const { value: fieldValue, hide, ...field } = useField<boolean>(toRef(() => name))
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleUpdate = (v: boolean) => {
  fieldValue!.value = v
  emit('update:modelValue', v)
}

const fieldAttrs = useFieldAttrs(field.path!, props)
</script>

<style lang="scss" scoped>
.ff-boolean-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
