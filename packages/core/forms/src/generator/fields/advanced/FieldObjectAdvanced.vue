<template>
  <div
    :id="getFieldID(schema)"
    class="w-100"
    :class="schema.fieldClasses"
  >
    <div
      v-for="(item, index) in value"
      :key="index"
      :data-testid="`field-object-key-${index}`"
    >
      <div>
        <div class="ml-7">
          <div class="justify-content-between align-items-center d-flex mt-1">
            <strong>{{ index }}</strong>
            <div>
              <KButton
                appearance="btn-link"
                class="delete"
                type="button"
                @click="removeElement(index)"
              >
                <KIcon
                  icon="trash"
                  size="18"
                />
              </KButton>
            </div>
          </div>
          <hr class="my-2">
          <div v-if="subSchema">
            <vue-form-generator
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
              type="text"
              @input="updateModel(value[index], model[schema.model])"
            >
            <p
              v-if="schema.fields && schema.fields[0].schema.hint"
              class="hint"
            >
              {{ schema.fields[0].schema.hint }}
            </p>
          </div>
          <hr class="my-4">
        </div>
      </div>
    </div>
    <div
      class="mr-4 mt-4"
      :class="{'ml-7': hasObjectKeys}"
    >
      <div class="d-flex">
        <input
          v-model="newKeyName"
          class="form-control d-flex"
          data-testid="keyname-input"
          :placeholder="schema.placeholder"
          type="text"
        >
        <KButton
          appearance="btn-link"
          class="d-flex mx-5"
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

<script>
import abstractField from '../abstractField'
export default {
  mixins: [abstractField],
  emits: ['model-updated'],
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
      const vals = {}

      Object.keys(model).map(config => {
        if (config.indexOf(field + '-') > -1 && Array.isArray(fields)) {
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
              vals[parts.slice(2).join('-')] = model[config]
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
      const type = this.subSchema ? valueIsArray ? [''] : {} : ''

      this.value[this.newKeyName] = type
      this.newKeyName = ''
    },

    updateModel(_, schema) {
      this.$emit('model-updated', this.model[this.schema.model], schema)
    },
  },
}
</script>
<style lang="scss">
.vue-form-generator .field-wrap {
  .k-button {
    &,
    &:hover {
      background: none;
      border: none;
    }
  }
}
</style>
