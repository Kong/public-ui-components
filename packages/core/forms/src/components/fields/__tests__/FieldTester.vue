<template>
  <div class="field-tester-container">
    <h3>Field Tester</h3>
    <VueFormGenerator
      :model="updatedFormModel"
      :schema="schema"
      @model-updated="(model: Record<string, any>, key: string) => handleModelUpdated(model, key)"
    />

    <hr>

    <button
      data-testid="tester-update-button"
      @click="handleUpdate"
    >
      Update Model
    </button>

    <h3>Value Displays</h3>

    <p>
      <label>
        Prop - Schema:
      </label>
      <code data-testid="field-tester-prop-schema">{{ schema }}</code>
    </p>

    <p>
      <label>
        Prop - Model:
      </label>
      <code data-testid="field-tester-prop-model">{{ model }}</code>
    </p>

    <p>
      <label>
        Prop - Modified Model:
      </label>
      <code data-testid="field-tester-prop-modified-model">{{ modifiedModel }}</code>
    </p>

    <div>
      <label>
        Form Model:
      </label>
      <div
        v-for="fieldKey in Object.keys(updatedFormModel)"
        :key="`${fieldKey}-field`"
      >
        <label :data-testid="`field-tester-form-model-${fieldKey}-label`">{{ fieldKey }}</label>
        <div :data-testid="`field-tester-form-model-${fieldKey}-value`">
          {{ updatedFormModel[fieldKey] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { FormSchema } from '../../../types'
import VueFormGenerator from '../../FormGenerator.vue'

const props = defineProps({
  schema: {
    type: Object as PropType<FormSchema>,
    default: () => ({
      fields: [],
    }),
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  modifiedModel: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
})

// verify value displays on load
const updatedFormModel = ref<Record<string, any>>(props.model)

// verify model updated reflects input events
const handleModelUpdated = (model: Record<string, any>, key: string): void => {
  updatedFormModel.value[key] = model
}

// verify programmatic updates to model
const handleUpdate = (): void => {
  updatedFormModel.value = props.modifiedModel
}
</script>
