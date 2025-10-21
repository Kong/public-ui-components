<template>
  <ObjectField
    as-child
    :name="name"
    reset-label-path="isolate"
  >
    <EnumField
      v-for="cname in childFieldNames"
      :key="cname"
      clearable
      enable-filtering
      :items="items"
      :name="cname"
      :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
      @change="(value: InputOption | null) => $emit('change:inputs', cname, value ? value.value : null)"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFreeformStore } from '../../../shared/composables'
import ObjectField from '../../../shared/ObjectField.vue'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import EnumField from '../../../shared/EnumField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption } from '../composables/useNodeForm'
import type { FieldName, IdConnection } from '../../types'

defineProps<{
  name: string
  items: InputOption[]
}>()

defineEmits<{
  'change:inputs': [fieldName: FieldName, fieldValue: IdConnection | null]
}>()

const { getSchema } = useFreeformStore()
const { i18n } = useI18n()

const childFieldNames = computed(() => {
  const schema = getSchema<RecordFieldSchema>('inputs')
  if (!schema) {
    return []
  }

  return schema.fields.map(fieldObj => Object.keys(fieldObj)[0]) as FieldName[]
})
</script>
