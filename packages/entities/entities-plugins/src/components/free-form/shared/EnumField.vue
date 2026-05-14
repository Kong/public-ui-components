<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <SelectComponent
    v-else
    v-show="!hide"
    v-bind="{ ...props, ...fieldAttrs }"
    v-model="fieldModel"
    class="ff-enum-field"
    :clearable="!fieldAttrs.required"
    :data-autofocus="autofocus ? 'true' : undefined"
    :data-testid="`ff-${field.path.value}`"
    :items="realItems"
    :kpop-attributes="{ 'data-testid': `ff-enum-${field.path.value}-items` }"
    @update:model-value="(value: EnumValue) => emit('update', normalizeValue(value))"
  >
    <template
      v-if="'tooltip' in $slots || fieldAttrs.labelAttributes?.info"
      #label-tooltip
    >
      <slot name="tooltip">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>

    <template
      v-if="$slots['item-label']"
      #item-template="{ item }"
    >
      <slot
        name="item-label"
        v-bind="item"
      />
    </template>
  </SelectComponent>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import {
  KSelect,
  KMultiselect,
  type LabelAttributes,
  type SelectItem,
  type SelectProps,
  type MultiselectProps,
} from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared } from './composables'
import type { BaseFieldProps } from './types'

type MultipleSelectProps = { multiple: true } & MultiselectProps<string, false>
type SingleSelectProps = { multiple?: false } & SelectProps<string, false>
type EnumValue = number | string | string[] | null

type EnumFieldProps = {
  labelAttributes?: LabelAttributes
  items?: SelectItem[]
  placeholder?: string
} & (MultipleSelectProps | SingleSelectProps) & BaseFieldProps

const emit = defineEmits<{
  update: [EnumValue]
}>()

const {
  name,
  items,
  multiple = undefined,
  autofocus,
  ...props
} = defineProps<EnumFieldProps>()
const { getSelectItems } = useFormShared()
const { value: fieldValue, hide, ...field } = useField<EnumValue>(
  toRef(() => name),
)
const fieldAttrs = useFieldAttrs(field.path!, props)

function normalizeValue(value: EnumValue): EnumValue {
  if (isMultiple.value && Array.isArray(value) && value.length === 0 && !fieldAttrs.value.required) {
    return null
  }

  return value
}

const fieldModel = defineModel({
  // If multiple and value is null/undefined, return empty array for v-model
  get: () => isMultiple.value && fieldValue?.value == null ? [] : fieldValue!.value,
  set: (val) => {
    fieldValue!.value = normalizeValue(val as EnumValue)
  },
})

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
