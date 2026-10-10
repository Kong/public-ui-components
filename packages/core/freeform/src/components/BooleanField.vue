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
    v-bind="{ ...fieldAttrs, ...$attrs }"
    class="ff-boolean-field"
    :data-autofocus="autofocus ? 'true' : undefined"
    :data-testid="`ff-${field.path.value}`"
    :disabled="isDisabled"
    :model-value="!!(fieldValue == null ? (emptyOrDefaultValue || false) : fieldValue)"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info || versionInfo"
      #tooltip
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
  </KCheckbox>
</template>

<script setup lang="ts">
import { KCheckbox, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from '../composables'
import { computed, toRef, useAttrs } from 'vue'
import type { BaseFieldProps } from '../types'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Props other than `labelAttributes` and `modelValue` here are passed down to the
// `KCheckbox` via attribute fallthrough.
interface InputProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  modelValue?: boolean
}

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const { autofocus, name, ...props } = defineProps<InputProps>()
const { value: fieldValue, hide, emptyOrDefaultValue, versionInfo, ...field } = useField<boolean>(toRef(() => name))
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isDisabled = computed(() => !!attrs.disabled || !!versionInfo?.value)

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

  // Separate the description from a preceding version-compatibility note with a
  // blank line — only when both are present (the description is otherwise the sole line).
  :deep(.k-tooltip .ff-version-compatibility-note + .ff-label-tooltip-info) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
