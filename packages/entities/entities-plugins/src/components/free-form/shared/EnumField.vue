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

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { KSelect, KMultiselect, type LabelAttributes, type SelectItem } from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared } from './composables'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
// Props other than `labelAttributes` here are passed down to the `KSelect` or
// `KMultiselect` via attribute fallthrough.
interface EnumFieldProps {
  name: string
  labelAttributes?: LabelAttributes
  multiple?: boolean
  items?: SelectItem[]
  placeholder?: string
}

const { name, items, multiple = undefined, ...props } = defineProps<EnumFieldProps>()
const { getSelectItems } = useFormShared()
const { value: fieldValue, ...field } = useField<number | string>(toRef(() => name))

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
