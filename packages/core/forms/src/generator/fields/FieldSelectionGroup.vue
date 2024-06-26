<template>
  <div class="selection-group">
    <!-- Radio button -->
    <div class="form-group horizontal-radios">
      <div class="radio-group">
        <div
          v-for="(option, i) in schema.fields"
          :key="i"
          class="option-group"
        >
          <label
            class="k-label"
            :class="`${option.label}-check`"
          >
            <input
              v-model="checkedGroup"
              class="k-input"
              type="radio"
              :value="i"
            >
            {{ option.label }}
            <div class="control-help">{{ option.description }}</div>
          </label>
        </div>
      </div>
    </div>

    <div
      v-for="(option, i) in schema.fields"
      :key="i"
      class="option-group"
    >
      <!-- Selected Field -->
      <div
        v-show="option.fields && checkedGroup === i"
        class="option-field"
      >
        <div class="option-field-container">
          <vue-form-generator
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

<script>
import abstractField from './abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  data() {
    return {
      checkedGroup: null,
      fieldModel: { ...this.model }, // keep local copy of original model
      fieldSchema: [],
    }
  },

  watch: {
    checkedGroup: {
      handler(newVal, oldVal) {
        // First time trigger shouldn't need to update the form model
        if (oldVal === null) {
          this.fieldModel = { ...this.model }

          return
        }

        const newFields = this.schema.fields[newVal].fields
        const oldFields = this.schema.fields[oldVal].fields

        oldFields && oldFields.forEach(field => this.updateModel('', field.model))
        newFields && newFields.forEach(field => this.updateModel(this.fieldModel[field.model], field.model))
      },
    },
  },

  async created() {
    await this.$nextTick()

    // Set checkedGroup based on model
    this.schema.fields.forEach((field, i) => {
      field.fields && field.fields.forEach(subField => {
        if (this.model[subField.model]) {
          this.checkedGroup = i
          this.fieldSchema.push(subField.model)
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
  }
}
</style>
