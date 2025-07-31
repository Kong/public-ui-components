<template>
  <EnumField
    v-if="getSchema('input')"
    :items="[]"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
  />

  <InputsField name="inputs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useFormShared } from '@freeform/composables'
import EnumField from '@freeform/EnumField.vue'
import InputsRecordField from './InputsRecordField.vue'
import InputsMapField from './InputsMapField.vue'
import useI18n from '@/composables/useI18n'

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))

const InputsField = computed(() => {
  if (!inputsSchema.value) return null
  return inputsSchema.value.type === 'record' ? InputsRecordField : InputsMapField
})
</script>
