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
import { FieldTester } from '../src'
// dummy data
import schema from './schema.json'
import model from './model.json'

const mutableModel = ref(model)

const fieldSchema = {
  fields: [{
    type: 'input',
    model: 'cat_name',
    id: 'cat_name',
    inputType: 'text',
    label: 'Cat Name',
  }],
}

const fieldModelDefault = ref({
  cat_name: 'TK Meowstersmith',
})

const fieldModelModified = ref({
  cat_name: 'TK Meowstersmith, Esq.',
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  padding: 40px;
}
</style>
