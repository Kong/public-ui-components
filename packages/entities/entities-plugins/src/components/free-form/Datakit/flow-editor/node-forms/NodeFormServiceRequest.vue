<template>
  <Form
    ref="form"
    :data="formData"
    :schema="schema"
  >
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
import InputsField from './InputsField.vue'
import { useTemplateRef } from 'vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import type { NodeId } from '../../types'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')

const schema = useSubSchema('service_request')

const {
  formData,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  fieldNameValidator,
} = useNodeForm<BaseFormData>(nodeId, () => formRef.value!.getValue())
</script>

