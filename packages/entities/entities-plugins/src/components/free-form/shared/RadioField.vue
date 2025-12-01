<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    v-show="!field.hide.value"
  >
    <KLabel v-bind="fieldAttrs.labelAttributes">
      {{ fieldAttrs.label }}
      <template
        v-if="fieldAttrs.labelAttributes?.info"
        #tooltip
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="fieldAttrs.labelAttributes.info" />
      </template>
    </KLabel>

    <div class="horizontal-container">
      <KRadio
        v-for="item of realItems"
        :key="item.value"
        v-model:model-value="field.value.value"
        card-orientation="horizontal"
        :label="item.label"
        :selected-value="item.value"
        @update:model-value="onChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { KRadio, type LabelAttributes, type SelectItem } from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared } from './composables'
import type { BaseFieldProps } from './types'

// Vue doesn't support the built-in `InstanceType` utility type, so we have to
// work around it a bit.
interface EnumFieldProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  multiple?: boolean
  items?: SelectItem[]
  label?: string
}

const emit = defineEmits<{
  'update:modelValue': [value: number | string]
}>()

const { name, items, ...props } = defineProps<EnumFieldProps>()
const { getSelectItems } = useFormShared()
const field = useField<number | string>(toRef(() => name))
const fieldAttrs = useFieldAttrs(field.path!, props)

const realItems = computed<SelectItem[]>(() => {
  if (items) return items
  if (field.path) {
    return getSelectItems(field.path.value)
  }
  return []
})

const onChange = (v: any) => {
  if (field.value) {
    field.value.value = v
  }
  emit('update:modelValue', v)
}
</script>

<style lang="scss" scoped>
.horizontal-container {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-60;
}

:deep(.radio-label) {
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-regular;
}
</style>
