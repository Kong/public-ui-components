<template>
  <div
    :id="getFieldID(schema)"
    class="object-advanced-wrapper"
    :class="schema.fieldClasses"
  >
    <div
      v-for="(item, index) in value"
      :key="index"
      :data-testid="`field-object-key-${index}`"
    >
      <div>
        <div class="item-wrapper">
          <div class="index-wrapper">
            <strong>{{ index }}</strong>
            <div>
              <KButton
                appearance="tertiary"
                class="delete"
                icon
                type="button"
                @click="removeElement(index)"
              >
                <TrashIcon />
              </KButton>
            </div>
          </div>
          <hr class="divider">
          <div v-if="subSchema">
            <VueFormGenerator
              :model="transformedModel[index]"
              :options="{ helpAsHtml: true }"
              :schema="subSchema"
              @model-updated="updateModel"
            />
          </div>
          <div v-else>
            <input
              v-model="value[index]"
              class="form-control"
              :placeholder="schema.fields && schema.fields[0].schema.placeholder"
              :type="valueInputType"
              @input="updateModel(value[index], model[schema.model])"
            >
            <p
              v-if="schema.fields && schema.fields[0].schema.hint"
              class="hint"
            >
              {{ schema.fields[0].schema.hint }}
            </p>

            <!-- autofill -->
            <component
              :is="autofillSlot"
              :schema="(schema.fields && schema.fields[0].schema) || schema.values"
              :update="(val) => value[index] = val"
              :value="value[index]"
            />
          </div>
          <hr class="wide-divider">
        </div>
      </div>
    </div>
    <div
      class="input-wrapper"
      :class="{ 'indent': hasObjectKeys }"
    >
      <div class="input-item">
        <input
          v-model="newKeyName"
          class="form-control"
          data-testid="keyname-input"
          :placeholder="schema.placeholder"
          type="text"
        >
        <KButton
          appearance="tertiary"
          data-testid="add-key"
          :disabled="!newKeyName"
          @click="addKey"
        >
          + Add {{ schema.buttonLabel || schema.label }}
        </KButton>
      </div>
      <p
        v-if="schema.hintText"
        class="hint"
      >
        {{ schema.hintText }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { TrashIcon } from '@kong/icons'
import VueFormGenerator from '../FormGenerator.vue'
</script>

<script>
import { AUTOFILL_SLOT } from '../../const'
import abstractField from './abstractField'

export default {
  mixins: [abstractField],
  inject: {
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },
  emits: ['model-updated'],
  expose: ['validate', 'clearValidationErrors', 'schema'],
  data() {
    return {
      newKeyName: '',
    }
  },
  computed: {
    subSchema() {
      return this.schema.schema && this.schema.schema.fields[0].schema
    },
    subFields() {
      return !this.subSchema && this.schema.fields
    },
    hasObjectKeys() {
      return this.value && Object.keys(this.value).length > 0
    },
    transformedModel() {
      // treat 'array' typed subschema specially
      if (this.subSchema && this.subSchema.fields.length >= 1 && this.subSchema.fields[0].type === 'array') {
        return new Proxy(this.model[this.schema.model], {
          get: (target, key) => ({ [this.schema.model]: target[key] }),
          set: (target, key, value) => (target[key] = value[this.schema.model]),
        })
      }

      return this.model[this.schema.model]
    },
    valueInputType() {
      return ['number', 'integer'].includes(this.schema.values?.type) ? 'number' : 'text'
    },
  },
  mounted() {
    if (!this.value) this.value = {}
    let fields = []

    if (this.subSchema) {
      fields = this.subSchema.fields
    } else if (this.subFields) {
      fields = this.schema.fields[0].schema
    }

    this.value = this.transformMapModelValuesToObject(this.model, fields, this.schema.model)
  },
  methods: {
    removeElement(index) {
      const value = this.value

      delete value[index]
      this.value = { ...value }
    },

    /**
     * This function takes schema fields of type 'map', and prepares the model for
     * dynamic key/value pairs that need to be transformed into objects.
     *
     * @param {Object} model - VFG form model
     * @param {Array} fields - sub fields to lookup. empty array means no subschema
     * @param {String} field - field name e.g. config-limits-consumer1-minutes
     * @returns {Object}
     * e.g. config-limits-consumer1-seconds: 1
     *      config-limits-consumer1-minutes: 2
     *      config-limits-consumer2-seconds: 10
     *      config-limits-consumer2-hours: 11
     *
     *      would become:
     *
     *      config-limits: {
     *        consumer1: { seconds: 1, minutes: 2 },
     *        consumer2: { seconds: 1, minutes: 2 }
     *      }
     */
    transformMapModelValuesToObject(model, fields, field) {
      let vals = {}
      try {
        vals = JSON.parse(JSON.stringify(model ?? {}))[field] ?? {}
      } catch {
        // no-op
      }

      Object.keys(model).map(config => {
        const keyStartIndex = config.indexOf(field + '-')
        if (keyStartIndex > -1 && Array.isArray(fields)) {
          if (fields.length > 0) {
            const parts = config.split('-')
            const item = parts.filter(p => fields.find(f => f.model === p))
            const parsedConfig = config.split(`-${item}`)[0].split(`${field}-`)[1]
            if (item.length) {
              vals[parsedConfig] = {
                ...vals[parsedConfig],
                [item]: model[config],
              }
            } else {
              vals[config.substring(keyStartIndex + `${field}-`.length)] = model[config]
            }
          } else {
            vals[config.substring(`${field}-`.length)] = model[config]
          }
        } else {
          const parts = config.split('-')
          const item = parts.filter(p => p === this.schema.model)
          const parsedConfig = config.split(`-${item}`)[0].split(`${field}-`)[1]

          if (parsedConfig) {
            vals[parsedConfig] = model[config]
          }
        }
        return config
      })

      return vals
    },

    addKey() {
      const valueIsArray = this.subSchema &&
        Array.isArray(this.subSchema.fields) &&
        this.subSchema.fields.length === 1 &&
        this.subSchema.fields[0].type === 'array'
      const defaultValue = this.schema.values?.default ?? (this.valueInputType === 'number' ? 0 : '')
      const initialValue = this.subSchema
        ? (valueIsArray ? [''] : {})
        : defaultValue

      this.value[this.newKeyName] = initialValue
      this.newKeyName = ''
    },

    updateModel(_, schema) {
      this.$emit('model-updated', this.model[this.schema.model], schema)
    },
  },
}
</script>

<style lang="scss" scoped>
.object-advanced-wrapper {
  width: 100%;
}

.item-wrapper {
  margin-left: 28px;
}

.index-wrapper {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.divider {
  margin-bottom: 8px;
  margin-top: 8px;
}

.wide-divider {
  margin-bottom: 16px;
  margin-top: 16px;
}

.input-wrapper {
  margin-right: 16px;
  margin-top: 16px;

  .indent {
    margin-left: 28px;
  }
}

.input-item {
  display: flex;

  .form-control {
    display: flex;
  }

  .k-button {
    display: flex;
    margin-left: 20px;
    margin-right: 20px;
  }
}
</style>
