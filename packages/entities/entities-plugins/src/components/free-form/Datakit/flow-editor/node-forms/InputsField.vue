<template>
  <EnumField
    v-if="getSchema('input')"
    clearable
    enable-filtering
    :items="items"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @change="handleInputChange"
  />

  <InputsField
    v-if="InputsField"
    :items="items"
    :key-order="fieldNames"
    name="inputs"
    @add:field="handleAddField"
    @change:inputs="handleChangeInputs"
    @remove:field="handleRemoveField"
    @rename:field="handleRenameField"
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
  fieldNames: FieldName[]
}>()

const emit = defineEmits<{
  'change:input': [value: IdConnection | null]
  'change:inputs': [name: FieldName, value: IdConnection | null]
  'add:field': [name: FieldName, value?: IdConnection | null]
  'remove:field': [name: FieldName]
  'rename:field': [oldName: FieldName, newName: FieldName]
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

function handleAddField(name: FieldName, value?: IdConnection | null) {
  emit('add:field', name, value)
}

function handleChangeInputs(name: FieldName, value: IdConnection | null) {
  emit('change:inputs', name, value)
}

function handleRemoveField(name: FieldName) {
  emit('remove:field', name)
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  emit('rename:field', oldName, newName)
}

</script>
