<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <SelectComponent
    v-else
    v-bind="fieldAttrs"
    v-model="fieldValue"
    class="ff-enum-field"
    :data-testid="field.path.value"
    :items="realItems"
    :kpop-attributes="{ 'data-testid': `${field.path.value}-items` }"
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
  </SelectComponent>
</template>

<script lang="ts">
import type { DeepKeys, DeepValue } from './types/util-types'
import type { FieldCommonProps } from './types/types'
import type {
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsOptions,
  EmitsToProps,
  PublicProps,
  SlotsType,
} from 'vue'

export type EnumFieldProps<
  TParentData,
  TName extends DeepKeys<TParentData>,
> = {
  labelAttributes?: LabelAttributes
  multiple?: boolean
  items?: SelectItem[]
  placeholder?: string
} & FieldCommonProps<TParentData, TName>

export type EnumFieldSlots = {
  tooltip?: never
}

export type EnumFieldComponent<
  TParentData,
> = new <
  TName extends DeepKeys<TParentData>,
>(
  props: EnumFieldProps<TParentData, TName> &
    EmitsToProps<EmitsOptions> &
    PublicProps,
) => CreateComponentPublicInstanceWithMixins<
  EnumFieldProps<TParentData, TName>,
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
  SlotsType<EnumFieldSlots>
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
import { computed, toRef } from 'vue'
import { KSelect, KMultiselect, type LabelAttributes, type SelectItem } from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared } from './composables'

const { name, items, multiple = undefined, ...props } = defineProps<EnumFieldProps<TParentData, TName>>()
defineSlots<EnumFieldSlots>()
const { getSelectItems } = useFormShared()
const { value: fieldValue, ...field } = useField<number | string>(toRef(() => name), props.ignoreRelativePath, props.scope)

const fieldAttrs = useFieldAttrs(field.path!, props)

const realItems = computed<SelectItem[]>(() => {
  if (items) return items
  if (field.path) {
    return getSelectItems(field.path.value)
  }
  return []
})

const isMultiple = computed(() => {
  if (multiple !== undefined) {
    return multiple
  }

  return field.schema!.value?.type === 'set'
})

const SelectComponent = computed(() => {
  return isMultiple.value ? KMultiselect : KSelect
})
</script>

<style lang="scss" scoped>
.ff-enum-field {
  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
