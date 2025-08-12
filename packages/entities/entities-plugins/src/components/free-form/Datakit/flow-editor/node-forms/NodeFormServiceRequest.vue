<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="schema"
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
import { useTemplateRef } from 'vue'
import { useNodeForm, useSubSchema } from '../composables/useNodeForm'

const formRef = useTemplateRef('form')

const schema = useSubSchema('service_request')

const {
  formData,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>

