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
    v-bind="$attrs"
  >
    <EnhancedInput
      v-bind="{
        ...fieldAttrs,
        showPasswordMaskToggle: encrypted,
        type: encrypted ? 'password' : 'text',
      }"
      class="ff-string-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="`ff-${field.path.value}`"
      :error="error"
      :error-message="errorMessage"
      :help="(multiline && error) ? errorMessage : help"
      :model-value="fieldValue ?? ''"
      :multiline="multiline"
      :placeholder="placeholder ?? fieldAttrs.placeholder"
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
      <template
        v-if="!(multiline && error) && $slots.help"
        #help
      >
        <slot name="help" />
      </template>
    </EnhancedInput>
    <component
      :is="autofillSlot"
      v-if="autofillSlot && realShowVaultSecretPicker"
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
import { computed, inject, toRef, useAttrs } from 'vue'
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import useI18n from '../../../composables/useI18n'
import EnhancedInput from './EnhancedInput.vue'

import * as utils from '../shared/utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'

import type { StringFieldSchema } from 'src/types/plugins/form-schema'
import type { BaseFieldProps } from './types'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const { i18n } = useI18n()

interface StringFieldProps extends InputProps, BaseFieldProps {
  labelAttributes?: LabelAttributes
  multiline?: boolean
  showVaultSecretPicker?: boolean
  showPasswordMaskToggle?: boolean
  type?: string
  placeholder?: string
}

const {
  // Props of type boolean cannot distinguish between `undefined` and `false` in vue.
  // so we need to show them declaring their default value as undefined
  showVaultSecretPicker = undefined,
  showPasswordMaskToggle = undefined,
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { value: fieldValue, hide, ...field } = useField<string | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))
const initialValue = fieldValue?.value

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && value !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = value.trim()
    emit('update:modelValue', value.trim())
  }
}

const encrypted = computed(() => {
  if (showPasswordMaskToggle !== undefined) {
    return showPasswordMaskToggle
  }

  if (props.type === 'password') {
    return true
  }

  return !!(field.schema?.value as StringFieldSchema).encrypted
})

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const realShowVaultSecretPicker = computed(() => {
  if (showVaultSecretPicker !== undefined) {
    return showVaultSecretPicker
  }
  return !!field.schema!.value?.referenceable
})

const schema = computed(() => ({ referenceable: realShowVaultSecretPicker.value }))

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})
</script>

<style lang="scss" scoped>
.ff-string-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
