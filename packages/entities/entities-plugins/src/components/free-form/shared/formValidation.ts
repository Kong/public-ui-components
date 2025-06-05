import { inject, onMounted, ref, watch, type InjectionKey, type Ref } from 'vue'
import type { ConditionEntityCheck, EntityCheck, FieldSchema, FormSchema, MutuallyRequiredEntityCheck, RecordFieldSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import * as utils from './utils'
import { isEqual } from 'lodash-es'
import { generalizePath } from './composables'

interface FieldValidationSchema extends FieldSchema {
  reallyRequired?: boolean
  relatedChecks?: EntityCheck[]
}

export const INLINE_VALIDATION_HANDLER: InjectionKey<FormValidationHandler> = Symbol('free-form-inline-validation-handler')

const ValidationErrors = new Map<string, string>()
function getByPath(obj: Record<string, any>, path: string) {
  return path.split('.').reduce((o, key) => o?.[key], obj)
}

class FormValidationHandler {
  private errors: Map<string, string>
  private formDataRef: Ref<Record<string, any>>
  private schema: FormSchema
  private schemaMap: Record<string, any>

  constructor(formDataRef: Ref<Record<string, any>>) {
    this.errors = new Map()
    this.formDataRef = formDataRef
    this.schema = {} as FormSchema
    this.schemaMap = {}
  }

  get formData() {
    return this.formDataRef.value
  }

  buildSchemaMap(
    schema: UnionFieldSchema,
    pathPrefix: string = '',
  ): Record<string, any> {
    const schemaMap: Record<string, any> = {}
    const recordSchema = schema as RecordFieldSchema
    if (Array.isArray(recordSchema.fields)) {
      for (const fieldDef of recordSchema.fields) {
        const fieldName = Object.keys(fieldDef)[0]
        const fieldProps = fieldDef[fieldName]
        const fieldPath = pathPrefix
          ? utils.resolve(pathPrefix, fieldName)
          : fieldName

        const relatedChecks = []
        schemaMap[fieldPath] = fieldProps
        if (recordSchema.entity_checks) {
          // pick the entity checks containing fieldName
          for (const check of recordSchema.entity_checks) {
            const checkRule = Object.keys(
              check,
            )[0] as keyof typeof this.checker
            if (
              checkRule === 'mutually_required' &&
              (check as any)[checkRule]?.includes(fieldName)
            ) {
              const mappedCheck = {
                [checkRule]: (check as any)[checkRule].map((f: string) =>
                  utils.resolve(pathPrefix, f),
                ),
              }
              relatedChecks.push(mappedCheck)
            } else if (checkRule === 'conditional') {
              if (
                (check as any)[checkRule]?.if_field === fieldName ||
                (check as any)[checkRule]?.then_field === fieldName
              ) {
                const condition = {
                  ...(check as any)[checkRule],
                  if_field: utils.resolve(
                    pathPrefix,
                    (check as any)[checkRule].if_field,
                  ),
                  then_field: utils.resolve(
                    pathPrefix,
                    (check as any)[checkRule].then_field,
                  ),
                }
                relatedChecks.push({
                  [checkRule]: condition,
                })
              }
            }
          }
          schemaMap[fieldPath].relatedChecks = relatedChecks
        }

        if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
          const subMap = this.buildSchemaMap(fieldProps, fieldPath)
          Object.assign(schemaMap, subMap)
        } else if (fieldProps.type === 'array' && fieldProps.elements) {
          const elementProps = fieldProps.elements
          const elementPath = utils.resolve(fieldPath, utils.arraySymbol)
          schemaMap[elementPath] = elementProps
          if (
            elementProps.type === 'record' &&
            Array.isArray(elementProps.fields)
          ) {
            const subMap = this.buildSchemaMap(elementProps, elementPath)
            Object.assign(schemaMap, subMap)
          }
        }
      }
    }

    return schemaMap
  }

  setSchema(schema: FormSchema) {
    this.schema = schema
    this.schemaMap = this.buildSchemaMap(schema)
    console.log(
      'FormValidationHandler: Schema map built successfully',
      this.schemaMap,
    )
  }

  getSchema<T extends FieldValidationSchema = FieldValidationSchema>(
    path?: string,
  ): T | FieldValidationSchema | undefined {
    return path == null ? this.schema : this.schemaMap[generalizePath(path)]
  }

  isFieldEmpty(path: string) {
    const value = getByPath(this.formData, path)
    const schema = this.getSchema(path)
    if (schema?.default) {
      return false
    }
    if (value == null || value === undefined) {
      return true
    }
    if (schema?.type === 'array' && value.length === 0) {
      return true
    }
    return false
  }

  ops = {
    eq: (a: any, b: any) => a === b,
    one_of: (a: any, b: any[]) => b.includes(a),
    not_one_of: (a: any, b: any[]) => !b.includes(a),
    between: (a: any, b: [number, number]) => {
      if (typeof a !== 'number') return false
      const [min, max] = b
      return a >= min && a <= max
    },
    starts_with: (a: any, b: string) => {
      if (typeof a !== 'string') return false
      return a.startsWith(b)
    },
    match: (a: any, b: string) => {
      if (typeof a !== 'string') return false
      const regex = new RegExp(b)
      return regex.test(a)
    },
    match_all: (a: any, b: { pattern: string }[]) => {
      if (typeof a !== 'string') return false
      return b.every(({ pattern }) => {
        const regex = new RegExp(pattern)
        return regex.test(a)
      })
    },
    match_any: (a: any, b: { patterns: string[] }) => {
      if (typeof a !== 'string') return false
      return b.patterns.some((pattern) => {
        const regex = new RegExp(pattern)
        return regex.test(a)
      })
    },
    match_none: (a: any, b: { pattern: string }[]) => {
      if (typeof a !== 'string') return false
      return b.every(({ pattern }) => {
        const regex = new RegExp(pattern)
        return !regex.test(a)
      })
    },
  }

  checker = {
    mutually_required: (check: MutuallyRequiredEntityCheck) => {
      const fields = check.mutually_required
      // Check if all fields in the list are present/have default values in formData
      const allFieldsPresentOrEmpty =
        fields.every((field) => !this.isFieldEmpty(field)) ||
        fields.every((field) => this.isFieldEmpty(field))
      if (allFieldsPresentOrEmpty) {
        return
      } else {
        return `Fields ${fields.join(', ')} are mutually required.`
      }
    },
    /**
     *
     * @example
     * {
     *   "conditional": {
     *     "if_field": "connection_is_proxied",
     *     "if_match": {
     *       "eq": true
     *     },
     *     "then_field": "host",
     *     "then_match": {
     *       "required": true
     *     }
     *   }
     * }
     *
     */
    conditional: (condition: ConditionEntityCheck) => {
      const {
        if_field,
        if_match,
        then_field,
        then_match,
        // then_err = '',
      } = condition['conditional']
      const ifValue = getByPath(this.formData, if_field)
      if (ifValue === undefined) {
        return
      }

      // Check if the condition matches
      const conditionMet = Object.entries(if_match).every(([op, value]) => {
        const operation = this.ops[op as keyof typeof this.ops]
        return operation ? operation(ifValue, value) : false
      })

      if (conditionMet) {
        // If condition is met, check the then_field
        const violations: string[] = []
        const thenValue = getByPath(this.formData, then_field)
        Object.entries(then_match).forEach(([op, value]) => {
          if (op === 'required') {
            if (this.isFieldEmpty(then_field)) {
              violations.push(`Field ${then_field} is required but not provided.`)
            }
            return
          }
          const operation = this.ops[op as keyof typeof this.ops]
          if (!operation(thenValue, value)) {
            violations.push(
              `Field ${then_field}: ${op} ${value}`,
            )
            // ValidationErrors.set(
            //   then_field,
            //   then_err ||
            //     `Field ${then_field} failed validation: ${op} ${value}`,
            // )
          }
        })
        return violations.length > 0
          ? violations.join(', ')
          : undefined // No violations, return undefined
      }
    },
    // at_least_one_of: (fields: string[]) => {}
    // conditional_at_least_one_of: () => {},
    // Not implemented yet
    custom_entity_check: (checkFields: Record<string, any>) => {},
  }

  useFieldSchemaValidation(
    schema: UnionFieldSchema & { relatedChecks?: any[] },
    path: any,
    parentFieldRequired?: boolean,
  ) {
    // If the field is required, check if it exists in formData
    if (
      schema.required &&
      schema.default === undefined &&
      parentFieldRequired &&
      !getByPath(this.formData, path)
    ) {
      // add it to validation errors
      ValidationErrors.set(path, `Field ${path} is required but not provided.`)
      return
    }
    // length checker
    if (
      (schema.type === 'array' || schema.type === 'string') &&
      (schema as any).len_min !== undefined &&
      (schema as any).len_max !== undefined
    ) {
      // You can safely access len_min and len_max here if needed
      // Example: const lenMin = (schema as any).len_min;
      // Example: const lenMax = (schema as any).len_max;
    }
    // validate string field matches
    if (schema.type === 'string') {
      //
    }
    if (schema.relatedChecks) {
      for (const check of schema.relatedChecks) {
        const checkRule = Object.keys(check)[0] as keyof typeof this.checker
        const checkFields = (check as Record<string, any>)[checkRule]
        this.checker[checkRule](checkFields)
      }
    }
  }

  subscriptField(path: string, callback?: (val: string | undefined) => void) {
    const schema = this.getSchema(path)
    if (!schema?.relatedChecks) {
      return
    }
    // subscript the fields changes in relatedChecks
    for (const check of schema.relatedChecks) {
      if ('mutually_required' in check) {
        const checkFields = check['mutually_required']

        watch(
          () => checkFields.map((field: string) => getByPath(this.formDataRef.value, field)),
          (newVal, oldVal) => {
            if (!isEqual(newVal, oldVal)) {
              // console.log(
              //   'Mutually required fields changed:',
              //   newVal,
              //   oldVal,
              //   isEqual(newVal, oldVal),
              //   this.checker['mutually_required'](check),
              // )
              if (callback) callback(this.checker['mutually_required'](check))
            }
          },
          { immediate: true },
        )
      } else if ('conditional' in check) {
        const { if_field, then_field } = check['conditional']
        watch(
          () => [getByPath(this.formDataRef.value, if_field), getByPath(this.formDataRef.value, then_field)],
          (newVal, oldVal) => {
            if (!isEqual(newVal, oldVal)) {
              // console.log(
              //   'Conditional fields changed:',
              //   newVal,
              //   oldVal,
              //   isEqual(newVal, oldVal),
              // )
              const res = this.checker['conditional'](check)
              if (callback) callback(res)
            }
          },
          { immediate: true },
        )
      }
    }
  }

  validateField(path: string, value?: any) {
    const schema = this.getSchema(path)
    const fieldValue = value ?? getByPath(this.formData, path)
    if (!schema) {
      return
    }
    // validate the field schema
    if (
      schema.required &&
      schema.default === undefined &&
      schema.reallyRequired &&
      !fieldValue
    ) {
      // add it to validation errors
      ValidationErrors.set(path, `Field ${path} is required but not provided.`)
      return
    }
    // length checker
    if (
      (schema.type === 'array' || schema.type === 'string') &&
      (schema as any).len_min !== undefined &&
      (schema as any).len_max !== undefined
    ) {
      // You can safely access len_min and len_max here if needed
      // Example: const lenMin = (schema as any).len_min;
      // Example: const lenMax = (schema as any).len_max;
    }
    if (schema.relatedChecks) {
      for (const check of schema.relatedChecks) {
        const checkRule = Object.keys(check)[0] as keyof typeof this.checker
        return this.checker[checkRule](check)
      }
    }
  }

  validateForm(data: Record<string, any>) {
    // this.formData = data || {}
    const formSchema = this.schema
    for (const field of formSchema.fields) {
      const key = Object.keys(field)[0]
      const schema = field[key]
      this.useFieldSchemaValidation(schema, key, schema.required || false)
    }
    return ValidationErrors
  }

  addError(field: string, message: string) {
    this.errors.set(field, message)
  }

  getErrors() {
    return this.errors
  }

  clearErrors() {
    this.errors.clear()
  }
}


// export function useFieldSchemaValidation(
//   schema: UnionFieldSchema,
//   path: any,
//   formData: Record<string, any> = {},
//   parentFieldRequired?: boolean,
// ) {
//   // If the field is required, check if it exists in formData
//   if (
//     schema.required &&
//     schema.default === undefined &&
//     parentFieldRequired &&
//     !getByPath(formData, path)
//   ) {
//     // add it to validation errors
//     ValidationErrors.set(
//       path,
//       `Field ${path} is required but not provided.`,
//     )
//     return
//   }
//   // length checker
//   if (
//     (schema.type === 'array' || schema.type === 'string') &&
//     (schema as any).len_min !== undefined &&
//     (schema as any).len_max !== undefined
//   ) {
//     // You can safely access len_min and len_max here if needed
//     // Example: const lenMin = (schema as any).len_min;
//     // Example: const lenMax = (schema as any).len_max;
//   }
//   if (
//     schema.type === 'record' &&
//     Array.isArray((schema as RecordFieldSchema).fields)
//   ) {
//     // You can safely access (schema as RecordFieldSchema).fields here
//     for (const field of schema.fields) {
//       const key = Object.keys(field)[0]
//       useFieldSchemaValidation(
//         field[key],
//         `${path}.${key}`,
//         parentFieldRequired,
//       )
//     }
//   }
//   if (schema.entity_checks) {
//     for (const check of schema.entity_checks) {
//       const checkRule = Object.keys(check)[0] as keyof typeof checker
//       const checkFields = check[checkRule]
//       checker[checkRule](checkFields)
//     }
//   }
// }

// export function useFormValidation(formSchemaRef: Ref<FormSchema>, data: Record<string, any>) {
//   formData = data || {}
//   const formSchema = formSchemaRef.value
//   for (const field of formSchema.fields) {
//     const key = Object.keys(field)[0]
//     const schema = field[key]
//     useFieldSchemaValidation(schema, key, formData, schema.required || false)
//   }
//   return ValidationErrors
// }

export default FormValidationHandler

export function useFormValidationHandler(field: any) {
  const fieldValidationHandler = inject(INLINE_VALIDATION_HANDLER)
  const touched = ref(false)
  const validationHelp = ref('')
  const inputHelpHandler = (help: string | undefined) => {
    if (help) {
      //
      validationHelp.value = help || ''
    } else {
      validationHelp.value = ''
    }
  }

  onMounted(() => {
    fieldValidationHandler?.subscriptField(field.path!.value, inputHelpHandler)
  })

  return {
    fieldValidationHandler,
    touched,
    validationHelp,
    inputHelpHandler,
  }

}
