import { computed, inject, toRaw, toValue, type MaybeRefOrGetter } from 'vue'
import { marked } from 'marked'
import { toSelectItems } from './utils'

export const DATA_INJECTION_KEY = Symbol('free-form-data')
export const SCHEMA_INJECTION_KEY = Symbol('free-form-schema')

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

// Construct a map of all fields in a schema, with their full paths as keys
function buildSchemaMap(schema: any, pathPrefix: string = ''): Record<string, any> {
  const schemaMap: Record<string, any> = {}

  if (schema.type === 'record' && Array.isArray(schema.fields)) {
    for (const fieldDef of schema.fields) {
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]
      const fieldPath = pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

      schemaMap[fieldPath] = fieldProps

      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        const subMap = buildSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const elementProps = fieldProps.elements
        const elementPath = `${fieldPath}.*`
        schemaMap[elementPath] = elementProps
        if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
          const subMap = buildSchemaMap(elementProps, elementPath)
          Object.assign(schemaMap, subMap)
        }
      }
    }
  }

  return schemaMap
}

export function useSchemaHelpers(schema: MaybeRefOrGetter<any>) {
  const schemaValue = toValue(schema)

  const configSchema = computed(() => {
    return schemaValue?.fields?.find((field: any) => 'config' in field)?.config
  })

  const schemaMap = computed(() => {
    if (!configSchema.value) {
      return {}
    }
    return buildSchemaMap(toRaw(configSchema.value))
  })

  function getSchema(path?: string): any {
    return path == null ? configSchema.value : schemaMap.value?.[path]
  }

  /**
   * Get the default value for a specific field by its path
   */
  function getFieldDefault(fieldPath: string): any {
    const schema = getSchema(fieldPath)
    if (!schema) {
      return undefined
    }

    // Use explicit default if provided
    if (schema.default !== undefined) {
      return schema.default
    }

    // Handle required fields without explicit defaults
    if (schema.required || fieldPath.endsWith('.*')) {
      if (schema.type === 'record') {
        return buildRecordDefault(schema, fieldPath)
      } else if (schema.type === 'array') {
        return []
      } else {
        return null
      }
    }
    // Non-required fields default to null
    return null
  }

  /**
   * Build the default object for a record schema
   */
  function buildRecordDefault(recordSchema: any, path: string): any {
    const defaultObj: Record<string, any> = {}
    if (Array.isArray(recordSchema.fields)) {
      for (const fieldDef of recordSchema.fields) {
        const fieldName = Object.keys(fieldDef)[0]
        const fieldProps = fieldDef[fieldName]
        const fieldPath = path ? `${path}.${fieldName}` : fieldName
        const fieldDefault = getFieldDefaultForSchema(fieldProps, fieldPath)
        if (fieldDefault !== undefined) {
          defaultObj[fieldName] = fieldDefault
        }
      }
    }
    return defaultObj
  }

  /**
   * Get the default value for a field schema (helper for buildRecordDefault)
   */
  function getFieldDefaultForSchema(schema: any, path: string): any {
    if (schema.default !== undefined) {
      return schema.default
    }

    if (schema.required) {
      if (schema.type === 'record') {
        return buildRecordDefault(schema, path)
      } else if (schema.type === 'array') {
        return []
      } else {
        return null
      }
    }
    return null
  }

  /**
   * Get the default value for a field or the entire form
   * @param path Optional path to a specific field
   * @returns Default value for the field (if path provided) or entire form (if no path)
   */
  function getDefault(path?: string): any {
    if (path) {
      // Return default for specific field
      return getFieldDefault(path)
    } else {
      // Return default for entire form using root schema
      return buildRecordDefault(getSchema(), '')
    }
  }

  function getLabelAttributes(fieldPath: string) {
    const fieldSchema = getSchema(fieldPath)
    const info = fieldSchema?.description ? marked.parse(fieldSchema.description, { async: false }) : undefined
    return {
      ...SHARED_LABEL_ATTRIBUTES,
      info,
    }
  }

  function getSelectItems(fieldPath: string) {
    const fieldSchema = getSchema(fieldPath)
    return toSelectItems((fieldSchema?.one_of || []))
  }

  return {
    getSchema,
    getDefault,
    getSelectItems,
    getLabelAttributes,
  }
}

export function useFormShared<T>() {
  const formData = inject<T>(DATA_INJECTION_KEY)
  const schemaHelpers = inject<ReturnType<typeof useSchemaHelpers>>(SCHEMA_INJECTION_KEY)

  if (!formData) {
    throw new Error('useFormShared() called without form data provider.')
  }

  if (!schemaHelpers) {
    throw new Error('useFormShared() called without schema provider.')
  }

  return { formData, ...schemaHelpers }
}
