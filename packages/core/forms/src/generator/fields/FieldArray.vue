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
        <KTextArea
          v-if="schema.inputAttributes && schema.inputAttributes.type === 'textarea'"
          v-bind="schema.inputAttributes"
          :id="getFieldID(schema)"
          v-model="value[index]"
          :aria-labelledby="getLabelId(schema)"
          :class="schema.fieldClasses"
          :maxlength="schema.max"
          :minlength="schema.min"
          :name="schema.inputName"
          :placeholder="schema.placeholder"
          :readonly="schema.readonly"
          :required="schema.required"
          :rows="schema.rows || 2"
        />

        <KInput
          v-else-if="!schema.inputAttributes || !schema.inputAttributes.type || schema.inputAttributes.type === 'text'"
          v-model="value[index]"
          :aria-labelledby="getLabelId(schema)"
          v-bind="schema.inputAttributes"
          :type="schema.inputAttributes && schema.inputAttributes.type || 'text'"
        />

        <input
          v-else
          v-model="value[index]"
          :aria-labelledby="getLabelId(schema)"
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
        :aria-labelledby="getLabelId(schema)"
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
      appearance="tertiary"
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
import abstractField from './abstractField'
import FieldInput from './FieldInput.vue'
import FieldSelect from './FieldSelect.vue'
import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import FieldArrayItem from './FieldArrayItem.vue'
import FieldArrayMultiItem from './FieldArrayMultiItem.vue'
import FieldAutoSuggest from './FieldAutoSuggest.vue'
import FieldMetric from './FieldMetric.vue'
import FieldObject from './FieldObject.vue'
import FieldObjectAdvanced from './FieldObjectAdvanced.vue'
import FieldRadio from './FieldRadio.vue'

export default {
  name: 'FieldArray',
  components: {
    FieldArrayItem,
    FieldArrayMultiItem,
    FieldSelect,
    FieldMetric,
    FieldObject,
    FieldObjectAdvanced,
    FieldAutoSuggest,
    FieldRadio,
    FieldArrayCardContainer,
    FieldInput,
  },
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

        copy.schema?.fields?.map?.(field => {
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
      this.value = this.value.filter((_, i) => i !== index)
    },
    getFieldType(fieldSchema) {
      return 'field-' + fieldSchema.type
    },
    modelUpdated() {},
  },
}
</script>

<style scoped lang="scss">
.field-array-item {
  display: flex;
  justify-content: space-between;

  input.form-control {
    width: 200px;
  }
}
</style>
