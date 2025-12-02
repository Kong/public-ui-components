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

    <NumberField
      :error="statusHandler.error.value"
      :error-message="statusHandler.errorMessage.value"
      name="status"
      @blur="statusHandler.onBlur"
      @update:model-value="statusHandler.onUpdate"
    />

    <BooleanField
      name="warn_headers_sent"
      @update:model-value="setConfig()"
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
import Form from '../../../shared/Form.vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import { useTemplateRef } from 'vue'
import NumberField from '../../../shared/NumberField.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import type { NodeId } from '../../types'
import { useFormValidation } from '../composables/validation'
import { compose, numberFormat, numberRange } from '../composables/validation'

interface ExitFormData extends BaseFormData {
  status?: number
  warn_headers_sent?: boolean
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')

const schema = useSubSchema('exit')

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
} = useNodeForm<ExitFormData>(nodeId, () => formRef.value!.getValue())

const {
  createFieldHandler,
} = useFormValidation({
  validationConfig: {
    status: compose(
      numberFormat('integer', { fieldName: 'Status' }),
      numberRange(200, 599, { fieldName: 'Status' }),
    ),
  },
  getValidationData: () => ({
    status: formData.value.status,
  }),
  toggleNodeValid,
})

// Create field handlers
const statusHandler = createFieldHandler('status', () => setConfig('status'))
</script>
