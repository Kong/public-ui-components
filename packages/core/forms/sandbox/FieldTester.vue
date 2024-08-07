<template>
  <div class="field-tester-container">
    <h3>Field Tester</h3>

    <KButton
      class="tester-update-button"
      data-testid="tester-update-button"
      @click="handleUpdate"
    >
      Programmatically Update Model
    </KButton>

    <VueFormGenerator
      :model="updatedFormModel"
      :schema="schema"
      @model-updated="(model: Record<string, any>, key: string) => handleModelUpdated(model, key)"
    />

    <hr>

    <h3>Value Displays</h3>

    <div>
      <KLabel>
        Form Model (setup ref)
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

    <p>
      <KCollapse trigger-label="Show/hide schema (prop)">
        <code data-testid="field-tester-prop-schema"><pre>{{ JSON.stringify(schema, null, 2) }}</pre></code>
      </KCollapse>
    </p>

    <p>
      <KCollapse trigger-label="Show/hide model (prop)">
        <code data-testid="field-tester-prop-model"><pre>{{ JSON.stringify(model, null, 2) }}</pre></code>
      </KCollapse>
    </p>

    <p>
      <KCollapse trigger-label="Show/hide modifiedModel (prop)">
        <code data-testid="field-tester-prop-modified-model"><pre>{{ JSON.stringify(modifiedModel, null, 2) }}</pre></code>
      </KCollapse>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue'
import type { FormSchema } from '../src/types'
import VueFormGenerator from '../src/components/FormGenerator.vue'

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
    background-color: $kui-color-background-neutral-weakest;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    display: block;
    padding: $kui-space-40;

    pre {
      margin: $kui-space-0;
    }
  }

  .tester-update-button {
    margin-bottom: $kui-space-60;
  }

  .field-tester-form-model {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    margin-bottom: $kui-space-40;
    text-align: center;

    &-row {
      align-items: center;
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
