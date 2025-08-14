<template>
  <div class="sandbox-container">
    <main>
      <p>This is the component sandbox.</p>
      <VueFormGenerator
        :model="mutableModel"
        :schema="schema"
      />
    </main>

    <hr>

    <p>
      Test individual field configurations with the FieldTester component.
    </p>

    <KCheckbox
      v-model="fieldTesterUseCustomComponent"
      label="Render 'eats' with custom field"
    />

    <FieldTester
      :model="fieldModelDefault"
      :modified-model="fieldModelModified"
      :schema="fieldSchema"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import CatFoodField from './CatFoodField.vue'
import FieldTester from './FieldTester.vue'
import { FORMS_API_KEY, VueFormGenerator } from '../src'

import type { FormSchema } from '../src'

// dummy data
import schema from './schema.json'
import model from './model.json'

provide(FORMS_API_KEY, {
  getOne: async () => ({}),
  getAll: async () => [{}],
})

const fieldTesterUseCustomComponent = ref<boolean>(true)

const mutableModel = ref(model)

const fieldSchema = computed<FormSchema>(() => ({
  fields: [
    // FieldInput
    {
      type: 'input',
      model: 'cat_name',
      id: 'cat_name',
      inputType: 'text',
      label: 'Cat Name',
    },
    // FieldCheckbox
    {
      type: 'checkbox',
      model: 'is_friendly',
      id: 'is_friendly',
      label: 'Is Friendly',
    },
    // FieldRadio
    {
      type: 'radio',
      model: 'gender',
      id: 'gender',
      name: 'gender',
      label: 'Gender',
      values: [
        { name: 'Male', value: 'male' },
        { name: 'Female', value: 'female' },
      ],
    },
    // FieldSelect
    {
      type: 'select',
      model: 'https_redirect_status_code',
      label: 'HTTPS Redirect Status Code',
      values: [426, 301, 302, 307, 308],
    },
    // FieldMultiselect
    {
      type: 'multiselect',
      model: 'protocols',
      label: 'Protocols',
      values: [
        { label: 'GRPC', value: 'grpc' },
        { label: 'GRPCS', value: 'grpcs' },
        { label: 'HTTP', value: 'http' },
        { label: 'HTTPS', value: 'https' },
        { label: 'TCP', value: 'tcp' },
        { label: 'TLS', value: 'tls' },
        { label: 'TLS_PASSTHROUGH', value: 'tls_passthrough' },
        { label: 'UDP', value: 'udp' },
        { label: 'WS', value: 'ws' },
        { label: 'WSS', value: 'wss' },
      ],
    },
    // FieldSwitch
    {
      type: 'switch',
      model: 'is_cute',
      label: 'Is Cute',
      textOn: 'Cute',
      textOff: 'Not Cute',
    },
    // FieldTextArea
    {
      type: 'text-area',
      model: 'personality',
      id: 'personality',
      label: 'Personality',
      placeholder: 'Describe your cat\'s personality',
      rows: 4,
    },
    // Custom Field Demo
    {
      type: 'array',
      component: fieldTesterUseCustomComponent.value ? CatFoodField : null,
      itemContainerComponent: 'FieldArrayItem',
      model: 'eats',
      id: 'eats',
      label: 'Eats',
      inputType: 'text',
      valueType: 'array',
      valueArrayType: 'string',
    },
  ],
}))

const fieldModelDefault = ref({
  cat_name: 'TK Meowstersmith',
  is_friendly: true,
  is_cute: true,
  gender: 'male',
  https_redirect_status_code: '',
  protocols: ['http', 'https'],
  eats: [],
})

const fieldModelModified = ref({
  cat_name: 'BratCat',
  is_friendly: false,
  is_cute: false,
  gender: null,
  personality: 'A little bit of a brat',
  https_redirect_status_code: 307,
  protocols: ['https', 'wss'],
  eats: ['dairy-free diet', 'chicken'],
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  padding: 40px;
}
</style>
