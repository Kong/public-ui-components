<template lang="pug">
div.vue-form-generator(v-if='schema != null')
  fieldset(v-if="schema.fields", :is='tag')
    template(v-for='field in fields')
      form-group(v-if='fieldVisible(field)', ref="children", :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated")

  template(v-for='group in groups')
    fieldset(:is='tag', :class='getFieldRowClasses(group)')
      legend(v-if='group.legend') {{ group.legend }}
      template(v-for='field in group.fields')
        form-group(v-if='fieldVisible(field)', ref="children", :vfg="vfg", :field="field", :errors="errors", :model="model", :options="options", @validated="onFieldValidated", @model-updated="onModelUpdated")
</template>

<script>
import { get as objGet, forEach, isFunction, isNil, isArray } from 'lodash'
import formMixin from './FormMixin.vue'
import formGroup from './FormGroup.vue'
import { ref } from 'vue'
export default {
  name: 'FormGenerator',
  components: { formGroup },
  mixins: [formMixin],
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
  },
  emits: ['validated', 'modelUpdated'],

  data() {
    return {
      vfg: this,
      errors: [], // Validation errors,
      children: ref([]),
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
        // First load, running validation if neccessary
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

    onModelUpdated(newVal, schema) {
      this.$emit('modelUpdated', newVal, schema)
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
          if (isArray(err) && err.length > 0) {
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

  .form-control {
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
    color: #555;
    // Default Bootstrap .form-control style
    display: block;
    font-size: 14px;
    line-height: 1.42857143;
    padding: 6px 12px;
    transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
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

    button,
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
        border-color: #adadad;
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

  /* Toggle Switch
========================================================================== */
  .field-switch {
    .field-wrap {
      input[type="checkbox"] {
        position: absolute;
        &:checked ~ .label {
          background-color: $kui-color-background-primary;
          box-shadow: none;
        }
        &:checked ~ .handle {
          left: calc(100% - 22px);
        }
      }
      label {
        box-shadow: none;
        height: 24px;
        margin: 0;
        width: 44px;
      }
    }
    .label {
      background-color: $kui-color-background-neutral-weakest;
      box-shadow: none;
      &:before,
      &:after {
        color: rgba(0, 0, 0, 0.7);
        font-size: 14px;
        font-weight: normal;
        left: 18px;
        margin-left: 42px;
        text-shadow: none;
        text-transform: none;
        width: max-content;
      }
    }
    .handle {
      background: #fff;
      box-shadow: none;
      height: 20px;
      left: 2px;
      top: 2px;
      width: 20px;
      &:before {
        background: none;
        box-shadow: none;
      }
    }
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
.vue-form-generator .field-wrap button.btn-link:hover,
.vue-form-generator .field-wrap input[type=submit].btn-link:hover,
.vue-form-generator .field-wrap button.btn-link:active,
.vue-form-generator .field-wrap input[type=submit].btn-link:active {
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
  display: inline-flex;
}
</style>
