<template>
  <EnumField
    v-if="getSchema('input')"
    :items="[]"
    label="Inputs"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
  />

  <InputRecordField v-if="inputsSchema?.type === 'record'" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useFormShared } from '../../../shared/composables'
import EnumField from '../../../shared/EnumField.vue'
import InputRecordField from './InputsRecordField.vue'
import useI18n from '../../../../../composables/useI18n'

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))
</script>
