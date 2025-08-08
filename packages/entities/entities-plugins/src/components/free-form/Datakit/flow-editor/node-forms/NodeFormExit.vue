<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="ExitNodeSchema"
  >
    <StringField
      name="name"
      @update:model-value="setName"
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
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import { ExitNodeSchema } from '../node/schemas'
import { useNodeForm } from './composables'
import { useTemplateRef } from 'vue'
import StringField from '../../../shared/StringField.vue'
import NumberField from '../../../shared/NumberField.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import InputsField from './InputsField.vue'

const formRef = useTemplateRef('form')

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>
