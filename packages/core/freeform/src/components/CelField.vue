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
    <!--
      The host's CEL editor when it provides one (`CEL_INPUT_KEY`), else a
      textarea. Both take the `KTextArea` props and slots.
    -->
    <component
      :is="editor ?? EnhancedInput"
      v-bind="fieldAttrs"
      :id="inputId"
      class="ff-cel-field"
      :data-autofocus="autofocus ? 'true' : undefined"
      :data-testid="`ff-${field.path.value}`"
      :disabled="isDisabled"
      :model-value="fieldValue ?? ''"
      :multiline="editor ? undefined : true"
      :path="editor ? field.path.value : undefined"
      :rows="rows"
      @update:model-value="handleUpdate"
    >
      <template
        v-if="fieldAttrs.labelAttributes?.info || versionInfo || $slots.tooltip"
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
      <template
        v-if="$slots.help"
        #help
      >
        <slot name="help" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, toRef, useAttrs } from 'vue'
import type { LabelAttributes } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'
import { CEL_INPUT_KEY } from '../constants'
import { useField, useFieldAttrs } from '../composables'

import type { BaseFieldProps, EmptyValue } from '../types'

/**
 * A string field that holds a CEL expression. Kong Gateway evaluates these
 * per request (plugin `condition`, `expressions`, ACL `allow_when`/`deny_when`).
 */
defineOptions({
  inheritAttrs: false,
})

const {
  autofocus,
  name,
  rows = 3,
  ...props
} = defineProps<BaseFieldProps & {
  disabled?: boolean
  label?: string
  labelAttributes?: LabelAttributes
  placeholder?: string
  required?: boolean
  inputId?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | EmptyValue]
}>()

defineSlots<{
  /** Replaces the info tooltip's default content. */
  tooltip?: () => any
  /** The help text under the editor. */
  help?: () => any
}>()

const attrs = useAttrs()
const editor = inject(CEL_INPUT_KEY, null)

const { value: fieldValue, hide, versionInfo, ...field } = useField<string | EmptyValue>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef(() => ({ ...props, ...attrs })))

const isDisabled = computed(() => props.disabled || !!versionInfo?.value)

function handleUpdate(value: string) {
  fieldValue!.value = value === '' ? field.emptyValue!.value : value
  emit('update:modelValue', fieldValue!.value)
}
</script>
