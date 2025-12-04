<template>
  <Form
    ref="form"
    :data="formData"
    :schema="schema"
  >
    <NameField
      :name="formData.name"
      :validate="nameValidator"
      @update="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{
        t("plugins.free-form.datakit.flow_editor.node_properties.configuration")
      }}
    </KLabel>

    <BooleanField
      name="bypass_on_error"
      @update:model-value="setConfig('bypass_on_error')"
    />

    <NumberField
      :error="ttlHandler.error.value"
      :error-message="ttlHandler.errorMessage.value"
      name="ttl"
      @blur="ttlHandler.onBlur"
      @update:model-value="ttlHandler.onUpdate"
    />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import Form from '../../../shared/Form.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import NumberField from '../../../shared/NumberField.vue'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import useI18n from '../../../../../composables/useI18n'
import {
  useNodeForm,
  useSubSchema,
  type BaseFormData,
} from '../composables/useNodeForm'
import {
  compose,
  numberFormat,
  numberRange,
  useFormValidation,
} from '../composables/validation'
import type { NodeId } from '../../types'

interface CacheFormData extends BaseFormData {
  bypass_on_error?: boolean
  ttl?: number
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('cache')
const {
  i18n: { t },
} = useI18n()

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  nameValidator,
  toggleNodeValid,
  fieldNameValidator,
} = useNodeForm<CacheFormData>(nodeId, () => formRef.value!.getValue())

const { createFieldHandler } = useFormValidation({
  validationConfig: () => ({
    ttl: compose(
      numberFormat('integer', { fieldName: 'TTL' }),
      numberRange(1, Infinity, { fieldName: 'TTL' }),
    ),
  }),
  getValidationData: () => ({
    ttl: formData.value.ttl,
  }),
  toggleNodeValid,
})

const ttlHandler = createFieldHandler('ttl', () => setConfig('ttl'))
</script>
