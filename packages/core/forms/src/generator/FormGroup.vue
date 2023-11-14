<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    class="form-group"
    :class="getFieldRowClasses(field)"
  >
    <label
      v-if="fieldTypeHasLabel(field)"
      class="form-group-label"
      :class="field.labelClasses"
      :for="getFieldID(field)"
    >
      <div class="icon-wrapper">
        <span v-html="formattedLabel(field.label)" />
        <KTooltip
          v-if="field.help"
          max-width="300"
          placement="top"
          :position-fixed="true"
        >
          <div
            class="help"
            role="button"
            tabindex="0"
          >
            <i class="icon" />
          </div>
          <template #content>
            <div
              v-if="options.helpAsHtml"
              v-html="field.help"
            />
            <template v-else>
              {{ field.help }}
            </template>
          </template>
        </KTooltip>
      </div>

      <div
        v-if="field.link"
        class="link-wrapper"
      >
        <KExternalLink :href="field.link">
          <span class="section-header">More info</span>
        </KExternalLink>
      </div>
    </label>

    <div class="field-wrap">
      <component
        v-bind="$attrs"
        :is="getFieldType(field)"
        ref="child"
        :disabled="fieldDisabled(field) || null"
        :form-options="options"
        :model="model"
        :schema="field"
        :vfg="vfg"
        @model-updated="onModelUpdated"
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
      v-if="field.hint"
      class="hint"
      v-html="fieldHint(field)"
    />

    <div
      v-if="fieldErrors(field).length > 0"
      class="errors help-block"
    >
      <span
        v-for="(error, index) in fieldErrors(field)"
        :key="index"
        v-html="error"
      />
    </div>
  </div>
</template>

<script>
import { get as objGet, isNil, isFunction } from 'lodash'
import { slugifyFormID } from './utils/schema'
import formMixin from './FormMixin.vue'
import * as fieldComponents from './utils/fieldsLoader'
import { ref } from 'vue'

export default {
  name: 'FormGroup',
  components: fieldComponents,
  mixins: [formMixin],
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
  emits: ['validated', 'modelUpdated'],
  data() {
    return {
      child: ref(),
    }
  },
  methods: {
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
    // Get type of field 'field-xxx'. It'll be the name of HTML element
    getFieldType(fieldSchema) {
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

  &.required {
    > label:after {
      color: red;
      content: "*";
      font-size: 14px;
      font-weight: normal;
      // position: absolute;
      padding-left: 3px;
    }
  }

  &.disabled {
    > label {
      color: #666;
      font-style: italic;
    }
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
  justify-content: space-between;
}

.icon-wrapper {
  display: flex!important;
}

.link-wrapper {
  margin-left: 4px;
}
</style>
