<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div v-else>
    <InputComponent
      v-bind="{
        ...fieldAttrs,
        showPasswordMaskToggle: encrypted,
        type: encrypted ? 'password' : 'text',
      }"
      class="ff-string-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="field.path.value"
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

<script lang="ts">
import type {
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsOptions,
  EmitsToProps,
  PublicProps,
  SlotsType,
} from 'vue'
import type { DeepKeys } from './types/util-types'
import type { FieldCommonProps } from './types/types'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export type StringFieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = {
  labelAttributes?: LabelAttributes
  multiline?: boolean
  showVaultSecretPicker?: boolean
  showPasswordMaskToggle?: boolean
  type?: string
} & FieldCommonProps<TParentData, TName>

export type StringFieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
>(
  props: StringFieldProps<TParentData, TName> &
    EmitsToProps<EmitsOptions> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  StringFieldProps<TParentData, TName>,
  object,
  object,
  Record<string, any>,
  Record<string, any>,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  EmitsOptions,
  PublicProps,
  object,
  false,
  Record<string, any>,
  SlotsType
>

</script>

<script setup lang="ts" generic="TParentData, TName extends DeepKeys<TParentData>">
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import { computed, inject, toRef, useAttrs } from 'vue'
import { KInput, KTextArea, type LabelAttributes } from '@kong/kongponents'

import * as utils from '../shared/utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'

import type { StringFieldSchema } from 'src/types/plugins/form-schema'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const {
  // Props of type boolean cannot distinguish between `undefined` and `false` in vue.
  // so we need to show them declaring their default value as undefined
  showVaultSecretPicker = undefined,
  showPasswordMaskToggle = undefined,
  name,
  ...props
} = defineProps<StringFieldProps<TParentData, TName>>()
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { value: fieldValue, ...field } = useField<string | null>(toRef(() => name), props.ignoreRelativePath, props.scope)
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...(props as any), ...attrs }))
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
