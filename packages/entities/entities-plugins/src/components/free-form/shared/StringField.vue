<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div v-else>
    <InputComponent
      class="ff-string-field"
      v-bind="{
        ...fieldAttrs,
        showPasswordMaskToggle: encrypted,
        type: encrypted ? 'password' : 'text',
      }"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :model-value="fieldValue ?? ''"
      @update:model-value="handleUpdate"
    >
      <template
        v-if="fieldAttrs.labelAttributes?.info"
        #label-tooltip
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </template>
    </InputComponent>
    <component
      :is="autofillSlot"
      v-if="autofillSlot && realShowVaultSecretPicker"
      :schema="schema"
      :update="handleUpdate"
      :value="fieldValue ?? ''"
    />
  </div>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import { computed, inject, toRef, useAttrs } from 'vue'
import { KInput, KTextArea, type LabelAttributes } from '@kong/kongponents'

import { path } from '../shared/utils'
import { useField, useFieldAttrs, useFormShared } from './composables'

import type { StringFieldSchema } from 'src/types/plugins/form-schema'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
interface StringFieldProps {
  name: string
  labelAttributes?: LabelAttributes
  multiline?: boolean
  showVaultSecretPicker?: boolean
  showPasswordMaskToggle?: boolean
  type?: string
}

const {
  // Props of type boolean cannot distinguish between `undefined` and `false` in vue.
  // so we need to show them declaring their default value as undefined
  showVaultSecretPicker = undefined,
  name,
  ...props
} = defineProps<StringFieldProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { getSchema } = useFormShared()
const { value: fieldValue, ...field } = useField<string | null>(toRef(() => name))
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
  if (props.type === 'password') {
    return true
  }
  return !!(field.schema?.value as StringFieldSchema).encrypted
})

const InputComponent = computed(() => {
  return props.multiline ? KTextArea : KInput
})

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const realShowVaultSecretPicker = computed(() => {
  if (showVaultSecretPicker !== undefined) {
    return showVaultSecretPicker
  }
  return !!field.schema!.value?.referenceable
})

const schema = computed(() => ({ referenceable: realShowVaultSecretPicker.value }))

const isAutoFocus = computed(() => {
  if (attrs['data-autofocus'] !== undefined) return attrs['data-autofocus']

  // If is child of array then return true
  const parent = field.ancestors?.value.parent
  if (parent?.path) {
    const parentType = getSchema(parent.path)?.type
    return parentType === 'array'
  }

  return false
})

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return path.getName(name) === 'name'
})
</script>

<style lang="scss" scoped>
.ff-string-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
