<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="ResponseSchema"
  >
    <InputsField
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import InputsField from './InputsField.vue'
import { ResponseSchema } from '../node/schemas'
import { useTemplateRef } from 'vue'
import { useNodeForm } from './composables'

const formRef = useTemplateRef('form')

const {
  formData,
  inputOptions,
  setInputs,
  setInput,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>

