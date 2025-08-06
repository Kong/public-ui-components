<template>
  <Form
    ref="form"
    :data="formData"
    :schema="PropertyNodeSchema"
  >
    <StringField
      name="name"
      @update:model-value="setName"
    />

    <EnumField
      name="content_type"
      @update:model-value="setConfig"
    />

    <PropertiesField @update:model-value="handlePropertiesChange" />

    <InputsField
      v-if="writable"
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import PropertiesField from './PropertiesField.vue'
import { PropertyNodeSchema } from '../node/mock'
import { useNodeForm, type BaseFormData } from './composables'
import { computed, useTemplateRef } from 'vue'
import StringField from '../../../shared/StringField.vue'
import EnumField from '../../../shared/EnumField.vue'
import InputsField from './InputsField.vue'
import { isWritableProperty } from './property'

interface PropertyFormData extends BaseFormData {
  property: string | null
  content_type: string | null
}

const formRef = useTemplateRef('form')

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
} = useNodeForm<PropertyFormData>(() => formRef.value!.getInnerData())

const writable = computed(() => isWritableProperty(formData.value.property))

function handlePropertiesChange(value: string | null) {
  const writable = isWritableProperty(value)

  if (!writable) {
    // If the property is not writable, we clear the input
    setInput(null, false)
  }

  setConfig()
}
</script>
