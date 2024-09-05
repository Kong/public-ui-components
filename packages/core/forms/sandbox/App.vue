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

    <FieldTester
      :model="fieldModelDefault"
      :modified-model="fieldModelModified"
      :schema="fieldSchema"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FieldTester from './FieldTester.vue'
// dummy data
import schema from './schema.json'
import model from './model.json'

const mutableModel = ref(model)

const fieldSchema = {
  fields: [
    // FieldCheckbox
    {
      type: 'checkbox',
      model: 'is_friendly',
      id: 'is_friendly',
      label: 'Is Friendly',
    },
    // FieldInput
    {
      type: 'input',
      model: 'cat_name',
      id: 'cat_name',
      inputType: 'text',
      label: 'Cat Name',
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
  ],
}

const fieldModelDefault = ref({
  cat_name: 'TK Meowstersmith',
  is_friendly: true,
  is_cute: true,
  gender: 'male',
})

const fieldModelModified = ref({
  cat_name: 'BratCat',
  is_friendly: false,
  is_cute: false,
  gender: null,
  personality: 'A little bit of a brat',
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  padding: 40px;
}
</style>
