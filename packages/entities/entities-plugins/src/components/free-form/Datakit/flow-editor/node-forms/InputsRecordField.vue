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
    >
      <template
        v-if="$slots['item-label']"
        #item-label="item"
      >
        <slot
          name="item-label"
          v-bind="item"
        />
      </template>
    </EnumField>
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { intersection } from 'lodash-es'
import { useFormShared } from '../../../shared/composables'
import ObjectField from '../../../shared/ObjectField.vue'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import EnumField from '../../../shared/EnumField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption } from '../composables/useNodeForm'
import type { FieldName, IdConnection, NodeType } from '../../types'
import { getCompatInputFieldsByNodeType } from '../../schema/compat'
import { isImplicitType } from '../node/node'

const {
  nodeType,
} = defineProps<{
  name: string
  items: InputOption[]
  nodeType: NodeType
}>()

defineEmits<{
  'change:inputs': [fieldName: FieldName, fieldValue: IdConnection | null]
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const childFieldNames = computed(() => {
  const schema = getSchema<RecordFieldSchema>('inputs')
  if (!schema) {
    return []
  }

  const schemaFieldNames = schema.fields.map(fieldObj => Object.keys(fieldObj)[0]) as FieldName[]
  if (isImplicitType(nodeType)) {
    return schemaFieldNames
  }

  const allowed = getCompatInputFieldsByNodeType(nodeType)
  if (allowed === null) {
    return schemaFieldNames
  }

  if (allowed.length === 0) {
    return []
  }

  return intersection(schemaFieldNames, allowed)
})
</script>
