<template>
  <EnumField
    v-if="getSchema('input')"
    clearable
    :items="items"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @update:model-value="$emit('update:input')"
  />

  <InputsField
    :items="items"
    name="inputs"
    @update:inputs="$emit('update:inputs', $event)"
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
import type { FieldName } from '../../types'

defineProps<{
  items: InputOption[]
}>()

defineEmits<{
  (event: 'update:input'): void
  (event: 'update:inputs', fieldName: FieldName): void
  (event: 'addField', fieldName: string): void
  (event: 'removeField', fieldName: string): void
  (event: 'renameField', fieldName: string): void
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))

const InputsField = computed(() => {
  if (!inputsSchema.value) return null
  return inputsSchema.value.type === 'record' ? InputsRecordField : InputsMapField
})
</script>
