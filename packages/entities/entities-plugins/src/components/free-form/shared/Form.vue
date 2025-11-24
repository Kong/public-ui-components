<template>
  <component :is="tag">
    <component :is="slots[FIELD_RENDERERS]" />

    <slot>
      <Field
        v-for="field in childFields"
        :key="Object.keys(field)[0]"
        :name="Object.keys(field)[0]"
        @global-action="(name: GlobalAction, payload: any) => emit('globalAction', name, payload)"
      />
    </slot>
  </component>
</template>

<script lang="ts">
export type Props<T extends Record<string, any> = Record<string, any>> = {
  tag?: string
  schema: FormSchema | UnionFieldSchema
  data?: T
  config?: FormConfig<T>
  fieldsOrder?: string[]
  renderRules?: RenderRules
}
</script>

<script setup lang="ts" generic="T extends Record<string, any> = Record<string, any>">
import { useSlots, type Slot, computed, toRaw, toRef } from 'vue'
import { FIELD_RENDERERS, provideFormShared } from './composables'
import type { FormSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import Field from './Field.vue'
import type { FormConfig, GlobalAction, RenderRules } from './types'

defineOptions({ name: 'SchemaForm' })

defineSlots<
  {
    default?: Slot
    [FIELD_RENDERERS]?: Slot<{ name: string }>
  } & Partial<Record<string, Slot<{ name: string }>>>
>()

const { tag = 'form', schema, fieldsOrder, config, data, renderRules } = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
  'globalAction': [name: GlobalAction, payload: any]
}>()

const slots = useSlots()

const { getSchema, formData, resetFormData } = provideFormShared({
  schema,
  propsData: computed(() => data as T),
  propsConfig: config as FormConfig,
  propsRenderRules: toRef(() => renderRules),
  onChange: (value) => emit('change', value as T),
})

const childFields = computed(() => {
  const { fields } = getSchema()

  if (!fieldsOrder) return fields

  return fields.sort((a, b) => {
    const aKey = Object.keys(a)[0]
    const bKey = Object.keys(b)[0]

    const aIndex = fieldsOrder.indexOf(aKey)
    const bIndex = fieldsOrder.indexOf(bKey)

    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
})


defineExpose({
  getInnerData: () => toRaw(formData),
  setInnerData: (data: T) => resetFormData(data),
})
</script>
