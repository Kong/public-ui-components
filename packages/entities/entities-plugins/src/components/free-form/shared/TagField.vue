<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div v-else>
    <KInput
      v-bind="fieldAttrs"
      class="ff-string-field"
      :data-1p-ignore="is1pIgnore"
      :data-autofocus="isAutoFocus"
      :data-testid="field.path.value"
      :model-value="rawInputValue ?? ''"
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
    </KInput>
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
import type { DeepKeys, DeepValue } from './types/util-types'
import type { FieldCommonProps } from './types/types'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Other props are passed down to the `KInput` via attribute fallthrough.
export type TagFieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = {
  labelAttributes?: LabelAttributes
  multiline?: boolean
  type?: string
} & FieldCommonProps<TParentData, TName>

export type TagFieldSlots = {
  tooltip?: never
}

export type TagFieldEmits = {
  'update:modelValue': [value: string[] | null]
}

export type TagFieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
>(
  props: TagFieldProps<TParentData, TName> &
    EmitsToProps<TagFieldEmits> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  TagFieldProps<TParentData, TName>,
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
  SlotsType<TagFieldSlots>
>

</script>

<script
  setup
  lang="ts"
  generic="
    TParentData,
    TName extends DeepKeys<TParentData>,
    TData extends DeepValue<TParentData, TName>,
  "
>
import { computed, ref, toRef, useAttrs, watch } from 'vue'
import { KInput, type LabelAttributes } from '@kong/kongponents'

import * as utils from './utils'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import type { ArrayLikeFieldSchema } from 'src/types/plugins/form-schema'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const {
  name,
  ...props
} = defineProps<TagFieldProps<TParentData, TName>>()
const emit = defineEmits<TagFieldEmits>()

const { value: fieldValue, ...field } = useField<string[] | null, ArrayLikeFieldSchema>(toRef(() => name), props.ignoreRelativePath, props.scope)
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...(props as any), ...attrs }))
const noEmptyArray = computed(() => field.schema?.value?.len_min && field.schema.value.len_min > 0)

const rawInputValue = ref('')

function arrToStr(arr: string[]) {
  return arr.map(item => item.trim()).filter(Boolean).join(', ')
}

function strToArr(str: string) {
  return str.trim().split(',').map(item => item.trim()).filter(Boolean)
}

function handleUpdate(value: string) {
  rawInputValue.value = value
  const values = strToArr(value)
  const finalValue = (!values.length && noEmptyArray.value) ? null : values
  fieldValue!.value = finalValue
  emit('update:modelValue', finalValue)
}

const isAutoFocus = useIsAutoFocus(field.ancestors)

const is1pIgnore = computed(() => {
  if (attrs['data-1p-ignore'] !== undefined) return attrs['data-1p-ignore']
  return utils.getName(name) === 'name'
})

// sync fieldValue to rawInputValue ONLY when their formatted value are different.
watch(fieldValue!, newValue => {
  const nv = newValue ? arrToStr(newValue) : ''
  const ov = arrToStr(strToArr(rawInputValue.value))
  if (ov !== nv) {
    rawInputValue.value = nv
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.ff-string-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
