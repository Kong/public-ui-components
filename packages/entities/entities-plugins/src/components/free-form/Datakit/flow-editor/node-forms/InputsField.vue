<template>
  <EnumField
    v-if="getSchema('input')"
    clearable
    :items="items"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @change="handleInputChange"
  />

  <InputsField
    v-if="InputsField"
    :items="items"
    name="inputs"
    @change:inputs="handleInputsChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useFormShared } from '../../../shared/composables'
import EnumField from '../../../shared/EnumField.vue'
import InputsRecordField from './InputsRecordField.vue'
import InputsMapField from './InputsMapField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption } from './composables'
import type { FieldName, IdConnection } from '../../types'

defineProps<{
  items: InputOption[]
}>()

const emit = defineEmits<{
  'change:input': [value: IdConnection | null]
  'change:inputs': [fieldName: FieldName, fieldValue: IdConnection | null]
  addField: [fieldName: string]
  removeField: [fieldName: string]
  renameField: [fieldName: string]
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))

const InputsField = computed(() => {
  if (!inputsSchema.value) return null
  return inputsSchema.value.type === 'record' ? InputsRecordField : InputsMapField
})

function handleInputChange(value: null | InputOption) {
  emit('change:input', value ? value.value : null)
}

function handleInputsChange(fieldName: FieldName, fieldValue: IdConnection | null) {
  emit('change:inputs', fieldName, fieldValue)
}
</script>
