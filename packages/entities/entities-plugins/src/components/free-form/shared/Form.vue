<template>
  <component :is="tag">
    <component :is="slots[FIELD_RENDERERS]" />

    <!-- custom rendering -->
    <template v-if="slots.default">
      <slot />
    </template>

    <!-- auto rendering -->
    <template v-else>
      <Field
        v-for="field in schemaHelpers.getSchema().fields"
        :key="Object.keys(field)[0]"
        :name="Object.keys(field)[0]"
      />
    </template>
  </component>
</template>

<script setup lang="ts" generic="T extends Record<string, any> = Record<string, any>">
import { provide, reactive, useSlots, type Slot, watch, toValue } from 'vue'
import { DATA_INJECTION_KEY, FIELD_RENDERER_MATCHERS_MAP, FIELD_RENDERER_SLOTS, SCHEMA_INJECTION_KEY, useSchemaHelpers, FIELD_RENDERERS, FORM_CONFIG } from './composables'
import type { FormSchema } from '../../../types/plugins/form-schema'
import Field from './Field.vue'
import { omit } from 'lodash-es'
import type { MatchMap } from './FieldRenderer.vue'
import type { FormConfig } from './types'


defineOptions({ name: 'SchemaForm' })

defineSlots<
  {
    default?: Slot
    [FIELD_RENDERERS]?: Slot<{ name: string }>
  } & Record<string, Slot<{ name: string }>>
>()

const { tag = 'form', schema, data, config } = defineProps<{
  tag?: string
  schema: FormSchema
  data?: T
  config?: FormConfig
}>()

const emit = defineEmits<{
  change: [value: T]
}>()

const slots = useSlots()

const schemaHelpers = useSchemaHelpers(schema)
provide(SCHEMA_INJECTION_KEY, schemaHelpers)

const formData = reactive<T>(
  config?.prepareFormData
    ? config?.prepareFormData(data || schemaHelpers.getDefault())
    : data || schemaHelpers.getDefault(),
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
