<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="ServiceRequestSchema"
  >
    <InputsField
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
import { ServiceRequestSchema } from '../node/schemas'
import { useTemplateRef } from 'vue'
import { useNodeForm } from '../composables/useNodeForm'

const formRef = useTemplateRef('form')

const {
  formData,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>

