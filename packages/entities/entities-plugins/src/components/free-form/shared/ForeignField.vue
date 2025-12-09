<template>
  <EnhancedInput
    v-show="!hide"
    v-bind="fieldAttrs"
    class="ff-foreign-field"
    :data-1p-ignore="is1pIgnore"
    :data-autofocus="isAutoFocus"
    :data-testid="`ff-${field.path.value}`"
    :disabled="field.isInheritedDisabled.value"
    :error="error"
    :error-message="errorMessage"
    :help="help"
    :model-value="rawInputValue"
    :placeholder="placeholder"
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
import { computed, ref, toRef, useAttrs } from 'vue'
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import useI18n from '../../../composables/useI18n'
import EnhancedInput from './EnhancedInput.vue'

import { getName } from './utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import type { ForeignFieldSchema } from 'src/types/plugins/form-schema'
import type { BaseFieldProps } from './types'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const { i18n: { t } } = useI18n()

type ForeignFieldValue = { id: string } | null

interface ForeignFieldProps extends InputProps, BaseFieldProps {
  labelAttributes?: LabelAttributes
  showPasswordMaskToggle?: boolean
  type?: string
}

const {
  showPasswordMaskToggle = undefined,
  name,
  ...props
} = defineProps<ForeignFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: ForeignFieldValue]
}>()

const { value: fieldValue, hide, ...field } = useField<ForeignFieldValue, ForeignFieldSchema>(toRef(() => name))

if (field.error) {
  throw new Error(field.error.message)
}

const fieldAttrs = useFieldAttrs(field.path, toRef({ ...props, ...attrs }))
const initialValue = fieldValue!.value ? fieldValue!.value.id : null
const placeholder = computed(() => {
  if (fieldAttrs.value.placeholder) {
    return fieldAttrs.value.placeholder
  }
  return t('plugins.free-form.foreign_placeholder', { entity: field.schema.value?.reference ?? 'entity' })
})

const rawInputValue = ref(initialValue ?? '')

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && value !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = { id: value.trim() }
    emit('update:modelValue', fieldValue!.value)
  }
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return getName(name) === 'name'
})
</script>

<style lang="scss" scoped>
.ff-foreign-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
