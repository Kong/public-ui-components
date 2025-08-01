<template>
  <EnumField
    v-if="getSchema('input')"
    :items="items"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @update:model-value="$emit('update')"
  />

  <InputsField
    :items="items"
    name="inputs"
    @update="$emit('update')"
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

defineProps<{
  items: InputOption[]
}>()

defineEmits<{
  (event: 'update'): void
  (event: 'addField'): void
  (event: 'removeField'): void
  (event: 'renameField'): void
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))

const InputsField = computed(() => {
  if (!inputsSchema.value) return null
  return inputsSchema.value.type === 'record' ? InputsRecordField : InputsMapField
})
</script>
