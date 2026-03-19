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

    <NodeFormDivider />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="jwt_decode"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

import Form from '../../../shared/Form.vue'
import type { NodeId } from '../../types'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import NodeFormDivider from './NodeFormDivider.vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('jwt_decode')

const {
  formData,
  setName,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  nameValidator,
  fieldNameValidator,
} = useNodeForm<BaseFormData>(nodeId, () => formRef.value!.getValue())
</script>
