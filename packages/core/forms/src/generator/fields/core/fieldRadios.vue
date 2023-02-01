<template lang="pug">
.radio-list(:disabled="disabled || null", v-attributes="'wrapper'")
    label(v-for="item in items", :class="getItemCssClasses(item)", v-attributes="'label'")
      input(:id="getFieldID(schema, true)", type="radio", :disabled="isItemDisabled(item) || null", :name="id", @click="onSelection(item)", :value="getItemValue(item)", :checked="isItemChecked(item) || null", :class="schema.fieldClasses", :required="schema.required", v-attributes="'input'")
      | {{ getItemName(item) }}

</template>

<script>
import { isObject, isFunction, get as objGet } from 'lodash'
import abstractField from '../abstractField'

export default {
  mixins: [abstractField],

  computed: {
    items() {
      const values = this.schema.values
      if (typeof values === 'function') {
        return values.apply(this, [this.model, this.schema])
      } else {
        return values
      }
    },
    id() {
      return this.schema.model
    },
  },

  methods: {
    getItemValue(item) {
      if (isObject(item)) {
        if (typeof this.schema.radiosOptions !== 'undefined' && typeof this.schema.radiosOptions.value !== 'undefined') {
          return item[this.schema.radiosOptions.value]
        } else {
          if (typeof item.value !== 'undefined') {
            return item.value
          } else {
            throw new Error('`value` is not defined. If you want to use another key name, add a `value` property under `radiosOptions` in the schema. https://icebob.gitbooks.io/vueformgenerator/content/fields/radios.html#radios-field-with-object-values')
          }
        }
      } else {
        return item
      }
    },
    getItemName(item) {
      if (isObject(item)) {
        if (typeof this.schema.radiosOptions !== 'undefined' && typeof this.schema.radiosOptions.name !== 'undefined') {
          return item[this.schema.radiosOptions.name]
        } else {
          if (typeof item.name !== 'undefined') {
            return item.name
          } else {
            throw new Error('`name` is not defined. If you want to use another key name, add a `name` property under `radiosOptions` in the schema. https://icebob.gitbooks.io/vueformgenerator/content/fields/radios.html#radios-field-with-object-values')
          }
        }
      } else {
        return item
      }
    },
    getItemCssClasses(item) {
      return {
        'is-checked': this.isItemChecked(item),
        'is-disabled': this.isItemDisabled(item),
      }
    },
    onSelection(item) {
      this.value = this.getItemValue(item)
    },
    isItemChecked(item) {
      const currentValue = this.getItemValue(item)
      return currentValue === this.value
    },
    isItemDisabled(item) {
      if (this.disabled) {
        return true
      }
      const disabled = objGet(item, 'disabled', false)
      if (isFunction(disabled)) {
        return disabled(this.model)
      }
      return disabled
    },
  },
}
</script>

<style lang="scss">
.vue-form-generator .field-radios {
  .radio-list {
    label {
      display: block;
      input[type="radio"] {
        margin-right: 5px;
      }
    }
  }
}
</style>
