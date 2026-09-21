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
    :disabled="isDisabled"
    :items="realItems"
    :kpop-attributes="{ 'data-testid': `ff-enum-${field.path.value}-items` }"
    @update:model-value="(value: EnumValue) => emit('update', normalizeValue(value))"
  >
    <template
      v-if="'tooltip' in $slots || fieldAttrs.labelAttributes?.info || fieldVersionInfo"
      #label-tooltip
    >
      <slot name="tooltip">
        <p
          v-if="fieldVersionInfo"
          class="ff-version-compatibility-note"
        >
          {{ fieldVersionInfo.tooltip }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html, vue/max-attributes-per-line -->
        <div v-if="fieldAttrs.labelAttributes?.info" class="ff-label-tooltip-info" v-html="fieldAttrs.labelAttributes.info" />
      </slot>
    </template>

    <template
      v-if="$slots['item-label'] || hasVersionIncompatibleItems"
      #item-template="{ item }"
    >
      <slot
        name="item-label"
        v-bind="item"
      >
        <KTooltip
          :kpop-attributes="{ 'data-testid': `ff-version-tooltip-item-${item.value}` }"
          max-width="400px"
          :text="item.versionInfo?.tooltip ?? ''"
        >
          {{ item.label }}
        </KTooltip>
      </slot>
    </template>

    <template
      v-if="$slots['dropdown-footer-text']"
      #dropdown-footer-text
    >
      <slot name="dropdown-footer-text" />
    </template>
  </SelectComponent>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import {
  KTooltip,
  KSelect,
  KMultiselect,
  type LabelAttributes,
  type SelectItem,
  type SelectProps,
  type MultiselectProps,
} from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared } from '../composables'
import type { BaseFieldProps, EmptyValue } from '../types'

type MultipleSelectProps = { multiple: true } & MultiselectProps<string, false>
type SingleSelectProps = { multiple?: false } & SelectProps<string, false>
type EnumValue = number | string | string[] | EmptyValue

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
const { getSelectItems, getFieldVersionInfo } = useFormShared()
const { value: fieldValue, hide, ...field } = useField<EnumValue>(
  toRef(() => name),
)
const fieldAttrs = useFieldAttrs(field.path!, props)

const fieldVersionInfo = computed(() => field.path ? getFieldVersionInfo(field.path.value) : undefined)

// `disabled` is only on `SelectProps`, not `MultiselectProps` (KMultiselect reads it off
// fallthrough attrs instead) — read it loosely so both branches of `EnumFieldProps` work.
const isDisabled = computed(() => (props as { disabled?: boolean }).disabled || !!fieldVersionInfo.value)

function normalizeValue(value: EnumValue): EnumValue {
  // Required fields are already correctly shaped here (`[]` for a cleared
  // multiselect, from KMultiselect's own v-model output) — no forcing needed.
  if (fieldAttrs.value.required) return value

  const isEmptyMultiselect = isMultiple.value && Array.isArray(value) && value.length === 0
  if (value == null || value === '' || isEmptyMultiselect) {
    return field.emptyValue!.value
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

const hasVersionIncompatibleItems = computed(() => realItems.value.some(item => item.versionInfo))

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

  // Separate the description from a preceding version-compatibility note with a
  // blank line — only when both are present (the description is otherwise the sole line).
  :deep(.k-tooltip .ff-version-compatibility-note + .ff-label-tooltip-info) {
    margin-top: var(--kui-space-40, $kui-space-40);
  }
}
</style>
