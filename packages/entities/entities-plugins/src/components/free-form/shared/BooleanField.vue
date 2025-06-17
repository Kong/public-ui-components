<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <KCheckbox
    v-else
    v-bind="fieldAttrs"
    class="ff-boolean-field"
    :data-testid="field.path.value"
    :model-value="fieldValue ?? false"
    @update:model-value="handleUpdate"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info"
      #tooltip
    >
      <slot name="tooltip">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>
  </KCheckbox>
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
// Props other than `labelAttributes` and `modelValue` here are passed down to the
// `KCheckbox` via attribute fallthrough.
export type BooleanFieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = {
  labelAttributes?: LabelAttributes
  modelValue?: boolean
} & FieldCommonProps<TParentData, TName>

export type BooleanFieldEmitOptions = {
  'update:modelValue': [value: boolean]
}

export type BooleanFieldSlots = {
  tooltip?: never
}

export type BooleanFieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
>(
  props: BooleanFieldProps<TParentData, TName> &
    EmitsToProps<EmitsOptions> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  BooleanFieldProps<TParentData, TName>,
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
  SlotsType<BooleanFieldSlots>
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
import { KCheckbox, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs } from './composables'
import { toRef } from 'vue'

const { name, ...props } = defineProps<BooleanFieldProps<TParentData, TName>>()
const { value: fieldValue, ...field } = useField<boolean>(toRef(() => name), props.ignoreRelativePath, props.scope)
const emit = defineEmits<BooleanFieldEmitOptions>()
defineSlots<BooleanFieldSlots>()

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
}
</style>
