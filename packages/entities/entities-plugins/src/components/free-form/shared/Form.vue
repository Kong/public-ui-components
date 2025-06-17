<template>
  <component :is="tag">
    <component :is="slots[FIELD_RENDERERS]" />

    <slot>
      <Field
        v-for="field in childFields"
        :key="Object.keys(field)[0]"
        :name="Object.keys(field)[0]"
      />
    </slot>
  </component>
</template>

<script lang="ts">
export type Props<T extends Record<string, any> = Record<string, any>> = {
  tag?: string
  schema: FormSchema
  data?: T
  config?: FormConfig<T>
  fieldsOrder?: string[]
}
</script>

<script setup lang="ts" generic="T extends Record<string, any> = Record<string, any>">
import { provide, reactive, useSlots, type Slot, watch, toValue, computed } from 'vue'
import { DATA_INJECTION_KEY, FIELD_RENDERER_MATCHERS_MAP, FIELD_RENDERER_SLOTS, SCHEMA_INJECTION_KEY, useSchemaHelpers, FIELD_RENDERERS, FORM_CONFIG } from './composables'
import type { FormSchema } from '../../../types/plugins/form-schema'
import Field from './Field.vue'
import { isFunction, omit } from 'lodash-es'
import type { MatchMap } from './FieldRenderer.vue'
import type { FormConfig } from './types/types'

defineOptions({ name: 'SchemaForm' })

defineSlots<
  {
    default?: Slot
    [FIELD_RENDERERS]?: Slot<{ name: string }>
  } & Record<string, Slot<{ name: string }>>
>()

const { tag = 'form', schema, data, config, fieldsOrder } = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
}>()

const slots = useSlots()

const schemaHelpers = useSchemaHelpers(schema)
provide(SCHEMA_INJECTION_KEY, schemaHelpers)

const hasValue = (data: T | undefined) => {
  if (isFunction(config?.hasValue)) {
    return config.hasValue(data)
  }
  return !!data
}

const childFields = computed(() => {
  let fields = schemaHelpers.getSchema().fields

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

const formData = reactive<T>(
  config?.prepareFormData
    ? config.prepareFormData(hasValue(data) ? data : schemaHelpers.getDefault())
    : hasValue(data) ? data : schemaHelpers.getDefault(),
)
provide(DATA_INJECTION_KEY, formData)

provide(FIELD_RENDERER_SLOTS, omit(slots, 'default', FIELD_RENDERERS))

const matchMap: MatchMap = new Map()
provide(FIELD_RENDERER_MATCHERS_MAP, matchMap)

provide(FORM_CONFIG, config)

watch(formData, (newVal) => {
  emit('change', toValue(newVal))
}, { deep: true, immediate: true })
</script>
