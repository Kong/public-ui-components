<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="ExitNodeSchema"
  >
    <NameField
      :name="formData.name"
      :validate="nameValidator"
      @update="setName"
    />

    <NumberField
      name="status"
      @update:model-value="setConfig()"
    />

    <BooleanField
      name="warn_headers_sent"
      @update:model-value="setConfig()"
    />

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
import { ExitNodeSchema } from '../node/schemas'
import { useNodeForm } from '../composables/useNodeForm'
import { useTemplateRef } from 'vue'
import NumberField from '../../../shared/NumberField.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'

const formRef = useTemplateRef('form')

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  nameValidator,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>
