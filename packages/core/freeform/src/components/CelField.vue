<template>
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />
  <CelInput
    v-else
    v-show="!field.hide?.value"
    v-bind="{ ...fieldAttrs, ...$attrs }"
    :id="props.inputId"
    :data-autofocus="props.autofocus ? 'true' : undefined"
    :data-testid="`ff-${field.path?.value}`"
    :disabled="isDisabled"
    :error="props.error || !!field.fieldErrors?.value.length"
    :language="props.language"
    :model-value="draft ?? ''"
    @change="handleChange"
    @update:model-value="handleInput"
  >
    <template
      v-if="$slots.label"
      #label="slotProps"
    >
      <slot
        name="label"
        v-bind="slotProps"
      />
    </template>
    <template
      v-if="$slots.tooltip || fieldAttrs.labelAttributes?.info || field.versionInfo?.value"
      #label-tooltip
    >
      <slot name="tooltip">
        <p v-if="field.versionInfo?.value">
          {{ field.versionInfo.value.tooltip }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html, vue/max-attributes-per-line -->
        <div v-if="fieldAttrs.labelAttributes?.info" v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>
    <template
      v-if="$slots.help"
      #help
    >
      <slot name="help" />
    </template>
  </CelInput>
  <FieldErrors
    v-if="!field.hide?.value"
    :errors="field.fieldErrors?.value"
    :path="field.path?.value"
  />
</template>

<script setup lang="ts">
import { computed, ref, toRef, useAttrs, watch } from 'vue'
import type { CelLanguage } from '@kong-ui-public/monaco-editor/languages/cel'
import { useField, useFieldAttrs, useFormShared } from '../composables'
import type { BaseFieldProps, EmptyValue } from '../types'
import CelInput from './CelInput.vue'
import FieldErrors from './FieldErrors.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<BaseFieldProps & {
  language: CelLanguage
  disabled?: boolean
  error?: boolean
  inputId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | EmptyValue]
}>()

defineSlots<{
  label?: (props: { label?: string }) => any
  tooltip?: () => any
  help?: () => any
}>()

const attrs = useAttrs()
const field = useField<string | EmptyValue>(toRef(props, 'name'))
const { config } = useFormShared()
const fieldAttrs = useFieldAttrs(() => field.path?.value ?? props.name, { ...attrs, labelAttributes: props.labelAttributes })
const isDisabled = computed(() => props.disabled || !!field.versionInfo?.value)
const draft = ref(field.value?.value)

watch(() => field.value?.value, value => {
  draft.value = value
})

function commit() {
  if (isDisabled.value || !field.value) return
  field.value.value = draft.value === '' ? field.emptyValue!.value : draft.value
  emit('update:modelValue', field.value.value)
}

function handleInput(value: string) {
  if (isDisabled.value || value === draft.value) return
  draft.value = value
  if (!config.value.updateOnChange) commit()
}

function handleChange() {
  if (config.value.updateOnChange) commit()
}
</script>
