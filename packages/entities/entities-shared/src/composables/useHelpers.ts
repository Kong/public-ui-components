import { ConfigurationSchemaType, type ConfigurationSchema } from '../types'

export default function useHelpers() {
  /**
   * propName could be 'rowValue' or 'row'
   *
   * @param propName the prop name
   * @param slotProps the Record
   * @returns the property value or undefined
   */
  const getPropValue = (propName: string, slotProps?: Record<string, any>) => {
    return slotProps?.[propName] ?? undefined
  }

  const unsortedArraysAreEqual = (a: any[], b: any[]): boolean => {
    if (a.length !== b.length) return false
    const uniqueValues = new Set([...a, ...b])
    for (const v of uniqueValues) {
      const aCount = a.filter(e => e === v).length
      const bCount = b.filter(e => e === v).length
      if (aCount !== bCount) return false
    }
    return true
  }

  /**
   * Check if 2 objects are equal
   * @param {Object} a first object to compare
   * @param {Object} b second object to compare
   * @param {Boolean} ignoreOrder whether or not to ignore the order of the objects
   * @returns {Boolean} whether or not the objects are equal
   */
  const objectsAreEqual = (a: Record<string, any>, b: Record<string, any>, ignoreOrder?: boolean): boolean => {
    if (ignoreOrder) {
      if (Object.keys(a).length === Object.keys(b).length) {
        for (const key in a) {
          if (Array.isArray(a[key]) && Array.isArray(b[key])) {
            if (unsortedArraysAreEqual(a[key], b[key])) {
              continue
            } else {
              return false
            }
          } else if (a[key] === b[key]) {
            continue
          } else {
            return false
          }
        }
      } else {
        return false
      }

      return true
    }

    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }

  /**
   * A comparator function that given a key, compares object values with that key, and returns the results of
   * localCompare on those values (see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare for reference)
   * Also checks for undefined, nulls and sub-Arrays.
   * @param {String} property the key to sort on
   * @returns {Function} a comparator function
   */
  const sortAlpha = (property: string) => {
    return (a: Record<string, any>, b: Record<string, any>) => {
      let propertyA = a[property] === undefined || a[property] === null ? '' : a[property]
      let propertyB = b[property] === undefined || b[property] === null ? '' : b[property]

      if (Array.isArray(a[property])) {
        propertyA = a[property][0]
      }

      if (Array.isArray(b[property])) {
        propertyB = b[property][0]
      }

      return propertyA.localeCompare(propertyB)
    }
  }

  /**
   * Check if a string is a valid uuid
   * @param {String} str - the string to check
   * @returns {boolean}
   */
  const isValidUuid = (str: string) => {
    if (!str) return false

    return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(str)
  }

  const REDACTED_MASK = '********'
  /**
   * Check if the value is an object record (not an array)
   * @param value the value to check
   * @returns true if the value is an object record, false otherwise
   */
  const isObjectRecord = (value: unknown): value is Record<string, any> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)

  /**
   * Get the field schema by key from the fields of the schema
   * @param fields the fields of the schema
   * @param key the key of the field
   * @returns the field schema or undefined
   */
  const getApiSchemaField = (fields: Array<Record<string, any>> | undefined, key: string): Record<string, any> | undefined => {
    const entry = fields?.find((field: Record<string, any>) => Object.keys(field)?.[0] === key)
    return entry?.[key]
  }

  /**
   * Redact the record entries by the API schema (schema comes from BE).
   * Expects schema to have `encrypted: true` for entries that should be redacted.
   *
   * @param value the record to redact entries for
   * @param fieldSchema the field schema for the record
   * @returns the redacted record
   */
  const redactByApiSchema = (value: unknown, fieldSchema?: Record<string, any>): unknown => {
    if (!fieldSchema || value === null || value === undefined) {
      return value
    }

    if (fieldSchema.type === 'string') {
      return fieldSchema.encrypted ? REDACTED_MASK : value
    }

    if (fieldSchema.type === 'record' || fieldSchema.type === 'map') {
      if (!isObjectRecord(value)) {
        return value
      }

      if (fieldSchema.type === 'map' && !fieldSchema.values) {
        return { ...value }
      }

      // recursively redact child fields
      const output: Record<string, any> = {}
      for (const key in value) {
        if (fieldSchema.type === 'record') {
          const childFieldSchema = getApiSchemaField(fieldSchema.fields, key)
          output[key] = childFieldSchema ? redactByApiSchema(value[key], childFieldSchema) : value[key]
        } else if (fieldSchema.type === 'map') {
          const valueSchema = fieldSchema.values
          output[key] = redactByApiSchema(value[key], {
            ...valueSchema,
            encrypted: Boolean(fieldSchema.encrypted || valueSchema.encrypted),
          })
        }
      }

      return output
    }

    if ((fieldSchema.type === 'array' || fieldSchema.type === 'set') && Array.isArray(value)) {
      const elementSchema = fieldSchema.elements

      if (!elementSchema) {
        return value.slice()
      }

      // recursively redact array values
      return value.map((item: unknown) => redactByApiSchema(item, {
        ...elementSchema,
        // encryption set if either parent or child is encrypted
        encrypted: Boolean(fieldSchema.encrypted || elementSchema.encrypted),
      }))
    }

    return value
  }

  /**
   * Redact the record entries by the config schema (schema comes from FE).
   * Expects config schema to have `type: ConfigurationSchemaType.Redacted` for entries that should be redacted.
   *
   * @param value the record to redact entries for
   * @param configSchema the config schema for the record
   * @returns the redacted record
   */
  const redactByConfigSchema = (value: unknown, configSchema: ConfigurationSchema): unknown => {
    // recursively redact arrays of records
    if (Array.isArray(value)) {
      return value.map((item: unknown) => redactByConfigSchema(item, configSchema))
    }

    if (!isObjectRecord(value)) { // catch non-records
      return value
    }

    // redact record child fields
    const output: Record<string, any> = {}
    for (const key in value) {
      // regular string field redaction
      if (configSchema[key]?.type === ConfigurationSchemaType.Redacted) {
        output[key] = REDACTED_MASK
        continue
      }

      // array field redaction
      if (configSchema[key]?.type === ConfigurationSchemaType.RedactedArray && Array.isArray(value[key])) {
        output[key] = value[key].map(() => REDACTED_MASK)
        continue
      }

      // recursive redaction for nested record fields
      output[key] = redactByConfigSchema(value[key], configSchema)
    }

    return output
  }

  return {
    getPropValue,
    objectsAreEqual,
    sortAlpha,
    isValidUuid,
    isObjectRecord,
    getApiSchemaField,
    redactByApiSchema,
    redactByConfigSchema,
  }
}
