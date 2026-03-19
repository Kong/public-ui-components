<template>
  <div
    class="form-group"
    :class="getFieldRowClasses(field)"
  >
    <KLabel
      v-if="fieldTypeHasLabel(field)"
      :aria-describedby="field.help ? getTooltipId(field) : undefined"
      :class="[field.labelClasses, 'form-group-label']"
      :for="getFieldID(field)"
      :info="!options.helpAsHtml && field.help ? field.help : undefined"
      :tooltip-attributes="field.help ? {
        maxWidth: '300',
        placement: 'top',
        tooltipId: getTooltipId(field),
      } : undefined"
    >
      <template
        v-if="options.helpAsHtml && field.help"
        #tooltip
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="sanitize(field.help)" />
      </template>
      <div class="icon-wrapper">
        <span>{{ formattedLabel(field.label) }}</span>
      </div>

      <div
        v-if="field.link"
        class="link-wrapper"
      >
        <KExternalLink :href="field.link">
          <span class="section-header">More info</span>
        </KExternalLink>
      </div>
    </KLabel>

    <div class="field-wrap">
      <component
        v-bind="$attrs"
        :is="getFieldComponent(field)"
        ref="child"
        :disabled="fieldDisabled(field) || null"
        :form-options="options"
        :hint="field.hint && field.type === 'input' ? fieldHint(field) : undefined"
        :model="model"
        :schema="schema"
        :vfg="vfg"
        @model-updated="onModelUpdated"
        @refresh-model="onRefreshModel"
        @validated="onFieldValidated"
      />
      <div
        v-if="buttonVisibility(field)"
        class="buttons"
      >
        <button
          v-for="(btn, index) in field.buttons"
          :key="index"
          :class="btn.classes"
          :type="getButtonType(btn)"
          @click="buttonClickHandler(btn, field, $event)"
          v-text="btn.label"
        />
      </div>
    </div>

    <div
      v-if="field.hint && field.type !== 'input'"
      class="hint"
    >
      {{ fieldHint(field) }}
    </div>

    <div
      v-if="fieldErrors(field).length > 0"
      class="errors help-block"
    >
      <span
        v-for="(error, index) in fieldErrors(field)"
        :key="index"
      >
        {{ error }}
      </span>
    </div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify'
import objGet from 'lodash-es/get'
import isFunction from 'lodash-es/isFunction'
import isNil from 'lodash-es/isNil'
import { slugifyFormID } from '../utils/schema'
import formMixin from './FormMixin.vue'
import * as fieldComponents from '../utils/fieldsLoader'
import { ref } from 'vue'

export default {
  name: 'FormGroup',
  components: fieldComponents,
  mixins: [formMixin],
  inject: {
    'vfg-array-item-index': {
      default: undefined,
    },
  },
  props: {
    vfg: {
      type: Object,
      required: true,
    },
    model: {
      type: Object,
      default: () => undefined,
    },
    options: {
      type: Object,
      default: () => undefined,
    },
    field: {
      type: Object,
      required: true,
    },
    errors: {
      type: Array,
      default() {
        return []
      },
    },
  },
  emits: ['validated', 'modelUpdated', 'refreshModel'],
  data() {
    return {
      child: ref(),
    }
  },
  computed: {
    schema() {
      if (!this.field?.schema || !Array.isArray(this.field.schema.fields)) {
        return this.field
      }

      const index = this['vfg-array-item-index']

      if (typeof index !== 'number' || Number.isNaN(index)) {
        return this.field
      }

      return {
        ...this.field,
        schema: {
          ...this.field.schema,
          fields: this.field.schema.fields.map(field => ({
            ...field,
            ...(field.id ? { id: `${field.id}-${index}` } : undefined),
          })),
        },
      }
    },
  },
  methods: {
    sanitize(str) {
      return DOMPurify.sanitize(str)
    },
    // Should field type have a label?
    fieldTypeHasLabel(field) {
      if (isNil(field.label)) return false

      let relevantType = ''
      if (field.type === 'input') {
        relevantType = field.inputType
      } else {
        relevantType = field.type
      }

      switch (relevantType) {
        case 'button':
        case 'submit':
        case 'reset':
          return false
        default:
          return true
      }
    },
    getFieldID(schema) {
      const idPrefix = objGet(this.options, 'fieldIdPrefix', '')
      return slugifyFormID(schema, idPrefix)
    },
    getTooltipId(schema) {
      return `${this.getFieldID(schema)}-tooltip`
    },
    // Get type of field, it could be the name of a registered component or a Vue component
    // a registered component should be named in 'field-{type}' format
    getFieldComponent(fieldSchema) {
      if (fieldSchema.component) {
        return fieldSchema.component
      }

      return 'field-' + fieldSchema.type
    },
    // Get type of button, default to 'button'
    getButtonType(btn) {
      return objGet(btn, 'type', 'button')
    },
    // Child field executed validation
    onFieldValidated(res, errors, field) {
      this.$emit('validated', res, errors, field)
    },
    buttonVisibility(field) {
      return field.buttons && field.buttons.length > 0
    },
    buttonClickHandler(btn, field, event) {
      return btn.onclick.call(this, this.model, field, event, this)
    },
    // Get current hint.
    fieldHint(field) {
      if (isFunction(field.hint)) return field.hint.call(this, this.model, field, this)

      return field.hint
    },
    fieldErrors(field) {
      return this.errors.filter((e) => e.field.fieldName === field.fieldName).map((item) => item.error)
    },
    onRefreshModel() {
      // This is for updating a deeply nested array element
      // See `modelUpdated` in `FieldArray.vue`
      this.$emit('refreshModel')
    },
    onModelUpdated(newVal, schema) {
      this.$emit('modelUpdated', newVal, schema)
    },
    validate(calledParent) {
      return this.$refs.child.validate(calledParent)
    },
    clearValidationErrors() {
      if (this.$refs.child) {
        return this.$refs.child.clearValidationErrors()
      }
    },
    // Remove `config.*` terminology from the plugin form
    formattedLabel(originalLabel) {
      if (!originalLabel) {
        return ''
      }

      // If the label starts with the config prefix, remove it
      return originalLabel.replace(/^[cC]onfig\./, '')
    },
  },
}
</script>

<style lang="scss">
$errorColor: #f00;

.form-group:not([class*=" col-"]) {
  width: 100%;
}

.form-group {
  display: inline-block;
  margin-bottom: 16px;
  vertical-align: top;

  label {
    font-weight: 400;

    & > :first-child {
      display: inline-block;
    }

    & > div[role="button"] {
      display: inline-block;
    }
  }

  &.featured {
    > label {
      font-weight: bold;
    }
  }

  &.required > label:before {
    background-color: var(--kui-color-background-danger, $kui-color-background-danger);
    border-radius: var(--kui-border-radius-circle, $kui-border-radius-circle);
    content: "";
    height: 6px;
    margin-right: var(--kui-space-40, $kui-space-40);
    width: 6px;
  }

  // hide the required indicator for checkboxes
  // because it may be misleading that the checkbox must be checked
  &.field-checkbox.required > label:before {
    display: none;
  }

  &.error {
    input:not([type="checkbox"]),
    textarea,
    select {
      background-color: rgba($errorColor, 0.15);
      border: 1px solid $errorColor;
    }

    .errors {
      color: $errorColor;
      font-size: 12px;

      span {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiklEQVR4Xt2TMQoCQQxF3xdhu72MpZU3GU/meBFLOztPYrVWsQmEWSaMsIXgK8P8RyYkMjO2sAN+K9gTIAmDAlzoUzE7p4IFytvDCQWJKSStYB2efcAvqZFM0BcstMx5naSDYFzfLhh/4SmRM+6Agw/xIX0tKEDFufeDNRUc4XqLRz3qabVIf3BMHwl6Ktexn3nmAAAAAElFTkSuQmCC");
        background-repeat: no-repeat;
        display: block;
        font-weight: 600;
        margin-top: 3px;
        padding-left: 17px;
        padding-top: 0;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.form-group-label {
  display: flex;

  :deep(.k-tooltip p) {
    margin: 0;
  }
}

.icon-wrapper {
  display: flex !important;
}

.link-wrapper {
  margin-left: 4px;
}
</style>
