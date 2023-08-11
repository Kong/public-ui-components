<template>
  <div
    v-if="schema"
    :id="getFieldID(schema)"
    :class="schema.fieldClasses"
  >
    <div
      v-for="(item, index) in value"
      :key="index"
      :class="schema.fieldItemsClasses"
    >
      <component
        :is="schema.itemContainerComponent"
        v-if="schema.items && schema.itemContainerComponent"
        :model="item"
        :schema="generateSchema(value, schema.items, index)"
        @remove-item="removeElement(index)"
      >
        <component
          :is="getFieldType(schema.items)"
          :form-options="formOptions"
          :model="item"
          :schema="generateSchema(value, schema.items, index)"
          @model-updated="modelUpdated"
        />
      </component>
      <span v-else-if="schema.items">
        <component
          :is="getFieldType(schema.items)"
          :form-options="formOptions"
          :model="item"
          :schema="generateSchema(value, schema.items, index)"
          @model-updated="modelUpdated"
        />
      </span>
      <component
        :is="schema.itemContainerComponent"
        v-else-if="schema.itemContainerComponent"
        :data-testid="`${getFieldID(schema)}-item-${index}`"
        :model="item"
        :schema="generateSchema(value, schema.items, index)"
        @remove-item="removeElement(index)"
      >
        <FieldTextArea
          v-if=" schema.inputAttributes?.type === 'textarea'"
          class="k-input"
          :form-options="formOptions"
          :model="item"
          :schema="generateSchema(value, schema.items, index)"
          @model-updated="modelUpdated"
        />

        <input
          v-else
          v-model="value[index]"
          v-bind="schema.inputAttributes"
          :type="schema.inputAttributes?.type || 'text'"
        >
        <input
          v-if="schema.showRemoveButton"
          v-bind="schema.removeElementButtonAttributes"
          type="button"
          :value="schema.removeElementButtonLabel || removeElementButtonLabel"
          @click="removeElement(index)"
        >
      </component>
      <input
        v-else
        v-bind="schema.inputAttributes"
        v-model="value[index]"
        type="text"
      >
      <input
        v-if="schema.showRemoveButton"
        v-bind="schema.removeElementButtonAttributes"
        type="button"
        :value="schema.removeElementButtonLabel || removeElementButtonLabel"
        @click="removeElement(index)"
      >
    </div>
    <KButton
      appearance="btn-link"
      :class="schema.newElementButtonLabelClasses"
      :data-testid="`add-${getFieldID(schema)}`"
      type="button"
      @click="newElement"
    >
      {{ schema.newElementButtonLabel || newElementButtonLabel }}
    </KButton>
  </div>
</template>

<script>
import abstractField from '../abstractField'
import FieldArrayItem from './FieldArrayItem.vue'
import FieldArrayMultiItem from './FieldArrayMultiItem.vue'
import FieldMetric from './FieldMetric.vue'
import FieldObject from './FieldObject.vue'
import FieldObjectAdvanced from './FieldObjectAdvanced.vue'
import FieldAutoSuggest from './FieldAutoSuggest.vue'
import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import FieldRadio from './FieldRadio.vue'
import FieldSelect from '../core/fieldSelect.vue'
import FieldTextArea from '../core/fieldTextArea.vue'

export default {
  name: 'FieldArray',
  components: { FieldArrayItem, FieldArrayMultiItem, FieldSelect, FieldMetric, FieldObject, FieldObjectAdvanced, FieldAutoSuggest, FieldRadio, FieldArrayCardContainer, FieldTextArea },
  mixins: [abstractField],
  props: {
    newElementButtonLabel: {
      type: String,
      default: 'New Item',
    },
    removeElementButtonLabel: {
      type: String,
      default: 'x',
    },
  },
  methods: {
    generateSchema(rootValue, schema, index) {
      // Instead of using schema directly, we make a copy to avoid schema object mutation side effects

      let copy
      if (schema) {
        copy = JSON.parse(JSON.stringify(schema))

        copy.schema.fields.map(field => {
          field.id = `${field.id || field.model}-${index}`
          return field
        })
      }

      return {
        ...copy,
        set(model, value) {
          rootValue[index] = value
        },
        get() {
          return rootValue[index]
        },
      }
    },

    newElement() {
      let value = this.value
      let itemsDefaultValue

      if (!value || !value.push) value = []

      if (this.schema.items && this.schema.items.default) {
        if (typeof this.schema.items.default === 'function') {
          itemsDefaultValue = this.schema.items.default()
        } else {
          itemsDefaultValue = this.schema.items.default
        }
      }

      value.push(itemsDefaultValue)

      this.value = [...value]
    },
    removeElement(index) {
      this.value.splice(index, 1)
    },
    getFieldType(fieldSchema) {
      return 'field-' + fieldSchema.type
    },
    modelUpdated() {},
  },
}
</script>
