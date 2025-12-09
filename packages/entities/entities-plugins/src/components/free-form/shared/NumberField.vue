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
    class="ff-number-wrapper"
  >
    <EnhancedInput
      class="ff-number-field"
      v-bind="{
        ...fieldAttrs,
        min: between.min,
        max: between.max,
      }"
      :data-autofocus="isAutoFocus"
      :data-testid="`ff-${field.path.value}`"
      :disabled="field.isInheritedDisabled.value"
      :model-value="modelValue"
      :type="inputType"
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

    <component
      :is="autofillSlot"
      v-if="autofillSlot && realShowVaultSecretPicker"
      :disabled="field.isInheritedDisabled.value"
      :schema="schema"
      :update="handleUpdate"
      :value="fieldValue ?? ''"
    />
    <KAlert
      v-if="realShowVaultSecretPicker && !autofillSlot"
      appearance="warning"
      :data-testid="`ff-vault-secret-picker-warning-${field.path.value}`"
      :message="i18n.t('plugins.free-form.vault_picker.component_error')"
    />
  </div>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import { computed, inject, toRef } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'
import EnhancedInput from './EnhancedInput.vue'
import type { BaseFieldProps } from './types'
import useI18n from '../../../composables/useI18n'

export interface NumberFieldProps extends InputProps, BaseFieldProps {
  showVaultSecretPicker?: boolean
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
}

const {
  // Props of type boolean cannot distinguish between `undefined` and `false` in vue.
  // so we need to show them declaring their default value as undefined
  showVaultSecretPicker = undefined,
  name,
  ...props
} = defineProps<NumberFieldProps>()
const { value: fieldValue, hide, ...field } = useField<number | string | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const { i18n } = useI18n()

const between = computed(() => {
  const schema = (field.schema?.value as NumberLikeFieldSchema)
  if (typeof schema.gt === 'number') {
    return { min: schema.type === 'integer' ? schema.gt + 1 : schema.gt }
  }
  const [min, max] = schema.between ?? []
  return {
    min: props.min ?? min,
    max: props.max ?? max,
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
}>()

const initialValue = fieldValue!.value
const modelValue = computed(() => {
  const val = fieldValue?.value
  if (val == null || val === '') return ''

  if (realShowVaultSecretPicker.value) return `${val}`

  const num = typeof val === 'number' ? val : Number(val)
  if (Number.isFinite(num)) return `${num}`

  return ''
})

function handleUpdate(value: string) {
  const normalizedValue = normalizeValue(value)
  if (initialValue !== undefined && value === '' && normalizedValue !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = normalizedValue
    emit('update:modelValue', normalizedValue)
  }
}

function normalizeValue(value: string): number | string | null {
  if (value === '') return null

  const trimmed = value.trim()
  if (trimmed === '') return null

  const num = Number(trimmed)

  if (!Number.isFinite(num)) {
    return realShowVaultSecretPicker.value ? value : null
  }

  return num
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const schema = computed(() => ({ referenceable: realShowVaultSecretPicker.value }))

const realShowVaultSecretPicker = computed(() => {
  if (showVaultSecretPicker !== undefined) {
    return showVaultSecretPicker
  }
  return !!field.schema!.value?.referenceable
})

const inputType = computed(() => realShowVaultSecretPicker.value ? 'text' : 'number')

</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}

.ff-number-wrapper {
  width: 100%;
}
</style>
