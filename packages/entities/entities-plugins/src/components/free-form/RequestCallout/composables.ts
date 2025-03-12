import { computed, inject, toRaw, toValue, type MaybeRefOrGetter } from 'vue'
import type { RequestCallout } from './types'
import { marked } from 'marked'

export const DATA_INJECTION_KEY = Symbol('request-callout-form')
export const SCHEMA_INJECTION_KEY = Symbol('request-callout-schema')

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

export function useFormShared() {
  const formData = inject<RequestCallout>(DATA_INJECTION_KEY)
  const getSchemaByPath = inject<(path: string) => any>(SCHEMA_INJECTION_KEY)

  if (!formData) {
    throw new Error('useFormShared() called without provider.')
  }

  if (!getSchemaByPath) {
    throw new Error('useFormShared() called without schema provider.')
  }

  function getLabelAttributes(fieldPath: string) {
    const fieldSchema = getSchemaByPath!(fieldPath)
    const info = fieldSchema?.description ? marked.parse(fieldSchema.description, { async: false }) : undefined
    return {
      ...SHARED_LABEL_ATTRIBUTES,
      info,
    }
  }

  return { formData, getSchemaByPath, getLabelAttributes }
}

// Construct a map of all fields in a schema, with their full paths as keys
// eg. { 'cache.memory.dictionary_name': { type: 'string', ... }, ... }
// Array elements are represented as 'path.*'.
function buildSchemaMap(schema: any, pathPrefix: string = ''): Record<string, any> {
  const schemaMap: Record<string, any> = {}

  // Process only if the schema is a record with fields
  if (schema.type === 'record' && Array.isArray(schema.fields)) {
    for (const fieldDef of schema.fields) {
      // Each fieldDef is an object with one key (the field name)
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]

      // Construct the full path for this field
      const fieldPath = pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

      // Store the field's metadata in the map
      schemaMap[fieldPath] = fieldProps

      // Recurse based on field type
      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        // For records, process nested fields with the current path as prefix
        const subMap = buildSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const elementProps = fieldProps.elements
        const elementPath = `${fieldPath}.*`

        // If array elements are records, process their fields
        if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
          const subMap = buildSchemaMap(elementProps, elementPath)
          Object.assign(schemaMap, subMap)
        }
      }
    }
  }

  return schemaMap
}

// Given a schema, return a function to retrieve a field's metadata by its full path
export function useSchemaMap(schema: MaybeRefOrGetter<any>) {
  const schemaValue = toValue(schema)
  const schemaMap = computed(() => {
    const configSchema = schemaValue?.fields?.find((field: any) => 'config' in field)?.config
    if (!configSchema) {
      return {}
    }
    return buildSchemaMap(toRaw(configSchema))
  })

  function getSchemaByPath(path: string): any {
    return schemaMap.value?.[path]
  }

  return {
    getSchemaByPath,
  }
}
