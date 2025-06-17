<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <KInput
    v-else
    class="ff-number-field"
    v-bind="{
      ...fieldAttrs,
      min: between.min,
      max: between.max,
    }"
    :data-autofocus="isAutoFocus"
    :data-testid="field.path.value"
    :model-value="fieldValue ?? ''"
    type="number"
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
export type NumberFieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = {
  labelAttributes?: LabelAttributes
  max?: number | string
  min?: number | string
} & FieldCommonProps<TParentData, TName>

export type NumberFieldSlots = {
  tooltip?: never
}

export type NumberFieldEmits = {
  'update:modelValue': [value: number | null]
}

export type NumberFieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
>(
  props: NumberFieldProps<TParentData, TName> &
    EmitsToProps<NumberFieldEmits> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  NumberFieldProps<TParentData, TName>,
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
  SlotsType<NumberFieldSlots>
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
import { KInput, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useIsAutoFocus } from './composables'
import { computed, toRef } from 'vue'
import type { NumberLikeFieldSchema } from 'src/types/plugins/form-schema'

const { name, ...props } = defineProps<NumberFieldProps<TParentData, TName>>()
const { value: fieldValue, ...field } = useField<number | null>(toRef(() => name), props.ignoreRelativePath, props.scope)
const fieldAttrs = useFieldAttrs(field.path!, props)

const between = computed(() => {
  const [min, max] = (field.schema?.value as NumberLikeFieldSchema).between ?? []
  return {
    min: props.min ?? min,
    max: props.max ?? max,
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const initialValue = fieldValue!.value

function handleUpdate(value: string) {
  if (initialValue !== undefined && value === '' && Number(value) !== initialValue) {
    fieldValue!.value = null
    emit('update:modelValue', null)
  } else {
    fieldValue!.value = Number(value)
    emit('update:modelValue', Number(value))
  }
}

const isAutoFocus = useIsAutoFocus(field.ancestors)
</script>

<style lang="scss" scoped>
.ff-number-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
