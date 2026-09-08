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
      v-bind="fieldAttrs"
      :id="inputId"
      class="ff-string-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="autofocus ? 'true' : undefined"
      :data-testid="`ff-${field.path.value}`"
      :error="error"
      :error-message="errorMessage"
      :help="(multiline && error) ? errorMessage : help"
      :model-value="fieldValue ?? ''"
      :multiline="multiline"
      :placeholder="placeholder ?? fieldAttrs.placeholder"
      :secret="encrypted && useSecretInput"
      :show-password-mask-toggle="encrypted && !useSecretInput"
      :type="encrypted && !useSecretInput ? 'password' : encrypted ? undefined : 'text'"
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

      <!-- inline vault picker -->
      <template
        v-if="!multiline && inlineVaultPicker"
        #after
      >
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
      </template>
    </EnhancedInput>

    <!-- block vault picker -->
    <template v-if="!inlineVaultPicker">
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
    </template>

    <!--
      Self-guarded: renders nothing unless this field's schema is `expressible`
      and declares a twin. `expressionEditor === false` is the escape hatch for a
      plugin that lays the pair out itself (rate-limiting-advanced's limit rows).
    -->
    <ExpressionEditor
      v-if="expressionEditor !== false"
      class="ff-string-field-expression"
      :name="absoluteName"
      :placeholder="expressionEditor?.placeholder"
    >
      <template
        v-if="$slots['expression-help']"
        #help
      >
        <slot name="expression-help" />
      </template>
    </ExpressionEditor>
  </div>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import { computed, inject, toRef, useAttrs } from 'vue'
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import useI18n from '../../../composables/useFreeformI18n'
import EnhancedInput from './EnhancedInput.vue'
import { USE_SECRET_INPUT_KEY } from '../../../constants'

import * as utils from '../shared/utils'
import { useField, useFieldAttrs } from './composables'
import ExpressionEditor from './ExpressionEditor.vue'

import type { StringFieldSchema } from 'src/types/plugins/form-schema'
import type { BaseFieldProps, EmptyValue, ExpressionEditorFieldProps } from './types'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const { i18n } = useI18n()
const useSecretInput = inject(USE_SECRET_INPUT_KEY, computed(() => false))

interface StringFieldProps extends InputProps, BaseFieldProps {
  labelAttributes?: LabelAttributes
  multiline?: boolean
  showVaultSecretPicker?: boolean
  showPasswordMaskToggle?: boolean
  type?: string
  placeholder?: string
  inputId?: string
  inlineVaultPicker?: boolean
  expressionEditor?: ExpressionEditorFieldProps
}

const {
  autofocus,
  showVaultSecretPicker = undefined,
  showPasswordMaskToggle = undefined,
  expressionEditor = undefined,
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | EmptyValue]
}>()

const { value: fieldValue, hide, ...field } = useField<string | EmptyValue>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

function handleUpdate(value: string) {
  fieldValue!.value = value === '' ? field.emptyValue!.value : value
  emit('update:modelValue', fieldValue!.value)
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

/**
 * `useField` above provides this field's own resolved path to its descendants,
 * so `ExpressionEditor` rendered below would double-resolve a relative `name`
 * against it (`config.custom_key` becoming `config.custom_key.custom_key`).
 * The absolute path sidesteps that, same as `ExpressionField` does today for
 * the value component it wraps.
 */
const absoluteName = computed(() => utils.resolveRoot(field.path?.value ?? ''))

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

// `ExpressionEditor` is spacing-neutral by design — whoever composes it owns
// the gap to the input above.
.ff-string-field-expression {
  margin-top: var(--kui-space-40, $kui-space-40);
}
</style>
