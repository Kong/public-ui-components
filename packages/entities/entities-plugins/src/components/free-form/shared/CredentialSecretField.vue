<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <SensitiveInput
    v-else
    v-show="!hide"
    v-bind="fieldAttrs"
    class="ff-credential-secret-field"
    :data-testid="`ff-${field.path.value}`"
    :generator="generator ?? generateCredentialSecret"
    mode="create"
    :model-value="fieldValue ?? ''"
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
  </SensitiveInput>
</template>

<script setup lang="ts">
import { toRef, useAttrs } from 'vue'
import { SensitiveInput } from '@kong-ui-public/entities-shared'
import type { SensitiveInputLabels } from '@kong-ui-public/entities-shared'
import { useField, useFieldAttrs } from './composables'
import { generateCredentialSecret } from './utils'
import type { BaseFieldProps } from './types'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

interface CredentialSecretFieldProps extends BaseFieldProps {
  placeholder?: string
  help?: string
  labels?: SensitiveInputLabels
}

const { name, generator, ...props } = defineProps<CredentialSecretFieldProps & {
  generator?: () => string | Promise<string>
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { value: fieldValue, hide, ...field } = useField<string | null>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

function handleUpdate(value: string) {
  fieldValue!.value = value === '' ? null : value
  emit('update:modelValue', fieldValue!.value)
}
</script>

<style lang="scss" scoped>
.ff-credential-secret-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
