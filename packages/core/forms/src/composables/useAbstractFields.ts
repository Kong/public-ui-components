import { computed, ref } from 'vue'
import {
  get as objGet,
  forEach,
  isFunction,
  isString,
  isArray,
  debounce,
  uniqueId,
  uniq as arrayUniq,
  type DebouncedFunc,
} from 'lodash'
import validators from '../generator/utils/validators'
import { slugifyFormID } from '../generator/utils/schema'

export default function useAbstractFields(formData: {
  model?: Record<string, any>,
  schema: Record<string, any>,
  formOptions?: Record<string, any>,
  disabled?: boolean,
  emitModelUpdated?: (data: {
    value: any
    model: Record<string, any>
  }) => void,
  emitValidated?: (data: {
    isValid: any
    errors: any[]
    field: Record<string, any>
  }) => void
}) {
  const errors = ref<string[]>([])
  const debouncedValidateFunc = ref<DebouncedFunc<(calledParent?: any) => any[]> | null>(null)

  /**
   * Get the validator function from the validators object or null if given a string key, otherwise return the original param.
   * @param validator The validator function key in the validators object
   * @returns The validator function from the validators object or null if not found
   */
  const convertValidator = (validator: any) => {
    if (isString(validator)) {
      if (validators[validator] != null) {
        return validators[validator]
      } else {
        console.warn(`'${validator}' is not a validator function!`)

        return null // caller need to handle null
      }
    }

    return validator
  }

  /**
   * The value of the field with getter/setter defined.
   * Handles formatting to/from the model (used in PUT/POST) and field (actual input element) formatted values
   */
  const value = computed({
    get() {
      let val

      if (isFunction(objGet(formData.schema, 'get'))) {
        val = formData.schema.get(formData.model)
      } else {
        val = objGet(formData.model, formData.schema.model)
      }

      return formatValueToField(val)
    },
    set(newValue): void {
      const oldValue = value
      newValue = formatValueToModel(newValue)

      if (isFunction(newValue)) {
        newValue(newValue, oldValue)
      } else {
        updateModelValue(newValue, oldValue)
      }
    },
  })

  /**
   * Call validation functions on the field value. Will emit validated event (if defined)
   * with validity, errors, and the field being validated.
   */
  const validate = (calledParent?: any) => {
    clearValidationErrors()

    const schemaValidator = formData.schema?.validator
    const validateAsync = objGet(formData.formOptions, 'validateAsync', false)
    let results: any[] = []

    if (schemaValidator && formData.schema.readonly !== true && formData.disabled !== true) {
      const validators = []

      if (!isArray(schemaValidator)) {
        validators.push(convertValidator(schemaValidator))
      } else {
        forEach(schemaValidator, validator => {
          validators.push(convertValidator(validator))
        })
      }

      forEach(validators, validator => {
        if (validateAsync) {
          results.push(validator(value.value, formData.schema, formData.model))
        } else {
          const result = validator(value.value, formData.schema, formData.model)

          if (result && isFunction(result.then)) {
            result.then((err: any) => {
              if (err) {
                errors.value = errors.value.concat(err)
              }

              const isValid = errors.value.length === 0

              if (formData.emitValidated) {
                formData.emitValidated({ isValid, errors: errors.value, field: formData.schema })
              }
            })
          } else if (result) {
            results = results.concat(result)
          }
        }
      })
    }

    // Call onValidated and emit validated event
    const handleErrors = (errors: any[]) => {
      let fieldErrors: any[] = []

      forEach(arrayUniq(errors), err => {
        if (isArray(err) && err.length > 0) {
          fieldErrors = fieldErrors.concat(err)
        } else if (isString(err)) {
          fieldErrors.push(err)
        }
      })

      if (isFunction(formData.schema?.onValidated)) {
        formData.schema.onValidated(formData.model, fieldErrors, formData.schema)
      }

      if (!calledParent) {
        const isValid = fieldErrors.length === 0

        if (formData.emitValidated) {
          formData.emitValidated({ isValid, errors: fieldErrors, field: formData.schema })
        }
      }

      errors = fieldErrors

      return fieldErrors
    }

    if (!validateAsync) {
      return handleErrors(results)
    }

    return Promise.all(results).then(handleErrors)
  }

  const debouncedValidate = () => {
    if (!isFunction(debouncedValidateFunc.value)) {
      debouncedValidateFunc.value = debounce(
        validate,
        objGet(formData.schema, 'validateDebounceTime', objGet(formData.formOptions, 'validateDebounceTime', 500)),
      )
    } else {
      debouncedValidateFunc.value()
    }
  }

  /**
   * This is called every time the value of an input is changed and should handle validation/emitting modelUpdated events.
   */
  const updateModelValue = (newValue: any, oldValue: any) => {
    let changed = false

    if (isFunction(formData.schema.set)) {
      formData.schema.set(formData.model, newValue)
      changed = true
    } else if (formData.schema.model) {
      setModelValueByPath(formData.schema.model, newValue)
      changed = true
    }

    if (changed) {
      if (formData.emitModelUpdated && formData.model) {
        formData.emitModelUpdated({ value: newValue, model: formData.schema.model })
      }

      if (isFunction(formData.schema.onChanged)) {
        formData.schema.onChanged(formData.model, newValue, oldValue, formData.schema)
      }

      if (objGet(formData.formOptions, 'validateAfterChanged', false) === true) {
        if (objGet(formData.schema, 'validateDebounceTime', objGet(formData.formOptions, 'validateDebounceTime', 0)) > 0) {
          debouncedValidate()
        } else {
          validate()
        }
      }
    }
  }

  const clearValidationErrors = (): void => {
    errors.value.splice(0)
  }

  const setModelValueByPath = (path: string, value: any) => {
    // convert array indexes to properties
    let s = path.replace(/\[(\w+)\]/g, '.$1')

    // strip a leading dot
    s = s.replace(/^\./, '')

    let o = formData.model || {}
    const a = s.split('.')
    let i = 0
    const n = a.length

    while (i < n) {
      const k = a[i]

      if (i < n - 1) {
        if (o[k] !== undefined) {
          // Found parent property. Step in
          o = o[k]
        } else {
          // Create missing property (new level)
          o[k] = {}
          o = o[k]
        }
      } else {
        // Set final property value
        o[k] = value

        return
      }

      ++i
    }
  }

  const getFieldID = (fieldSchema: Record<string, any>, unique = false) => {
    const idPrefix = objGet(formData.formOptions, 'fieldIdPrefix', '')

    return slugifyFormID(fieldSchema, idPrefix) + (unique ? '-' + uniqueId() : '')
  }

  const getLabelId = (fieldSchema: Record<string, any>) => {
    return `${getFieldID(fieldSchema)}-label`
  }

  const getFieldClasses = () => {
    return objGet(formData.schema, 'fieldClasses', [])
  }

  /**
   * Placeholder functions to be overridden for specific field types.
   * We use them in the computed value for the field value, which CAN be exported.
   * TODO: check that this actually works as expected (ie. fieldSelect, fieldSwitch, etc.)
   * DO NOT EXPORT THESE FUNCTIONS
   */
  const formatValueToField = (value: any) => {
    return value
  }

  const formatValueToModel = (value: any) => {
    return value
  }

  return {
    value,
    clearValidationErrors,
    getFieldID,
    getLabelId,
    getFieldClasses,
    updateModelValue,
  }
}
