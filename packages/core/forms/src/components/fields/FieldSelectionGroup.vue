<template>
  <div class="selection-group">
    <!-- Radio button -->
    <component
      :is="$props.disabled ? 'k-tooltip' : 'div'"
      max-width="300"
      :text="t('general.disable_global_radio', { scope })"
    >
      <div
        class="form-group horizontal-radios"
      >
        <div class="radio-group">
          <div
            v-for="(option, i) in schema.fields"
            :key="i"
            class="option-group"
            :class="{ 'radio-disabled': $props.disabled }"
          >
            <label
              class="k-label"
              :class="`${option.label}-check`"
            >
              <input
                v-model="checkedGroup"
                class="k-input"
                :disabled="$props.disabled"
                type="radio"
                :value="i"
              >
              {{ option.label }}
              <div class="control-help">{{ option.description }}</div>
            </label>
          </div>
        </div>
      </div>
    </component>

    <div
      v-for="(option, i) in schema.fields"
      :key="i"
      class="option-group"
    >
      <!-- Selected Field -->
      <div
        v-if="renderedTrack[i]"
        v-show="option.fields && checkedGroup === i"
        class="option-field"
      >
        <div class="option-field-container">
          <VueFormGenerator
            :model="model"
            :options="{ helpAsHtml: true }"
            :schema="{ fields: option.fields }"
            @model-updated="updateModel"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../locales/en.json'
import VueFormGenerator from '../FormGenerator.vue'

const { t } = createI18n('en-us', english)
</script>

<script>
import abstractField from './abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  expose: ['validate', 'clearValidationErrors', 'schema'],

  data() {
    return {
      checkedGroup: null,
      fieldModel: { ...this.model }, // keep local copy of original model
      /**
       * renderedTrack tracks makes lazy rendering possible by tracking each index pointed component's render state
       * all unrendered components are set to 0, when the corresponding group got picked it will be set to 1 for good,
       * this retains the local state for each subgroup without initializing early to send unpermitted requests which
       * triggers testing failures
       */
      renderedTrack: [],
      fieldSchema: [],
      scope: 'scope',
    }
  },

  watch: {
    checkedGroup: {
      handler(newVal, oldVal) {
        this.renderedTrack[newVal] = true
        // First time trigger shouldn't need to update the form model
        if (oldVal === null) {
          this.fieldModel = { ...this.model }

          return
        }

        const newFields = this.schema.fields[newVal].fields
        const oldFields = this.schema.fields[oldVal].fields

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        oldFields && oldFields.forEach(field => this.updateModel('', field.model))
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        newFields && newFields.forEach(field => this.updateModel(this.fieldModel[field.model], field.model))
      },
    },
  },

  async created() {
    await this.$nextTick()

    // Set checkedGroup based on model
    this.schema.fields.forEach((field, i) => {
      this.renderedTrack.push(false)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      field.fields && field.fields.forEach(subField => {
        if (this.model[subField.model]) {
          this.checkedGroup = i
          this.fieldSchema.push(subField.model)
          this.scope = subField.label?.toLowerCase()
        }
      })
    })

    if (this.checkedGroup === null) {
      this.checkedGroup = 0
    }
  },

  methods: {
    updateModel(model, schema) {
      this.$emit('model-updated', model, schema)
    },
  },
}
</script>

<style lang="scss">
.field-selectionGroup {
  >label {
    display: none;
  }

  .control-help {
    color: rgba(0, 0, 0, .45);
    font-weight: normal;
    margin-left: 32px;
    width: 100%;
  }

  .form-check-input {
    margin-bottom: 8px;
    margin-right: 8px;
  }

  .option-field {
    margin-top: 16px;

    .form-group {
      margin-bottom: 16px;
    }
  }

  .k-label {
    display: block;
  }
}
</style>

<style lang="scss" scoped>
.selection-group {
  width: 100%;

  .form-group,
  .option-field-container {
    margin-bottom: 0;
  }

  .form-group.horizontal-radios {
    .radio-group {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-80;
    }

    .radio-disabled {
      cursor: not-allowed;
    }
  }
}
</style>
