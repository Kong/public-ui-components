<template>
  <div>
    <InputComponent
      class="ff-string-field"
      v-bind="{ ...props, ...attrs }"
      :model-value="modelValue ?? ''"
      @update:model-value="handleUpdate"
    >
      <template
        v-if="props.labelAttributes?.info"
        #label-tooltip
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="props.labelAttributes?.info" />
      </template>
    </InputComponent>
    <component
      :is="autofillSlot"
      v-if="autofillSlot && showVaultSecretPicker"
      :schema="schema"
      :update="handleUpdate"
      :value="modelValue ?? ''"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue'
import { KInput, KTextArea, type LabelAttributes } from '@kong/kongponents'
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export interface InputProps {
  labelAttributes?: LabelAttributes
  modelValue?: string | null
  multiline?: boolean
  showVaultSecretPicker?: boolean
}

const { modelValue, showVaultSecretPicker, ...props } = defineProps<InputProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const initialValue = modelValue

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && value !== initialValue) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', value)
  }
}

const InputComponent = computed(() => {
  return props.multiline ? KTextArea : KInput
})

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)
const schema = computed(() => ({ referenceable: showVaultSecretPicker }))
</script>

<style lang="scss" scoped>
.ff-string-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
