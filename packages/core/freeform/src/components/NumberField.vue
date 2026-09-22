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
    class="ff-number-field-wrapper"
  >
    <EnhancedInput
      class="ff-number-field"
      v-bind="{
        ...fieldAttrs,
        min: between.min,
        max: between.max,
      }"
      :data-autofocus="autofocus ? 'true' : undefined"
      :data-testid="`ff-${field.path.value}`"
      :disabled="isDisabled"
      :model-value="modelValue"
      :type="inputType"
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

    <component
      :is="autofillSlot"
      v-if="autofillSlot && realShowVaultSecretPicker"
      :disabled="isDisabled"
      :schema="schema"
      :update="handleUpdate"
      :value="fieldValue ?? ''"
    />
    <KAlert
      v-if="realShowVaultSecretPicker && !autofillSlot"
      appearance="warning"
      :data-testid="`ff-vault-secret-picker-warning-${field.path.value}`"
      :message="i18n.t('vault_picker.component_error')"
    />

    <!--
      Self-guarded: renders nothing unless this field's schema is `expressible`
      and declares a twin. `expressionEditor === false` is the escape hatch for a
      plugin that lays the pair out itself (rate-limiting-advanced's limit rows).
    -->
    <ExpressionEditor
      v-if="expressionEditor !== false"
      class="ff-number-field-expression"
      :name="absoluteName"
      v-bind="expressionEditor || {}"
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
import type { InputProps, LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from '../composables'
import { computed, inject, toRef } from 'vue'
import type { NumberLikeFieldSchema } from '../form-schema'
import EnhancedInput from './EnhancedInput.vue'
import ExpressionEditor from './ExpressionEditor.vue'
import * as utils from '../utils'
import type { BaseFieldProps, EmptyValue, ExpressionEditorFieldProps } from '../types'
import useI18n from '../composables/useI18n.ts'

export interface NumberFieldProps extends InputProps, BaseFieldProps {
  showVaultSecretPicker?: boolean
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
  expressionEditor?: ExpressionEditorFieldProps
}

const {
  autofocus,
  showVaultSecretPicker = undefined,
  expressionEditor = undefined,
  name,
  ...props
} = defineProps<NumberFieldProps>()
const { value: fieldValue, hide, versionInfo, ...field } = useField<number | string | EmptyValue>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const isDisabled = computed(() => !!(props as { disabled?: boolean }).disabled || !!versionInfo?.value)

/**
 * `useField` above provides this field's own resolved path to its descendants,
 * so `ExpressionEditor` rendered below would double-resolve a relative `name`
 * against it. The absolute path sidesteps that, same as `ExpressionField` does
 * today for the value component it wraps.
 */
const absoluteName = computed(() => utils.resolveRoot(field.path?.value ?? ''))

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
  'update:modelValue': [value: number | string | EmptyValue]
}>()

defineSlots<{
  /** Replaces the info tooltip's default `fieldAttrs.labelAttributes.info` content. */
  tooltip?: () => any
  /** Replaces the help text under the expression editor's textarea. */
  'expression-help'?: () => any
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
    fieldValue!.value = field.emptyValue!.value
    emit('update:modelValue', field.emptyValue!.value)
  } else {
    fieldValue!.value = normalizedValue
    emit('update:modelValue', normalizedValue)
  }
}

function normalizeValue(value: string): number | string | EmptyValue {
  if (value === '') return field.emptyValue!.value

  const trimmed = value.trim()
  if (trimmed === '') return field.emptyValue!.value

  const num = Number(trimmed)

  if (!Number.isFinite(num)) {
    return realShowVaultSecretPicker.value ? value : field.emptyValue!.value
  }

  return num
}
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
.ff-number-field-wrapper {
  width: 100%;

  .ff-number-field {
    :deep(.k-tooltip p) {
      margin: 0;
    }

    // Separate the description from a preceding version-compatibility note with a
    // blank line — only when both are present (the description is otherwise the sole line).
    :deep(.k-tooltip .ff-version-compatibility-note + .ff-label-tooltip-info) {
      margin-top: var(--kui-space-40, $kui-space-40);
    }
  }

  // `ExpressionEditor` is spacing-neutral by design — whoever composes it owns
  // the gap to the input above.
  .ff-number-field-expression {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
