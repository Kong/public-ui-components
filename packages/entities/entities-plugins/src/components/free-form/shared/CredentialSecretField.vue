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
    :use-secret-input="useSecretInput"
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
import { computed, inject, toRef, useAttrs } from 'vue'
import { SensitiveInput } from '@kong-ui-public/entities-shared'
import type { SensitiveInputLabels } from '@kong-ui-public/entities-shared'
import { useField, useFieldAttrs } from './composables'
import { generateCredentialSecret } from './utils'
import type { BaseFieldProps, EmptyValue } from './types'
import { USE_SECRET_INPUT_KEY } from '../../../constants'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const useSecretInput = inject(USE_SECRET_INPUT_KEY, computed(() => false))

interface CredentialSecretFieldProps extends BaseFieldProps {
  placeholder?: string
  help?: string
  labels?: SensitiveInputLabels
}

const { name, generator, ...props } = defineProps<CredentialSecretFieldProps & {
  generator?: () => string | Promise<string>
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string | EmptyValue]
}>()

const { value: fieldValue, hide, ...field } = useField<string | EmptyValue>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...attrs }))

function handleUpdate(value: string) {
  fieldValue!.value = value === '' ? field.emptyValue!.value : value
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
