<template>
  <div class="field-tester-container">
    <h3>Field Tester</h3>

    <KButton
      data-testid="tester-update-button"
      @click="handleUpdate"
    >
      Update Model
    </KButton>

    <VueFormGenerator
      :model="updatedFormModel"
      :schema="schema"
      @model-updated="(model: Record<string, any>, key: string) => handleModelUpdated(model, key)"
    />

    <hr>

    <h3>Value Displays</h3>

    <p>
      <KLabel>
        Prop - Schema:
      </KLabel>
      <br>
      <code data-testid="field-tester-prop-schema"><pre>{{ JSON.stringify(schema, null, 2) }}</pre></code>
    </p>

    <p>
      <KLabel>
        Prop - Model:
      </KLabel>
      <br>
      <code data-testid="field-tester-prop-model"><pre>{{ JSON.stringify(model, null, 2) }}</pre></code>
    </p>

    <p>
      <KLabel>
        Prop - Modified Model:
      </KLabel>
      <br>
      <code data-testid="field-tester-prop-modified-model"><pre>{{ JSON.stringify(modifiedModel, null, 2) }}</pre></code>
    </p>

    <div>
      <KLabel>
        Form Model:
      </KLabel>
      <div class="field-tester-form-model">
        <div class="field-tester-form-model-row">
          <KLabel class="first-col">
            Field Key
          </KLabel>
          <KLabel class="second-col">
            Field Value
          </KLabel>
        </div>
        <div
          v-for="fieldKey in Object.keys(updatedFormModel)"
          :key="`${fieldKey}-field`"
          class="field-tester-form-model-row"
        >
          <code
            class="first-col"
            :data-testid="`field-tester-form-model-${fieldKey}-label`"
          >{{ fieldKey }}</code>
          <div :data-testid="`field-tester-form-model-${fieldKey}-value`">
            {{ updatedFormModel[fieldKey] }}
          </div>
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

<style lang="scss" scoped>
.field-tester-container {
  code {
    background-color: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    display: block;
    padding: 8px;

    pre {
      margin: 0;
    }
  }

  .field-tester-form-model {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 8px;
    text-align: center;

    &-row {
      display: flex;
      gap: 40px;

      .first-col {
        width: 25%;
      }

      .second-col {
        /** code block padding + border */
        margin-left: calc(16px + 2px);
      }
    }
  }
}
</style>
