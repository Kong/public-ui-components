<template>
  <div class="sandbox-container">
    <h3>Controls</h3>
    <KInput
      v-model="defaultVal"
      label="Default"
      readonly
    />
    <KInput
      v-model="newVal"
      label="New Value"
    />

    <button @click="setNewVal">
      Update Model
    </button>

    <h3>My Form</h3>
    <VueFormGenerator
      :model="formModel"
      :schema="formSchema"
      @model-updated="(model: Record<string, any>, schema: string) => handleModelUpdated(model, schema)"
    />

    <code>{{ formModel }}</code>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const formSchema = ref({
  fields: [
    {
      type: 'input',
      model: 'cat_name',
      inputType: 'text',
      label: 'Cat Name',
    },
  ],
})

// test value displays on load
const defaultVal = ref('TK Meowstersmith')
const newVal = ref('')
const formModel = ref<Record<string, any>>({
  cat_name: defaultVal.value,
})

// verify model updated reflects text input events
const handleModelUpdated = (model: Record<string, any>, schema: string): void => {
  formModel.value[schema] = model
}

// test programmatic updates to model
const setNewVal = (): void => {
  formModel.value.cat_name = newVal.value
}
</script>
