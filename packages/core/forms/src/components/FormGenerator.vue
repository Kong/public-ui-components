<template>
  <div
    v-if="schema != null"
    class="vue-form-generator"
  >
    <component
      :is="tag"
      v-if="schema.fields"
    >
      <template
        v-for="field in fields"
        :key="field.model"
      >
        <form-redis
          v-if="field.model === 'redis_partial' && enableRedisPartial"
          :errors="errors"
          :field="field"
          :model="model"
          :options="options"
          :tag="tag"
          :vfg="vfg"
          @model-updated="onModelUpdated"
          @partial-toggled="onPartialToggled"
          @show-new-partial-modal="$emit('showNewPartialModal')"
          @validated="onFieldValidated"
        />
        <form-group
          v-else-if="fieldVisible(field)"
          ref="children"
          :errors="errors"
          :field="field"
          :model="model"
          :options="options"
          :vfg="vfg"
          @model-updated="onModelUpdated"
          @refresh-model="onRefreshModel"
          @validated="onFieldValidated"
        />
      </template>
    </component>

    <template
      v-for="(group, i) in groups"
      :key="`group-${i}`"
    >
      <KCollapse
        v-if="group.collapsible !== undefined && group.collapsible !== false"
        class="root-level-collapse"
        :model-value="false"
        :title="group.collapsible.title"
      >
        <template
          v-if="group.collapsible.description"
          #visible-content
        >
          {{ group.collapsible.description }}
        </template>

        <slot
          v-if="group.slots?.beforeContent"
          :name="group.slots?.beforeContent"
        />

        <slot
          v-if="group.fields.length === 0 && group.slots?.emptyState"
          :name="group.slots?.emptyState"
        />

        <component
          :is="tag"
          v-else
          :class="getFieldRowClasses(group)"
        >
          <template
            v-for="field in group.fields"
            :key="field.model"
          >
            <form-group
              v-if="fieldVisible(field)"
              ref="children"
              :errors="errors"
              :field="field"
              :model="model"
              :options="options"
              :vfg="vfg"
              @model-updated="onModelUpdated"
              @refresh-model="onRefreshModel"
              @validated="onFieldValidated"
            />
          </template>
        </component>

        <KCollapse
          v-if="group.collapsible !== true && group.collapsible.nestedCollapsible && group.collapsible.nestedCollapsible.fields.length > 0"
          class="nested-collapse"
          :model-value="collapseStates[`group-${i}-nested`] ?? true"
          trigger-alignment="leading"
          :trigger-label="(collapseStates[`group-${i}-nested`] ?? true) ? group.collapsible.nestedCollapsible.triggerLabel.expand : group.collapsible.nestedCollapsible.triggerLabel.collapse"
          @update:model-value="(value) => collapseStates[`group-${i}-nested`] = value"
        >
          <component
            :is="tag"
            :class="getFieldRowClasses(group)"
          >
            <template
              v-for="field in group.collapsible.nestedCollapsible.fields"
              :key="field.model"
            >
              <form-redis
                v-if="field.model === 'redis_partial' && enableRedisPartial"
                :errors="errors"
                :field="field"
                :model="model"
                :options="options"
                :tag="tag"
                :vfg="vfg"
                @model-updated="onModelUpdated"
                @partial-toggled="onPartialToggled"
                @show-new-partial-modal="$emit('showNewPartialModal')"
                @validated="onFieldValidated"
              />
              <form-group
                v-else-if="fieldVisible(field)"
                ref="children"
                :errors="errors"
                :field="field"
                :model="model"
                :options="options"
                :vfg="vfg"
                @model-updated="onModelUpdated"
                @refresh-model="onRefreshModel"
                @validated="onFieldValidated"
              />
            </template>
          </component>
        </KCollapse>
      </KCollapse>

      <component
        :is="tag"
        v-else
        :class="getFieldRowClasses(group)"
      >
        <legend v-if="group.legend">
          {{ group.legend }}
        </legend>
        <template
          v-for="field in group.fields"
          :key="field.model"
        >
          <form-group
            v-if="fieldVisible(field)"
            ref="children"
            :errors="errors"
            :field="field"
            :model="model"
            :options="options"
            :vfg="vfg"
            @model-updated="onModelUpdated"
            @refresh-model="onRefreshModel"
            @validated="onFieldValidated"
          />
        </template>
      </component>
    </template>
  </div>
</template>

<script>
/**
 * @typedef {import('../types/form-generator').FGCollapsibleOptions} FGCollapsibleOptions
 * @typedef {import('../types/form-generator').FGSlots} FGSlots
 *
 * @typedef PartialGroup
 * @prop {FGCollapsibleOptions=} collapsible
 * @prop {FGSlots=} slots
 *
 * @typedef {Record<string, any> & PartialGroup} Group
 */

import forEach from 'lodash-es/forEach'
import objGet from 'lodash-es/get'
import isFunction from 'lodash-es/isFunction'
import isNil from 'lodash-es/isNil'
import { ref } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../const'
import formGroup from './FormGroup.vue'
import formRedis from './FormRedis.vue'
import formMixin from './FormMixin.vue'

export default {
  name: 'FormGenerator',
  components: { formGroup, formRedis },
  mixins: [formMixin],

  inject: {
    // Inject AUTOFILL_SLOT for provide()
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },

  provide() {
    return {
      // Provide AUTOFILL_SLOT only if it is not already provided
      ...!this.autofillSlot && {
        [AUTOFILL_SLOT]: this.$slots?.[AUTOFILL_SLOT_NAME],
      },
    }
  },

  props: {
    schema: {
      type: Object,
      default: () => undefined,
    },

    model: {
      type: Object,
      default: () => undefined,
    },

    options: {
      type: Object,
      default() {
        return {
          validateAfterLoad: false,
          validateAfterChanged: false,
          child: ref([]),
          fieldIdPrefix: '',
          validateAsync: false,
          validationErrorClass: 'error',
          validationSuccessClass: '',
          helpAsHtml: false,
        }
      },
    },

    multiple: {
      type: Boolean,
      default: false,
    },

    isNewModel: {
      type: Boolean,
      default: false,
    },

    tag: {
      type: String,
      default: 'fieldset',
      validator: function(value) {
        return value.length > 0
      },
    },

    enableRedisPartial: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['validated', 'modelUpdated', 'refreshModel', 'partialToggled', 'showNewPartialModal'],

  data() {
    return {
      vfg: this,
      errors: [], // Validation errors,
      children: ref([]),
      collapseStates: {},
    }
  },

  computed: {
    fields() {
      const res = []
      if (this.schema && this.schema.fields) {
        forEach(this.schema.fields, field => {
          if (!this.multiple || field.multi === true) res.push(field)
        })
      }

      return res
    },
    groups() {
      /** @type {Group[]} */
      const res = []
      if (this.schema && this.schema.groups) {
        forEach(this.schema.groups.slice(0), group => {
          res.push(group)
        })
      }

      return res
    },
  },

  watch: {
    // new model loaded
    model: {
      deep: true,
      handler(newModel, oldModel) {
        if (oldModel === newModel) {
        // model property changed, skip
          return
        }

        if (newModel != null) {
          this.$nextTick(() => {
            // Model changed!
            if (this.options.validateAfterLoad === true && this.isNewModel !== true) {
              this.validate()
            } else {
              this.clearValidationErrors()
            }
          })
        }
      },
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.model) {
        // First load, running validation if necessary
        if (this.options.validateAfterLoad === true && this.isNewModel !== true) {
          this.validate()
        } else {
          this.clearValidationErrors()
        }
      }
    })
  },

  methods: {
    // Get visible prop of field
    fieldVisible(field) {
      if (isFunction(field.visible)) return field.visible.call(this, this.model, field, this)

      if (isNil(field.visible)) return true

      return field.visible
    },

    // Child field executed validation
    onFieldValidated(res, errors, field) {
      // Remove old errors for this field
      this.errors = this.errors.filter(e => e.field.fieldName !== field.schema.fieldName)

      if (!res && errors && errors.length > 0) {
        // Add errors with this field
        forEach(errors, err => {
          this.errors.push({
            field: field.schema,
            error: err,
          })
        })
      }

      const isValid = this.errors.length === 0
      this.$emit('validated', isValid, this.errors, this)
    },

    onRefreshModel() {
      // This is for updating a deeply nested array element
      // See `modelUpdated` in `FieldArray.vue`
      this.$emit('refreshModel')
    },

    onModelUpdated(newVal, schema) {
      this.$emit('modelUpdated', newVal, schema)
    },

    onPartialToggled(field, model) {
      this.$emit('partialToggled', field, model)
    },

    // Validating the model properties
    validate(isAsync = null) {
      if (isAsync === null) {
        isAsync = objGet(this.options, 'validateAsync', false)
      }
      this.clearValidationErrors()

      const fields = []
      const results = []

      forEach(this.$refs.children, child => {
        if (isFunction(child.validate)) {
          fields.push(child.$refs.child) // keep track of validated children
          results.push(child.$refs.child.validate(true))
        }
      })

      const handleErrors = errors => {
        const formErrors = []
        forEach(errors, (err, i) => {
          if (Array.isArray(err) && err.length > 0) {
            forEach(err, error => {
              formErrors.push({
                field: fields[i].schema,
                error,
              })
            })
          }
        })
        this.errors = formErrors
        const isValid = formErrors.length === 0
        this.$emit('validated', isValid, formErrors, this)
        return isAsync ? formErrors : isValid
      }

      if (!isAsync) {
        return handleErrors(results)
      }

      return Promise.all(results).then(handleErrors)
    },

    // Clear validation errors
    clearValidationErrors() {
      this.errors.splice(0)

      forEach(this.$refs.children, child => {
        child.clearValidationErrors()
      })
    },
  },
}
</script>

<style lang="scss">
.vue-form-generator {
  * {
    box-sizing: border-box;
  }

  .hidden-field {
    display: none;
  }

  .form-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 32px;
    }

    &.hide-label > label {
      display: none;
    }

    label {
      font-weight: 500;
    }
  }

  .field-advanced {
    margin-bottom: 8px;
    margin-top: -8px;

    .form-group:last-child {
      margin-bottom: 16px;
    }
  }

  .k-input[type="text"] {
    width: 100%;
  }

  :not(.k-input):not(.k-textarea).form-control {
    background-color: #fff;
    background-image: none;
    border: none;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px #e7e7ec;
    box-sizing: border-box;
    color: $kui-color-text-neutral-strong;
    display: block;
    font-size: $kui-font-size-40;
    line-height: $kui-line-height-40;
    padding: $kui-space-40 $kui-space-60;
    transition: color .1s ease, box-shadow .1s ease, border-color ease-in-out 0.15s;
    width: 100%;

    &:hover {
      box-shadow: inset 0 0 0 1px #bdd3f9;
    }

    &:focus {
      box-shadow: inset 0 0 0 1px #3972d5;
      outline: none;
    }

    &:not([class*=" col-"]) {
      width: 100%;
    }
  } // .form-control

  div.help {
    margin-left: 4px;
    position: relative;

    .icon {
      background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA+UlEQVQ4ja3TS0oDQRAG4C8+lq7ceICICoLGK7iXuNBbeAMJuPVOIm7cqmDiIncIggg+cMZFaqCnZyYKWtB0df31V1VXdfNH6S2wD9CP8xT3KH8T9BiTcE7XBMOfyBcogvCFO9ziLWwFRosyV+QxthNsA9dJkEYlvazsQdi3sBv6Ol6TBLX+HWT3fcQZ3vGM5fBLk+ynAU41m1biCXvhs4OPBDuBpa6GxF0P8YAj3GA1d1qJfdoS4DOIcIm1DK9x8iaWeDF/SP3QU6zRROpjLDFLsFlibx1jJaMkSIGrWKntvItcyTBKzCcybsvc9ZmYz3kz9Ooz/b98A8yvW13B3ch6AAAAAElFTkSuQmCC");
      background-position: center center;
      background-repeat: no-repeat;
      display: inline-block;
      height: 14px;
      width: 16px;
    } // .icon
  } // div.help

  .field-wrap {
    display: flex;

    .buttons {
      margin-left: 4px;
      white-space: nowrap;
    }

    input[type="submit"] {
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      color: #333;
      cursor: pointer;
      // Default Bootstrap button style
      display: inline-block;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.42857143;
      margin: 0px;
      padding: 6px 12px;
      text-align: center;
      touch-action: manipulation;
      user-select: none;
      vertical-align: middle;
      white-space: nowrap;

      &:not(:last-child) {
        margin-right: 4px;
      }

      &:hover {
        background-color: #e6e6e6;
        color: #333;
      }

      &:active {
        background-color: #d4d4d4;
        border-color: #8c8c8c;
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        color: #333;
        outline: 0;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    } // button, input[submit]
  } // .field-wrap

  .hint {
    font-size: 12px;
    font-style: italic;
  } // .hint

  .kong-form-new-element-button-label {
    margin-bottom: $kui-space-80!important;
    margin-top: $kui-space-80!important;
  }
} // fieldset

// stylelint-disable no-duplicate-selectors
.vue-form-generator div.help {
  .icon {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiI+ICA8cGF0aCBmaWxsPSIjMDA4NkU2IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02IDExYy0yLjc2MSAwLTUtMi4yMzktNS01czIuMjM5LTUgNS01IDUgMi4yMzkgNSA1LTIuMjM5IDUtNSA1TTYgMEMyLjY4NiAwIDAgMi42ODYgMCA2czIuNjg2IDYgNiA2IDYtMi42ODYgNi02LTIuNjg2LTYtNi02bTAgM2MtMS4xMDUgMC0yIC44OTUtMiAyaDFjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMSAuNDQ4LTEgMWgxYzEuMTA1IDAgMi0uODk1IDItMnMtLjg5NS0yLTItMnpNNSA5aDJWOEg1djF6Ii8+PC9zdmc+);
    height: 12px;
    width: 12px;
  }
}

.vue-form-generator .field-wrap button.danger:hover,
.vue-form-generator .field-wrap input[type=submit].danger:hover,
.vue-form-generator .field-wrap button.danger:active,
.vue-form-generator .field-wrap input[type=submit].danger:active {
  background-color: $kui-color-background;
  box-shadow: none;
  color: $kui-color-text-inverse;
}

.vue-form-generator .field-wrap button.tertiary:hover,
.vue-form-generator .field-wrap input[type=submit].tertiary:hover,
.vue-form-generator .field-wrap button.tertiary:active,
.vue-form-generator .field-wrap input[type=submit].tertiary:active {
  background-color: $kui-color-background;
  box-shadow: none;
  color: $kui-color-text-primary;
}

.vue-form-generator .field-checkbox {
  align-items: center;
  display: flex;
}

.vue-form-generator .field-checkbox label {
  margin: 0;
  order: 1;
}

.vue-form-generator .field-checkbox input {
  margin-left: 0;
  margin-right: 12px;
}

.vue-form-generator .field-radios .radio-list label input[type=radio] {
  margin-right: 10px;
}

.vue-form-generator label {
  font-weight: 500;
}

.vue-form-generator .form-group input[type=radio] {
  align-items: center;
  appearance: none;
  border: 2px solid currentColor;
  border-radius: 100%;
  color: $kui-color-text-primary;
  display: inline-flex;
  height: 20px;
  justify-content: center;
  width: 20px;

  &:after {
    border-radius: 100%;
    content: "";
    height: 10px;
    width: 10px;
  }

  &:disabled {
    background-color: $kui-color-background-disabled;
    border-color: $kui-color-border-neutral-weak;
  }

  &:checked:after {
    background-color: currentColor;
  }

  &:checked:disabled:after {
    background-color: $kui-color-background-neutral-weak;
  }
}

.vue-form-generator {
  .root-level-collapse {
    .k-collapse-heading {
      margin-bottom: 0 !important;
    }

    .k-collapse-visible-content {
      color: $kui-color-text-neutral;
    }
  }

  .nested-collapse .k-collapse-heading {
    margin-bottom: $kui-space-80 !important;
  }
}
</style>
