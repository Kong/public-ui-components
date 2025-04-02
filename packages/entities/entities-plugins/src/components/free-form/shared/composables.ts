import { computed, inject, toRaw, toValue, type MaybeRefOrGetter } from 'vue'
import { marked } from 'marked'
import { toSelectItems } from './utils'
import type { LabelAttributes, SelectItem } from '@kong/kongponents'

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

  /**
   * Retrieves a schema object by path
   * @param path Optional dot-notation path to a specific schema field
   * @returns The schema for the specified path or the root schema if no path provided
   */
  function getSchema(path?: string): any {
    return path == null ? configSchema.value : schemaMap.value?.[path]
  }

  /**
   * Creates a default value for a field, respecting its schema definition
   * @param path Path to the field in dot notation (e.g., 'foo.bar')
   * @param force When true, forces creation of structure even for optional fields
   * @returns The default value for the field based on its schema
   */
  function createFieldDefault(path: string, force: boolean = false): any {
    const schema = getSchema(path)
    if (!schema) {
      return null
    }

    // Use explicit default if provided
    if (schema.default !== undefined) {
      return schema.default
    }

    // Create structures when forced or for required fields
    if (force || schema.required) {
      if (schema.type === 'record') {
        return createRecordDefault(schema, path)
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
   * Creates a default object for a record schema
   * @param schema The record schema definition
   * @param path Current field path
   */
  function createRecordDefault(schema: any, path: string): Record<string, any> {
    const result: Record<string, any> = {}

    if (Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        const key = Object.keys(field)[0]
        const fieldPath = path ? `${path}.${key}` : key

        const value = createFieldDefault(fieldPath, false)
        if (value !== undefined) {
          result[key] = value
        }
      }
    }
    return result
  }

  /**
   * Gets the default value for a field or the entire form
   * @param path Optional path to a field
   * @returns Default value for the field or entire form
   */
  function getDefault(path?: string): any {
    if (path) {
      // For any specific path access, force creation of that field
      return createFieldDefault(path, true)
    } else {
      // For the entire form, respect required flags without forcing
      return createRecordDefault(getSchema(), '')
    }
  }

  function getLabelAttributes(fieldPath: string): LabelAttributes {
    const schema = getSchema(fieldPath)
    const info = schema?.description ? marked.parse(schema.description, { async: false }) : undefined
    return {
      ...SHARED_LABEL_ATTRIBUTES,
      info,
    }
  }

  function getSelectItems(fieldPath: string): SelectItem[] {
    const schema = getSchema(fieldPath)
    return toSelectItems((schema?.one_of || []))
  }

  function getPlaceholder(fieldPath: string): string | null {
    const defaultValue = getSchema(fieldPath)?.default

    let stringified = null

    if (defaultValue == null || typeof defaultValue === 'object' || defaultValue === '') {
      return null
    } else if (Array.isArray(defaultValue)) {
      if (defaultValue.length === 0) {
        return null
      }
      stringified = defaultValue.join(', ')
    } else {
      stringified = defaultValue.toString()
    }

    return `Default: ${stringified}`
  }

  return {
    getSchema,
    getDefault,
    getSelectItems,
    getLabelAttributes,
    getPlaceholder,
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
