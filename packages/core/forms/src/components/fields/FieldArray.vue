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
      <!-- String Array type: render comma-separated input field (check first to take priority) -->
      <div
        v-if="isStringArrayItems()"
        class="string-array-item"
      >
        <FieldStringArray
          :form-options="formOptions"
          :model="value"
          :schema="generateStringArraySchema(index)"
          @model-updated="(val) => handleStringArrayUpdate(val, index)"
        />
        <KButton
          appearance="tertiary"
          class="string-array-remove-btn"
          icon
          @click="removeElement(index)"
        >
          <TrashIcon decorative />
        </KButton>
      </div>

      <component
        :is="schema.itemContainerComponent"
        v-else-if="schema.items && schema.itemContainerComponent"
        :index="index"
        :model="item"
        :schema="generateSchema(value, schema.items, index)"
        @remove-item="removeElement(index)"
      >
        <component
          :is="getFieldComponent(schema.items)"
          :form-options="formOptions"
          :model="item"
          :schema="generateSchema(value, schema.items, index)"
          @model-updated="modelUpdated"
        />
      </component>

      <span v-else-if="schema.items">
        <component
          :is="getFieldComponent(schema.items)"
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
          autosize
          :character-limit="schema.inputAttributes.max"
          :class="schema.fieldClasses"
          :maxlength="schema.max"
          :minlength="schema.min"
          :name="schema.inputName"
          :placeholder="schema.placeholder"
          :readonly="schema.readonly"
          :required="schema.required"
          resizable
          :rows="schema.rows || 3"
        />

        <KInput
          v-else-if="!schema.inputAttributes || !schema.inputAttributes.type || schema.inputAttributes.type === 'text' || schema.inputAttributes.type === 'number'"
          :aria-labelledby="getLabelId(schema)"
          v-bind="schema.inputAttributes"
          :model-value="value[index]"
          :type="schema.inputAttributes && schema.inputAttributes.type || 'text'"
          @input="(val) => { handleInput(val, index) }"
        />

        <input
          v-else
          v-model="value[index]"
          :aria-labelledby="getLabelId(schema)"
          v-bind="schema.inputAttributes"
          :type="schema.inputAttributes?.type || 'text'"
        >

        <template #after>
          <!-- autofill -->
          <component
            :is="autofillSlot"
            :schema="schema"
            :update="(val) => value[index] = val"
            :value="value[index]"
          />
        </template>
      </component>

      <template v-else>
        <input
          v-bind="schema.inputAttributes"
          v-model="value[index]"
          :aria-labelledby="getLabelId(schema)"
          type="text"
        >

        <!-- autofill -->
        <component
          :is="autofillSlot"
          :schema="schema"
          :update="(val) => value[index] = val"
          :value="value[index]"
        />
      </template>
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
import { TrashIcon } from '@kong/icons'
import isNumber from 'lodash-es/isNumber'
import { AUTOFILL_SLOT } from '../../const'
import FieldArrayCardContainer from './FieldArrayCardContainer.vue'
import FieldArrayItem from './FieldArrayItem.vue'
import FieldArrayMultiItem from './FieldArrayMultiItem.vue'
import FieldAutoSuggest from './FieldAutoSuggest.vue'
import FieldAutoSuggestLegacy from './FieldAutoSuggestLegacy.vue'
import FieldInput from './FieldInput.vue'
import FieldMetric from './FieldMetric.vue'
import FieldObject from './FieldObject.vue'
import FieldObjectAdvanced from './FieldObjectAdvanced.vue'
import FieldRadio from './FieldRadio.vue'
import FieldSelect from './FieldSelect.vue'
import FieldStringArray from './FieldStringArray.vue'
import abstractField from './abstractField'

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
    FieldAutoSuggestLegacy,
    FieldRadio,
    FieldArrayCardContainer,
    FieldInput,
    FieldStringArray,
    TrashIcon,
  },
  mixins: [abstractField],
  inject: {
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },
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
  emits: ['refreshModel'],
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
    getFieldComponent(fieldSchema) {
      if (fieldSchema.component) {
        return fieldSchema.component
      }

      return 'field-' + fieldSchema.type
    },
    modelUpdated() {
      // Ideally the event handler should be:
      // `modelUpdated(model, schema) { this.$emit('modelUpdated', model, schema) }`
      // but currently `schema` is the plain key of the field:
      // when the field is nested, `schema` does not contain any info about its parent field,
      // so in the consuming components, we cannot know which field is being updated.
      // For example, if each element of the array is an object with a `name` field,
      // then if the user updates the `name` field, the `schema` will be `name` here,
      // so the consuming component will think the root `name` field is updated,
      // which is the name of the plugin and should not be updated.
      this.$emit('refreshModel')
    },
    handleInput(val, index) {
      let formattedVal = val
      if (this.schema?.inputAttributes?.type === 'number') {
        if (isNumber(parseFloat(val))) {
          formattedVal = parseFloat(val)
        }
      }
      this.value = this.value.map((item, i) => i === index ? formattedVal : item)
    },

    isStringArrayItems() {
      const elements = this.schema?.elements
      if (!elements) return false
      // Array of String Arrays: elements.type === 'array' and elements.elements.type === 'string'
      return elements.type === 'array' &&
        elements.elements?.type === 'string'
    },

    generateStringArraySchema(index) {
      return {
        model: String(index),
        id: `${this.schema.id || this.schema.model}-${index}`,
        placeholder: this.schema.placeholder,
        help: this.schema.help,
        fieldClasses: this.schema.inputAttributes?.class,
        get: () => this.value[index],
      }
    },

    handleStringArrayUpdate(val, index) {
      this.value = this.value.map((item, i) => i === index ? val : item)
      this.$emit('refreshModel')
    },
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

.string-array-item {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-70;

  .field-string-array {
    flex: 1;
  }

  .string-array-remove-btn {
    flex-shrink: 0;
    margin-top: $kui-space-20;
  }
}
</style>
